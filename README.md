# Spotify to YouTube Playlist Converter
<p align="center">
  <img width="800" height="400" src="https://i.imgur.com/imn7awQ.png">
</p>



## Program Description

A website for converting Spotify playlists to YouTube playlists without logging into Spotify or registration. However, this method only supports <b>up to 50 songs per playlist.</b>

Try it [here](https://ptjung.github.io/Spotify-Youtube-Converter)!

## Known Bugs

* Excessive song requests will lead to the website being temporarily blocked by Spotify
* In rare occasions, a completely unrelated YouTube video will be selected
* Specific playlists being converted will not convert some specific songs
* Invalid URIs with the correct link format will convert forever

## Changelog

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
