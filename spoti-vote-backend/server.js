/*jshint esversion: 6, node: true, undef: true*/
"use strict"; //Places the server in a strict enviroment (More exeptions, catches coding blooper, prevents unsafe actions, disables some features)
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const querystring = require('querystring');
const request = require('request');
//Import of used files
const constants = require('./src/constants');
const Room = require('./src/Room');
//Setup of the server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

//Global Varibles

const addressOutside = process.env.ADDRESS || 'spoti-vote.com';
const portOutside = process.env.PORTOUTSIDE || 80;
const backendExtension = '/b';

const addressInside = process.env.INTERNALADDRESS || 'localhost';
const portFront = process.env.PORT || 8080;
const portBack = process.env.PORTBACK || 8888;
const redirect_uri = 'http://' + addressOutside + ':' + portOutside + backendExtension + '/callback';

const secTillDelete = 60;

console.log(redirect_uri);
let rooms = [];
let allClients = {};

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
		if (rooms[i].id == roomId) {
			room = rooms[i];
		}
	}
	return room;
}

/* jshint ignore: start */

/**
* Login using the Spotify API (This is only a Redirect)
*/
app.get(backendExtension + '/login', (req, res) => {
	res.redirect('https://accounts.spotify.com/authorize?' + querystring.stringify({response_type: 'code', client_id: process.env.SPOTIFY_CLIENT_ID, scope: 'user-read-private user-read-email user-read-currently-playing user-modify-playback-state user-read-playback-state playlist-read-collaborative playlist-read-private', redirect_uri}));
});

/**
* The callback that will be called when the Login with the Spotify API is completed
* Will redirect the user to the newly created room
*/
app.get(backendExtension + '/callback', async (req, res) => {
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
	request.post(authOptions, async (error, response, body) => {
		let uri = 'http://' + addressOutside + ':' + portOutside + '/app';
		let room = new Room(body.access_token, rooms, 4);

		if (await room.fetchData() == true) {
			rooms.push(room);
			console.log(uri + '/' + room.id);
			res.redirect(uri + '/' + room.id); // + '?token=' + body.access_token);
		} else {
			res.redirect('https://' + addressOutside + ':' + portOutside);
		}
	});
});

/**
* Get a list of all rooms
*
* @Returns ResponseCode of 200
* @Returns content Array of all the rooms
*/
app.get(backendExtension + '/rooms', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');

	let roomIds = [];
	for (var i = 0; i < rooms.length; i++) {
		roomIds.push(rooms[i].id);
	}

	res.send({responseCode: constants.codes.SUCCESS, content: roomIds});
});
/* jshint ignore: end */

