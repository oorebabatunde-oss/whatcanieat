import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Redirect legacy domain to custom domain
if (window.location.hostname === "whatcanieat.lovable.app") {
  window.location.replace("https://whatcanieat.food" + window.location.pathname + window.location.search + window.location.hash);
} else {
  createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}
