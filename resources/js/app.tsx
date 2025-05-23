import '../css/app.css';

import React from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import axios from 'axios';

// Set CSRF token for all AJAX requests
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Get CSRF token from the meta tag
const csrfToken = document.head.querySelector('meta[name="csrf-token"]');
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken.getAttribute('content');
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${appName} | ${title}`,
    resolve: (name) => {
        // Support for nested page paths (like 'auth/login')
        const pagesLowercase = import.meta.glob('./pages/**/*.tsx', { eager: true });
        const pagesUppercase = import.meta.glob('./Pages/**/*.tsx', { eager: true });
        
        // Try to find the page in lowercase directory first
        let page = pagesLowercase[`./pages/${name}.tsx`];
        
        // If not found, check if it might be in nested structure in lowercase directory
        if (!page) {
            Object.keys(pagesLowercase).forEach(path => {
                const normalizedPath = path.replace(/^\.\/pages\//, '').replace(/\.tsx$/, '');
                if (normalizedPath.toLowerCase() === name.toLowerCase()) {
                    page = pagesLowercase[path];
                }
            });
        }
        
        // If still not found, try uppercase directory
        if (!page) {
            page = pagesUppercase[`./Pages/${name}.tsx`];
        }
        
        // If still not found, check if it might be in nested structure in uppercase directory
        if (!page) {
            Object.keys(pagesUppercase).forEach(path => {
                const normalizedPath = path.replace(/^\.\/Pages\//, '').replace(/\.tsx$/, '');
                if (normalizedPath.toLowerCase() === name.toLowerCase()) {
                    page = pagesUppercase[path];
                }
            });
        }
        
        // If page doesn't exist in any directory, throw an error
        if (!page) {
            throw new Error(`Page ${name} not found in pages or Pages directory`);
        }

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// Initialize theme on load
initializeTheme();
