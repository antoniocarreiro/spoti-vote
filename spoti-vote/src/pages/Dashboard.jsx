import React, {Component} from 'react';
import {css} from 'glamor';
import Cookies from 'universal-cookie';

import Sidebar from '../components/Dashboard/Sidebar.jsx';
import Main from '../components/Dashboard/Main.jsx';

const cookies = new Cookies();
const constants = require('../js/constants');
const styles = {
    main: css({backgroundColor: constants.colors.background, maxHeight: '100vh', maxWidth: '100vw'})
};

class Dashboard extends Component {

    constructor() {
        super();
        this.state = {
            profile: {
                name: null,
                id: 0,
                img: 'https://via.placeholder.com/152x152'
            },
            topTracks: []
        }
    }

    componentDidMount() {
        let token = cookies.get('token');

        if (token === undefined) {
            token = window.location.search.split('=')[1];
        }

        if (token === undefined) {
            window.location.pathname = '';
        } else {
            cookies.set('token', token);
        }

        //Gets rid of the search in window.location
        var myNewURL = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
        window.history.pushState({}, document.title, myNewURL)
        console.log(myNewURL);

        this.fetchProfileData(token);
        this.fetchTopTracks(token);
    }

    // asynchronously fetch all the comments for the current post and add it to the comments array in the state
    fetchProfileData(token) {
        fetch('https://api.spotify.com/v1/me/', {
            headers: {
                "Authorization": "Bearer " + token
            }
        }).then(response => response.json()).then(response => {
            if (response.error === undefined) {

                this.setState({
                    profile: {
                        name: response.display_name,
                        id: response.id,
                        img: response.images[0].url || 'https://via.placeholder.com/152x152'
                    }
                });
            }
        });
    }

    // asynchronously fetch all the comments for the current post and add it to the comments array in the state
    fetchTopTracks(token) {
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=' + constants.amountTopTracks, {
            headers: {
                "Authorization": "Bearer " + token
            }
        }).then(response => response.json()).then(response => {
            if (response.error === undefined) {
                this.setState({topTracks: response});
            }
        });
    }

    render() {
        return (<div className={`${styles.main}`}>
            <Sidebar profile={this.state.profile}/>
            <Main topTracks={this.state.topTracks} profile={this.state.profile}/>
        </div>);
    }
}

export default Dashboard;
