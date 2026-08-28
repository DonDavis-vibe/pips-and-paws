import React from 'react';
import { createRoot } from 'react-dom/client';
import { LangProvider } from './i18n/index.jsx';
import App from './App.jsx';
import './index.css';
import './theme.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </React.StrictMode>,
);
