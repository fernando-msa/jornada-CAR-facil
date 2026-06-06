import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register Progressive Web App (PWA) Service Worker for offline operation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('PWA ServiceWorker registered successfully: ', registration.scope);
      })
      .catch(err => {
        console.warn('PWA ServiceWorker registration failed: ', err);
      });
  });
}
