import React, {Component} from 'react';
import SongIcon from './Footer/SongIcon.jsx';
import SongAggregation from './Footer/SongAggregation.jsx';
import VolumeBar from './Footer/VolumeBar.jsx';

let color = require('../css/colors.js');
let defaultStyle = {
	height: '75px',
	width: '100vw',
	position: 'absolute',
	bottom: 0,
	backgroundColor: color.backgroundLite
}
//<PlayButton/>

class Footer extends Component {
	render() {
		return (<footer style={defaultStyle}>
			<SongIcon/>
			<SongAggregation/>
			<VolumeBar/>
		</footer>);
	}
}
export default Footer;