function resetCache() {
    // Resets cache: empties forms
    document.getElementById("inputURL").value = "";
    document.getElementById("outputURL").value = "";
}

function copyToClipboard() {
    // Copies the output URL text to clipboard
    let copyText = document.getElementById("outputURL");
    copyText.select();
    copyText.setSelectionRange(0, copyText.value.length);
    document.execCommand("copy");
}

function openLinkWindow() {
    // Opens a window of the link (if possible)
    let link = document.getElementById("outputURL").value;
    if (link.length > 0) {
        window.open(link);
    }
}

function setClickable(paramBoolean) {
    // Function that makes the button elements clickable or not clickable
    document.getElementById("outputCopy").disabled = paramBoolean;
    document.getElementById("outputOpen").disabled = paramBoolean;
    document.getElementById("inputSubmit").disabled = paramBoolean;
}

function checkLink(paramString) {
    // Function that checks if a link is valid to be searched; does not work with checking if the URI works
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

function accessTrackList(paramURL) {
    const MESSAGE_CONVERT = "Converting...";
    const MESSAGE_ERROR = "Failed!";
    const HTML_SEARCH_LINK = "open.spotify.com/embed";

    // Report on the website that the link is loading
    document.getElementById("reporter").innerHTML = MESSAGE_CONVERT;
    setClickable(true);

    if (checkLink(paramURL)) {
        // This block represents a Spotify full playlist request
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

function makePlaylist(paramURL) {
    const MESSAGE_FINISH = "Finished!";
    const BASE_COPY_LINK = "https://www.youtube.com/watch_videos?video_ids=";

    console.log("VALID REQUEST");

    // This block represents a Spotify playlist request
    let xHttp = new XMLHttpRequest();
    xHttp.onreadystatechange = function() {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {

            // Search and initialize base URL such that video IDs can be appended to it, to form a link
            let searchLinks = getSearches(this.responseText);
            if (searchLinks.length > 0) {
                document.getElementById("outputURL").value = BASE_COPY_LINK;
            }

            // Search all the Spotify songs to get their respective YouTube video IDs (if they exist)
            console.log("POTENTIAL SONG COUNT: " + searchLinks.length);
            for (let linkIndex = 0; linkIndex < searchLinks.length; linkIndex++) {
                setTimeout(function() {
                    searchSpotify(searchLinks[linkIndex]);
                }, 100 * linkIndex);
            }

            // Report on the website that the link has finished loading
            setTimeout(function() {
                document.getElementById("reporter").innerHTML = MESSAGE_FINISH;
                setClickable(false);
            }, 350 * searchLinks.length);
        }
    };
    xHttp.open("GET", "https://cors-anywhere.herokuapp.com/" + paramURL, true);
    xHttp.send();
}

function searchSpotify(paramSearch) {
    const FILTER_ARRAY = ["<em>", "</em>", "&#39;", "&#039;", "&quot;", "<wbr>"];
    const HTML_SEARCH_TERM = " on Spotify";

    // This block represents a Spotify song query request
    let xHttp = new XMLHttpRequest();
    xHttp.onreadystatechange = function() {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {

            // Index for the Spotify song's author and title
            let searchResults = this.responseText;
            let indexEnd = searchResults.indexOf(HTML_SEARCH_TERM);
            let indexInit = indexEnd - 1;
            while (searchResults.charAt(indexInit) != '>') {
                indexInit--;
            }

            // Sanitize the song string and put it in the "<author> - <songName>" format
            let song = searchResults.substring(indexInit + 1, indexEnd);
            for (let filterIndex = 0; filterIndex < FILTER_ARRAY.length; filterIndex++) {
                song = song.replace(FILTER_ARRAY[filterIndex], "");
            }
            song = song.split(", a song by ");
            song = {author: song[1], name: song[0]};
            song = song.author + " - " + song.name;

            // Use the song as a search query, for adding the video's ID to the output link
            addSearchVideoID(song);
        }
    };
    xHttp.open("GET", "https://cors-anywhere.herokuapp.com/" + "https://" + paramSearch, true);
    xHttp.send();
}

function addSearchVideoID(paramSong) {
    const HTML_SEARCH_TERM = "https://www.youtube.com/watch?v=";
    const SEARCH_QUERIER = "https://www.google.com/search?q=";

    // This block represents a YouTube search query request
    let xHttp = new XMLHttpRequest();
    xHttp.onreadystatechange = function() {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
            let searchResults = this.responseText;

            // Use Google search query to get the ID of the first video result from searching <paramSong>
            let firstOccurence = searchResults.indexOf(HTML_SEARCH_TERM);
            let nameIndexInit = firstOccurence + HTML_SEARCH_TERM.length;
            let nameIndexEnd = searchResults.indexOf("\"", nameIndexInit + 1);
            let resName = searchResults.substring(nameIndexInit, nameIndexEnd);

            if (firstOccurence >= 0) {
                // Append the ID to the output YouTube link
                let elemOutURL = document.getElementById("outputURL");
                if ((elemOutURL.value).indexOf(resName) < 0) {
                    elemOutURL.value += resName + ",";
                }
                console.log("APPENDED (name=\"" + paramSong + "\", id=\"" + resName + "\")");
                console.log("CONTENT AT AREA (len=250): [" + searchResults.substring(nameIndexInit - HTML_SEARCH_TERM.length, nameIndexInit - HTML_SEARCH_TERM.length + 250)) + "]";
            }
            else {
                // ERROR 1: Cannot append the ID; no link is found
                console.log("ERROR 1 (" + paramSong + "): No YouTube link found");
            }

        }
        else {
            // ERROR 2: Cannot request song due to request error
            console.log("ERROR 2 (" + paramSong + "): Song cannot be requested (readyState=\"" + this.readyState + "\", status=\"" + this.status + "\")");
        }
    };
    xHttp.open("GET", "https://cors-anywhere.herokuapp.com/" + SEARCH_QUERIER + paramSong.replace(" ", "%20"), true);
    xHttp.send();
}

function getSearches(paramContent) {
    const LINK_LENGTH = 45;
    const YT_VIDEO_CAP = 50;
    const SONG_LINK_STARTER = "open.spotify.com/track";

    paramContent = paramContent.replace(/\\/g, '');

    // Loop through all lines in the HTML content (max: 64)
    let htmlContent = paramContent.split('\n');
    for (let lineIndex = 0; lineIndex < htmlContent.length; lineIndex++) {
        let line = htmlContent[lineIndex];

        // Condition for lines listing all of the songs
        if (line.indexOf(SONG_LINK_STARTER) >= 0) {

            // Get trackIndices of the HTML
            let songIndex = 0;
            let trackIndices = [];
            while (true) {
                songIndex = line.indexOf(SONG_LINK_STARTER, songIndex);
                if (songIndex < 0) {
                    break;
                }
                trackIndices.push(songIndex);
                songIndex++;
            }

            // Get searches from trackIndices
            let searches = [];
            for (let trackIndex = 0; trackIndex < Math.min(YT_VIDEO_CAP, trackIndices.length); trackIndex++) {
                let linkIndex = trackIndices[trackIndex];
                searches.push(line.substring(linkIndex, linkIndex + LINK_LENGTH));
            }
            for (let trackIndex = 0; trackIndex < searches.length; trackIndex++) {
                console.log("TRACK #" + (trackIndex + 1) + ": " + searches[trackIndex]);
            }
            return searches;
        }
    }
    return [];
}

function init() {
    // Runs on loading main.js
    console.log("< main.js >");
    setTimeout(function() {
        resetCache();
    }, 1);
}
init();