import { MantineProvider } from '@mantine/core';
import React from 'react';
import { createRoot } from 'react-dom/client';
import xior from 'xior';

import App from './App';

xior.defaults.baseURL = 'http://localhost:3333';

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme='auto'>
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