/**
* Is called when a new connection is established
*/
io.on('connection', (socket) => {
	//Local varibles, can only be used by the same connection (but in every call)
	console.log('connection enabled');
	let roomId = null;
	let isHost = false;
	let name = null;
	let updateCounter = {
		amount: 0
	};

	/* jshint ignore: start */
	//This function is called every 500ms
	let updateInterval = setInterval(() => theUpdateFunction(socket, roomId, isHost, updateCounter), 500);
	/* jshint ignore: end */

	//This is what happens when a user connects
	socket.emit('roomId');

	/**
    * Called when a user wants to connect to a room
	*
	* Will set the local varible {room} and {isHost}
	* @param {string} roomId Id of the room
    */
	socket.on('roomId', data => {
		let room = getRoomById(data.roomId);

		//Check if this user is already hosting a room
		if (room !== null) {
			let x = -1;
			for (let i = 0; i < rooms.length; i++) {
				if (rooms[i].host.id == room.host.id && rooms[i].id !== room.id) {
					x = i;
				}
			}

			//Check if its old
			let toBeDeleted = [];
			for (let i = 0; i < rooms.length; i++) {
				if (Date.now() - rooms[i].hostDisconnect > 1000 * secTillDelete && rooms[i].hostDisconnect !== null) {
					toBeDeleted.push(rooms[i]);
				}
			}
			for (let i = 0; i < toBeDeleted.length; i++) {
				console.log('-de- Deleting [' + toBeDeleted[i].id + '] due to inactivity');
				rooms.splice(rooms.indexOf(toBeDeleted[i]), 1);
				if (i == x) {
					x = -1;
				}
			}

			if (x >= 0) {
				socket.emit('errorEvent', {
					message: 'You are already hosting a Room, try joining: [' + rooms[x].id + ']'
				});
				rooms.splice(rooms.indexOf(room), 1);
			} else {
				if (room !== null) {
					roomId = room.id;
					if (room.firstConnection === true) {
						room.firstConnection = false;
						console.log('-c - Host connected');
						isHost = true;
						socket.emit('initData', {
							playlists: room.getPlaylists(),
							hostName: room.host.name,
							isHost: isHost,
							token: room.host.token
						});
						room.hostDisconnect = null;
					} else {
						if (room.hostDisconnect !== null && data.token == room.host.token) { //If host is gone
							console.log('-c - Host connected');
							isHost = true;
							socket.emit('initData', {
								playlists: room.getPlaylists(),
								hostName: room.host.name,
								isHost: isHost
							});
							room.hostDisconnect = null;
						} else {
							socket.emit('nameEvent', {userNames: room.getUserNames()});
						}
					}

				} else {
					socket.emit('errorEvent', {message: 'Room has been closed'});
				}
			}
		}
	});

	/**
    * Called when a user thats not a host wants to enter a room
	*
	* Will set the local varible {name}
	* @param {string} name Name of the user
    */
	socket.on('nameEvent', data => {
		console.warn('Request to nameEvent:');
		console.error(data);
		let room = getRoomById(roomId);
		if (room !== null) {
			console.log('-c - [' + data.name + '] connected');
			name = data.name;
			if (name !== null) {
				room.addUser(name);
				socket.emit('initData', {hostName: room.host.name});
			}
		} else {
			socket.emit('errorEvent', {message: 'Room was closed'});
		}

	});

	/**
    * Called when the host changes the volume
	* @param {int} volume Volume in percent
    */
	socket.on('changeVolume', data => {
		console.warn('Request to changeVolume:');
		console.error(data);
		let room = getRoomById(roomId);
		if (room !== null) {
			console.log('-vl- The volume was changed to: [' + data.volume + ']');
			room.changeVolume(data.volume);
		} else {
			socket.emit('errorEvent', {message: 'Room was closed'});
		}
	});

	/**
    * Called when the host changes the playlist
	* @param {string} playlistId Name of the user
    */
	socket.on('changePlaylist', data => {
		console.warn('Request to changePlaylist:');
		console.error(data);
		let room = getRoomById(roomId);
		if (room !== null) {
			console.log('-pC- Playlist changed to: [' + data.playlistId + ']');
			room.changePlaylist(data.playlistId);
		} else {
			socket.emit('errorEvent', {message: 'Room was closed'});
		}
	});

	/**
    * Called when a user votes on a track
	* @param {string} trackId Id of the track
    */
	socket.on('vote', data => {
		console.warn('Request to vote:');
		console.error(data);
		let room = getRoomById(roomId);
		if (room !== null) {
			if (isHost === true) {
				console.log('-vo- the host voted for: [' + data.trackId + ']');
			} else {
				console.log('-vo- [' + name + '] voted for: [' + data.trackId + ']');
			}
			room.vote(data.trackId, isHost, name);
		} else {
			socket.emit('errorEvent', {message: 'Room was closed'});
		}
	});

	/**
    * Called when the host wants to close the room
    */
	socket.on('logout', data => {
		console.warn('Request to logout:');
		console.error(data);
		let room = getRoomById(roomId);
		if (room !== null) {
			console.log('-lo- room [' + room.id + '] was closed by host');
			let i = rooms.indexOf(room);
			rooms.splice(i, 1);
		} else {
			socket.emit('errorEvent', {message: 'Room was closed'});
		}
	});

	/**
    * Called when a connection is closed
    */
	socket.on('disconnect', () => {
		let room = getRoomById(roomId);

		/* jshint ignore: start */
		clearInterval(updateInterval);
		/* jshint ignore: end */
		if (room !== null) {
			if (isHost === false) {
				room.removeUser(name);

				console.log('-d - [' + name + '] disconnected from [' + room.id + ']');
			} else {
				room.hostDisconnect = Date.now();

				console.log('-d - Host disconnected from [' + room.id + ']');
			}
		} else {
			console.log('-d - User was auto-disconnected from [' + roomId + ']');
		}
	});
});

/* jshint ignore: start */

/**
* This function will be called every interval and is used to update the users
*
* @author: Michiocre
* @param {socket} socket The socket object passed down from the call
*/
async function theUpdateFunction(socket, roomId, isHost, updateCounter) {
	let room = getRoomById(roomId);
	if (room !== null) {
		room.update(isHost);
		socket.emit('update', room);
		//console.log('-u -');
	} else {
		socket.emit('errorEvent', {message: null});
	}

	updateCounter.amount += 1;
	if (updateCounter.amount > 30) {
		let toBeDeleted = [];
		for (var i = 0; i < rooms.length; i++) {
			if (Date.now() - rooms[i].hostDisconnect > 1000 * 60 && rooms[i].hostDisconnect !== null) {
				toBeDeleted.push(rooms[i]);
			}
		}
		for (var i = 0; i < toBeDeleted.length; i++) {
			console.log('-de- Deleting [' + toBeDeleted[i].id + '] due to inactivity');
			rooms.splice(rooms.indexOf(toBeDeleted[i]), 1);
		}
		updateCounter.amount = 0;
	}
};

/* jshint ignore: end */

/**
* Starts the server
*/
server.listen(portBack, () => {
	console.log('Server started on port: ' + server.address().port);
});
