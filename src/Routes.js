// src/Routes.js
import React from 'react';
import { Route, Routes } from 'react-router-dom'; // Use Routes instead of Switch
import Home from './components/Home/Home';
import NotFound from './components/NotFound/NotFound';

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} /> {/* Fallback route */}
    </Routes>
);

export default AppRoutes;
