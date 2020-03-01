/**
 * This file holds all of the JavaScript behind the Spotify to Youtube Playlist Converter.
 *
 * Uses the middle-ware: CORS Anywhere @ https://github.com/Rob--W/cors-anywhere
 * to enable GET requests being sent to Spotify and Google.
 *
 *   Author: Patrick Jung
 *     Date: 2020-03-01
 *  Version: 1.2
 */



// GLOBAL CONSTANTS & VARIABLES
const MESSAGE_CONVERT = "Converting";

let timeSinceLinkTest = 0;
let convertPeriodCounter = 0;
let linkBuilder = "";



/**
 * This function resets the website's cache by emptying forms
 */
function resetCache() {
    document.getElementById("inputURL").value = "";
    document.getElementById("outputURL").value = "";
    linkBuilder = "";
}



/**
 * This function copies the output URL text to clipboard
 */
function copyToClipboard() {
    let copyText = document.getElementById("outputURL");
    copyText.select();
    copyText.setSelectionRange(0, copyText.value.length);
    document.execCommand("copy");
}



/**
 * This function opens a window of the link, if possible
 */
function openLinkWindow() {
    let link = document.getElementById("outputURL").value;
    if (link.length > 0) {
        window.open(link);
    }
}



/**
 * This function sets clickability of the button elements
 */
function setClickable(paramBoolean) {
    document.getElementById("outputCopy").disabled = paramBoolean;
    document.getElementById("outputOpen").disabled = paramBoolean;
    document.getElementById("inputSubmit").disabled = paramBoolean;
}



/**
 * This function updates the conversion message on the website with a string and a number of periods
 *
 * @param {string} paramString The base string to set the conversion message to
 * @param {number} paramPeriodCount The number of periods
 */
function setConvertMessage(paramString, paramPeriodCount) {
    for (let count = 0; count < paramPeriodCount; count++) {
        paramString += ".";
    }
    document.getElementById("reporter").innerHTML = paramString;
}



/**
 * This function updates the time since the last link text with the current milliseconds time
 */
function updateTimeLinkTest() {
    let dateAtAppend = new Date();
    timeSinceLinkTest = dateAtAppend.getTime();
}


/**
 * This function "sanitizes" a string by converting non-meta characters with metacharacter format
 * into an entire metacharacter string (i.e. looks the same but all special characters work)
 *
 * @param {string} paramString The string to sanitize
 * @return {string} The sanitized string
 */
function sanitizeString(paramString) {
    let newString = "";
    for (let index = 0; index < paramString.length; index++) {
        let currentChar = paramString.substring(index, index + 1);
        if (!(currentChar.localeCompare('\\') == 0)) {
            newString += paramString.charAt(index);
        }
        else {
            newString += unescape('%u' + paramString.substring(index + 2, index + 6));
            index += 5;
        }
    }
    return newString;
}



/**
 * This function checks if a string follows the album or playlist link format
 *
 * Note: cannot handle correct formatting with non-existent URIs
 *
 * @param {string} paramString The string to check for playlist link validity
 * @return {boolean} Whether a string follows the album or playlist link format
 */
function checkLink(paramString) {
    const ACCEPTABLE_SCHEMES = ["", "//", "http://", "https://"];
    const SUBSECTIONS_LIST = ["playlist/", "album/"];
    const EXPECT_LINK_MATERIAL = "open.spotify.com/";
    const URI_LENGTH = 22;

    let domainIndex = paramString.indexOf(EXPECT_LINK_MATERIAL);
    let schemeCheck = false;

    if (domainIndex >= 0) {
        // Check link works by checking necessary URL scheme
        for (let scheme of ACCEPTABLE_SCHEMES) {
            schemeCheck = schemeCheck || (paramString.substring(0, domainIndex) == scheme);
        }

        if (schemeCheck) {
            // Check link works by finding the existence of the website subsection
            schemeCheck = false;
            for (let subsection of SUBSECTIONS_LIST) {
                schemeCheck = schemeCheck || (paramString.substring(domainIndex + EXPECT_LINK_MATERIAL.length, domainIndex + EXPECT_LINK_MATERIAL.length + subsection.length) == subsection);
            }

            if (schemeCheck) {
                // Returns boolean after checking if URI length is met (truncating query)
                paramString = (paramString.indexOf("?") >= 0) ? paramString.substring(0, paramString.indexOf("?")) : paramString;
                let slashChar = (paramString.charAt(paramString.length - URI_LENGTH - 1) == "/");
                return slashChar;
            }
            return false;
        }
        return false;
    }
    return false;
}



