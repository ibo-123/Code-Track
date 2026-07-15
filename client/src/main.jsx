import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Toaster } from "sonner";
import "./index.css";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster position="top-right" />
    </AuthProvider>
  </StrictMode>
);