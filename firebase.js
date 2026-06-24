// ============================================================
//  firebase.js
//  Single source of truth for Firebase initialisation.
//  This file is consumed by portfolio.js (browser ES module).
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Web app config (same as satwinder777.github.io) — do not use the Android appId here.
const firebaseConfig = {
  apiKey: "AIzaSyBZ5YrCArKHjgp-WtzkVy-3byHZiVM4Sx0",
  authDomain: "satwinder-portfolio.firebaseapp.com",
  projectId: "satwinder-portfolio",
  storageBucket: "satwinder-portfolio.firebasestorage.app",
  messagingSenderId: "845165533284",
  appId: "1:845165533284:web:9574280de985d7cedaa771",
  measurementId: "G-4MJE1H03ZP",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Single-tenant CMS — every read points at this exact document.
export const portfolioRef = doc(db, "portfolio", "satwinder");
export const submissionsCol = collection(db, "contact_submissions");
export const cmsLogsCol = collection(db, "cms_logs");

// Re-export the Firestore helpers so portfolio.js never has to know
// the full SDK URL.
export { onSnapshot, addDoc, serverTimestamp, collection };
