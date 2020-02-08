function copyToClipboard() {
    let copyText = document.getElementById("outputURL");
    copyText.select();
    copyText.setSelectionRange(0, copyText.value.length);
    document.execCommand("copy");
}

function openLinkWindow() {
    let link = document.getElementById("outputURL").value;
    if (link.length > 0) {
        window.open(link);
    }
}

function clearURLField() {
    document.getElementById('inputURL').value = '';
}

function makePlaylist(paramURL) {
    console.log("paramURL: " + paramURL);

    const MESSAGE_CONVERT = "Converting...";
    const MESSAGE_FINISH = "Finished!";

    const EXPECT_LINK_MATERIAL = "open.spotify.com/";
    const BASE_COPY_LINK = "https://www.youtube.com/watch_videos?video_ids=";

    if (paramURL.indexOf(EXPECT_LINK_MATERIAL) >= 0) {
        console.log("VALID REQUEST");

        document.getElementById("reporter").innerHTML = MESSAGE_CONVERT;
        document.getElementById("outputCopy").disabled = true;
        document.getElementById("outputOpen").disabled = true;

        let xHttp = new XMLHttpRequest();
        xHttp.onreadystatechange = function() {
            if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
                let searchLinks = getSearches(this.responseText);

                setTimeout(function() {
                    if (searchLinks.length > 0) {
                        document.getElementById("outputURL").value = BASE_COPY_LINK;
                    }

                    for (let linkIndex = 0; linkIndex < searchLinks.length; linkIndex++) {
                        setTimeout(function() {
                            searchGoogle(searchLinks[linkIndex]);
                        }, 115 * linkIndex);
                    }

                    setTimeout(function() {
                        document.getElementById("reporter").innerHTML = MESSAGE_FINISH;
                        document.getElementById("outputCopy").disabled = false;
                        document.getElementById("outputOpen").disabled = false;
                    }, 125 * searchLinks.length);
                }, 100);
            }
        };
        xHttp.open("GET", "https://cors-anywhere.herokuapp.com/" + paramURL, true);
        xHttp.send();
    }
    else {
        console.log("INVALID REQUEST");
    }
}

function searchGoogle(paramSearch) {
    console.log("paramSearch: " + paramSearch);

    const HTML_SEARCH_TERM = " on Spotify";
    const SEARCH_QUERIER = "https://www.google.com/search?q=";

    let xHttp = new XMLHttpRequest();
    xHttp.onreadystatechange = function() {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
            let searchResults = this.responseText;
            let indexEnd = searchResults.indexOf(HTML_SEARCH_TERM);
            let indexInit = indexEnd - 1;
            while (searchResults.substring(indexInit, indexInit + 2) != "\">") {
                indexInit--;
            }
            let song = searchResults.substring(indexInit + 2, indexEnd)
            song = ((((song.replace("<em>", "")).replace("</em>", "")).replace("&#39;", "")).replace("&quot;", "")).replace("<wbr>", "")
            song = song.split(", a song by ");
            song = (song[1] + " - " + song[0]);
            addSearchVideoID(song);
            console.log("REQUEST SONG: " + song);
        }
    };
    xHttp.open("GET", "https://cors-anywhere.herokuapp.com/" + SEARCH_QUERIER + paramSearch, true);
    xHttp.send();
}

function addSearchVideoID(paramSong) {
    console.log("paramSong: " + paramSong);

    const HTML_SEARCH_TERM = "\"videoId\":\"";
    const SEARCH_QUERIER = "https://www.youtube.com/results?search_query=";

    let xHttp = new XMLHttpRequest();
    xHttp.onreadystatechange = function() {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
            let searchResults = this.responseText;
            let indexInit = searchResults.indexOf(HTML_SEARCH_TERM) + HTML_SEARCH_TERM.length;
            let indexEnd = searchResults.indexOf("\"", indexInit + 1);
            let res = searchResults.substring(indexInit, indexEnd);
            document.getElementById("outputURL").value += res + ",";
        }
    };
    xHttp.open("GET", "https://cors-anywhere.herokuapp.com/" + SEARCH_QUERIER + paramSong, true);
    xHttp.send();
}

function getSearches(paramContent) {
    const LINK_LENGTH = 45;
    const SONG_LINK_STARTER = "open.spotify.com/track";
    const SONG_LINK_TRUNCAT = "open.spotify.";


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
            for (let trackIndex = 0; trackIndex < trackIndices.length; trackIndex++) {
                let linkIndex = trackIndices[trackIndex];
                searches.push(line.substring(linkIndex + SONG_LINK_TRUNCAT.length, linkIndex + LINK_LENGTH));
            }
            return searches;
        }
    }

    return [];
}