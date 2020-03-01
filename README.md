# Spotify to YouTube Playlist Converter
<p align="center">
  <img width="800" height="400" src="https://i.imgur.com/imn7awQ.png">
</p>



## Program Description

A website for converting Spotify playlists to YouTube playlists without logging into Spotify or registration. However, this method only supports <b>up to 50 songs per playlist.</b>

Try it [here](https://ptjung.github.io/Spotify-Youtube-Converter)!

## Known Bugs

* Invalid URIs with the correct link format will convert forever
* In rare occasions, unrelated YouTube videos will be selected
* Specific playlists will be unable to convert specific songs

## Changelog

(March 1, 2020)
* Improvements to Spotify-YouTube-Converter.
  * Bug fix: linking errors caused the converter to stop working
  * Bug fix: songs with special characters might not convert
  * Improved the time it takes to convert a playlist
  * Improved the rate of success for song picking
  * Added conversion animation

(February 9, 2020)
* Quick patches to Spotify-YouTube-Converter.
  * Bug fix: the text forms do not reset on refresh
  * Bug fix: the "finish" event happens too early
  * Improved the YouTube picking algorithm
  * Improved website error reporting

(February 8, 2020)
* Bug fixes to Spotify-YouTube-Converter.
  * Bug fix: larger playlists do not have all of their songs converted
  * Bug fix: permanent freezing when converting specific songs
* Released Spotify-YouTube-Converter.
