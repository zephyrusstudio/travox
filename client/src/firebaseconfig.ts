// firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔑 Replace these with your config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBrQM5E9D2sFyeGkUTBot8G1fwERFnUIlk",
  authDomain: "travox-a7a08.firebaseapp.com",
  projectId: "travox-a7a08",
  storageBucket: "travox-a7a08.firebasestorage.app",
  messagingSenderId: "277785594096",
  appId: "1:277785594096:web:eada1c6e09365417621a35",
};

// Initialize Firebase App
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Initialize Firestore and export
export const db = getFirestore(app);
