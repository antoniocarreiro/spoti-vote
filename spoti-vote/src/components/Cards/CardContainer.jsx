import React, {Component} from 'react';
import Card from './Card.jsx';

let color = require('../../css/colors.js');
let fakeServer = {
	pictures: [
		{
			song: 'NTFS',
			artists: 'Linux, Windows, Macintosh',
			background: 'https://picsum.photos/650'
		}, {
			song: 'NTFS',
			artists: 'Linux, Windows, Macintosh',
			background: 'https://picsum.photos/550'
		}, {
			song: 'NTFS',
			artists: 'Linux, Windows, Macintosh',
			background: 'https://picsum.photos/500'
		}, {
			song: 'NTFS',
			artists: 'Linux, Windows, Macintosh',
			background: 'https://picsum.photos/600'
		}
	]
}

let defaultStyle = {
	height: 'calc(100vh - 125px)',
	width: 'calc(100vw - 375px)',
	position: 'absolute',
	top: 0,
	left: '75px',
	display: 'flex',
	flexWrap: 'wrap',
	flexDirection: 'row',
	padding: '25px',
	overflow: 'hidden',
	backgroundColor: color.background
}

class CardContainer extends Component {
	constructor() {
		super();
		this.state = {
			selectedPlaylist: {
				name: '',
				id: '',
				href: ''
			},
			next: '',
			tracks: []
		}
	}

	componentDidUpdate() {
		let access_token = this.props.token;
		if (this.props.playlist.name !== '' && this.props.playlist.id !== '' && this.props.playlist.href !== '') {
			if (this.props.playlist.name !== this.state.selectedPlaylist.name && this.props.playlist.id !== this.state.selectedPlaylist.id) {
				this.setState({
					selectedPlaylist: {
						name: this.props.playlist.name,
						id: this.props.playlist.id
					},
					next: this.props.playlist.href + '/tracks?fields=items(track(name%2Chref%2Calbum(images)%2Cartists(name)%2C%20id))%2Cnext%2Coffset%2Ctotal',
					tracks: []
				});
			}
		}
		if (this.state.selectedPlaylist.id !== '' && this.state.selectedPlaylist.id === this.props.playlist.id) {
			while (this.state.next !== null) {
				fetch(this.state.next, {
					headers: {
						"Authorization": "Bearer " + access_token
					}
				}).then((response) => response.json().then(data => {
					this.setState({
						next: data.next,
						tracks: this.state.tracks.concat(data.items)

					})
				}));
				break;
			}
		}

	}

	getRandomTrack() {
		if (this.state.next === null && this.state.tracks.length > 0 && this.state.selectedPlaylist.id === this.props.playlist.id) {
			let random = Math.floor(Math.random() * this.state.tracks.length); //gets random song number for tracksarray
			return this.state.tracks[random].track;
			// let song = this.state.tracks[random].track.name;
			// let id = this.state.tracks[random].track.id;
			// let artists = [];
			// artists.push(this.state.tracks[random].track.artists.map((artist) => artist.name));
			// let albumCover = this.state.tracks[random].track.album.images[0].url;
		} else {
			return {
				name: '',
				id: '',
				artists: [],
				album: {
					images: [
						{
							url: ''
						}
					]
				}
			};
		}
	}

	render() {
		return (<div style={defaultStyle}>
			<Card randomTrack={this.getRandomTrack()} votes="1" color={color.redCard}/>
			<Card randomTrack={this.getRandomTrack()} votes="-" color={color.blueCard}/>
			<Card randomTrack={this.getRandomTrack()} votes="5" color={color.greenCard}/>
			<Card randomTrack={this.getRandomTrack()} votes="100" color={color.yellowCard}/>
		</div>);
	}
}
export default CardContainer;
