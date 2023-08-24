// src/components/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
    <div>
        <h1>404 Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link to="/">Return to Home</Link> {/* Link back to the Home page */}
    </div>
);

export default NotFound;
