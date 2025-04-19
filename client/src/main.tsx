import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Initialize Firebase with Bismi Chicken Shop configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3f4gJOKZDIjy9gnhSSpMVLs1UblGxo0s",
  authDomain: "bismi-broilers-3ca96.firebaseapp.com",
  databaseURL: "https://bismi-broilers-3ca96-default-rtdb.firebaseio.com",
  projectId: "bismi-broilers-3ca96",
  storageBucket: "bismi-broilers-3ca96.firebasestorage.app",
  messagingSenderId: "949430744092",
  appId: "1:949430744092:web:4ea5638a9d38ba3e76dbd9"
};

// Initialize Firebase
initializeApp(firebaseConfig);

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
