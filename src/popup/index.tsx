import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { MantineProvider } from '@mantine/core';

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="auto">
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
