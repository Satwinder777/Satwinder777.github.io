// ============================================================
//  portfolio.js
//  Renders /portfolio/satwinder onto satwinder777.github.io in
//  real time, handles the contact form, and runs all the
//  cosmetic UI animations (cursor, reveal, year, lucide icons).
// ============================================================

import {
  portfolioRef,
  submissionsCol,
  feedbackCol,
  cmsLogsCol,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from "./firebase.js";

// ------------------------------------------------------------
//  CMS error logging (inlined — GitHub Pages only ships portfolio.js
//  + firebase.js + index.html; a missing cms-log.js broke the whole site)
// ------------------------------------------------------------
const _cmsLogRecent = new Map();
const CMS_LOG_DEDUPE_MS = 15000;

async function reportCmsLog(opts) {
  const message = String(opts?.message ?? "").trim();
  if (!message) return;
  const key = `${opts?.category}:${message.slice(0, 120)}`;
  const now = Date.now();
  const last = _cmsLogRecent.get(key);
  if (last != null && now - last < CMS_LOG_DEDUPE_MS) return;
  _cmsLogRecent.set(key, now);
  try {
    await addDoc(cmsLogsCol, {
      source: "portfolio_web",
      category: String(opts?.category ?? "web").slice(0, 32),
      level: String(opts?.level ?? "ERROR").slice(0, 12),
      message: message.slice(0, 2000),
      stack: String(opts?.stack ?? "").slice(0, 8000),
      context: String(opts?.context ?? "").slice(0, 200),
      url: typeof location !== "undefined" ? String(location.href).slice(0, 500) : "",
      meta: opts?.meta && typeof opts.meta === "object" ? opts.meta : {},
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("[cms-log] could not report:", e);
  }
}

function installWebErrorHandlers() {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (ev) => {
    reportCmsLog({
      level: "ERROR",
      category: "web",
      message: ev.message || "Uncaught error",
      stack: ev.error?.stack || `${ev.filename}:${ev.lineno}:${ev.colno}`,
      context: "window.error",
    });
  });
  window.addEventListener("unhandledrejection", (ev) => {
    const reason = ev.reason;
    reportCmsLog({
      level: "ERROR",
      category: "web",
      message: reason?.message || String(reason ?? "Unhandled rejection"),
      stack: reason?.stack || "",
      context: "unhandledrejection",
    });
  });
}

installWebErrorHandlers();
document.documentElement.classList.add("portfolio-ready");

// ------------------------------------------------------------
//  Helpers
// ------------------------------------------------------------
const $ = (id) => document.getElementById(id);

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const fmtMonthYear = (raw) => {
  if (!raw) return "";
  const d = parseFirestoreDate(raw);
  if (!d) return "";
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const parseFirestoreDate = (raw) => {
  if (!raw) return null;
  const d = raw.toDate
    ? raw.toDate()
    : raw.seconds != null
    ? new Date(raw.seconds * 1000)
    : raw instanceof Date
    ? raw
    : new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

function formatFeedbackTimeAgo(raw) {
  const d = parseFirestoreDate(raw);
  if (!d) return "";
  const sec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 45) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.floor(day / 7)}w ago`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

const buildSocialUrl = (platform, raw) => {
  const v = String(raw || "").trim();
  if (!v) return "";
  const isUrl = /^https?:\/\//i.test(v);
  switch (platform) {
    case "github":    return isUrl ? v : `https://github.com/${v.replace(/^@/, "")}`;
    case "linkedin":  return isUrl ? v : `https://www.linkedin.com/in/${v}`;
    case "instagram": return isUrl ? v : `https://instagram.com/${v.replace(/^@/, "")}`;
    case "whatsapp":  return isUrl ? v : `https://wa.me/${v.replace(/[^0-9]/g, "")}`;
    case "email":     return v.startsWith("mailto:") ? v : `mailto:${v}`;
    default:          return v;
  }
};

// Admin's icon picker keys → lucide icon names (mirrors the static
// design exactly so admin-driven cards look identical to hard-coded
// ones at https://satwinder777.github.io/).
const ICON_MAP = {
  star: "star",
  rocket: "rocket",
  bolt: "zap",
  shield: "shield-check",
  cloud: "cloud",
  code: "code-2",
  design: "palette",
  mobile: "smartphone",
  gear: "settings",
  graph: "line-chart",
  layers: "layers",
  database: "database",
  activity: "activity",
  map: "map",
  wifi: "wifi-off",
  merge: "git-merge",
};
const ICON_TINTS = [
  "text-accent-cyan",
  "text-accent-purple",
  "text-accent-pink",
  "text-orange-500",
  "text-green-400",
  "text-yellow-500",
];

// Per-project palette so each card keeps the same visual rhythm as
// the static design (purple → pink → orange → green → yellow → cyan).
const PROJECT_PALETTE = [
  { secondary: "bg-accent-purple/10 text-accent-purple border-accent-purple/20", visualTint: "text-accent-purple/50", icon: "map-pin" },
  { secondary: "bg-accent-pink/10 text-accent-pink border-accent-pink/20",       visualTint: "text-accent-pink/50",   icon: "scissors" },
  { secondary: "bg-orange-500/10 text-orange-400 border-orange-500/20",          visualTint: "text-orange-500/50",    icon: "navigation" },
  { secondary: "bg-green-400/10 text-green-400 border-green-400/20",             visualTint: "text-green-400/50",     icon: "activity" },
  { secondary: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",          visualTint: "text-yellow-500/50",    icon: "shield-check" },
  { secondary: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20",       visualTint: "text-accent-cyan/50",   icon: "rocket" },
];

// ------------------------------------------------------------
//  UI bootstrap (cursor, IntersectionObserver, lucide icons)
//  The observer is module-scoped so render functions can re-attach
//  it to dynamically injected `.reveal` nodes.
// ------------------------------------------------------------
const yearEl = $("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
);

const refreshUi = () => {
  if (window.lucide) window.lucide.createIcons();
  document
    .querySelectorAll(".reveal:not(.active)")
    .forEach((el) => revealObserver.observe(el));
};

// Initial UI pass for the static fallback content.
refreshUi();

// Custom cursor (desktop only).
(function setupCursor() {
  const cursor = $("cursor");
  if (!cursor || !window.matchMedia("(pointer: fine)").matches) return;
  document.addEventListener("mousemove", (e) => {
    requestAnimationFrame(() => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    });
  });
  document.body.addEventListener("mouseover", (e) => {
    if (e.target.closest?.(".interactive, a, button, input, textarea, select")) {
      cursor.classList.add("hovered");
    }
  });
  document.body.addEventListener("mouseout", (e) => {
    if (e.target.closest?.(".interactive, a, button, input, textarea, select")) {
      cursor.classList.remove("hovered");
    }
  });
})();

// ------------------------------------------------------------
//  Render functions
// ------------------------------------------------------------

function renderProfile(profile = {}) {
  const name = (profile.name && profile.name.trim()) || "Satwinder Singh";
  const jobTitle = (profile.title && profile.title.trim()) || "";
  const tagline =
    (profile.tagline && profile.tagline.trim()) || jobTitle || "";

  const navName = $("nav-name");
  if (navName) navName.textContent = name.split(" ")[0] || name;

  const heroName = $("hero-name");
  if (heroName) heroName.textContent = name;

  const footerName = $("footer-name");
  if (footerName) footerName.textContent = name;

  // Subtitle under availability (admin "Main Title" field).
  const heroSubtitle = $("hero-subtitle");
  if (heroSubtitle) {
    if (jobTitle) {
      heroSubtitle.textContent = jobTitle;
      heroSubtitle.classList.remove("hidden");
    } else {
      heroSubtitle.classList.add("hidden");
    }
  }

  // Hero h1 — tagline from admin, or fall back to main title.
  if (tagline) {
    const t = $("hero-tagline");
    if (t) t.textContent = tagline;
  }

  // Browser tab: "Name | Job Title"
  if (jobTitle) {
    document.title = `${name} | ${jobTitle}`;
  } else if (name) {
    document.title = name;
  }

  // Hero paragraph — keep "I am [name]." prefix, append bio/spec text.
  const heroBio = $("hero-bio");
  if (heroBio && (profile.bio || profile.tagline)) {
    const suffix = (profile.bio && profile.bio.trim()) ||
      (profile.tagline && profile.tagline.trim()) ||
      "I specialize in bridging cross-platform efficiency with native Android performance, building real-time systems, and deploying enterprise-grade architectures.";
    heroBio.innerHTML = `I am <strong id="hero-name" class="text-white font-semibold">${esc(name)}</strong>. ${esc(suffix)}`;
  }

  // Engineering Mindset — title + description (falls back to legacy `bio`).
  const mindsetTitleEl = $("mindset-title");
  const mindsetHeading =
    (profile.mindsetTitle && profile.mindsetTitle.trim()) ||
    "Engineering Mindset";
  if (mindsetTitleEl) mindsetTitleEl.textContent = mindsetHeading;

  const mindsetBody =
    (profile.mindsetDescription && profile.mindsetDescription.trim()) ||
    (profile.bio && profile.bio.trim()) ||
    "";
  const wrap = $("mindset-paragraphs");
  if (wrap) {
    if (!mindsetBody) {
      wrap.innerHTML = "";
    } else {
      const paragraphs = mindsetBody
        .split(/\n\s*\n|\r\n\r\n/)
        .map((p) => p.replace(/\n+/g, " ").trim())
        .filter(Boolean);
      const list = paragraphs.length ? paragraphs : [mindsetBody.trim()];
      wrap.innerHTML = list
        .map((p, i) => {
          const mb = i === list.length - 1 ? "mb-8" : "mb-6";
          return `<p class="text-gray-300 leading-relaxed text-lg ${mb}">${esc(p)}</p>`;
        })
        .join("");
    }
  }

  // Availability badge.
  const text = $("hero-availability-text");
  if (text && profile.availabilityText)
    text.textContent = profile.availabilityText;
  const badge = $("hero-availability-badge");
  if (badge) badge.style.display = profile.availability === false ? "none" : "";

  // Avatar (only shown if admin uploaded one).
  const avatar = $("hero-avatar");
  if (avatar) {
    if (profile.avatarUrl) {
      avatar.src = profile.avatarUrl;
      avatar.classList.remove("hidden");
    } else {
      avatar.classList.add("hidden");
    }
  }
}

function renderStats(stats = []) {
  const el = $("stats-container");
  if (!el) return;
  const list = (stats || [])
    .filter((s) => s && s.visible !== false && (s.value || s.label))
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  if (!list.length) return; // keep static fallback
  el.innerHTML = list.map((s) => buildStatCardHtml(s)).join("");
  setupStatCards(el);
}

function statScrollTarget(stat = {}) {
  const label = String(stat.label || "").toLowerCase();
  if (/\bproduction\b|\bapps?\b/.test(label)) return "projects";
  if (/\byear\b|\bexp\.?\b|\bexperience\b/.test(label)) return "experience";
  if (/\bcrash\b|\breliab\b|\bfree\b/.test(label)) return "expertise";
  if (/\bfps\b|\bframe\b|\brender\b/.test(label)) return "expertise";
  if (/\bperf\b|\bimprov/.test(label)) return "expertise";
  if (/\bdomain\b|\bindustr/.test(label)) return "about";
  return null;
}

const STAT_SECTION_HINTS = {
  projects: "Featured Implementations",
  experience: "Career Trajectory",
  expertise: "Deep Technical Expertise",
  about: "Technical Arsenal",
  contact: "Contact",
};

function buildStatCardHtml(stat) {
  const target = statScrollTarget(stat);
  const hint = target ? STAT_SECTION_HINTS[target] : "";
  const linkCls = target ? " stat-card--link" : "";
  const attrs = target
    ? ` data-scroll-section="${target}" tabindex="0" role="link" aria-label="${esc(stat.label)} — scroll to ${esc(hint)}"`
    : "";
  return `
        <div class="glass-card stat-card${linkCls} p-6 rounded-2xl"${attrs}>
          ${stat.icon ? `<div class="text-2xl mb-2" aria-hidden="true">${esc(stat.icon)}</div>` : ""}
          <div class="text-3xl font-display font-bold gradient-text mb-2">${esc(stat.value)}</div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider">${esc(stat.label)}</div>
          ${target ? `<div class="stat-card__hint" aria-hidden="true">View ${esc(hint)}</div>` : ""}
        </div>`;
}

function getScrollOffset() {
  const nav = document.getElementById("navbar");
  const navH = nav?.offsetHeight || 72;
  const bannerH = document.body.classList.contains("has-site-banner")
    ? parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--site-banner-height"
        ) || "52",
        10
      )
    : 0;
  return navH + bannerH + 16;
}

