// ============================================================
//  analytics-tracker.js
//  Client Telemetry, Dwell Time & Feature Engagement Tracker
//  Zero-dependency, high-precision telemetry for satwinder777.github.io
// ============================================================

import { db, analyticsSessionsCol } from "./firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Session state in memory
let session = null;
let currentVisibleSection = "about";
let dwellTimer = null;
let syncTimer = null;
let isTabActive = true;
let isInitialized = false;

const SECTION_IDS = [
  "about",
  "stats",
  "expertise",
  "experience",
  "skills",
  "projects",
  "contributors",
  "upcoming",
  "feedback",
  "contact"
];

/**
 * Detect client environment (Device, Browser, OS, Referrer)
 */
function getClientEnvironment() {
  const ua = navigator.userAgent || "";
  
  // Device
  let device = "Desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (window.innerWidth >= 640 && window.innerWidth <= 1024 && 'ontouchstart' in window)) {
    device = "Tablet";
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua) || window.innerWidth < 640) {
    device = "Mobile";
  }

  // OS
  let os = "Other";
  if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Browser
  let browser = "Other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Opera|OPR\//i.test(ua)) browser = "Opera";

  // Referrer & Domain
  const ref = document.referrer || "";
  let referrerDomain = "Direct / Bookmark";
  if (ref) {
    try {
      const url = new URL(ref);
      const host = url.hostname.toLowerCase();
      if (host.includes("github")) referrerDomain = "GitHub";
      else if (host.includes("linkedin")) referrerDomain = "LinkedIn";
      else if (host.includes("google")) referrerDomain = "Google";
      else if (host.includes("twitter") || host.includes("t.co") || host.includes("x.com")) referrerDomain = "Twitter / X";
      else if (host.includes("instagram")) referrerDomain = "Instagram";
      else if (host.includes("reddit")) referrerDomain = "Reddit";
      else referrerDomain = host.replace(/^www\./, "");
    } catch {
      referrerDomain = "External Referrer";
    }
  }

  return {
    device,
    os,
    browser,
    referrer: ref || "Direct",
    referrerDomain,
    screen: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language || "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  };
}

/**
 * Get or create unique visitor and session IDs
 */
function getVisitorAndSessionIds() {
  const VID_KEY = "satwinder_vid";
  const SID_KEY = "satwinder_sid";

  let visitorId = null;
  let isNewVisitor = false;

  try {
    visitorId = localStorage.getItem(VID_KEY);
    if (!visitorId) {
      visitorId = "vid_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(VID_KEY, visitorId);
      isNewVisitor = true;
    }
  } catch {
    visitorId = "vid_guest_" + Math.random().toString(36).substring(2, 9);
    isNewVisitor = true;
  }

  let sessionId = null;
  try {
    sessionId = sessionStorage.getItem(SID_KEY);
    if (!sessionId) {
      sessionId = "sid_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem(SID_KEY, sessionId);
    }
  } catch {
    sessionId = "sid_temp_" + Date.now();
  }

  return { visitorId, sessionId, isNewVisitor };
}

/**
 * Flush session data to Firestore with fallback
 */
async function syncSessionToFirestore() {
  if (!session || !session.sessionId) return;

  try {
    session.updatedAt = new Date().toISOString();
    
    // Calculate most viewed section
    let maxTime = 0;
    let topSection = "about";
    for (const [sec, secTime] of Object.entries(session.sectionDwellTime || {})) {
      if (secTime > maxTime) {
        maxTime = secTime;
        topSection = sec;
      }
    }
    session.mostViewedSection = topSection;
    session.durationSeconds = Object.values(session.sectionDwellTime || {}).reduce((a, b) => a + b, 0);

    // Save to Firestore
    const sessionDocRef = doc(db, "analytics_sessions", session.sessionId);
    await setDoc(sessionDocRef, {
      ...session,
      startedAt: new Date(session.startedAt),
      updatedAt: new Date(session.updatedAt)
    }, { merge: true });

    // Cache in local storage for instant offline recovery
    try {
      localStorage.setItem("sx_last_session_telemetry", JSON.stringify(session));
    } catch {}
  } catch (err) {
    // Silent catch — never throw into client runtime
    console.debug("[Analytics] Telemetry sync notice:", err.message);
  }
}

/**
 * Track an interaction event
 */
export function trackInteraction(feature, label = "", metadata = {}) {
  if (!session) return;

  const eventItem = {
    feature,
    label: String(label || "").substring(0, 100),
    section: currentVisibleSection,
    timestamp: new Date().toISOString(),
    ...metadata
  };

  session.interactions = session.interactions || [];
  session.interactions.push(eventItem);
  session.totalInteractions = session.interactions.length;

  // Immediate debounce sync for high value conversions
  if (["resume_download", "contact_submit", "feedback_submit", "project_view"].includes(feature)) {
    syncSessionToFirestore();
  }
}

/**
 * Initialize IntersectionObserver to track visible section
 */
function initSectionObserver() {
  const observer = new IntersectionObserver((entries) => {
    let bestEntry = null;
    let maxRatio = 0;

    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
        maxRatio = entry.intersectionRatio;
        bestEntry = entry;
      }
    });

    if (bestEntry && bestEntry.target && bestEntry.target.id) {
      const secId = bestEntry.target.id;
      if (SECTION_IDS.includes(secId)) {
        currentVisibleSection = secId;
      }
    }
  }, {
    threshold: [0.2, 0.4, 0.6, 0.8]
  });

  SECTION_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

