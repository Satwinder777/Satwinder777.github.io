// ============================================================
//  admin/js/config.js
//  Constants, Collection Names & Field Keys matching satwinderx
// ============================================================

export const ADMIN_CONFIG = {
  appName: "SatwinderX Web Admin",
  version: "2.4.0",
  // Document path
  portfolioCollection: "portfolio",
  mainDocId: "satwinder",
  portfolioDocId: "satwinder",
  
  // Independent collections
  contactSubmissionsCollection: "contact_submissions",
  feedbackSubmissionsCollection: "feedback_submissions",
  cmsLogsCollection: "cms_logs",

  // Top-level fields on portfolio/satwinder doc
  fields: {
    profile: "profile",
    stats: "stats",
    socialLinks: "socialLinks",
    technicalArsenal: "technicalArsenal",
    expertise: "expertise",
    experience: "experience",
    projects: "projects",
    resumeUrl: "resumeUrl",
    showResume: "showResume",
    liveResumeTemplateId: "liveResumeTemplateId",
    contactEnabled: "contactEnabled",
    seo: "seo",
    lastPublishedAt: "lastPublishedAt",
    siteBanner: "siteBanner",
    upcomingFeatures: "upcomingFeatures",
    contributorsSection: "contributorsSection",
    feedbackSection: "feedbackSection",
  },

  // Security defaults
  sessionKey: "satwinderx_admin_auth_token",
  pinHashKey: "satwinderx_master_pin_hash",
  // Default PIN hash (SHA-256 of '7770' as initial default, customizable anytime in Settings)
  defaultPinHash: "c304a87b43ab7ab9410ebf60b538c971e300a04507de94b8053ff24167a8f2f1", // '7770'
  inactivityTimeoutMinutes: 20,
};

export const PROJECT_CATEGORIES = [
  "E-Commerce",
  "Logistics",
  "Booking",
  "FinTech",
  "HealthTech",
  "Social",
  "Other"
];

export const SKILL_CATEGORIES = [
  { key: "frontend", label: "Frontend", icon: "code" },
  { key: "backend", label: "Backend", icon: "server" },
  { key: "architecture", label: "Architecture", icon: "layers" },
  { key: "devops", label: "DevOps", icon: "cpu" },
  { key: "other", label: "Other", icon: "box" }
];

export const FEEDBACK_STATUSES = [
  { key: "in_review", label: "In Review", color: "#f59e0b", badgeClass: "badge-warning" },
  { key: "reviewed", label: "Reviewed", color: "#3b82f6", badgeClass: "badge-info" },
  { key: "resolved", label: "Resolved", color: "#10b981", badgeClass: "badge-success" },
  { key: "declined", label: "Declined", color: "#64748b", badgeClass: "badge-neutral" },
];
