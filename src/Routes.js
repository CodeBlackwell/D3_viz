// src/Routes.js
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Home from './components/Home/Home';
import NotFound from './components/NotFound/NotFound';

const Routes = () => (
    <Switch>
        <Route exact path="/" component={Home} />
        <Route component={NotFound} /> {/* Fallback route */}
    </Switch>
);

export default Routes;
