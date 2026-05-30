// ============================================================
//  portfolio.js
//  Renders /portfolio/satwinder onto satwinder777.github.io in
//  real time, handles the contact form, and runs all the
//  cosmetic UI animations (cursor, reveal, year, lucide icons).
// ============================================================

import {
  portfolioRef,
  submissionsCol,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "./firebase.js";

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
  const d = raw.toDate
    ? raw.toDate()
    : raw.seconds
    ? new Date(raw.seconds * 1000)
    : new Date(raw);
  if (isNaN(d.getTime())) return "";
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

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
  el.innerHTML = list
    .map(
      (s) => `
        <div class="glass-card p-6 rounded-2xl">
          ${s.icon ? `<div class="text-2xl mb-2" aria-hidden="true">${esc(s.icon)}</div>` : ""}
          <div class="text-3xl font-display font-bold gradient-text mb-2">${esc(s.value)}</div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider">${esc(s.label)}</div>
        </div>`
    )
    .join("");
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

  // If admin used real categories, highlight the first chip per
  // category. Otherwise (everything is "other") fall back to a
  // position-based highlight rotation so the chip row keeps the
  // same coloured rhythm as the static design.
  const usedCategorisation = list.some((s) => s.category && s.category !== "other");
  const ROTATION = ["frontend", "architecture", "devops", "backend"];

  const seenCat = new Set();
  let posLeader = 0;

  el.innerHTML = list
    .map((s, i) => {
      let key = "other";
      if (usedCategorisation) {
        const cat = s.category || "other";
        if (cat !== "other" && !seenCat.has(cat)) {
          seenCat.add(cat);
          key = cat;
        }
      } else if (i % 4 === 0 && posLeader < ROTATION.length) {
        key = ROTATION[posLeader++];
      }
      const cls = ACCENT[key] || ACCENT.other;
      return `<span class="px-5 py-2.5 rounded-full border ${cls} interactive skill-tag" data-skill="${esc(s.label)}">${esc(s.label)}</span>`;
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
}

function renderAll(data) {
  try { renderProfile(data.profile);                              } catch (e) { console.error("renderProfile",   e); }
  try { renderStats(data.stats);                                  } catch (e) { console.error("renderStats",     e); }
  try { renderArsenal(data.technicalArsenal || data.skills);      } catch (e) { console.error("renderArsenal",   e); }
  try { renderExpertise(data.expertise);                          } catch (e) { console.error("renderExpertise", e); }
  try { renderExperience(data.experience);                        } catch (e) { console.error("renderExperience",e); }
  try { renderProjects(data.projects);                            } catch (e) { console.error("renderProjects",  e); }
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
    return false;
  }
};

const setFieldError = (field, msg) => {
  const wrap = document.querySelector(`.contact-field[data-field="${field}"]`);
  const err = document.getElementById(`error-${field}`);
  if (err) err.textContent = msg || "";
  wrap?.classList.toggle("contact-field--invalid", !!msg);
};

const clearContactErrors = () => {
  ["name", "email", "phone", "subject", "message"].forEach((f) => setFieldError(f, ""));
};

const validateContactForm = (data) => {
  clearContactErrors();
  let ok = true;

  if (data.name.length < 2) {
    setFieldError("name", "Please enter your full name (at least 2 characters).");
    ok = false;
  }
  if (!EMAIL_RE.test(data.email)) {
    setFieldError("email", "Enter a valid email address.");
    ok = false;
  }
  if (data.phone && data.phone.replace(/\D/g, "").length < 8) {
    setFieldError("phone", "Enter a valid phone number or leave blank.");
    ok = false;
  }
  if (!data.subject) {
    setFieldError("subject", "Please select an inquiry type.");
    ok = false;
  }
  if (data.message.length < 10) {
    setFieldError("message", "Tell me a bit more (at least 10 characters).");
    ok = false;
  }
  if (data.message.length > 5000) {
    setFieldError("message", "Message is too long (max 5000 characters).");
    ok = false;
  }
  return ok;
};

const initContactForm = () => {
  const form = document.getElementById("contact-form");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  const statusDiv = document.getElementById("form-status");
  const messageEl = document.getElementById("message");
  const countEl = document.getElementById("message-count");

  const updateCount = () => {
    if (!countEl || !messageEl) return;
    countEl.textContent = `${messageEl.value.length} / 5000`;
  };
  messageEl?.addEventListener("input", updateCount);
  updateCount();

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

    const data = {
      name: document.getElementById("name")?.value.trim() || "",
      email: document.getElementById("email")?.value.trim() || "",
      phone: document.getElementById("phone")?.value.trim() || "",
      company: document.getElementById("company")?.value.trim() || "",
      subject: document.getElementById("subject")?.value || "",
      message: document.getElementById("message")?.value.trim() || "",
    };

    if (!validateContactForm(data)) {
      showStatus("Please fix the highlighted fields.", "error");
      return;
    }

    const submitBtn = document.getElementById("submit-btn");
    const labelEl = submitBtn?.querySelector(".contact-submit__label");
    const originalLabel = labelEl?.textContent || "Send Secure Message";
    if (submitBtn) {
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
      submitBtn.disabled = false;
      if (labelEl) labelEl.textContent = originalLabel;
    }
    refreshUi();
  });
};

const bootPortfolioUi = () => {
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
