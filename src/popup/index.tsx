import { MantineProvider } from '@mantine/core';
import React from 'react';
import { createRoot } from 'react-dom/client';
import xior from 'xior';

import App from './App';

xior.defaults.baseURL = import.meta.env.VITE_API_URL;

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme='auto'>
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