function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - getScrollOffset();
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  if (typeof setActiveNav === "function") setActiveNav(sectionId);
  try {
    history.replaceState(null, "", `#${sectionId}`);
  } catch (_) {
    /* ignore */
  }
}

function setupStatCards(container) {
  if (!container || container.dataset.statBound === "1") return;
  container.dataset.statBound = "1";

  const activate = (card) => {
    const id = card?.dataset?.scrollSection;
    if (id) scrollToSection(id);
  };

  container.addEventListener("click", (e) => {
    const card = e.target.closest("[data-scroll-section]");
    if (!card) return;
    activate(card);
  });

  container.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest("[data-scroll-section]");
    if (!card) return;
    e.preventDefault();
    activate(card);
  });
}

function renderArsenal(skills = []) {
  const el = $("arsenal-container");
  if (!el) return;
  const list = (skills || [])
    .filter((s) => s && s.label)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  if (!list.length) return;

  const ACCENT = {
    frontend:     "border-accent-cyan/40 bg-accent-cyan/10 text-white font-medium shadow-[0_0_15px_rgba(0,217,255,0.1)]",
    architecture: "border-accent-purple/40 bg-accent-purple/10 text-white font-medium",
    devops:       "border-accent-pink/40 bg-accent-pink/10 text-white font-medium",
    backend:      "border-orange-500/40 bg-orange-500/10 text-white font-medium",
    other:        "border-white/10 bg-bg-primary text-gray-300",
  };

  const CAT_ORDER = ["frontend", "architecture", "backend", "devops", "other"];
  const CAT_LABEL = {
    frontend: "Frontend",
    architecture: "Architecture",
    backend: "Backend",
    devops: "DevOps",
    other: "Other",
  };
  const CAT_ICON = {
    frontend: "smartphone",
    architecture: "git-branch",
    backend: "database",
    devops: "cloud",
    other: "wrench",
  };
  const CAT_TINT = {
    frontend: "text-accent-cyan",
    architecture: "text-accent-purple",
    devops: "text-accent-pink",
    backend: "text-orange-400",
    other: "text-gray-400",
  };

  const chipHtml = (s, key) => {
    const cls = ACCENT[key] || ACCENT.other;
    return `<span class="px-5 py-2.5 rounded-full border ${cls} interactive skill-tag" data-skill="${esc(s.label)}">${esc(s.label)}</span>`;
  };

  const usedCategorisation = list.some((s) => s.category && s.category !== "other");

  if (usedCategorisation) {
    el.innerHTML = CAT_ORDER.map((cat) => {
      const items = list.filter((s) => (s.category || "other") === cat);
      if (!items.length) return "";
      const tint = CAT_TINT[cat] || CAT_TINT.other;
      const chips = items
        .map((s) => chipHtml(s, cat === "other" ? "other" : cat))
        .join("");
      return `
        <div class="w-full mb-8 last:mb-0 reveal">
          <div class="flex items-center gap-2 mb-3">
            <i data-lucide="${CAT_ICON[cat] || "star"}" class="w-4 h-4 ${tint}"></i>
            <span class="text-xs font-bold uppercase tracking-widest ${tint}">${esc(CAT_LABEL[cat] || cat)}</span>
            <span class="text-[10px] text-gray-500 font-medium">${items.length}</span>
          </div>
          <div class="flex flex-wrap gap-3">${chips}</div>
        </div>`;
    }).join("");
    if (typeof lucide !== "undefined") lucide.createIcons();
    return;
  }

  const ROTATION = ["frontend", "architecture", "devops", "backend"];
  const seenCat = new Set();
  let posLeader = 0;

  el.innerHTML = list
    .map((s, i) => {
      let key = "other";
      if (i % 4 === 0 && posLeader < ROTATION.length) {
        key = ROTATION[posLeader++];
      }
      return chipHtml(s, key);
    })
    .join("");
}

function renderExpertise(items = []) {
  const el = $("expertise-container");
  if (!el) return;
  const list = (items || [])
    .filter((e) => e && e.visible !== false && (e.title || e.description))
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  if (!list.length) return;
  el.innerHTML = list
    .map(
      (e, i) => `
        <div class="glass-card rounded-2xl p-8 reveal service-card" data-service="${esc(e.title)}" style="transition-delay: ${(i % 4) * 50}ms;">
          <i data-lucide="${ICON_MAP[e.icon] || "star"}" class="w-10 h-10 ${ICON_TINTS[i % ICON_TINTS.length]} mb-6"></i>
          <h3 class="text-lg font-bold text-white mb-3">${esc(e.title)}</h3>
          <p class="text-sm text-gray-400 leading-relaxed">${esc(e.description)}</p>
        </div>`
    )
    .join("");
}

function renderExperience(items = []) {
  const el = $("experience-container");
  if (!el) return;
  const list = (items || [])
    .filter((e) => e && (e.title || e.company))
    .slice()
    .sort((a, b) => {
      const oa = a.order ?? 9999;
      const ob = b.order ?? 9999;
      // Highest `order` first (matches admin list bottom → top as career timeline).
      if (oa !== ob) return ob - oa;
      const da = a.startDate?.seconds ?? 0;
      const db_ = b.startDate?.seconds ?? 0;
      return db_ - da; // most recent start date first
    });
  if (!list.length) return;

  el.innerHTML = list
    .map((e, i) => {
      const isFirst = i === 0;
      const isLast = i === list.length - 1;
      const start = fmtMonthYear(e.startDate);
      const end = e.isCurrent ? "Present" : (fmtMonthYear(e.endDate) || "Present");
      const dotCls = isFirst
        ? "w-5 h-5 bg-accent-cyan shadow-[0_0_15px_rgba(0,217,255,0.8)] border-4"
        : "w-4 h-4 bg-white/30 border-2";
      const companyCls = isFirst ? "text-accent-cyan font-semibold" : "text-white";
      const techChips = (e.technologies || [])
        .slice(0, 6)
        .map(
          (t) =>
            `<span class="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400 border border-white/10">${esc(t)}</span>`
        )
        .join("");
      const wrapMargin = isLast ? "" : "mb-16";
      const centerLine = isFirst
        ? '<div class="hidden md:block absolute left-1/2 -ml-[0.5px] w-px h-full bg-white/10"></div>'
        : "";
      return `
        <div class="${wrapMargin} relative pl-10 md:pl-0 reveal">
          ${centerLine}
          <div class="md:grid md:grid-cols-2 md:gap-16 items-center">
            <div class="md:text-right md:pr-12 relative">
              <div class="absolute left-[-45px] md:left-auto md:right-[-41px] top-1 ${dotCls} rounded-full z-10 border-bg-secondary"></div>
              <h3 class="text-2xl font-display font-bold text-white">${esc(e.title)}</h3>
              <p class="${companyCls} mt-1">${esc(e.company)}</p>
              <p class="text-sm text-gray-500 mt-2">${start}${start || end ? " - " : ""}${end}</p>
              ${e.location ? `<p class="text-xs text-gray-600 mt-1">${esc(e.location)}</p>` : ""}
            </div>
            <div class="mt-6 md:mt-0 glass-card p-8 rounded-2xl md:pl-12">
              <p class="text-gray-300 text-sm leading-relaxed">${esc(e.description)}</p>
              ${techChips ? `<div class="mt-4 flex flex-wrap gap-2">${techChips}</div>` : ""}
            </div>
          </div>
        </div>`;
    })
    .join("");
}

