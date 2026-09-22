import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { AppDataProvider } from "@/state/AppDataContext";
import { LanguageProvider } from "@/state/LanguageContext";
import "@/index.css";

// Importing this module initializes Firebase when VITE_FIREBASE_* env values exist.
import "@/lib/firebase";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AppDataProvider>
          <App />
        </AppDataProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
