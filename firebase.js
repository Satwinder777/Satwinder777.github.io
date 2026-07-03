// ============================================================
//  firebase.js
//  Firebase initialisation for the public portfolio site.
//  Config lives in gitignored firebase.config.js (see example).
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase.config.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const portfolioRef = doc(db, "portfolio", "satwinder");
export const submissionsCol = collection(db, "contact_submissions");
export const feedbackCol = collection(db, "feedback_submissions");
export const cmsLogsCol = collection(db, "cms_logs");

export {
  onSnapshot,
  addDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
};
