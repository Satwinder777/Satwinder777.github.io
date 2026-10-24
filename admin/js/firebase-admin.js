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
export const analyticsColRef = collection(db, ADMIN_CONFIG.analyticsSessionsCollection);

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

/**
 * Subscribe to real-time analytics sessions stream (with resilient local storage mirror)
 */
export function subscribeToAnalytics(onData, onError) {
  function getLocalFallbackSessions() {
    try {
      const raw = localStorage.getItem("sx_seeded_analytics");
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list.map(d => ({
        ...d,
        startedAt: d.startedAt ? new Date(d.startedAt) : new Date(),
        updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date()
      })) : [];
    } catch {
      return [];
    }
  }

  try {
    const q = query(analyticsColRef, orderBy("updatedAt", "desc"), limit(300));
    return onSnapshot(q, (snap) => {
      const remoteItems = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        startedAt: d.data().startedAt?.toDate ? d.data().startedAt.toDate() : (d.data().startedAt ? new Date(d.data().startedAt) : new Date()),
        updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate() : (d.data().updatedAt ? new Date(d.data().updatedAt) : new Date())
      }));

      const localItems = getLocalFallbackSessions();
      // Merge remote & local, de-duplicating by id
      const seen = new Set(remoteItems.map(x => x.id || x.sessionId));
      const merged = [...remoteItems];
      localItems.forEach(item => {
        const key = item.id || item.sessionId;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      });

      onData(merged);
    }, (err) => {
      console.warn("[FirebaseAdmin] subscribeToAnalytics stream notice:", err.message);
      // Fallback: provide local/seeded sessions immediately so UI never stays empty
      const local = getLocalFallbackSessions();
      onData(local);
    });
  } catch (err) {
    console.warn("[FirebaseAdmin] subscribeToAnalytics init notice:", err.message);
    const local = getLocalFallbackSessions();
    onData(local);
    return () => {};
  }
}

/**
 * Fetch one-off analytics records
 */
export async function getAnalyticsData(limitCount = 300) {
  let localItems = [];
  try {
    const raw = localStorage.getItem("sx_seeded_analytics");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localItems = parsed.map(d => ({
          ...d,
          startedAt: d.startedAt ? new Date(d.startedAt) : new Date(),
          updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date()
        }));
      }
    }
  } catch {}

  try {
    const q = query(analyticsColRef, limit(limitCount));
    const snap = await getDocs(q);
    const remote = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      startedAt: d.data().startedAt?.toDate ? d.data().startedAt.toDate() : (d.data().startedAt ? new Date(d.data().startedAt) : new Date()),
      updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate() : (d.data().updatedAt ? new Date(d.data().updatedAt) : new Date())
    }));

    const seen = new Set(remote.map(x => x.id || x.sessionId));
    const merged = [...remote];
    localItems.forEach(item => {
      const key = item.id || item.sessionId;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    });

    return merged;
  } catch (err) {
    console.debug("[FirebaseAdmin] getAnalyticsData using local mirror:", err.message);
    return localItems;
  }
}

/**
 * Clear all analytics sessions
 */
export async function clearAllAnalytics() {
  try {
    localStorage.removeItem("sx_seeded_analytics");
    const snap = await getDocs(analyticsColRef);
    const promises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.allSettled(promises);
    return true;
  } catch (err) {
    console.debug("[FirebaseAdmin] clearAllAnalytics notice:", err.message);
    localStorage.removeItem("sx_seeded_analytics");
    return true;
  }
}

/**
 * Seed realistic telemetry demo data to populate charts immediately
 */
