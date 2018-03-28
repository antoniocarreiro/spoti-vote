import React, {Component} from 'react';
import Infos from './Sidebar/Infos.jsx';
import UserContainer from './Sidebar/UserContainer.jsx';

let color = require('../css/colors.js');
let defaultStyle = {
	height: 'calc(100vh - 75px)',
	width: '250px',
	position: 'absolute',
	top: 0,
	right: 0,
	color: 'white',
	backgroundColor: color.backgroundLite
}

class Sidebar extends Component {

	render() {
		console.log(this.props);
		return (<div style={defaultStyle}>
			<Infos token={this.props.token} handler={this.props.playlistHandler} playlistCover={this.props.playlistCover} playlistUrl={this.props.playlistUrl}/>
			<UserContainer token={this.props.token}/>
		</div>);
	}
}
export default Sidebar;