// —— Featured Implementations (full CMS project showcase) ——
const PROJECT_STATUS = {
  live: { label: "Live on Store", cls: "proj-status-live", icon: "radio" },
  inDevelopment: { label: "In Development", cls: "proj-status-dev", icon: "hammer" },
  beta: { label: "Beta / Testing", cls: "proj-status-beta", icon: "flask-conical" },
  archived: { label: "Archived", cls: "proj-status-archived", icon: "archive" },
};

const PROJECT_FLAVOR = {
  production: "Production",
  staging: "Staging",
  dev: "Dev",
};

const CATEGORY_ICON = {
  "E-Commerce": "shopping-bag",
  Logistics: "truck",
  Booking: "calendar",
  FinTech: "landmark",
  HealthTech: "heart-pulse",
  Social: "users",
  Other: "layers",
};

const TECH_ICON = {
  Flutter: "smartphone",
  Dart: "code-2",
  Firebase: "flame",
  "Google Maps": "map",
  "Google Maps API": "map",
  GetX: "zap",
  Bloc: "boxes",
  Provider: "package",
  Riverpod: "waves",
  Android: "tablet-smartphone",
  Kotlin: "file-code",
  Java: "coffee",
  Swift: "apple",
  "REST APIs": "globe",
  GraphQL: "share-2",
  WebSockets: "radio",
  PostgreSQL: "database",
  Supabase: "database",
  AWS: "cloud",
  Docker: "container",
};

const techIconFor = (name) => {
  const key = String(name || "").trim();
  if (TECH_ICON[key]) return TECH_ICON[key];
  const found = Object.keys(TECH_ICON).find(
    (k) => key.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(key.toLowerCase())
  );
  return found ? TECH_ICON[found] : "box";
};

/* Lucide CDN no longer ships brand icons (GitHub, Apple, etc.) — inline SVGs. */
const BRAND_ICON_SVG = {
  github: `<svg class="proj-icon-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-1.395-.735-1.41-.555 0-1.305 0 0 1.14-.195 2.13.99.915.51 1.26 1.47 1.47 1.47.84 1.455 2.205 1.035 2.745.795.085-.615.54-1.035 1.005-1.275-2.565-.285-5.25-1.275-5.25-5.685 0-1.26.45-2.295 1.2-3.105-.12-.285-.54-1.395.12-2.895 0 0 .975-.315 3.195 1.185.93-.255 1.92-.39 2.91-.39.99 0 1.98.135 2.91.39 2.22-1.515 3.195-1.185 3.195-1.185.66 1.5.24 2.61.12 2.895.75.81 1.2 1.845 1.2 3.105 0 4.425-2.7 5.4-5.28 5.685.42.36.81 1.05.81 2.115 0 1.53-.015 2.76-.015 3.135 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`,
  apple: `<svg class="proj-icon-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>`,
};

const linkIconHtml = (icon) =>
  BRAND_ICON_SVG[icon] || `<i data-lucide="${icon}"></i>`;

let _projectsById = new Map();
let _projectUiReady = false;

const projectDateRange = (p) => {
  const start = fmtMonthYear(p.startDate);
  const end = p.endDate ? fmtMonthYear(p.endDate) : "Present";
  if (start && end) return `${start} – ${end}`;
  return start || end || "";
};

const projectStatusBadge = (statusKey) => {
  const meta = PROJECT_STATUS[statusKey] || PROJECT_STATUS.inDevelopment;
  return `<span class="proj-status ${meta.cls}">
    <span class="proj-status-dot"></span>
    <i data-lucide="${meta.icon}" class="w-3 h-3"></i>
    ${esc(meta.label)}
  </span>`;
};

const projectLinkButtons = (p) => {
  const items = [];
  const add = (href, label, icon, store = false) => {
    if (!href || !String(href).trim()) return;
    items.push({ href: String(href).trim(), label, icon, store });
  };
  add(p.playStoreUrl, "Play Store", "smartphone", true);
  add(p.appStoreUrl, "App Store", "apple", true);
  add(p.githubUrl, "GitHub", "github", false);
  add(p.liveDemoUrl, "Live Demo", "external-link", false);
  if (!items.length) return "";
  return `<div class="proj-card__links">${items
    .map(
      (l) =>
        `<a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer" class="proj-link-tile ${l.store ? "proj-link-tile--store" : ""} interactive" title="${esc(l.label)}">
          <span class="proj-link-tile__icon">${linkIconHtml(l.icon)}</span>
          <span>${esc(l.label)}</span>
        </a>`
    )
    .join("")}</div>`;
};

const projectMetaRow = (p) => {
  const items = [];
  if (p.yourRole) items.push({ icon: "user-round", label: "Role", value: p.yourRole });
  if (p.teamSize) items.push({ icon: "users", label: "Team", value: p.teamSize });
  if (p.clientType) items.push({ icon: "building-2", label: "Client", value: p.clientType });
  const dates = projectDateRange(p);
  if (dates) items.push({ icon: "calendar-range", label: "Timeline", value: dates });
  if (!items.length) return "";
  return `<div class="proj-meta-strip">${items
    .map(
      (m) =>
        `<div class="proj-meta-pill">
          <span class="proj-meta-pill__icon"><i data-lucide="${m.icon}"></i></span>
          <span class="proj-meta-pill__text">
            <span class="proj-meta-pill__label">${esc(m.label)}</span>
            <span class="proj-meta-pill__value">${esc(m.value)}</span>
          </span>
        </div>`
    )
    .join("")}</div>`;
};

const TECH_CATEGORY_ICON = {
  Mobile: "smartphone",
  Frontend: "layout",
  Backend: "server",
  Database: "database",
  DevOps: "workflow",
  Cloud: "cloud",
  Tools: "wrench",
  Stack: "layers",
};

const techChip = (t) =>
  `<span class="proj-tech-chip"><i data-lucide="${techIconFor(t)}"></i>${esc(t)}</span>`;

/** Unified media frame — nothing cropped; same aspect everywhere. */
const mediaFrame = (inner, variant = "") =>
  `<div class="media-frame ${variant}"><div class="media-frame__inner">${inner}</div></div>`;

/** Card view — category names only (full stack in case study). */
const projectTechCategoriesHtml = (p) => {
  const stack = (p.techStack || []).filter(
    (g) => g && g.category && Array.isArray(g.items) && g.items.length
  );
  if (stack.length) {
    const pills = stack
      .map((group) => {
        const cat = group.category || "Stack";
        const icon = TECH_CATEGORY_ICON[cat] || "box";
        const n = group.items.filter(Boolean).length;
        return `
          <button type="button" class="proj-cat-pill interactive proj-open-detail" data-project-id="${esc(p.id)}" title="View ${esc(cat)} in case study">
            <i data-lucide="${icon}"></i>
            <span class="proj-cat-pill__name">${esc(cat)}</span>
            <span class="proj-cat-pill__count">${n}</span>
          </button>`;
      })
      .join("");
    return `
      <div class="proj-card__tech proj-card__tech--cats">
        <span class="proj-card__tech-label">Stack</span>
        <div class="proj-cat-pills">${pills}</div>
      </div>`;
  }
  const flat = (p.technologies || []).filter(Boolean).slice(0, 4);
  if (!flat.length) return "";
  const chips = flat.map((t) => techChip(t)).join("");
  const extra =
    (p.technologies || []).length > 4
      ? `<span class="proj-cat-pill proj-cat-pill--muted">+${p.technologies.length - 4}</span>`
      : "";
  return `
    <div class="proj-card__tech proj-card__tech--cats">
      <span class="proj-card__tech-label">Stack</span>
      <div class="proj-cat-pills">${chips}${extra}</div>
    </div>`;
};

/** Case study — full grouped stack with every technology. */
const projectTechStackFullHtml = (p) => {
  const stack = (p.techStack || []).filter(
    (g) => g && g.category && Array.isArray(g.items) && g.items.length
  );
  if (stack.length) {
    const groups = stack
      .map((group) => {
        const cat = group.category || "Stack";
        const icon = TECH_CATEGORY_ICON[cat] || "box";
        const items = group.items.filter(Boolean);
        return `
          <div class="proj-tech-group">
            <div class="proj-tech-group__head">
              <i data-lucide="${icon}"></i>
              <span>${esc(cat)}</span>
              <span class="proj-tech-group__count">${items.length}</span>
            </div>
            <div class="proj-tech-group__chips">
              ${items.map((t) => techChip(t)).join("")}
            </div>
          </div>`;
      })
      .join("");
    return `<div class="proj-tech-stack proj-tech-stack--full">${groups}</div>`;
  }
  const flat = (p.technologies || []).filter(Boolean);
  if (!flat.length) return "";
  return `<div class="flex flex-wrap gap-2">${flat.map((t) => techChip(t)).join("")}</div>`;
};

const projectVisualBlock = (p, palette) => {
  const thumb =
    p.thumbnailUrl ||
    (Array.isArray(p.imageUrls) && p.imageUrls[0]) ||
    "";
  const screenInner = thumb
    ? `<img src="${esc(thumb)}" alt="${esc(p.name)}" loading="lazy" decoding="async">`
    : `<i data-lucide="${palette.icon}" class="proj-device__icon ${palette.visualTint}"></i>`;
  return `
    <div class="proj-media-orb proj-media-orb--cyan" aria-hidden="true"></div>
    <div class="proj-media-orb proj-media-orb--purple" aria-hidden="true"></div>
    <div class="proj-device">
      <div class="proj-device__frame">
        <div class="proj-visual-inner">
          ${mediaFrame(screenInner, "media-frame--card")}
        </div>
      </div>
    </div>`;
};

