// ============================================================
//  admin/js/firebase-admin.js
//  Direct Firebase & Firestore Client for Admin Operations
// ============================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig } from "../../firebase.config.js";
import { ADMIN_CONFIG } from "./config.js";

// Ensure single initialized Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

export const portfolioDocRef = doc(db, ADMIN_CONFIG.portfolioCollection, ADMIN_CONFIG.mainDocId);
export const contactColRef = collection(db, ADMIN_CONFIG.contactSubmissionsCollection);
export const feedbackColRef = collection(db, ADMIN_CONFIG.feedbackSubmissionsCollection);
export const cmsLogsColRef = collection(db, ADMIN_CONFIG.cmsLogsCollection);

/**
 * Fetch the entire portfolio/satwinder document
 */
export async function getPortfolioData() {
  try {
    const snap = await getDoc(portfolioDocRef);
    if (!snap.exists()) {
      return null;
    }
    return snap.data();
  } catch (err) {
    console.error("[FirebaseAdmin] getPortfolioData error:", err);
    throw err;
  }
}

/**
 * Update a specific top-level field on portfolio/satwinder
 * (e.g., 'profile', 'projects', 'experience', 'siteBanner', etc.)
 */
export async function updatePortfolioField(fieldKey, value) {
  if (!auth.currentUser) {
    const err = new Error("Firebase account not connected. Please connect your Firebase Admin email (satwinder@gmail.com) to save live updates to Firestore.");
    err.code = "auth-required";
    throw err;
  }
  try {
    await updateDoc(portfolioDocRef, {
      [fieldKey]: value,
      lastPublishedAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error(`[FirebaseAdmin] updatePortfolioField (${fieldKey}) error:`, err);
    if (err.code === "permission-denied") {
      throw new Error("Firestore permission denied. Please verify you are logged in with your owner email (satwinder@gmail.com).");
    }
    throw err;
  }
}

/**
 * Update multiple fields on portfolio/satwinder
 */
export async function updatePortfolioFields(updates) {
  if (!auth.currentUser) {
    const err = new Error("Firebase account not connected. Please connect your Firebase Admin email (satwinder@gmail.com) to save live updates to Firestore.");
    err.code = "auth-required";
    throw err;
  }
  try {
    const payload = {
      ...updates,
      lastPublishedAt: serverTimestamp()
    };
    await updateDoc(portfolioDocRef, payload);
    return true;
  } catch (err) {
    console.error("[FirebaseAdmin] updatePortfolioFields error:", err);
    if (err.code === "permission-denied") {
      throw new Error("Firestore permission denied. Please verify you are logged in with your owner email (satwinder@gmail.com).");
    }
    throw err;
  }
}

/**
 * Real-time listener for portfolio/satwinder document
 */
export function subscribeToPortfolio(onData, onError) {
  return onSnapshot(portfolioDocRef, (snap) => {
    if (snap.exists()) {
      onData(snap.data());
    } else {
      onData(null);
    }
  }, onError);
}

// ─────────────────────────────────────────────────────────────
// FEEDBACK SUBMISSIONS (Signal Studio)
// ─────────────────────────────────────────────────────────────

export async function getFeedbackSubmissions(maxLimit = 100) {
  try {
    const q = query(feedbackColRef, orderBy("createdAt", "desc"), limit(maxLimit));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : d.data().createdAt
    }));
  } catch (err) {
    console.error("[FirebaseAdmin] getFeedbackSubmissions error:", err);
    throw err;
  }
}

export function subscribeToFeedback(onData, onError) {
  const q = query(feedbackColRef, orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : d.data().createdAt
    }));
    onData(items);
  }, onError);
}

export async function updateFeedbackItem(id, { status, developerReply, visibleOnWeb }) {
  try {
    const ref = doc(db, ADMIN_CONFIG.feedbackSubmissionsCollection, id);
    const payload = {
      status,
      developerReply: developerReply || "",
      visibleOnWeb: visibleOnWeb !== false,
      updatedAt: serverTimestamp()
    };
    await updateDoc(ref, payload);
    return true;
  } catch (err) {
    console.error("[FirebaseAdmin] updateFeedbackItem error:", err);
    throw err;
  }
}

export async function deleteFeedbackItem(id) {
  try {
    const ref = doc(db, ADMIN_CONFIG.feedbackSubmissionsCollection, id);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error("[FirebaseAdmin] deleteFeedbackItem error:", err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// CONTACT INBOX SUBMISSIONS
// ─────────────────────────────────────────────────────────────

export async function getContactSubmissions(maxLimit = 100) {
  try {
    const q = query(contactColRef, orderBy("submittedAt", "desc"), limit(maxLimit));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      submittedAt: d.data().submittedAt?.toDate ? d.data().submittedAt.toDate() : d.data().submittedAt
    }));
  } catch (err) {
    console.error("[FirebaseAdmin] getContactSubmissions error:", err);
    throw err;
  }
}

export function subscribeToInbox(onData, onError) {
  const q = query(contactColRef, orderBy("submittedAt", "desc"), limit(100));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      submittedAt: d.data().submittedAt?.toDate ? d.data().submittedAt.toDate() : d.data().submittedAt
    }));
    onData(items);
  }, onError);
}

export async function updateContactStatus(id, { isRead, isArchived, isStarred }) {
  try {
    const ref = doc(db, ADMIN_CONFIG.contactSubmissionsCollection, id);
    const updates = {};
    if (typeof isRead === "boolean") updates.isRead = isRead;
    if (typeof isArchived === "boolean") updates.isArchived = isArchived;
    if (typeof isStarred === "boolean") updates.isStarred = isStarred;
    await updateDoc(ref, updates);
    return true;
  } catch (err) {
    console.error("[FirebaseAdmin] updateContactStatus error:", err);
    throw err;
  }
}

export async function deleteContactSubmission(id) {
  try {
    const ref = doc(db, ADMIN_CONFIG.contactSubmissionsCollection, id);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error("[FirebaseAdmin] deleteContactSubmission error:", err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// CMS ERROR LOGS / TELEMETRY
// ─────────────────────────────────────────────────────────────

export async function getCmsLogs(maxLimit = 80) {
  try {
    const q = query(cmsLogsColRef, orderBy("createdAt", "desc"), limit(maxLimit));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : d.data().createdAt
    }));
  } catch (err) {
    console.error("[FirebaseAdmin] getCmsLogs error:", err);
    throw err;
  }
}

export function subscribeToLogs(onData, onError) {
  const q = query(cmsLogsColRef, orderBy("createdAt", "desc"), limit(80));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : d.data().createdAt
    }));
    onData(items);
  }, onError);
}

export async function markLogRead(id) {
  try {
    const ref = doc(db, ADMIN_CONFIG.cmsLogsCollection, id);
    await updateDoc(ref, { read: true });
    return true;
  } catch (err) {
    console.error("[FirebaseAdmin] markLogRead error:", err);
    throw err;
  }
}

export async function clearAllLogs() {
  try {
    const snap = await getDocs(cmsLogsColRef);
    const promises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(promises);
    return true;
  } catch (err) {
    console.error("[FirebaseAdmin] clearAllLogs error:", err);
    throw err;
  }
}

export async function pingFirestoreLatency() {
  const start = performance.now();
  try {
    await getDoc(portfolioDocRef);
    return Math.max(12, Math.round(performance.now() - start));
  } catch (err) {
    console.warn("[FirebaseAdmin] pingFirestoreLatency error:", err);
    return Math.max(22, Math.round(performance.now() - start));
  }
}

