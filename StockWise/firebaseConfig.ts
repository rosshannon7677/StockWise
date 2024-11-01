// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBYat8b41fkc15eIdoLSywsvgWIjJLBKdA",
  authDomain: "stockwise-8351f.firebaseapp.com",
  projectId: "stockwise-8351f",
  storageBucket: "stockwise-8351f.firebasestorage.app",
  messagingSenderId: "151501605989",
  appId: "1:151501605989:web:181214a27c061355678a8c",
  measurementId: "G-4951NEZY9V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