const buildProjectCardHtml = (p, i) => {
  const palette = PROJECT_PALETTE[i % PROJECT_PALETTE.length];
  const accents = [
    { a: "#00d9ff", b: "#8b5cf6" },
    { a: "#8b5cf6", b: "#ec4899" },
    { a: "#f97316", b: "#00d9ff" },
    { a: "#4ade80", b: "#8b5cf6" },
    { a: "#eab308", b: "#00d9ff" },
    { a: "#00d9ff", b: "#4ade80" },
  ][i % 6];
  const name = p.name || "Untitled";
  const desc = p.shortDesc || p.longDesc || "";
  const imageRight = i % 2 === 0;
  const featured = !!p.featured;
  const catIcon = CATEGORY_ICON[p.category] || "folder-kanban";
  const flavor = PROJECT_FLAVOR[p.flavorType] || "";
  const techBlock = projectTechCategoriesHtml(p);
  const linksHtml = projectLinkButtons(p);
  const metaHtml = projectMetaRow(p);
  const indexStr = String(i + 1).padStart(2, "0");

  const headBadges = [
    featured ? '<span class="proj-badge-featured"><i data-lucide="sparkles"></i> Featured</span>' : "",
    projectStatusBadge(p.status),
    p.category
      ? `<span class="proj-tag"><i data-lucide="${catIcon}"></i>${esc(p.category)}</span>`
      : "",
    p.primaryLanguage
      ? `<span class="proj-tag"><i data-lucide="${techIconFor(p.primaryLanguage)}"></i>${esc(p.primaryLanguage)}</span>`
      : "",
    flavor && flavor !== "Production"
      ? `<span class="proj-tag"><i data-lucide="git-branch"></i>${esc(flavor)}</span>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const gridFlip = imageRight ? "" : " proj-card__grid--flip";
  const eyebrow = p.category || "Product build";

  return `
    <article class="proj-card reveal interactive ${featured ? "proj-card--featured" : ""}"
      data-project-id="${esc(p.id)}"
      data-project="${esc(name)}"
      style="--reveal-delay: ${Math.min(i * 90, 360)}ms; --proj-accent: ${accents.a}; --proj-accent-2: ${accents.b}">
      <div class="proj-card__shell">
        <div class="proj-card__ambient" aria-hidden="true"></div>
        <div class="proj-card__shine" aria-hidden="true"></div>
        <span class="proj-card__index" aria-hidden="true">${indexStr}</span>
        <div class="proj-card__grid${gridFlip}">
          <div class="proj-card__content">
            <header class="proj-card__head">${headBadges}</header>
            <div class="proj-card__body">
              <div class="proj-card__title-wrap">
                <p class="proj-card__eyebrow"><i data-lucide="${catIcon}"></i> ${esc(eyebrow)}</p>
                <h3 class="proj-card__title">${esc(name)}</h3>
              </div>
              ${desc ? `<p class="proj-card__desc line-clamp-3">${esc(desc)}</p>` : ""}
              ${metaHtml}
              ${techBlock || ""}
            </div>
            <footer class="proj-card__foot">
              <div class="proj-card__links-row">
                ${linksHtml}
                <button type="button" class="proj-cta interactive proj-open-detail" data-project-id="${esc(p.id)}">
                  <span>Case study</span>
                  <i data-lucide="arrow-up-right"></i>
                </button>
              </div>
            </footer>
          </div>
          <aside class="proj-card__media" aria-label="${esc(name)} preview">
            ${projectVisualBlock(p, palette)}
          </aside>
        </div>
      </div>
    </article>`;
};

const buildProjectModalHtml = (p) => {
  const long = p.longDesc || p.shortDesc || "";
  const features = (p.keyFeatures || []).filter(Boolean);
  const images = (p.imageUrls || []).filter(Boolean);
  const videos = (p.videoUrls || []).filter(Boolean);
  const heroImg = p.thumbnailUrl || images[0] || "";
  const linksHtml = projectLinkButtons(p);

  const techHtml = projectTechStackFullHtml(p);

  const featuresHtml = features.length
    ? `<section class="proj-modal__section">
        <h3 class="proj-modal__section-title"><i data-lucide="sparkles"></i> Key features</h3>
        <ul class="proj-modal__features">
          ${features.map((f) => `<li><i data-lucide="check-circle-2"></i><span>${esc(f)}</span></li>`).join("")}
        </ul>
      </section>`
    : "";

  const challengesHtml = p.challenges
    ? `<section class="proj-modal__section">
        <h3 class="proj-modal__section-title proj-modal__section-title--purple"><i data-lucide="cpu"></i> Technical challenges</h3>
        <p class="proj-modal__desc" style="margin:0">${esc(p.challenges)}</p>
      </section>`
    : "";

  const impactHtml = p.impact
    ? `<section class="proj-modal__section">
        <h3 class="proj-modal__section-title"><i data-lucide="trending-up"></i> Impact & results</h3>
        <p class="proj-modal__desc" style="margin:0">${esc(p.impact)}</p>
      </section>`
    : "";

  const galleryHtml = images.length
    ? `<section class="proj-modal__section">
        <h3 class="proj-modal__section-title"><i data-lucide="images"></i> Screenshots</h3>
        <div class="proj-gallery">${images
          .map(
            (u) =>
              `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" class="interactive proj-gallery__item">${mediaFrame(`<img src="${esc(u)}" alt="${esc(p.name)}" loading="lazy" decoding="async">`, "media-frame--fluid media-frame--thumb")}</a>`
          )
          .join("")}</div>
      </section>`
    : "";

  const videoHtml = videos.length
    ? `<section class="proj-modal__section">
        <h3 class="proj-modal__section-title"><i data-lucide="play-circle"></i> Demo video</h3>
        <div class="proj-media-list">${videos
          .map(
            (u) =>
              mediaFrame(
                `<video controls playsinline preload="metadata" src="${esc(u)}"></video>`,
                "media-frame--video"
              )
          )
          .join("")}</div>
      </section>`
    : "";

  return `
    ${heroImg ? mediaFrame(`<img src="${esc(heroImg)}" alt="${esc(p.name)}" decoding="async">`, "media-frame--fluid media-frame--hero proj-modal__hero") : ""}
    <div class="proj-modal__badges">
      ${projectStatusBadge(p.status)}
      ${p.category ? `<span class="proj-tag"><i data-lucide="${CATEGORY_ICON[p.category] || "folder-kanban"}"></i>${esc(p.category)}</span>` : ""}
      ${p.primaryLanguage ? `<span class="proj-tag"><i data-lucide="${techIconFor(p.primaryLanguage)}"></i>${esc(p.primaryLanguage)}</span>` : ""}
    </div>
    <h2 id="project-modal-title" class="proj-modal__title">${esc(p.name)}</h2>
    ${projectMetaRow(p)}
    ${long ? `<p class="proj-modal__desc">${esc(long)}</p>` : ""}
    ${techHtml ? `<section class="proj-modal__section proj-modal__section--stack"><h3 class="proj-modal__section-title"><i data-lucide="layers"></i> Technology stack</h3>${techHtml}</section>` : ""}
    ${linksHtml ? `<div class="proj-modal__actions">${linksHtml}</div>` : ""}
    ${featuresHtml}
    ${challengesHtml}
    ${impactHtml}
    ${galleryHtml}
    ${videoHtml}`;
};

let _contactNudgeTimer = null;
let _skipNudgeThisCaseStudy = false;

/** Popup timing & persistence (sessionStorage — per browser tab). */
const NUDGE = {
  delayMs: 4500,
  snoozeMs: 30 * 60 * 1000,
  keys: {
    dismissed: "contact_nudge_dismissed",
    snoozeUntil: "contact_nudge_snooze_until",
  },
};

const canShowContactNudge = () => {
  if (sessionStorage.getItem(NUDGE.keys.dismissed) === "1") return false;
  const until = Number(sessionStorage.getItem(NUDGE.keys.snoozeUntil) || 0);
  return !(until > Date.now());
};

const clearContactNudgeTimer = () => {
  if (_contactNudgeTimer) {
    clearTimeout(_contactNudgeTimer);
    _contactNudgeTimer = null;
  }
};

const openContactNudge = () => {
  const el = $("contact-nudge");
  if (!el || !canShowContactNudge() || _skipNudgeThisCaseStudy) return;
  el.classList.add("is-open");
  el.setAttribute("aria-hidden", "false");
  refreshUi();
};

/** @param {"none"|"session"|"snooze"|"next-study"} persist */
const closeContactNudge = (persist = "none") => {
  clearContactNudgeTimer();
  const el = $("contact-nudge");
  if (!el) return;
  el.classList.remove("is-open");
  el.setAttribute("aria-hidden", "true");
  if (persist === "session") {
    sessionStorage.setItem(NUDGE.keys.dismissed, "1");
  } else if (persist === "snooze") {
    sessionStorage.setItem(
      NUDGE.keys.snoozeUntil,
      String(Date.now() + NUDGE.snoozeMs)
    );
  } else if (persist === "next-study") {
    _skipNudgeThisCaseStudy = true;
  }
};

const scheduleContactNudge = () => {
  clearContactNudgeTimer();
  if (!canShowContactNudge() || _skipNudgeThisCaseStudy) return;
  _contactNudgeTimer = setTimeout(() => {
    const caseStudy = $("project-modal");
    if (!caseStudy?.classList.contains("is-open")) return;
    openContactNudge();
  }, NUDGE.delayMs);
};

const scrollToContact = () => {
  closeContactNudge("session");
  closeProjectModal();
  requestAnimationFrame(() => {
    $("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
};

const initContactNudge = () => {
  const root = $("contact-nudge");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  root.querySelectorAll("[data-nudge-close]").forEach((el) => {
    el.addEventListener("click", () => closeContactNudge("next-study"));
  });

  root.querySelector("[data-nudge-contact]")?.addEventListener("click", (e) => {
    e.preventDefault();
    scrollToContact();
  });

  root.querySelector("[data-nudge-remind]")?.addEventListener("click", () => {
    closeContactNudge("snooze");
  });

  root.querySelector("[data-nudge-dismiss]")?.addEventListener("click", () => {
    closeContactNudge("session");
  });

  root.querySelectorAll("[data-nudge-wa], [data-nudge-email]").forEach((el) => {
    el.addEventListener("click", () => closeContactNudge("snooze"));
  });
};

const openProjectModal = (id) => {
  const p = _projectsById.get(id);
  const modal = $("project-modal");
  const body = $("project-modal-body");
  if (!p || !modal || !body) return;
  closeContactNudge("none");
  _skipNudgeThisCaseStudy = false;
  body.innerHTML = buildProjectModalHtml(p);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  refreshUi();
  scheduleContactNudge();
};

const closeProjectModal = () => {
  clearContactNudgeTimer();
  const modal = $("project-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

const setupProjectTilt = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(".proj-card__media[data-tilt-bound]").forEach((el) => {
    el.removeAttribute("data-tilt-bound");
  });
  document.querySelectorAll(".proj-card__media").forEach((media) => {
    media.setAttribute("data-tilt-bound", "1");
    const visual = media.querySelector(".proj-visual-inner");
    if (!visual) return;
    media.addEventListener("mousemove", (e) => {
      const r = media.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      visual.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 5}deg)`;
    });
    media.addEventListener("mouseleave", () => {
      visual.style.transform = "";
    });
  });
};

