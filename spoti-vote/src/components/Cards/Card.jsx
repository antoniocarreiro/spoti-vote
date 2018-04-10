import React, {Component} from 'react';

let constants = require('../../js/constants');

let defaultStyle = {
	flexBasis: 'calc(50% - 40px)',
	margin: '20px',
	userSelect: 'none',
	border: 0,
	padding: 0,
	position: 'relative',
	backgroundPosition: 'center',
	backgroundRepeat: 'no-repeat',
	backgroundSize: 'cover',
	backgroundColor: constants.colors.blueCard,
	WebKitUserSelect: 'none',
	MozUserSelect: 'none'
}

let imgStyle = {
	width: '100%',
	position: 'absolute',
	top: 0,
	right: 0,
	bottom: 0,
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	flexDirection: 'column'
}

class Card extends Component {

	constructor() {
		super();
		this.state = {
			hover: false
		}
	}

	toggleHover() {
		this.setState({
			hover: !this.state.hover
		})
	}

	hexToRgb(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			}
			: null;
	}

	render() {
		const tint = this.hexToRgb(this.props.color);
		let linkStyle;
		if (this.state.hover) {
			linkStyle = {
				cursor: 'pointer'
			}
		} else {
			linkStyle = {
				cursor: 'context-menu'
			}
		}

		let votes = this.props.randomTrack.votes;
		if (votes === undefined || votes === 0) {
			votes = '-';
		}

		let artistString = '';
		for (var i = 0; i < this.props.randomTrack.artists.length; i++) {
			artistString += this.props.randomTrack.artists[i].name;
			if (i < this.props.randomTrack.artists.length - 1) {
				artistString += ' ';
			}
		}

		return (<button onClick={this.props.onClick} onMouseEnter={this.toggleHover.bind(this)} onMouseLeave={this.toggleHover.bind(this)} style={{
				...defaultStyle,
				...linkStyle,
				backgroundImage: 'url(' + this.props.randomTrack.album.images[0].url + ')'
			}} id={this.props.randomTrack.id}>
			<div style={{
					...imgStyle,
					backgroundColor: 'rgba(' + tint.r + ',' + tint.g + ',' + tint.b + ',' + 0.5 + ')'
				}}>
				<div style={{
						fontSize: '2em',
						textAlign: 'center'
					}}>{this.props.randomTrack.name || '-'}</div>
				<div>{artistString || '-'}</div>
				<div style={{

						fontSize: '1.25em'
					}}>{votes + ' Votes'}</div>
			</div>
		</button>);
	}
}
export default Card;
