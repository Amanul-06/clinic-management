import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { BrandingProvider } from "./context/BrandingContext";

import "./styles/tokens.css";
import "./styles/reset.css";
import "./styles/typography.css";
import "./styles/shared.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BrandingProvider>
          <App />
        </BrandingProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