const initProjectShowcase = () => {
  if (_projectUiReady) return;
  _projectUiReady = true;

  const container = $("projects-container");
  container?.addEventListener("click", (e) => {
    const btn = e.target.closest?.(".proj-open-detail");
    if (btn?.dataset?.projectId) openProjectModal(btn.dataset.projectId);
  });

  const modal = $("project-modal");
  modal?.querySelectorAll("[data-proj-close]").forEach((el) => {
    el.addEventListener("click", closeProjectModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if ($("contact-nudge")?.classList.contains("is-open")) {
      closeContactNudge("next-study");
      return;
    }
    closeProjectModal();
  });
};

function renderProjects(items = []) {
  const el = $("projects-container");
  if (!el) return;
  const all = (items || []).filter((p) => p && p.name);
  if (!all.length) return;

  initProjectShowcase();

  const list = all.slice().sort((a, b) => {
    const fa = a.featured ? 0 : 1;
    const fb = b.featured ? 0 : 1;
    if (fa !== fb) return fa - fb;
    return (a.order || 0) - (b.order || 0);
  });

  _projectsById = new Map(list.map((p) => [p.id, p]));
  el.innerHTML = list.map((p, i) => buildProjectCardHtml(p, i)).join("");
  setupProjectTilt();
  refreshUi();
}

function renderSocialLinks(links = {}) {
  const map = [
    { id: "social-github",    key: "github",    show: "showGithub"    },
    { id: "social-linkedin",  key: "linkedin",  show: "showLinkedin"  },
    { id: "social-whatsapp",  key: "whatsapp",  show: "showWhatsapp"  },
    { id: "social-instagram", key: "instagram", show: "showInstagram" },
    { id: "social-email",     key: "email",     show: "showEmail"     },
  ];
  map.forEach(({ id, key, show }) => {
    const el = $(id);
    if (!el) return;
    const value = links[key];
    const visible = links[show] !== false && !!value;
    if (visible) {
      el.href = buildSocialUrl(key, value);
      el.style.display = "";
    } else {
      el.style.display = "none";
    }
  });

  const wa = $("social-whatsapp");
  const em = $("social-email");
  const nudgeWa = $("nudge-whatsapp");
  const nudgeEm = $("nudge-email");
  if (nudgeWa && wa?.href && wa.style.display !== "none") nudgeWa.href = wa.href;
  if (nudgeEm && em?.href && em.style.display !== "none") nudgeEm.href = em.href;
}

function renderResume(url, show) {
  const btn = $("resume-download-btn");
  if (!btn) return;
  const ok = !!url && show !== false;
  if (ok) {
    btn.href = url;
    btn.style.display = "";
  } else {
    btn.style.display = "none";
  }
}

function renderSeo(seo = {}) {
  if (seo.title) document.title = seo.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc && seo.description) desc.setAttribute("content", seo.description);
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme && seo.themeColor) theme.setAttribute("content", seo.themeColor);
}

let _contactFormEnabled = true;

function renderContactGate(enabled) {
  _contactFormEnabled = enabled !== false;
  const el = document.querySelector("[data-contact-section]");
  if (!el) return;
  el.style.display = enabled === false ? "none" : "";
  const banner = document.getElementById("contact-disabled-banner");
  const form = document.getElementById("contact-form");
  if (banner) banner.classList.toggle("hidden", _contactFormEnabled);
  if (form) form.classList.toggle("contact-form--disabled", !_contactFormEnabled);
  refreshContactFormUi();
}

const contribInitials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const SVG_GITHUB = `<svg class="contrib-link__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.38 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12"/></svg>`;

const SVG_LINKEDIN = `<svg class="contrib-link__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;

const SVG_GLOBE = `<svg class="contrib-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;

const buildContributorCardHtml = (person, index) => {
  const links = [];
  const gh = buildSocialUrl("github", person.github);
  const li = buildSocialUrl("linkedin", person.linkedin);
  const web = String(person.website || "").trim();
  const webHref = web && !/^https?:\/\//i.test(web) ? `https://${web}` : web;
  if (gh) {
    links.push(
      `<a href="${esc(gh)}" class="contrib-link contrib-link--github interactive" target="_blank" rel="noopener noreferrer">${SVG_GITHUB}<span>GitHub</span></a>`
    );
  }
  if (li) {
    links.push(
      `<a href="${esc(li)}" class="contrib-link contrib-link--linkedin interactive" target="_blank" rel="noopener noreferrer">${SVG_LINKEDIN}<span>LinkedIn</span></a>`
    );
  }
  if (webHref) {
    links.push(
      `<a href="${esc(webHref)}" class="contrib-link contrib-link--web interactive" target="_blank" rel="noopener noreferrer">${SVG_GLOBE}<span>Website</span></a>`
    );
  }
  return `
    <article class="contrib-card reveal" style="animation-delay:${(index * 0.06).toFixed(2)}s" data-contrib-card data-accent="${index % 6}">
      <div class="contrib-card__spotlight" aria-hidden="true"></div>
      <div class="contrib-card__accent-bar" aria-hidden="true"></div>
      <div class="contrib-card__inner">
        <span class="contrib-card__index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
        <div class="contrib-avatar-wrap">
          <div class="contrib-avatar-glow" aria-hidden="true"></div>
          <div class="contrib-avatar" aria-hidden="true">${esc(contribInitials(person.name))}</div>
        </div>
        <h3 class="contrib-name">${esc(person.name)}</h3>
        <span class="contrib-role-badge">${esc(person.role)}</span>
        ${links.length ? `<div class="contrib-divider" aria-hidden="true"></div><div class="contrib-links">${links.join("")}</div>` : ""}
      </div>
    </article>
  `;
};

const setupContributorEffects = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll("[data-contrib-card]").forEach((card) => {
    if (card.dataset.contribFx === "1") return;
    card.dataset.contribFx = "1";

    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);
    });
  });
};

function renderContributorsSection(section = {}) {
  const wrap = document.getElementById("contributors");
  const el = document.getElementById("contributors-container");
  if (!wrap || !el) return;

  const enabled = section.enabled === true;
  const items = (section.items || [])
    .filter((p) => p && p.name && p.visible !== false)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (!enabled || !items.length) {
    wrap.classList.add("cms-section--hidden");
    wrap.setAttribute("aria-hidden", "true");
    el.innerHTML = "";
    return;
  }

  const titleEl = document.getElementById("contributors-title");
  const subEl = document.getElementById("contributors-subtitle");
  if (titleEl && section.title) titleEl.textContent = section.title;
  if (subEl && section.subtitle) subEl.textContent = section.subtitle;

  wrap.classList.remove("cms-section--hidden");
  wrap.setAttribute("aria-hidden", "false");
  el.innerHTML = items.map((p, i) => buildContributorCardHtml(p, i)).join("");
  setupContributorEffects();
  refreshUi();
}

const buildUpcomingCardHtml = (feature, index) => `
  <article class="upcoming-card reveal" data-upcoming-card data-accent="${index % 6}" style="animation-delay:${(index * 0.06).toFixed(2)}s">
    <div class="upcoming-card__spotlight" aria-hidden="true"></div>
    <div class="upcoming-card__accent" aria-hidden="true"></div>
    <div class="upcoming-card__inner">
      <span class="upcoming-card__tag">Soon</span>
      <div class="upcoming-card__head">
        <div class="upcoming-card__icon-wrap">
          <span class="upcoming-card__icon" aria-hidden="true">${esc(feature.icon || "✨")}</span>
        </div>
        <div class="upcoming-card__body">
          <h3 class="upcoming-card__title">${esc(feature.title)}</h3>
          ${feature.eta ? `<span class="upcoming-card__eta"><span class="upcoming-card__eta-dot" aria-hidden="true"></span>${esc(feature.eta)}</span>` : ""}
        </div>
      </div>
      <p class="upcoming-card__desc">${esc(feature.description)}</p>
    </div>
  </article>
`;

