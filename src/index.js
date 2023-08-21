import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootContainer = document.getElementById('root');
if (rootContainer) {
    const root = createRoot(rootContainer);
    root.render(<App />);

    // Enable Hot Module Replacement
    if (module.hot) {
        module.hot.accept('./App', () => {
            const NextApp = require('./App').default;
            root.render(<NextApp />);
        });
    }
} else {
    console.error('Root element not found');
}