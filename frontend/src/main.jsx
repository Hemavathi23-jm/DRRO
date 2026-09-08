import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import CriticalAlertModal from './components/common/CriticalAlertModal';
import App from './App.jsx';
import './index.css';

function AppShell() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <App />
          <CriticalAlertModal />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </React.StrictMode>
);
