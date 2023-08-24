// src/App.js
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Routes from './Routes';
import NavBar from './components/Main/NavBar'; // Import NavBar

const App = () => (
    <BrowserRouter>
        <div>
            <NavBar /> {/* Include the NavBar component */}
            <h1>D3 Visualization App</h1>
            <Routes />
        </div>
    </BrowserRouter>
);

export default App;
