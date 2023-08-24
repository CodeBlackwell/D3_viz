// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
    <div>
        <h1>Welcome to D3 Visualization App</h1>
        <p>This is the home page of the application.</p>
        <Link to="/graph">Go to Graph</Link> {/* Link to the Graph page */}
    </div>
);

export default Home;
