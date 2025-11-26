import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("Application starting...");

try {
  const root = createRoot(document.getElementById('root'));
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log("React root rendered.");
} catch (e) {
  console.error("Fatal error during app startup:", e);
  document.getElementById('root').innerHTML = `<div style="padding: 20px; color: red;"><h1>Application Failed to Start</h1><p>${e.message}</p></div>`;
}