const setupUpcomingEffects = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll("[data-upcoming-card]").forEach((card) => {
    if (card.dataset.upcomingFx === "1") return;
    card.dataset.upcomingFx = "1";
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
};

function renderUpcomingFeatures(items = []) {
  const wrap = document.getElementById("upcoming");
  const el = document.getElementById("upcoming-container");
  if (!wrap || !el) return;

  const list = (items || [])
    .filter((f) => f && f.title && f.visible !== false)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (!list.length) {
    wrap.classList.add("cms-section--hidden");
    wrap.setAttribute("aria-hidden", "true");
    el.innerHTML = "";
    return;
  }

  wrap.classList.remove("cms-section--hidden");
  wrap.setAttribute("aria-hidden", "false");
  el.innerHTML = list.map((f, i) => buildUpcomingCardHtml(f, i)).join("");
  setupUpcomingEffects();
  refreshUi();
}

function bannerEsc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSiteBannerLine(devName, message) {
  const msg = message.replace(/^[—–-]\s*/, "").trim();
  return (
    `<span class="site-dev-banner__text">` +
    `<strong class="site-dev-banner__dev">${bannerEsc(devName)}</strong>` +
    ` is actively updating this portfolio` +
    `<span class="site-dev-banner__sep" aria-hidden="true">✦</span>` +
    `<span class="site-dev-banner__msg">${bannerEsc(msg)}</span>` +
    `</span>`
  );
}

function renderSiteBanner(banner = {}) {
  const el = document.getElementById("site-dev-banner");
  const marqueeEl = document.getElementById("site-dev-banner-marquee");
  const ariaEl = document.getElementById("site-dev-banner-aria");
  if (!el) return;

  const enabled = banner.enabled === true;
  const devName = String(banner.developerName || "The developer").trim() || "The developer";
  const message = String(banner.message || "Shipping new features and improvements.").trim();
  const line = buildSiteBannerLine(devName, message);
  const ariaText = `${devName} is actively updating this portfolio — ${message.replace(/^[—–-]\s*/, "")}`;

  if (marqueeEl) marqueeEl.innerHTML = line + line;
  if (ariaEl) ariaEl.textContent = ariaText;

  el.hidden = !enabled;
  el.classList.toggle("is-visible", enabled);
  document.body.classList.toggle("has-site-banner", enabled);

  if (enabled) {
    requestAnimationFrame(() => {
      const h = el.offsetHeight || 52;
      document.documentElement.style.setProperty("--site-banner-height", `${h}px`);
    });
  } else {
    document.documentElement.style.removeProperty("--site-banner-height");
  }
}

// ------------------------------------------------------------
//  Premium nav — scroll state + active section spy
// ------------------------------------------------------------
const NAV_SECTIONS = [
  "about",
  "expertise",
  "experience",
  "projects",
  "contributors",
  "upcoming",
  "feedback",
  "contact",
];

function moveNavGlider(dock, link) {
  const glider = dock?.querySelector(".nav-dock__glider");
  if (!glider || !link) return;
  const dockRect = dock.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  glider.style.width = `${linkRect.width}px`;
  glider.style.transform = `translateX(${linkRect.left - dockRect.left}px)`;
}

function initNavDock(dock) {
  if (!dock || dock.dataset.bound === "1") return;
  dock.dataset.bound = "1";
  const links = dock.querySelectorAll(".nav-link[data-section]");

  links.forEach((link) => {
    link.addEventListener("mouseenter", () => moveNavGlider(dock, link));
    link.addEventListener("focus", () => moveNavGlider(dock, link));
  });

  dock.addEventListener("mouseleave", () => {
    const active = dock.querySelector(".nav-link.is-active");
    if (active) moveNavGlider(dock, active);
  });

  const active = dock.querySelector(".nav-link.is-active");
  if (active) moveNavGlider(dock, active);

  window.addEventListener("resize", () => {
    const a = dock.querySelector(".nav-link.is-active");
    if (a) moveNavGlider(dock, a);
  });
}

function setActiveNav(sectionId) {
  document.querySelectorAll(".nav-link[data-section]").forEach((link) => {
    const active = link.dataset.section === sectionId;
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", "page");
      const dock = link.closest(".nav-dock");
      if (dock) moveNavGlider(dock, link);
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function initNavEffects() {
  const navbar = document.getElementById("navbar");
  const onScroll = () => {
    navbar?.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  initNavDock(document.getElementById("nav-dock-main"));
  initNavDock(document.getElementById("nav-dock-mobile"));

  const sectionEls = NAV_SECTIONS.map((id) => document.getElementById(id)).filter(Boolean);
  if (!sectionEls.length) return;

  const spy = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]?.target?.id) setActiveNav(visible[0].target.id);
    },
    { rootMargin: "-28% 0px -58% 0px", threshold: [0.08, 0.2, 0.45] }
  );
  sectionEls.forEach((el) => spy.observe(el));

  document.querySelectorAll(".nav-link[data-section]").forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.dataset.section;
      if (id) setActiveNav(id);
    });
  });

  // Default active on load
  if (!document.querySelector(".nav-link.is-active")) {
    setActiveNav("about");
  }
}

// ------------------------------------------------------------
//  Suggestions & Feedback — Signal Studio
// ------------------------------------------------------------
const FEEDBACK_RATE_MS = 45_000;
let _lastFeedbackSubmit = 0;
let _feedbackDocs = [];
let _feedbackFilter = "all";

const FEEDBACK_STATUS_META = {
  in_review: { label: "In review", cls: "signal-badge--review" },
  reviewed: { label: "Reviewed", cls: "signal-badge--reviewed" },
  resolved: { label: "Resolved", cls: "signal-badge--resolved" },
};

const FEEDBACK_TYPE_ACCENT = {
  "Design & UX": "#a78bfa",
  "New Feature Idea": "#00d9ff",
  "Bug Report": "#f87171",
  "Content / Copy": "#fbbf24",
  Performance: "#34d399",
  Other: "#8b5cf6",
};

function feedbackInitials(name) {
  const parts = String(name || "V")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] || "V").toUpperCase();
}

function feedbackAccent(type) {
  return FEEDBACK_TYPE_ACCENT[type] || "#00d9ff";
}

function filterFeedbackDocs(docs = []) {
  if (_feedbackFilter === "all") return docs;
  return docs.filter((d) => d.status === _feedbackFilter);
}

function updateSignalFilterCounts(docs = []) {
  const filters = document.getElementById("signal-filters");
  if (!filters) return;
  const counts = {
    all: docs.length,
    in_review: docs.filter((d) => d.status === "in_review").length,
    reviewed: docs.filter((d) => d.status === "reviewed").length,
    resolved: docs.filter((d) => d.status === "resolved").length,
  };
  filters.querySelectorAll(".signal-filter").forEach((btn) => {
    const key = btn.dataset.filter || "all";
    const base = btn.dataset.label || btn.textContent.trim().split(" (")[0];
    btn.dataset.label = base;
    const n = counts[key] ?? 0;
    btn.textContent = key === "all" ? `${base} (${n})` : `${base} (${n})`;
  });
}

function setupSignalCardEffects() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll("[data-signal-card]").forEach((card) => {
    if (card.dataset.sigFx === "1") return;
    card.dataset.sigFx = "1";
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--tilt-x", `${x * 10}deg`);
      card.style.setProperty("--tilt-y", `${-y * 10}deg`);
      card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    });
    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

function setupSignalTypeTiles() {
  const grid = document.getElementById("signal-type-grid");
  const select = document.getElementById("fb-type");
  if (!grid || !select || grid.dataset.bound === "1") return;
  grid.dataset.bound = "1";

  const sync = (value) => {
    select.value = value;
    grid.querySelectorAll(".signal-type-tile").forEach((tile) => {
      tile.classList.toggle("is-active", tile.dataset.value === value);
    });
    setFeedbackFieldError("fb-type", "");
    refreshFeedbackFormUi();
  };

  grid.querySelectorAll(".signal-type-tile").forEach((tile) => {
    tile.addEventListener("click", () => sync(tile.dataset.value || ""));
  });
}

function setupSignalFilters() {
  const filters = document.getElementById("signal-filters");
  if (!filters || filters.dataset.bound === "1") return;
  filters.dataset.bound = "1";

  filters.querySelectorAll(".signal-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      _feedbackFilter = btn.dataset.filter || "all";
      filters.querySelectorAll(".signal-filter").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      renderFeedbackBoard(_feedbackDocs);
    });
  });
}

