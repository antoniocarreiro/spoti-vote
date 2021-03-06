import React from 'react';
import ReactDOM from 'react-dom';
import {Route} from 'react-router';
import {BrowserRouter, Switch} from 'react-router-dom';
import Loadable from 'react-loadable';

import Loading from './pages/Loading.jsx';
import './css/reset.css';
import './css/fonts.css';
import registerServiceWorker from './registerServiceWorker';

const Login = Loadable({
    loader: () => import ('./pages/Login.jsx'),
    loading: Loading
});
const App = Loadable({
    loader: () => import ('./pages/App.jsx'),
    loading: Loading
});
const Dashboard = Loadable({
    loader: () => import ('./pages/Dashboard.jsx'),
    loading: Loading
});
const Join = Loadable({
    loader: () => import ('./pages/Join.jsx'),
    loading: Loading
});
const Usage = Loadable({
    loader: () => import ('./pages/Usage.jsx'),
    loading: Loading
});
const NotFound = Loadable({
    loader: () => import ('./pages/NotFound.jsx'),
    loading: Loading
});
ReactDOM.render((<BrowserRouter>
    <Switch>
        <Route exact={true} path="/" component={Login}/>
        <Route path="/app" component={App}/>
        <Route path="/dashboard" component={Dashboard}/>
        <Route path="/join" component={Join}/>
        <Route path="/usage" component={Usage}/>
        <Route component={NotFound}/>
    </Switch>

</BrowserRouter>), document.getElementById('root'));
registerServiceWorker();
