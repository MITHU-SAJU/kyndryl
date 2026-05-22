import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { registerSW } from 'virtual:pwa-register';

// Auto-register the service worker and update immediately when changes are found
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version detected. Auto-updating and reloading...');
    window.location.reload();
  },
  onOfflineReady() {
    console.log('[PWA] App cache ready. Offline support enabled.');
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

