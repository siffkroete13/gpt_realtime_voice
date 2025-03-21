import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";


ReactDOM.hydrateRoot(
  document.getElementById("root"),
  <StrictMode>
    <App />
  </StrictMode>,
);