/**
 * This function finds and accesses the embedded Spotify track list from an expected album/playlist share link
 *
 * @param {string} paramURL The expected URL of the Spotify track sharing link
 */
function accessTrackList(paramURL) {
    const MESSAGE_ERROR = "Failed!";
    const HTML_SEARCH_LINK = "open.spotify.com/embed";

    // Report on the website that the link is loading
    setConvertMessage(MESSAGE_CONVERT, convertPeriodCounter);
    setClickable(true);
    document.getElementById("outputURL").value = "";

    // This block represents a Spotify full playlist request, made if possible
    if (checkLink(paramURL)) {
        let xHttp = new XMLHttpRequest();
        xHttp.onreadystatechange = function() {
            if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {

                // Grants access to link with the full playlist, to make a playlist from it
                let paramContent = this.responseText;
                let indexInit = paramContent.indexOf(HTML_SEARCH_LINK);
                let indexFin = paramContent.indexOf("\"", indexInit + 1);
                makePlaylist(paramContent.substring(indexInit, indexFin));
            }
        };
        xHttp.open("GET", "https://cors-anywhere.herokuapp.com/" + paramURL, true);
        xHttp.send();
    }
    else {
        // Invalid request; link material not found
        console.log("INVALID REQUEST");
        document.getElementById("reporter").innerHTML = MESSAGE_ERROR;
        setClickable(false);
    }
}



/**
 * This function makes a playlist out of an expected embedded Spotify track list
 *
 * @param {string} paramURL The expected URL of the embedded Spotify track list
 */
function makePlaylist(paramURL) {
    const TEST_FINISH_TIME = 2500;
    const MESSAGE_FINISH = "Finished!";
    const BASE_COPY_LINK = "https://www.youtube.com/watch_videos?video_ids=";

    console.log("VALID REQUEST");

    // This block represents a Spotify playlist request
    let xHttp = new XMLHttpRequest();
    xHttp.onreadystatechange = function() {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {

            // Search and initialize base URL such that video IDs can be appended to it, to form a link
            let songsToSearch = getSearches(this.responseText);
            if (songsToSearch.length > 0) {
                linkBuilder = BASE_COPY_LINK;
            }

            // Search all the Spotify songs to get their respective YouTube video IDs (if they exist)
            console.log("POTENTIAL SONG COUNT: " + songsToSearch.length);
            for (let linkIndex = 0; linkIndex < songsToSearch.length; linkIndex++) {
                addSearchVideoID(songsToSearch[linkIndex]);
            }

            // Report on the website that the link has finished loading
            let timedFinish = setInterval(function() {
                let currentDate = new Date();
                let currentDateMS = currentDate.getTime();
                if (((currentDateMS - timeSinceLinkTest) > TEST_FINISH_TIME) && (timeSinceLinkTest > 0)) {

                    // Finished loading: last update was at least TEST_FINISH_TIME milliseconds ago
                    document.getElementById("reporter").innerHTML = MESSAGE_FINISH;
                    document.getElementById("outputURL").value = linkBuilder;
                    setClickable(false);
                    clearInterval(timedFinish);
                    console.log("TIMED FINISH: Stopped (" + (currentDateMS - timeSinceLinkTest) + " ms)");
                }
                else {
                    // Still running: last update was within TEST_FINISH_TIME milliseconds ago
                    convertPeriodCounter = ++convertPeriodCounter % 4;
                    setConvertMessage(MESSAGE_CONVERT, convertPeriodCounter);
                    console.log("TIMED FINISH: Running (" + (currentDateMS - timeSinceLinkTest) + " ms)");
                    console.log("CONVERT PERIOD COUNTER: " + convertPeriodCounter);
                }
            }, 1000);
        }
    };
    xHttp.open("GET", "https://cors-anywhere.herokuapp.com/" + paramURL, true);
    xHttp.send();
}



/**
 * This function searches a query via Google and finds the first YouTube link occurence, and concatenates
 * the video's ID with the website's playlist builder link
 *
 * @param {string} paramQuery A query to search through the Google search engine
 */
