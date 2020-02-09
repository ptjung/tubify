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

function accessTrackList(paramURL) {
    const HTML_SEARCH_LINK = "open.spotify.com/embed";

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

function makePlaylist(paramURL) {
    const MESSAGE_CONVERT = "Converting...";
    const MESSAGE_FINISH = "Finished!";
    const EXPECT_LINK_MATERIAL = "open.spotify.com/";
    const BASE_COPY_LINK = "https://www.youtube.com/watch_videos?video_ids=";

    if (paramURL.indexOf(EXPECT_LINK_MATERIAL) >= 0) {
        console.log("VALID REQUEST");

        // Report on the website that the link is loading
        document.getElementById("reporter").innerHTML = MESSAGE_CONVERT;
        document.getElementById("outputCopy").disabled = true;
        document.getElementById("outputOpen").disabled = true;

        // This block represents a Spotify playlist request
        let xHttp = new XMLHttpRequest();
        xHttp.onreadystatechange = function() {
            if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
                let searchLinks = getSearches(this.responseText);

                // Initialize base URL such that video IDs can be appended to it, to form a link
                if (searchLinks.length > 0) {
                    document.getElementById("outputURL").value = BASE_COPY_LINK;
                }

                // Search all the Spotify songs to get their respective YouTube video IDs (if they exist)
                for (let linkIndex = 0; linkIndex < searchLinks.length; linkIndex++) {
                    searchSpotify(searchLinks[linkIndex]);
                }

                // Report on the website that the link has finished loading
                document.getElementById("reporter").innerHTML = MESSAGE_FINISH;
                document.getElementById("outputCopy").disabled = false;
                document.getElementById("outputOpen").disabled = false;
            }
        };
        xHttp.open("GET", "https://cors-anywhere.herokuapp.com/" + paramURL, true);
        xHttp.send();
    }
    else {
        console.log("INVALID REQUEST");
    }
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
            song = (song[1] + " - " + song[0]);

            // Use the song as a search query, for adding the video's ID to the output link
            addSearchVideoID(song);
            console.log("REQUEST SONG: " + song);
        }
    };
    xHttp.open("GET", "https://cors-anywhere.herokuapp.com/" + "https://" + paramSearch, true);
    xHttp.send();
}

function addSearchVideoID(paramSong) {
    const HTML_SEARCH_TERM = "\"videoId\":\"";
    const SEARCH_QUERIER = "https://www.youtube.com/results?search_query=";

    // This block represents a YouTube search query request
    let xHttp = new XMLHttpRequest();
    xHttp.onreadystatechange = function() {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {

            // Use YouTube search query to get the ID of the first video result from searching <paramSong>
            let searchResults = this.responseText;
            let indexInit = searchResults.indexOf(HTML_SEARCH_TERM) + HTML_SEARCH_TERM.length;
            let indexEnd = searchResults.indexOf("\"", indexInit + 1);
            let res = searchResults.substring(indexInit, indexEnd);
            let elemOutURL = document.getElementById("outputURL");

            // Append the ID to the output YouTube link
            if ((elemOutURL.value).indexOf(res) < 0) {
                elemOutURL.value += res + ",";
            }
        }
    };
    xHttp.open("GET", "https://cors-anywhere.herokuapp.com/" + SEARCH_QUERIER + paramSong, true);
    xHttp.send();
}

function getSearches(paramContent) {
    const LINK_LENGTH = 45;
    const YT_VIDEO_CAP = 50;
    const SONG_LINK_STARTER = "open.spotify.com/track";

    paramContent = paramContent.replace(/\\/g, '');
    //console.log("CONTENT: " + paramContent);

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
                console.log("Track " + trackIndex + ": " + searches[trackIndex]);
            }
            return searches;
        }
    }

    return [];
}