function triggerSignalBurst() {
  const burst = document.getElementById("signal-burst");
  if (!burst || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  burst.innerHTML = "";
  const colors = ["#00d9ff", "#8b5cf6", "#ec4899", "#34d399", "#fbbf24"];
  for (let i = 0; i < 28; i++) {
    const span = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 28;
    const dist = 70 + Math.random() * 130;
    span.style.left = "50%";
    span.style.top = "40%";
    span.style.background = colors[i % colors.length];
    span.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
    span.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
    burst.appendChild(span);
  }
  setTimeout(() => {
    burst.innerHTML = "";
  }, 950);
}

function renderFeedbackSection(cfg = {}) {
  const wrap = document.getElementById("feedback");
  if (!wrap) return;

  const enabled = cfg.enabled !== false;
  const title = String(cfg.title || "Suggestions & Feedback").trim();
  const subtitle =
    String(
      cfg.subtitle ||
        "Share ideas for this portfolio — every submission is reviewed personally."
    ).trim();

  const titleEl = document.getElementById("feedback-title");
  const subEl = document.getElementById("feedback-subtitle");
  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = subtitle;

  wrap.classList.toggle("cms-section--hidden", !enabled);
  wrap.setAttribute("aria-hidden", enabled ? "false" : "true");
  if (enabled) refreshUi();
}

function buildFeedbackItemHtml(item, i = 0) {
  const status = FEEDBACK_STATUS_META[item.status] || FEEDBACK_STATUS_META.in_review;
  const reply = String(item.developerReply || "").trim();
  const accent = feedbackAccent(item.type);
  const initials = feedbackInitials(item.name);
  const hero = i === 0 ? " signal-card--hero" : "";
  const created = parseFirestoreDate(item.createdAt);
  const timeAgo = formatFeedbackTimeAgo(item.createdAt);
  const timeIso = created ? created.toISOString() : "";
  return `
    <article class="signal-card${hero}" data-signal-card style="--sig-accent:${accent};animation-delay:${Math.min(i * 0.06, 0.36)}s">
      <div class="signal-card__inner">
        <div class="signal-card__spotlight" aria-hidden="true"></div>
        <div class="signal-card__corner" aria-hidden="true"></div>
        <div class="signal-card__top">
          <div class="signal-card__avatar" aria-hidden="true">${esc(initials)}</div>
          <div class="signal-card__meta">
            <div class="signal-card__name">${esc(item.name || "Visitor")}</div>
            <div class="signal-card__subrow">
              <span class="signal-card__type">${esc(item.type || "Feedback")}</span>
              ${
                timeAgo
                  ? `<span class="signal-card__dot" aria-hidden="true">·</span><time class="signal-card__time" datetime="${esc(timeIso)}" title="${esc(created ? created.toLocaleString() : "")}">${esc(timeAgo)}</time>`
                  : ""
              }
            </div>
          </div>
          <span class="signal-badge ${status.cls}">
            <span class="signal-badge__dot" aria-hidden="true"></span>
            ${esc(status.label)}
          </span>
        </div>
        <p class="signal-card__text">${esc(item.suggestion || "")}</p>
        ${
          reply
            ? `<div class="signal-card__reply"><strong>Developer reply</strong>${esc(reply)}</div>`
            : ""
        }
      </div>
    </article>`;
}

function renderFeedbackBoard(docs = []) {
  const board = document.getElementById("feedback-board");
  if (!board) return;

  updateSignalFilterCounts(docs);
  const visible = filterFeedbackDocs(docs);

  if (!docs.length) {
    board.innerHTML =
      '<p class="signal-empty">No public signals yet — transmit the first suggestion from the console.</p>';
    return;
  }

  if (!visible.length) {
    board.innerHTML =
      '<p class="signal-empty">No signals in this lane yet. Try another filter or send one in.</p>';
    return;
  }

  board.innerHTML = visible.map((d, i) => buildFeedbackItemHtml(d, i)).join("");
  setupSignalCardEffects();
  refreshUi();
}

function watchFeedbackBoard() {
  const q = query(
    feedbackCol,
    where("visibleOnWeb", "==", true),
    orderBy("createdAt", "desc"),
    limit(40)
  );
  onSnapshot(
    q,
    (snap) => {
      _feedbackDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderFeedbackBoard(_feedbackDocs);
    },
    (err) => {
      console.error("[feedback] board listener:", err);
      const board = document.getElementById("feedback-board");
      if (board) {
        board.innerHTML =
          '<p class="signal-empty">Could not load signal feed. Firestore rules or index may need deploying.</p>';
      }
    }
  );
}

const setFeedbackFieldError = (field, msg) => {
  const wrap = document.querySelector(`.feedback-field[data-fb-field="${field}"]`);
  const err = document.getElementById(`error-${field}`);
  if (err) err.textContent = msg || "";
  wrap?.classList.toggle("contact-field--invalid", !!msg);
};

const readFeedbackFormData = () => ({
  name: document.getElementById("fb-name")?.value.trim() || "",
  type: document.getElementById("fb-type")?.value.trim() || "",
  suggestion: document.getElementById("fb-suggestion")?.value.trim() || "",
});

const feedbackFieldError = (field, data = readFeedbackFormData()) => {
  switch (field) {
    case "fb-name":
      return data.name.length < 2 ? "Please enter your full name." : "";
    case "fb-type":
      return !data.type ? "Please choose a signal type." : "";
    case "fb-suggestion":
      return data.suggestion.length < 10
        ? "Please write at least 10 characters."
        : "";
    default:
      return "";
  }
};

const isFeedbackFormValid = (data = readFeedbackFormData()) =>
  !feedbackFieldError("fb-name", data) &&
  !feedbackFieldError("fb-type", data) &&
  !feedbackFieldError("fb-suggestion", data);

const showAllFeedbackErrors = (data = readFeedbackFormData()) => {
  ["fb-name", "fb-type", "fb-suggestion"].forEach((field) => {
    setFeedbackFieldError(field, feedbackFieldError(field, data));
  });
};

function refreshFeedbackFormUi() {
  const submitBtn = document.getElementById("feedback-submit-btn");
  const data = readFeedbackFormData();
  const submitting = submitBtn?.dataset.submitting === "1";

  ["fb-name", "fb-type", "fb-suggestion"].forEach((field) => {
    const err = document.getElementById(`error-${field}`);
    if (!err?.textContent) return;
    setFeedbackFieldError(field, feedbackFieldError(field, data));
  });

  if (submitBtn && !submitting) {
    submitBtn.disabled = !isFeedbackFormValid(data);
  }
}

function bindFeedbackFormLiveUi() {
  const refresh = () => refreshFeedbackFormUi();
  ["fb-name", "fb-suggestion", "fb-type"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", refresh);
    el.addEventListener("change", refresh);
  });
}

const clearFeedbackErrors = () => {
  ["fb-name", "fb-type", "fb-suggestion"].forEach((f) => setFeedbackFieldError(f, ""));
};

/** Shift+Enter in a textarea submits the form; Enter alone keeps a new line. */
function bindShiftEnterSubmit(form, textareaIds = []) {
  if (!form) return;
  const trigger = () => {
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
      return;
    }
    form.querySelector('[type="submit"]')?.click();
  };

  textareaIds.forEach((id) => {
    const ta = document.getElementById(id);
    if (!ta) return;
    ta.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || !e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      e.preventDefault();
      trigger();
    });
  });
}

function initFeedbackForm() {
  const form = document.getElementById("feedback-form");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  setupSignalTypeTiles();
  setupSignalFilters();
  bindFeedbackFormLiveUi();
  bindShiftEnterSubmit(form, ["fb-suggestion"]);

  const statusEl = document.getElementById("feedback-form-status");
  const submitBtn = document.getElementById("feedback-submit-btn");
  const labelEl = document.getElementById("feedback-submit-label");
  const suggestionEl = document.getElementById("fb-suggestion");
  const charCountEl = document.getElementById("fb-char-count");

  const updateCharCount = () => {
    if (!charCountEl || !suggestionEl) return;
    const len = suggestionEl.value.length;
    charCountEl.textContent = `${len} / 2000`;
  };
  suggestionEl?.addEventListener("input", updateCharCount);
  updateCharCount();
  refreshFeedbackFormUi();

  const showFbStatus = (msg, kind = "") => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.remove("is-success", "is-error");
    if (kind) statusEl.classList.add(`is-${kind}`);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = readFeedbackFormData();

    if (!isFeedbackFormValid(data)) {
      showAllFeedbackErrors(data);
      return;
    }

    const now = Date.now();
    if (now - _lastFeedbackSubmit < FEEDBACK_RATE_MS) {
      showFbStatus("Please wait a moment before transmitting again.", "error");
      return;
    }

    const original = labelEl?.textContent || "Transmit signal";
    if (submitBtn) {
      submitBtn.dataset.submitting = "1";
      submitBtn.disabled = true;
    }
    if (labelEl) labelEl.textContent = "Transmitting…";
    showFbStatus("");

    try {
      await addDoc(feedbackCol, {
        name: data.name,
        type: data.type,
        suggestion: data.suggestion,
        status: "in_review",
        developerReply: "",
        visibleOnWeb: true,
        source: "portfolio_web",
        createdAt: serverTimestamp(),
      });
      _lastFeedbackSubmit = now;
      form.reset();
      document.getElementById("signal-type-grid")?.querySelectorAll(".signal-type-tile").forEach((c) => {
        c.classList.remove("is-active");
      });
      clearFeedbackErrors();
      updateCharCount();
      triggerSignalBurst();
      showFbStatus(
        "Signal received! Your idea is live on the feed as In review.",
        "success"
      );
    } catch (err) {
      console.error("[feedback] submit failed:", err);
      showFbStatus("Could not transmit. Please try again in a moment.", "error");
      reportCmsLog({
        level: "ERROR",
        category: "feedback",
        message: err?.message || String(err),
        stack: err?.stack || "",
        context: "feedback.submit",
      });
    } finally {
      if (submitBtn) submitBtn.dataset.submitting = "0";
      if (labelEl) labelEl.textContent = original;
      refreshFeedbackFormUi();
    }
  });
}

function renderAll(data) {
  try { renderSiteBanner(data.siteBanner);                                   } catch (e) { console.error("renderSiteBanner",     e); }
  try { renderProfile(data.profile);                              } catch (e) { console.error("renderProfile",   e); }
  try { renderStats(data.stats);                                  } catch (e) { console.error("renderStats",     e); }
  try { renderArsenal(data.technicalArsenal || data.skills);      } catch (e) { console.error("renderArsenal",   e); }
  try { renderExpertise(data.expertise);                          } catch (e) { console.error("renderExpertise", e); }
  try { renderExperience(data.experience);                        } catch (e) { console.error("renderExperience",e); }
  try { renderProjects(data.projects);                            } catch (e) { console.error("renderProjects",  e); }
  try { renderContributorsSection(data.contributorsSection);       } catch (e) { console.error("renderContributors",e); }
  try { renderUpcomingFeatures(data.upcomingFeatures);            } catch (e) { console.error("renderUpcoming",  e); }
  try { renderFeedbackSection(data.feedbackSection);              } catch (e) { console.error("renderFeedback",   e); }
  try { renderSocialLinks(data.socialLinks || {});                } catch (e) { console.error("renderSocialLinks",e); }
  try { renderResume(data.resumeUrl, data.showResume);            } catch (e) { console.error("renderResume",    e); }
  try { renderSeo(data.seo || {});                                } catch (e) { console.error("renderSeo",       e); }
  try { renderContactGate(data.contactEnabled);                   } catch (e) { console.error("renderContactGate",e); }
  refreshUi();
}

// ------------------------------------------------------------
//  Real-time subscription
// ------------------------------------------------------------
onSnapshot(
  portfolioRef,
  (snap) => {
    if (!snap.exists()) {
      console.warn("[portfolio] /portfolio/satwinder is empty — keeping static fallback");
      return;
    }
    const data = snap.data() || {};
    renderAll(data);
    const p = data.profile || {};
    console.log(
      "[portfolio] live data applied",
      {
        mindsetTitle: p.mindsetTitle || "(default)",
        mindsetChars: (p.mindsetDescription || p.bio || "").length,
      }
    );
    document.body?.setAttribute("data-cms-live", "true");
  },
  (err) => {
    // Public read rule should make this very unlikely. If it fires
    // we keep the static HTML in place — the user still sees content.
    console.error("[portfolio] snapshot error:", err);
    reportCmsLog({
      level: "ERROR",
      category: "firestore",
      message: err?.message || String(err),
      stack: err?.stack || "",
      context: "portfolio.snapshot",
    });
  }
);

