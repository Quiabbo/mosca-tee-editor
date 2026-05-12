import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import './i18n';
import { HelmetProvider } from 'react-helmet-async';
import * as agPsd from 'ag-psd';
import { animate as anime } from 'animejs';

// Attach to window for compatibility with code that expects global variables
(window as any).agPsd = agPsd;
(window as any).anime = anime;


createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </HelmetProvider>,
);
