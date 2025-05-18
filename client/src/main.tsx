import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/firebase"; // Import firebase.ts to ensure it's initialized once

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