// ------------------------------------------------------------
//  Contact form → contact_submissions
// ------------------------------------------------------------
const CONTACT_RATE_MS = 60_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** EmailJS — admin notify + visitor auto-reply (satwinder777.github.io) */
const EMAILJS_CONFIG = {
  serviceId: "service_kdpuh4s",
  templateId: "template_ttjhute",
  autoReplyTemplateId: "template_uv3mgab",
  publicKey: "Sl5eEtFVuJ4NEqYYx",
};

const buildAdminEmailParams = (data) => ({
  from_name: data.name,
  reply_to: data.email,
  subject: data.subject,
  message: data.message,
  to_name: "Satwinder Singh",
  phone: data.phone?.trim() || "—",
  company: data.company?.trim() || "—",
  site_url: "https://satwinder777.github.io",
  year: String(new Date().getFullYear()),
});

/** Params for auto-reply → visitor (To Email in EmailJS = {{email}} or {{to_email}}) */
const buildAutoReplyParams = (data) => ({
  to_name: data.name,
  user_name: data.name,
  from_name: "Satwinder Singh",
  email: data.email,
  to_email: data.email,
  reply_to: data.email,
  subject: data.subject,
  inquiry_type: data.subject,
  site_url: "https://satwinder777.github.io",
  year: String(new Date().getFullYear()),
});

const emailjsSend = async (templateId, templateParams) => {
  const emailjs = globalThis.emailjs;
  if (!emailjs?.send) {
    console.warn("[contact] EmailJS SDK not loaded");
    return false;
  }
  await emailjs.send(
    EMAILJS_CONFIG.serviceId,
    templateId,
    templateParams,
    EMAILJS_CONFIG.publicKey
  );
  return true;
};

const sendContactEmail = async (data) => {
  try {
    await emailjsSend(EMAILJS_CONFIG.templateId, buildAdminEmailParams(data));
    console.log("[contact] EmailJS: admin notification sent");
    return true;
  } catch (err) {
    console.error("[contact] EmailJS admin failed:", err);
    reportCmsLog({
      level: "ERROR",
      category: "emailjs",
      message: err?.message || String(err),
      stack: err?.stack || "",
      context: "contact.emailjs.admin",
    });
    return false;
  }
};

const sendAutoReply = async (data) => {
  try {
    await emailjsSend(
      EMAILJS_CONFIG.autoReplyTemplateId,
      buildAutoReplyParams(data)
    );
    console.log("[contact] EmailJS: auto-reply sent to visitor");
    return true;
  } catch (err) {
    console.error("[contact] EmailJS auto-reply failed:", err);
    reportCmsLog({
      level: "WARN",
      category: "emailjs",
      message: err?.message || String(err),
      stack: err?.stack || "",
      context: "contact.emailjs.autoreply",
    });
    return false;
  }
};

const setFieldError = (field, msg) => {
  const wrap = document.querySelector(`.contact-field[data-field="${field}"]`);
  const err = document.getElementById(`error-${field}`);
  if (err) err.textContent = msg || "";
  wrap?.classList.toggle("contact-field--invalid", !!msg);
};

const contactFieldError = (field, data) => {
  switch (field) {
    case "name":
      return data.name.length < 2
        ? "Please enter your full name (at least 2 characters)."
        : "";
    case "email":
      return !EMAIL_RE.test(data.email) ? "Enter a valid email address." : "";
    case "phone":
      return data.phone && data.phone.replace(/\D/g, "").length < 8
        ? "Enter a valid phone number or leave blank."
        : "";
    case "subject":
      return !data.subject ? "Please select an inquiry type." : "";
    case "message":
      if (data.message.length < 10) {
        return "Tell me a bit more (at least 10 characters).";
      }
      if (data.message.length > 5000) {
        return "Message is too long (max 5000 characters).";
      }
      return "";
    default:
      return "";
  }
};

const readContactFormData = () => ({
  name: document.getElementById("name")?.value.trim() || "",
  email: document.getElementById("email")?.value.trim() || "",
  phone: document.getElementById("phone")?.value.trim() || "",
  company: document.getElementById("company")?.value.trim() || "",
  subject: document.getElementById("subject")?.value || "",
  message: document.getElementById("message")?.value.trim() || "",
});

const isContactFormValid = (data = readContactFormData()) =>
  !contactFieldError("name", data) &&
  !contactFieldError("email", data) &&
  !contactFieldError("phone", data) &&
  !contactFieldError("subject", data) &&
  !contactFieldError("message", data);

const showAllContactErrors = (data = readContactFormData()) => {
  ["name", "email", "phone", "subject", "message"].forEach((field) => {
    setFieldError(field, contactFieldError(field, data));
  });
};

function refreshContactFormUi() {
  const submitBtn = document.getElementById("submit-btn");
  const data = readContactFormData();
  const submitting = submitBtn?.dataset.submitting === "1";

  ["name", "email", "phone", "subject", "message"].forEach((field) => {
    const err = document.getElementById(`error-${field}`);
    if (!err?.textContent) return;
    setFieldError(field, contactFieldError(field, data));
  });

  if (submitBtn && !submitting) {
    submitBtn.disabled = !_contactFormEnabled || !isContactFormValid(data);
  }
}

function bindContactFormLiveUi() {
  const refresh = () => refreshContactFormUi();
  ["name", "email", "phone", "subject", "message"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", refresh);
    el.addEventListener("change", refresh);
  });
}

const clearContactErrors = () => {
  ["name", "email", "phone", "subject", "message"].forEach((f) => setFieldError(f, ""));
};

const validateContactForm = (data) => {
  showAllContactErrors(data);
  return isContactFormValid(data);
};

const initContactForm = () => {
  const form = document.getElementById("contact-form");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  bindContactFormLiveUi();
  bindShiftEnterSubmit(form, ["message"]);

  const statusDiv = document.getElementById("form-status");
  const messageEl = document.getElementById("message");
  const countEl = document.getElementById("message-count");
  const submitBtn = document.getElementById("submit-btn");

  const updateCount = () => {
    if (!countEl || !messageEl) return;
    countEl.textContent = `${messageEl.value.length} / 5000`;
  };
  messageEl?.addEventListener("input", updateCount);
  updateCount();
  refreshContactFormUi();

  const showStatus = (message, type) => {
    if (!statusDiv) return;
    statusDiv.classList.remove("hidden", "contact-status--success", "contact-status--error");
    statusDiv.classList.add(type === "error" ? "contact-status--error" : "contact-status--success");
    statusDiv.textContent = message;
    statusDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!_contactFormEnabled) {
      showStatus("Contact form is currently disabled. Use WhatsApp or email in the footer.", "error");
      return;
    }

    const honeypot = document.getElementById("company_website")?.value?.trim();
    if (honeypot) return;

    const lastSent = Number(localStorage.getItem("contact_last_sent") || 0);
    if (Date.now() - lastSent < CONTACT_RATE_MS) {
      showStatus("Please wait a minute before sending another message.", "error");
      return;
    }

    const data = readContactFormData();

    if (!validateContactForm(data)) {
      showStatus("Please fix the highlighted fields.", "error");
      return;
    }

    const labelEl = submitBtn?.querySelector(".contact-submit__label");
    const originalLabel = labelEl?.textContent || "Send Secure Message";
    if (submitBtn) {
      submitBtn.dataset.submitting = "1";
      submitBtn.disabled = true;
      if (labelEl) labelEl.textContent = "Sending…";
    }
    statusDiv?.classList.add("hidden");

    const payload = {
      name: data.name,
      email: data.email,
      type: data.subject,
      message: data.message,
      isRead: false,
      isArchived: false,
      source: "portfolio_web",
      submittedAt: serverTimestamp(),
    };
    if (data.phone) payload.phone = data.phone;
    if (data.company) payload.company = data.company;

    let dbOk = false;
    let emailOk = false;
    let autoReplyOk = false;

    try {
      await addDoc(submissionsCol, payload);
      dbOk = true;
      console.log("[contact] Firestore: saved to contact_submissions");
    } catch (err) {
      console.error("[contact] Firestore save failed:", err);
      reportCmsLog({
        level: "ERROR",
        category: "inbox",
        message: err?.message || String(err),
        stack: err?.stack || "",
        context: "contact.firestore",
      });
    }

    emailOk = await sendContactEmail(data);
    if (emailOk) {
      autoReplyOk = await sendAutoReply(data);
    }

    if (dbOk || emailOk) {
      localStorage.setItem("contact_last_sent", String(Date.now()));
      form.reset();
      updateCount();
      clearContactErrors();

      const autoNote = autoReplyOk
        ? " A confirmation email was sent to you."
        : "";

      if (dbOk && emailOk) {
        showStatus(
          `Message sent! Check your Gmail inbox — saved in Portfolio CMS (Inbox).${autoNote}`,
          "success"
        );
      } else if (emailOk) {
        showStatus(
          `Email sent to Gmail.${autoNote} Firestore backup failed — check rules.`,
          "success"
        );
      } else {
        showStatus(
          "Saved in Portfolio CMS Inbox, but Gmail email failed. Check browser console.",
          "success"
        );
      }
    } else {
      showStatus(
        "Could not send. Check Firestore rules and EmailJS, or use WhatsApp below.",
        "error"
      );
    }

    if (submitBtn) {
      submitBtn.dataset.submitting = "0";
      if (labelEl) labelEl.textContent = originalLabel;
      refreshContactFormUi();
    }
    refreshUi();
  });
};

const bootPortfolioUi = () => {
  initNavEffects();
  setupStatCards($("stats-container"));
  initFeedbackForm();
  watchFeedbackBoard();
  initContactForm();
  initContactNudge();
  console.info(
    "[portfolio] local preview ready",
    "| EmailJS:",
    !!globalThis.emailjs?.send,
    "| Firestore project: satwinder-portfolio"
  );
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootPortfolioUi);
} else {
  bootPortfolioUi();
}
