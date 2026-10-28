// ============================================================
//  admin/js/modules/site-content.js
//  Live Site Announcement Banner & Roadmap / Upcoming Features
// ============================================================

import { updatePortfolioField } from "../firebase-admin.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

export function renderSiteContent(container, state) {
  const portfolio = state.portfolio || {};
  let banner = portfolio.siteBanner || {
    enabled: false,
    message: "This portfolio is being actively upgraded with new features and architectural improvements.",
    developerName: "Satwinder Singh"
  };

  let sectionVisibility = {
    about: true,
    stats: true,
    skills: true,
    expertise: true,
    experience: true,
    projects: true,
    contributors: true,
    upcoming: true,
    feedback: true,
    contact: true,
    resume: true,
    banner: true,
    ...(portfolio.sectionVisibility || {})
  };

  const SECTIONS_CONFIG = [
    { key: "about", icon: "👤", title: "Hero & Mindset", desc: "Hero bio, avatar, and Engineering Mindset narrative block" },
    { key: "stats", icon: "📊", title: "Metrics & Stats Row", desc: "Production apps, crash-free rate, and rendering performance" },
    { key: "skills", icon: "⚡", title: "Technical Skills Arsenal", desc: "Interactive categorized skill chips and domain stacks" },
    { key: "expertise", icon: "🎯", title: "Core Capabilities Cards", desc: "Architecture, rendering performance, and engineering cards" },
    { key: "experience", icon: "💼", title: "Career Timeline", desc: "Chronological roles, milestone accomplishments and dates" },
    { key: "projects", icon: "🚀", title: "Featured Work & Projects", desc: "Interactive mobile and web project showcase cards" },
    { key: "contributors", icon: "👥", title: "Contributors & Team", desc: "Open-source collaborators and co-creator profile cards" },
    { key: "upcoming", icon: "🗺️", title: "Roadmap & Upcoming", desc: "Forward-looking feature milestones and ETA cards" },
    { key: "feedback", icon: "💬", title: "Signal Feedback Wall", desc: "Approved public feedback and visitor suggestions" },
    { key: "contact", icon: "📬", title: "Contact & Hire Gateway", desc: "Direct lead generation form and client inquiry pipeline" },
    { key: "resume", icon: "📄", title: "Download CV / Resume", desc: "Hero CTA button and public PDF download link" },
    { key: "banner", icon: "📢", title: "Announcement Marquee", desc: "Live ticker banner broadcast across website header" },
  ];

  let features = Array.isArray(portfolio.upcomingFeatures) ? [...portfolio.upcomingFeatures] : [];

  const renderView = () => {
    const activeCount = Object.values(sectionVisibility).filter(v => v !== false).length;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Features &amp; Section Visibility</h1>
          <p class="view-subtitle">Master switches to activate, deactivate, or hide any portfolio feature, section, or roadmap cell live.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" id="save-banner-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Banner Settings
          </button>
        </div>
      </div>

      <!-- Master Feature & Section Visibility Matrix -->
      <div class="card-box" style="margin-bottom: 28px;">
        <div class="card-box-header">
          <div class="card-box-title-wrap">
            <div class="card-header-icon-box" style="background: rgba(0, 217, 255, 0.15); color: #00d9ff; border-color: rgba(0, 217, 255, 0.3);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div>
              <h3>Master Feature &amp; Section Visibility</h3>
              <p class="card-desc">Instantly toggle any main portfolio section or component active/inactive on the live website.</p>
            </div>
          </div>
          <span class="badge badge-info" id="active-sections-counter">${activeCount} / ${SECTIONS_CONFIG.length} Features Active</span>
        </div>

        <div class="section-vis-grid">
          ${SECTIONS_CONFIG.map(sec => {
            const isAct = sectionVisibility[sec.key] !== false;
            return `
              <div class="section-vis-card ${isAct ? "" : "is-off"}" data-sec="${sec.key}">
                <div class="section-vis-info">
                  <div class="section-vis-icon">${sec.icon}</div>
                  <div class="section-vis-text">
                    <h4>${escapeHtml(sec.title)}</h4>
                    <p>${escapeHtml(sec.desc)}</p>
                  </div>
                </div>
                <div class="section-vis-toggle-wrap">
                  <span class="section-vis-status ${isAct ? "is-live" : "is-hidden"}">
                    ${isAct ? "LIVE" : "HIDDEN"}
                  </span>
                  <label class="switch">
                    <input type="checkbox" class="section-vis-checkbox" data-sec="${sec.key}" ${isAct ? "checked" : ""}>
                    <span class="slider round"></span>
                  </label>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <!-- Live Top Announcement Banner -->
      <div class="card-box" style="margin-bottom: 24px;">
        <div class="card-box-header">
          <div class="card-box-title-wrap">
            <div class="card-header-icon-box" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            </div>
            <div>
              <h3>Live Announcement Banner</h3>
              <p class="card-desc">Top-of-page interactive ticker displayed across the portfolio website.</p>
            </div>
          </div>
          <label class="switch-row">
            <span>Banner Broadcast</span>
            <label class="switch">
              <input type="checkbox" id="banner-enabled" ${banner.enabled ? "checked" : ""}>
              <span class="slider round"></span>
            </label>
          </label>
        </div>

        <div class="form-grid" style="margin-top: 16px;">
          <div class="form-group full-width">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label for="banner-msg">Banner Message Content</label>
              <div class="quick-preset-chips">
                <span class="preset-label">Quick Presets:</span>
                <button type="button" class="preset-chip" data-text="🚀 SatwinderX Web Admin v2.4 Launched! Interactive experience and real-time CMS live.">Portfolio v2.4</button>
                <button type="button" class="preset-chip" data-text="⚡ Actively exploring Principal & Senior Flutter / Mobile Architecture roles. Open for discussions!">Hiring Available</button>
                <button type="button" class="preset-chip" data-text="🛠 Site undergoing minor performance optimizations and WebGL canvas tuning.">Maintenance</button>
              </div>
            </div>
            <textarea id="banner-msg" class="form-textarea" rows="2" placeholder="Announcement text displayed in the marquee ticker...">${escapeHtml(banner.message || "")}</textarea>
          </div>
          <div class="form-group">
            <label for="banner-dev">Developer Signature / Name</label>
            <input type="text" id="banner-dev" class="form-input" value="${escapeHtml(banner.developerName || "Satwinder Singh")}">
          </div>
        </div>

        <div class="banner-preview-box" style="margin-top: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="preview-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Live Marquee Ticker Simulation:
            </span>
            <span class="badge ${banner.enabled ? "badge-success" : "badge-neutral"}" id="banner-status-badge">
              ${banner.enabled ? "LIVE ON PRODUCTION" : "BROADCAST DISABLED"}
            </span>
          </div>

          <div class="live-banner-demo ${banner.enabled ? "is-active" : "is-inactive"}">
            <span class="banner-live-dot"></span>
            <span class="banner-live-text">${escapeHtml(banner.message || "(No message entered)")}</span>
            <span class="banner-live-by">— ${escapeHtml(banner.developerName || "Satwinder Singh")}</span>
          </div>
        </div>
      </div>

      <!-- Upcoming Features Roadmap -->
      <div class="card-box">
        <div class="card-box-header">
          <div class="card-box-title-wrap">
            <div class="card-header-icon-box" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border-color: rgba(16, 185, 129, 0.3);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
              <h3>Upcoming Features Roadmap</h3>
              <p class="card-desc">Showcase in-progress capabilities, architectural milestones, and upcoming demos.</p>
            </div>
          </div>
          <button class="btn btn-secondary" id="add-feature-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Roadmap Item
          </button>
        </div>

        <div class="features-roadmap-grid" style="margin-top: 18px;">
          ${features.length === 0 ? `
            <div class="empty-state-sm full-width" style="text-align: center; padding: 32px 16px;">
              <p style="color: var(--text-muted); margin-bottom: 12px;">No roadmap milestones configured.</p>
              <button class="btn btn-sm btn-secondary" id="btn-seed-roadmap">Add Sample Roadmap Items</button>
            </div>
          ` : features.map((feat, idx) => `
            <div class="roadmap-admin-card ${feat.visible === false ? "is-inactive-card" : ""}" data-idx="${idx}">
              <div class="roadmap-top">
                <div class="roadmap-icon-pod">${escapeHtml(feat.icon || "✨")}</div>
                <div class="roadmap-info">
                  <h4>${escapeHtml(feat.title)}</h4>
                  <div style="display:flex; gap:6px; align-items:center;">
                    <span class="badge badge-info" style="font-size: 0.72rem;">${escapeHtml(feat.eta ? `Target: ${feat.eta}` : "In Development")}</span>
                    ${feat.visible === false ? `<span class="badge badge-neutral" style="font-size: 0.7rem;">HIDDEN</span>` : ""}
                  </div>
                </div>
                <div class="right-actions">
                  <button class="btn-toggle-vis toggle-feat-vis-btn ${feat.visible !== false ? "is-active" : "is-inactive"}" data-idx="${idx}" title="${feat.visible !== false ? "Active on public roadmap (click to hide)" : "Hidden from public roadmap (click to show)"}">
                    <span class="status-pulse-dot" style="background: ${feat.visible !== false ? "#10b981" : "#64748b"};"></span>
                    <span>${feat.visible !== false ? "Active" : "Hidden"}</span>
                  </button>
                  <button class="btn-icon edit-feat-btn" data-idx="${idx}" title="Edit Feature">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                  <button class="btn-icon del-feat-btn" data-idx="${idx}" title="Delete Feature">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
              <p class="roadmap-desc">${escapeHtml(feat.description || "No description provided.")}</p>
              <div class="roadmap-bottom-reorder">
                <div class="reorder-group">
                  <button class="btn-icon move-feat-up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Move Up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button class="btn-icon move-feat-down" data-idx="${idx}" ${idx === features.length - 1 ? "disabled" : ""} title="Move Down">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>
                <span style="font-size: 0.72rem; color: var(--text-muted);">Step #${idx + 1}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // Listeners
    container.querySelector("#banner-enabled")?.addEventListener("change", async (e) => {
      banner.enabled = e.target.checked;
      const demo = container.querySelector(".live-banner-demo");
      const badge = container.querySelector("#banner-status-badge");
      if (demo) {
        demo.classList.toggle("is-active", banner.enabled);
        demo.classList.toggle("is-inactive", !banner.enabled);
      }
      if (badge) {
        badge.className = `badge ${banner.enabled ? "badge-success" : "badge-neutral"}`;
        badge.textContent = banner.enabled ? "LIVE ON PRODUCTION" : "BROADCAST DISABLED";
      }
      try {
        await updatePortfolioField("siteBanner", banner);
        state.portfolio.siteBanner = banner;
        toast.success(banner.enabled ? "Banner enabled live on production!" : "Banner broadcast disabled.");
      } catch (err) {
        toast.warning("Local toggle updated, remember to click 'Save Banner Settings'.");
      }
    });

    container.querySelector("#banner-msg")?.addEventListener("input", (e) => {
      banner.message = e.target.value;
      const textEl = container.querySelector(".banner-live-text");
      if (textEl) textEl.textContent = banner.message;
    });

    container.querySelector("#banner-dev")?.addEventListener("input", (e) => {
      banner.developerName = e.target.value;
      const byEl = container.querySelector(".banner-live-by");
      if (byEl) byEl.textContent = `— ${banner.developerName}`;
    });

    // Preset chips
    container.querySelectorAll(".preset-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const text = chip.dataset.text;
        const msgEl = container.querySelector("#banner-msg");
        if (msgEl) {
          msgEl.value = text;
          banner.message = text;
          const textDemo = container.querySelector(".banner-live-text");
          if (textDemo) textDemo.textContent = text;
          toast.info("Applied preset text!");
        }
      });
    });

    container.querySelector("#save-banner-btn")?.addEventListener("click", async () => {
      banner.enabled = container.querySelector("#banner-enabled").checked;
      banner.message = container.querySelector("#banner-msg").value.trim();
      banner.developerName = container.querySelector("#banner-dev").value.trim();

      try {
        await updatePortfolioField("siteBanner", banner);
        state.portfolio.siteBanner = banner;
        toast.success("Site Announcement Banner settings saved!");
      } catch (e) {
        toast.error("Failed to save banner: " + e.message);
      }
    });

    // Roadmap seed helper
    container.querySelector("#btn-seed-roadmap")?.addEventListener("click", () => {
      features = [
        {
          title: "Offline AI Vector Search",
          description: "Embedded on-device vector embedding index for sub-5ms portfolio search without network calls.",
          icon: "🧠",
          eta: "Q4 2026",
          visible: true
        },
        {
          title: "Interactive 3D Device Frames",
          description: "Interactive Three.js / WebGL mobile device renders to interact directly with demo apps inside the browser.",
          icon: "📱",
          eta: "Q1 2027",
          visible: true
        }
      ];
      saveFeatures(features);
    });

    // Section visibility checkbox toggles with instant live sync
    container.querySelectorAll(".section-vis-checkbox").forEach(chk => {
      chk.addEventListener("change", async (e) => {
        const key = chk.dataset.sec;
        const enabled = e.target.checked;
        sectionVisibility[key] = enabled;
        state.portfolio.sectionVisibility = sectionVisibility;

        const card = container.querySelector(`.section-vis-card[data-sec="${key}"]`);
        if (card) {
          card.classList.toggle("is-off", !enabled);
          const st = card.querySelector(".section-vis-status");
          if (st) {
            st.className = `section-vis-status ${enabled ? "is-live" : "is-hidden"}`;
            st.textContent = enabled ? "LIVE" : "HIDDEN";
          }
        }
        const counterEl = container.querySelector("#active-sections-counter");
        if (counterEl) {
          const count = Object.values(sectionVisibility).filter(v => v !== false).length;
          counterEl.textContent = `${count} / ${SECTIONS_CONFIG.length} Features Active`;
        }

        try {
          await updatePortfolioField("sectionVisibility", sectionVisibility);
          toast.success(enabled ? `"${key.toUpperCase()}" feature active on website!` : `"${key.toUpperCase()}" feature deactivated (hidden).`);
        } catch (err) {
          toast.error("Failed to update visibility: " + err.message);
        }
      });
    });

    // Roadmap Features
    container.querySelector("#add-feature-btn")?.addEventListener("click", () => openFeatureEditor(null));

    // Roadmap active/inactive toggle
    container.querySelectorAll(".toggle-feat-vis-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (features[idx]) {
          features[idx].visible = features[idx].visible === false ? true : false;
          await saveFeatures(features);
          toast.success(features[idx].visible ? `"${features[idx].title}" activated on roadmap!` : `"${features[idx].title}" hidden from roadmap.`);
          renderView();
        }
      });
    });

    container.querySelectorAll(".edit-feat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        openFeatureEditor(features[idx], idx);
      });
    });

    container.querySelectorAll(".del-feat-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const ok = await modal.confirm({
          title: "Delete Feature?",
          message: `Delete "${features[idx]?.title || "Item"}" from roadmap?`,
          isDanger: true
        });
        if (ok) {
          features.splice(idx, 1);
          saveFeatures(features);
        }
      });
    });

    container.querySelectorAll(".move-feat-up").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (idx > 0) {
          const temp = features[idx];
          features[idx] = features[idx - 1];
          features[idx - 1] = temp;
          saveFeatures(features);
        }
      });
    });

    container.querySelectorAll(".move-feat-down").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (idx < features.length - 1) {
          const temp = features[idx];
          features[idx] = features[idx + 1];
          features[idx + 1] = temp;
          saveFeatures(features);
        }
      });
    });
  };

  const saveFeatures = async (newFeatures) => {
    try {
      await updatePortfolioField("upcomingFeatures", newFeatures);
      state.portfolio.upcomingFeatures = newFeatures;
      features = newFeatures;
      toast.success("Roadmap updated successfully!");
      renderView();
    } catch (e) {
      toast.error("Failed to save roadmap: " + e.message);
    }
  };

  const openFeatureEditor = (cur, idx) => {
    const isNew = cur === null;
    const f = cur || {
      title: "",
      description: "",
      icon: "✨",
      eta: "Q4 2026",
      visible: true,
      order: features.length
    };

    const modalBodyHtml = `
      <form id="feat-form" class="editor-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="f-ftitle">Feature Title *</label>
            <input type="text" id="f-ftitle" class="form-input" required value="${escapeHtml(f.title)}" placeholder="e.g. Offline Vector Search">
          </div>
          <div class="form-group">
            <label for="f-ficon">Emoji / Icon</label>
            <input type="text" id="f-ficon" class="form-input" value="${escapeHtml(f.icon)}" placeholder="✨ or 🚀">
          </div>
          <div class="form-group">
            <label for="f-feta">Target ETA</label>
            <input type="text" id="f-feta" class="form-input" value="${escapeHtml(f.eta)}" placeholder="e.g. Q4 2026, Next Release">
          </div>
          <div class="form-group full-width">
            <label for="f-fdesc">Description</label>
            <textarea id="f-fdesc" class="form-textarea" rows="4" placeholder="Brief outline of the technical capability...">${escapeHtml(f.description)}</textarea>
          </div>
          <div class="form-group full-width">
            <label class="switch-row">
              <div>
                <strong style="color: var(--text-primary); font-size: 13px;">Active on Public Roadmap</strong>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">Toggle whether this feature appears on the live website roadmap.</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="f-fvis" ${f.visible !== false ? "checked" : ""}>
                <span class="slider round"></span>
              </label>
            </label>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" id="modal-feat-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-feat-save">${isNew ? "Add Feature" : "Save Changes"}</button>
    `;

    const modalEl = modal.open({
      title: isNew ? "Add Roadmap Feature" : `Edit: ${f.title}`,
      bodyHtml: modalBodyHtml,
      footerHtml,
      size: "sm"
    });

    modalEl.querySelector("#modal-feat-cancel").addEventListener("click", () => modal.close());

    modalEl.querySelector("#modal-feat-save").addEventListener("click", () => {
      const title = modalEl.querySelector("#f-ftitle").value.trim();
      if (!title) {
        toast.error("Title is required.");
        return;
      }

      const updated = {
        ...f,
        title,
        icon: modalEl.querySelector("#f-ficon").value.trim() || "✨",
        eta: modalEl.querySelector("#f-feta").value.trim(),
        description: modalEl.querySelector("#f-fdesc").value.trim(),
        visible: modalEl.querySelector("#f-fvis")?.checked ?? true
      };

      if (isNew) {
        features.push(updated);
      } else {
        features[idx] = updated;
      }

      modal.close();
      saveFeatures(features);
    });
  };

  renderView();
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