export async function seedDemoAnalytics(count = 35) {
  const sections = ["projects", "skills", "experience", "expertise", "about", "upcoming", "contributors", "feedback", "contact"];
  const devices = ["Desktop", "Mobile", "Tablet"];
  const browsers = ["Chrome", "Safari", "Edge", "Firefox", "Brave"];
  const osList = ["macOS", "Windows", "iOS", "Android", "Linux"];
  const referrers = ["GitHub Profile", "LinkedIn Feed", "Direct / Bookmark", "Google Search", "Twitter / X", "Tech Community"];
  const projectNames = ["Codio Collaborative IDE", "E-Commerce Suite", "Logistics Engine", "Fleet Track IoT", "Fintech Mobile Wallet"];
  const skillsList = ["Flutter", "Dart", "BLoC", "Clean Architecture", "Firebase", "WebSockets", "Docker", "CI/CD"];

  const now = Date.now();
  const sessionDocs = [];
  const firestorePromises = [];

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.6) * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    const sessionTime = new Date(now - (daysAgo * 86400000 + hoursAgo * 3600000 + minutesAgo * 60000));
    
    const isNew = Math.random() > 0.35;
    const device = Math.random() > 0.4 ? "Desktop" : (Math.random() > 0.25 ? "Mobile" : "Tablet");
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const os = osList[Math.floor(Math.random() * osList.length)];
    const referrer = referrers[Math.floor(Math.random() * referrers.length)];

    const dwell = {
      about: Math.floor(15 + Math.random() * 45),
      projects: Math.floor(45 + Math.random() * 160),
      skills: Math.floor(30 + Math.random() * 95),
      experience: Math.floor(25 + Math.random() * 80),
      expertise: Math.floor(20 + Math.random() * 60),
      upcoming: Math.floor(10 + Math.random() * 40),
      contributors: Math.floor(8 + Math.random() * 30),
      feedback: Math.floor(12 + Math.random() * 35),
      contact: Math.floor(10 + Math.random() * 50)
    };

    const totalDuration = Object.values(dwell).reduce((a, b) => a + b, 0);

    const interactions = [];
    if (Math.random() > 0.3) {
      interactions.push({ feature: "project_view", label: projectNames[Math.floor(Math.random() * projectNames.length)], ts: sessionTime.toISOString() });
    }
    if (Math.random() > 0.4) {
      interactions.push({ feature: "skill_chip_hover", label: skillsList[Math.floor(Math.random() * skillsList.length)], ts: sessionTime.toISOString() });
    }
    if (Math.random() > 0.6) {
      interactions.push({ feature: "resume_action", label: "View Resume PDF", ts: sessionTime.toISOString() });
    }
    if (Math.random() > 0.75) {
      interactions.push({ feature: "theme_toggle", label: "Theme Changed", ts: sessionTime.toISOString() });
    }
    if (Math.random() > 0.85) {
      interactions.push({ feature: "contact_initiate", label: "Focused Contact Form", ts: sessionTime.toISOString() });
    }

    const sid = "demo_sid_" + (now - i * 1000) + "_" + Math.floor(Math.random() * 1000);
    const sessionDoc = {
      sessionId: sid,
      id: sid,
      visitorId: "vid_demo_" + Math.floor(i % 18),
      isNewVisitor: isNew,
      startedAt: sessionTime.toISOString(),
      updatedAt: new Date(sessionTime.getTime() + totalDuration * 1000).toISOString(),
      durationSeconds: totalDuration,
      device,
      browser,
      os,
      referrer,
      referrerDomain: referrer.split(" ")[0],
      timezone: "Asia/Kolkata",
      sectionDwellTime: dwell,
      interactions,
      totalInteractions: interactions.length,
      mostViewedSection: "projects",
      isDemo: true
    };

    sessionDocs.push(sessionDoc);

    // Try write to Firestore (fire & forget / allSettled)
    try {
      firestorePromises.push(setDoc(doc(analyticsColRef, sid), {
        ...sessionDoc,
        startedAt: sessionTime,
        updatedAt: new Date(sessionTime.getTime() + totalDuration * 1000)
      }));
    } catch {}
  }

  // Always save locally so charts and dashboards render 100% reliably
  try {
    localStorage.setItem("sx_seeded_analytics", JSON.stringify(sessionDocs));
  } catch {}

  // Non-blocking sync to Firestore
  Promise.allSettled(firestorePromises).catch(() => {});

  return sessionDocs.length;
}