function addSearchVideoID(paramQuery) {
    const HTML_SEARCH_TERM = "https://www.youtube.com/watch?v=";
    const SEARCH_QUERIER = "https://www.google.com/search?q=";

    // This block represents a Google search query request
    updateTimeLinkTest();
    paramQuery = encodeURI(sanitizeString(paramQuery)).replace(/%20/g, '+');
    let xHttp = new XMLHttpRequest();
    xHttp.onreadystatechange = function() {

        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
            let searchResults = this.responseText;

            // Use Google search query to get the ID of the first video result from searching <paramQuery>
            let firstOccurence = searchResults.indexOf(HTML_SEARCH_TERM);
            let nameIndexInit = firstOccurence + HTML_SEARCH_TERM.length;
            let nameIndexEnd = Math.min(searchResults.indexOf("\"", nameIndexInit + 1), searchResults.indexOf("&", nameIndexInit + 1));
            let resName = searchResults.substring(nameIndexInit, nameIndexEnd);

            if (firstOccurence >= 0) {
                // Append the ID to the output YouTube link
                if (linkBuilder.indexOf(resName) < 0) {
                    linkBuilder += resName + ",";
                    console.log("APPENDED (name=\"" + paramQuery + "\", id=\"" + resName + "\")");
                    console.log("CONTENT AT AREA (len=150): [" + searchResults.substring(nameIndexInit - HTML_SEARCH_TERM.length - 75, nameIndexInit - HTML_SEARCH_TERM.length + 75)) + "]";
                }
                else {
                    console.log("FOUND DUPLICATE, SKIPPING (name=\"" + paramQuery + "\", id=\"" + resName + "\")");
                }
            }
            else {
                // ERROR 1: Cannot append the ID; no link is found
                console.log("ERROR 1 (" + paramQuery + "): No YouTube link found");
            }

        }
        else {
            // ERROR 2: Cannot request song due to request error
            console.log("ERROR 2 (" + paramQuery + "): Song cannot be requested (readyState=\"" + this.readyState + "\", status=\"" + this.status + "\")");
        }
    };
    updateTimeLinkTest();
    xHttp.open("GET", "https://cors-anywhere.herokuapp.com/" + SEARCH_QUERIER + paramQuery, true);
    xHttp.send();
}



/**
 * This function reads in the HTML content of an embedded Spotify track list and retrieves an array of all
 * of its songs, each song in the format of "<author> - <song>"
 *
 * Note: in paramContent, the HTML property "name" appears in the usual cycle: author - album - author - song
 *
 * @param {string} paramContent The HTML content of an embedded Spotify track list
 * @return {object} The x-length array holding x songs found from the HTML content
 */
function getSearches(paramContent) {

    /**
     * This helper function takes a song builder and adds it to the search return list as a song
     *
     * @param {object} paramSongBuilder A song builder as an array of strings
     */
    function songBuilderToSearch(paramSongBuilder) {
        let songSearch = (paramSongBuilder.slice(1)).join(" - ");
        searchReturnList.push(songSearch);
        console.log("PUSHED ONTO LIST: " + songSearch);
    }

    const FIND_PROP_NAME = "\"name\":\"";
    const FIND_TRACK_NAME = "\"added_by\":{\"external_urls\"";
    const YT_PLAYLIST_MAX_LENGTH = 50;

    // paramContent = paramContent.replace(/\\/g, '');

    let searchReturnList = [];
    let songBuilder = [];
    let songIndex = -1;
    let indInit = 0;

    // This block records all of the authors and their respective songs in searchReturnList
    while (paramContent.indexOf(FIND_PROP_NAME, indInit) >= 0) {

        // Finds an "entry", which can be any of album, author or song name
        indInit = paramContent.indexOf(FIND_PROP_NAME, indInit) + FIND_PROP_NAME.length;
        let indEnd = paramContent.indexOf("\"", indInit);
        let entry = paramContent.substring(indInit, indEnd);
        let indNext = paramContent.indexOf(FIND_TRACK_NAME, indInit);

        // This block tests if the following index correlates to a newly found song
        if (indNext != songIndex) {

            // Newly found song: add "<author> - <name>" contents of songBuilder and reset the array
            songIndex = indNext;
            if (searchReturnList.length >= (YT_PLAYLIST_MAX_LENGTH - 1)) {
                break;
            }
            else if (songBuilder.length > 0) {
                songBuilderToSearch(songBuilder);
            }
            songBuilder = [];
        }
        else {
            // Same song: push entry onto songBuilder
            songBuilder.push(entry);
        }
        updateTimeLinkTest();
    }

    // Add the last built song
    songBuilderToSearch(songBuilder);
    updateTimeLinkTest();

    // Return the final array of songs to search
    return searchReturnList;
}



/**
 * This function is initially ran at the start of the program
 */
(function () {
    // Runs on loading main.js
    setTimeout(function() {
        console.log("< main.js >");
        resetCache();
    }, 1);
}());