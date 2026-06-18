import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './styles/global.css';

// Polices auto-hébergées (conformité CNIL - aucun transfert vers Google)
import '@fontsource/epilogue/700.css';
import '@fontsource/manrope/400.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/poppins/400.css';

import { initCookies } from './utils/cookies';
initCookies();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
