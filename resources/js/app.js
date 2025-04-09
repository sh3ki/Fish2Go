import { createInertiaApp } from '@inertiajs/react';
import React from 'react';
import { render } from 'react-dom';

createInertiaApp({
    resolve: name => require(`./pages/${name}`).default,
    setup({ el, App, props }) {
        render(<App {...props} />, el);
    },
});