/**
 * Setup Dwell Time accumulator
 */
function initDwellTimer() {
  if (dwellTimer) clearInterval(dwellTimer);

  dwellTimer = setInterval(() => {
    if (!isTabActive || document.hidden || !session) return;

    if (!session.sectionDwellTime) session.sectionDwellTime = {};
    if (!session.sectionDwellTime[currentVisibleSection]) {
      session.sectionDwellTime[currentVisibleSection] = 0;
    }

    session.sectionDwellTime[currentVisibleSection] += 1;
  }, 1000);

  // Sync every 25 seconds
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => {
    if (isTabActive && !document.hidden) {
      syncSessionToFirestore();
    }
  }, 25000);
}

/**
 * Delegated interaction listener across entire document
 */
function initInteractionListeners() {
  document.addEventListener("click", (e) => {
    // 1. Project links / clicks
    const projCard = e.target.closest("[data-project-card], .project-card, .featured-project-card");
    if (projCard) {
      const title = projCard.querySelector("h3, h4")?.textContent?.trim() || "Project";
      trackInteraction("project_view", title);
      return;
    }

    // Project external links
    const projLink = e.target.closest("a[href*='github.com'], a[href*='play.google.com'], a[href*='apps.apple.com']");
    if (projLink) {
      const label = projLink.getAttribute("aria-label") || projLink.textContent?.trim() || projLink.href;
      trackInteraction("project_demo_click", label);
      return;
    }

    // 2. Skill chips
    const chip = e.target.closest(".tech-chip, .skill-chip, [data-skill-chip]");
    if (chip) {
      const label = chip.textContent?.trim() || "Skill Chip";
      trackInteraction("skill_chip_click", label);
      return;
    }

    // 3. Resume CTA
    const resumeBtn = e.target.closest("a[href*='resume'], [data-resume-download], #resume-download-btn, #view-resume-btn, #floating-resume-btn");
    if (resumeBtn) {
      trackInteraction("resume_download", "Resume CTA Clicked");
      return;
    }

    // 4. Social links
    const socialLink = e.target.closest("a[href*='linkedin.com'], a[href*='github.com'], a[href*='wa.me'], a[href^='mailto:']");
    if (socialLink) {
      const href = socialLink.href || "";
      let platform = "Social Link";
      if (href.includes("linkedin")) platform = "LinkedIn";
      else if (href.includes("github")) platform = "GitHub";
      else if (href.includes("wa.me")) platform = "WhatsApp";
      else if (href.startsWith("mailto:")) platform = "Email Direct";
      trackInteraction("social_click", platform);
      return;
    }

    // 5. Theme button
    const themeBtn = e.target.closest(".theme-btn, [data-theme-switcher], .theme-switcher-btn");
    if (themeBtn) {
      trackInteraction("theme_toggle", "Theme Switched");
      return;
    }

    // 6. Navigation dock
    const navLink = e.target.closest("a[data-section], a[href^='#']");
    if (navLink) {
      const targetSec = navLink.dataset.section || navLink.getAttribute("href")?.replace("#", "");
      if (targetSec) {
        trackInteraction("nav_dock_click", targetSec);
      }
    }
  }, { passive: true });

  // Contact form focus tracking
  const contactForm = document.getElementById("contact-form") || document.querySelector("form#contact-form");
  if (contactForm) {
    let focusLogged = false;
    contactForm.addEventListener("focusin", () => {
      if (!focusLogged) {
        focusLogged = true;
        trackInteraction("contact_initiate", "Form Focus");
      }
    }, { passive: true });
  }
}

/**
 * Hook into window lifecycle events
 */
function initLifecycleListeners() {
  document.addEventListener("visibilitychange", () => {
    isTabActive = !document.hidden;
    if (document.hidden) {
      syncSessionToFirestore();
    }
  });

  window.addEventListener("pagehide", () => {
    syncSessionToFirestore();
  });

  window.addEventListener("beforeunload", () => {
    syncSessionToFirestore();
  });
}

/**
 * Public Initialization method
 */
export function initPortfolioAnalytics() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const { visitorId, sessionId, isNewVisitor } = getVisitorAndSessionIds();
    const env = getClientEnvironment();

    session = {
      sessionId,
      visitorId,
      isNewVisitor,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      durationSeconds: 0,
      ...env,
      sectionDwellTime: {
        about: 0,
        stats: 0,
        expertise: 0,
        experience: 0,
        skills: 0,
        projects: 0,
        contributors: 0,
        upcoming: 0,
        feedback: 0,
        contact: 0
      },
      interactions: [],
      totalInteractions: 0,
      mostViewedSection: "about"
    };

    // Attach global helper
    window.__sxAnalytics = {
      track: trackInteraction,
      getSession: () => ({ ...session })
    };

    // Init modules
    initSectionObserver();
    initDwellTimer();
    initInteractionListeners();
    initLifecycleListeners();

    // Initial ping after 2.5s (records genuine visit)
    setTimeout(() => {
      syncSessionToFirestore();
    }, 2500);

    console.info("[Analytics] Telemetry tracker active for session:", sessionId);
  } catch (err) {
    console.debug("[Analytics] Tracker init deferred:", err);
  }
}
