import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // ← ADD THIS

const firebaseConfig = {
  apiKey: "AIzaSyD2pEX_zoYkjT-MWXWiLgrZWrXxmX5L43Y",
  authDomain: "ascet-interview-hub.firebaseapp.com",
  projectId: "ascet-interview-hub",
  storageBucket: "ascet-interview-hub.firebasestorage.app",
  messagingSenderId: "862772007519",
  appId: "1:862772007519:web:da999809d2e95269ad41ea"
};

const app = initializeApp(firebaseConfig);

// ADD THESE 2 LINES
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();