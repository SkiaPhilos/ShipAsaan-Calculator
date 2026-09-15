import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LocalStorageManager } from "./db/localStore";

// Ensure initial contract agreements and geography are seeded in local storage
LocalStorageManager.initializeIfEmpty();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
