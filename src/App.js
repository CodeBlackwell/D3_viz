// src/App.js
import React from 'react';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import Routes from './Routes';

const App = () => (
    <BrowserRouter> {/* Wrap the entire app with BrowserRouter */}
        <div>
            <h1>D3 Visualization App</h1>
            <Routes /> {/* Include the Routes component */}
        </div>
    </BrowserRouter>
);

export default App;
