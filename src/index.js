import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootContainer = document.getElementById('root');
if (rootContainer) {
    createRoot(rootContainer).render(<App />);
} else {
    console.error('Root element not found');
}
