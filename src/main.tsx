import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { AppDataProvider } from "@/state/AppDataContext";
import { LanguageProvider } from "@/state/LanguageContext";
import "@/index.css";

// Importing this module initializes Firebase when VITE_FIREBASE_* env values exist.
import "@/lib/firebase";

const routerBasename =
  import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <LanguageProvider>
        <AppDataProvider>
          <App />
        </AppDataProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
