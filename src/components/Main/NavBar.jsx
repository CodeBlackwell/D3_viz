// src/components/NavBar.js
import React from 'react';
import { Link } from 'react-router-dom';

const NavBar = () => (
    <nav style={{ backgroundColor: '#f0f0f0', padding: '10px' }}>
        <Link to="/" style={{ margin: '10px' }}>Home</Link>
        <Link to="/bfstree" style={{ margin: '10px' }}>BFS Tree</Link>
        {/* Add more links as needed */}
    </nav>
);

export default NavBar;
