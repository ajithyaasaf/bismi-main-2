import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/firebase"; // Import firebase.ts to ensure it's initialized once

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
