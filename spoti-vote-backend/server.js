"use strict"; //Places the server in a strict enviroment (More exeptions, catches coding blooper, prevents unsafe actions, disables some features)

const express = require('express');
const request = require('request');
const querystring = require('querystring');

let Room = require('./src/Room');
let constants = require('./src/constants');

let app = express();

let redirect_uri = process.env.REDIRECT_URI || 'http://localhost:8888/callback';

let rooms = [];

/**
* Return the room with the specified id
*
* @author: Michiocre
* @param {string} roomId The id that identifies the room
* @return {Room} The room object with the id of the parameter
*/
function getRoomById(roomId) {
	let room = null;
	for (var i = 0; i < rooms.length; i++) {
		if (rooms[i].id == roomId) 
			room = rooms[i];
		}
	return room;
}

/**
* Login using the Spotify API (This is only a Redirect)
*/
app.get('/login', function(req, res) {
	console.log(process.env.SPOTIFY_CLIENT_ID);
	console.log(process.env.SPOTIFY_CLIENT_SECRET);
	res.redirect('https://accounts.spotify.com/authorize?' + querystring.stringify({response_type: 'code', client_id: process.env.SPOTIFY_CLIENT_ID, scope: 'user-read-private user-read-email user-read-currently-playing user-modify-playback-state user-read-playback-state playlist-read-collaborative', redirect_uri}));
});

/**
* The callback that will be called when the Login with the Spotify API is completed
* Will redirect the user to the newly created room
*/
app.get('/callback', async function(req, res) {
	let code = req.query.code || null;
	let authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		form: {
			code: code,
			redirect_uri,
			grant_type: 'authorization_code'
		},
		headers: {
			'Authorization': 'Basic ' + (
			new Buffer(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
		},
		json: true
	};
	request.post(authOptions, async function(error, response, body) {
		let uri = process.env.FRONTEND_URI || 'http://localhost:3000/app';

		let room = new Room(body.access_token, rooms);
		await room.fetchData();
		rooms.push(room);

		res.redirect(uri + '/' + room.id + '?token=' + body.access_token);
	});
});

/**
* Get a list of all playlists of this room
*
* @PathParameter id  The id of the room
* @Returns ResponseCode of either 200 or 404 based on if the room-id exists
* @Returns responseMessage with error message in case of error
* @Returns content Array of all the playlists
*/
app.get('/room/playlists', async function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	let room = getRoomById(req.query.id);
	if (room != null) {
		res.send({responseCode: constants.codes.SUCCESS, responseMessage: '', content: await room.getPlaylists()});
	} else {
		res.send({responseCode: constants.codes.NOTFOUND, responseMessage: 'This room was not found'});
	}
});

/**
* Get the hosts user data of this room
*
* @PathParameter id  The id of the room
* @Returns ResponseCode of either 200 or 404 based on if the room-id exists
* @Returns responseMessage with error message in case of error
* @Returns content Object with the user data
*/
app.get('/room/host', async function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	let room = getRoomById(req.query.id);
	if (room != null) {
		res.send({responseCode: constants.codes.SUCCESS, responseMessage: '', content: await room.getHostInfo()});
	} else {
		res.send({responseCode: constants.codes.ROOMNOTFOUND, response: 'This room was not found'});
	}
});

/**
* Selects a new set of active tracks
*
* @PathParameter id  The id of the room
* @PathParameter playlist  The id of the playlist
* @Returns ResponseCode of either 200 or 404 or 414 or 500 based on if the room-id and the playlist-id exists or if the playlist is to small
* @Returns responseMessage with error message in case of error
*/
app.get('/room/newTracks', async function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	let playlistId = req.query.playlist;
	let room = getRoomById(req.query.id);

	if (room != null) {
		if (playlistId != 'none') {
			if (await room.getRandomTracks(playlistId) == true) {
				res.send({responseCode: constants.codes.SUCCESS, responseMessage: 'New tracks were generated'});
			} else {
				res.send({responseCode: constants.codes.ERROR, responseMessage: 'The playlist is to small'})
			}
		} else {
			res.send({responseCode: constants.codes.PLNOTFOUND, responseMessage: 'You cant pick no playlist'})
		}
	} else {
		res.send({responseCode: constants.codes.ROOMNOTFOUND, responseMessage: 'This room was not found'});
	}
});

/**
* Gets the current set of active playlist, tracks, connected users, num of playlists,...
* All the data that is needed to keep the frontend synced
*
* @PathParameter id  The id of the room
* @PathParameter loggedIn Boolean if the user is host or not
* @Returns ResponseCode of either 200 or 404 based on if the room-id exists
* @Returns responseMessage with error message in case of error
* @Returns content Object with the data
*/
app.get('/room/update', async function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	let room = getRoomById(req.query.id);

	if (room != null) {
		res.send({
			responseCode: constants.codes.SUCCESS,
			responseMessage: '',
			content: await room.update(req.query.loggedIn)
		});
	} else {
		res.send({responseCode: constants.codes.ROOMNOTFOUND, responseMessage: 'This room was not found'});
	}
});

/**
* Checks if a given token is the same one that was returned by the Spotify API
*
* @PathParameter id  The id of the room
* @PathParametert token The token that will be checked
* @Returns ResponseCode of either 200 or 404 based on if the room-id exists
* @Returns responseMessage with error message in case of error
* @Returns content Boolean true if the token match
*/
app.get('/room/checkToken', async function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	let room = getRoomById(req.query.id);

	if (room != null) {
		res.send({
			responseCode: constants.codes.SUCCESS,
			responseMessage: '',
			content: await room.checkToken(req.query.token)
		});
	} else {
		res.send({responseCode: constants.codes.ROOMNOTFOUND, responseMessage: 'This room was not found'});
	}
});

/**
* Adds a user to the list of connected users
*
* @PathParameter id  The id of the room
* @PathParametert name of the user that will be added
* @Returns ResponseCode of either 200 or 404 based on if the room-id exists
* @Returns responseMessage with error message in case of error
*/
app.get('/room/connect', async function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	let room = getRoomById(req.query.id);

	if (room != null) {
		await room.connect(req.query.name);
		res.send({responseCode: constants.codes.SUCCESS, responseMessage: ''});
	} else {
		res.send({responseCode: constants.codes.ROOMNOTFOUND, responseMessage: 'This room was not found'});
	}
});

let port = process.env.PORT || 8888;
console.log(`Listening on port ${port}. Go /login to initiate authentication flow.`);
app.listen(port);
