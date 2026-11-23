import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "./lib/router.jsx";
import { AppProvider } from "./lib/store.jsx";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </RouterProvider>
  </StrictMode>,
);
