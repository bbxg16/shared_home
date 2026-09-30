import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { AppDataProvider } from "@/state/AppDataContext";
import { LanguageProvider } from "@/state/LanguageContext";
import { NotificationProvider } from "@/state/NotificationContext";
import "@/index.css";
import "@/lib/firebase";

const routerBasename =
  import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <LanguageProvider>
        <AppDataProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AppDataProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
