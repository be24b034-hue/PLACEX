import React from "react";
import ReactDOM from "react-dom/client";
import App, { ErrorBoundary } from "./PlaceXApp.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary fallbackText="PlaceX hit an unexpected error. Refreshing usually fixes it.">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
