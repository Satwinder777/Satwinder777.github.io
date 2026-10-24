// ============================================================
//  admin/js/modules/profile.js
//  Profile, Hero Info, Mindset, Availability & Stats Manager
// ============================================================

import { updatePortfolioField } from "../firebase-admin.js";
import { uploadToSupabase } from "../supabase.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderProfile(container, state, appRouter) {
  const portfolio = state.portfolio || {};
  let profile = { ...(portfolio.profile || {}) };

  // Normalize stats to an array of objects with visibility flags
  let stats = Array.isArray(portfolio.stats)
    ? portfolio.stats.map((s, idx) => ({
        icon: s.icon || "📱",
        value: s.value || "",
        label: s.label || "",
        visible: s.visible !== false,
        order: typeof s.order === "number" ? s.order : idx
      }))
    : [
        { icon: "📱", value: "10+", label: "Production Apps", visible: true, order: 0 },
        { icon: "⏳", value: "3+", label: "Years Experience", visible: true, order: 1 },
        { icon: "✅", value: "99.9%", label: "Crash-Free Rate", visible: true, order: 2 },
        { icon: "⚡", value: "60+", label: "FPS Rendering", visible: true, order: 3 },
        { icon: "🚀", value: "40%", label: "Perf Improved", visible: true, order: 4 },
        { icon: "🌐", value: "5+", label: "Industry Domains", visible: true, order: 5 },
      ];

  // Normalize socialLinks to a structured object matching SocialLinkModel
  const rawSocials = portfolio.socialLinks || {};
  let socialLinks = Array.isArray(rawSocials)
    ? rawSocials.reduce((acc, cur) => {
        if (cur.platform) acc[cur.platform.toLowerCase()] = cur.url || "";
        return acc;
      }, {})
    : { ...rawSocials };

  const defaultSocials = {
    github: socialLinks.github || "https://github.com/satwinder777",
    linkedin: socialLinks.linkedin || "https://linkedin.com/in/satwinder777",
    whatsapp: socialLinks.whatsapp || "",
    instagram: socialLinks.instagram || "",
    email: socialLinks.email || "satwinder88721@gmail.com",
    showGithub: socialLinks.showGithub !== false,
    showLinkedin: socialLinks.showLinkedin !== false,
    showWhatsapp: socialLinks.showWhatsapp !== false,
    showInstagram: socialLinks.showInstagram !== false,
    showEmail: socialLinks.showEmail !== false,
  };
  socialLinks = defaultSocials;

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Profile & Personal Brand</h1>
        <p class="view-subtitle">Manage hero identity, media assets, highlight badges, and social channels with live visibility switches.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" id="save-profile-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span>Save All Changes</span>
        </button>
      </div>
    </div>

    <div class="profile-layout">
      <!-- Left Column: Core Identity, Mindset & Highlight Badges -->
      <div class="profile-main">
        <!-- 1. Hero Identity Card -->
        <div class="card-box">
          <div class="card-box-header">
            <div class="card-box-title-wrap">
              <span class="card-header-icon">👤</span>
              <div>
                <h3>Hero Identity</h3>
                <p class="card-desc">Your primary name, title, and introduction displayed across the portfolio hero section.</p>
              </div>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="prof-name">Full Name</label>
              <input type="text" id="prof-name" class="form-input" value="${escapeHtml(profile.name || "Satwinder Singh")}" placeholder="e.g. Satwinder Singh">
            </div>

            <div class="form-group">
              <label for="prof-title">Professional Title</label>
              <input type="text" id="prof-title" class="form-input" value="${escapeHtml(profile.title || "Senior Flutter Engineer & System Architect")}" placeholder="e.g. Senior Flutter Engineer">
            </div>

            <div class="form-group full-width">
              <label for="prof-tagline">Hero Headline / Tagline</label>
              <input type="text" id="prof-tagline" class="form-input" value="${escapeHtml(profile.tagline || "")}" placeholder="e.g. I architect high-performance mobile applications.">
            </div>

            <div class="form-group full-width">
              <label for="prof-bio">Short Bio (Hero subline)</label>
              <textarea id="prof-bio" class="form-textarea" rows="2" placeholder="Brief intro appearing under headline...">${escapeHtml(profile.bio || "")}</textarea>
            </div>
          </div>
        </div>

        <!-- 2. Engineering Mindset Section -->
        <div class="card-box">
          <div class="card-box-header">
            <div class="card-box-title-wrap">
              <span class="card-header-icon">🧠</span>
              <div>
                <h3>Engineering Mindset / About Section</h3>
                <p class="card-desc">Detailed architecture philosophies and engineering standards shown in the About section.</p>
              </div>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="prof-mindset-title">Section Heading</label>
              <input type="text" id="prof-mindset-title" class="form-input" value="${escapeHtml(profile.mindsetTitle || "Engineering Mindset")}">
            </div>

            <div class="form-group full-width">
              <label for="prof-mindset-desc">Mindset Description (Separate paragraphs with blank lines)</label>
              <textarea id="prof-mindset-desc" class="form-textarea" rows="6" placeholder="Describe your architectural philosophies, performance focus, etc.">${escapeHtml(profile.mindsetDescription || "")}</textarea>
            </div>
          </div>
        </div>

        <!-- 3. Key Metric Highlight Badges (Active / Inactive Controls) -->
        <div class="card-box">
          <div class="card-box-header">
            <div class="card-box-title-wrap">
              <span class="card-header-icon">⚡</span>
              <div>
                <h3>Highlight Badges & Metric Counters</h3>
                <p class="card-desc">Metric pills displayed on hero. Toggle any badge Active or Inactive to show/hide on your portfolio.</p>
              </div>
            </div>
            <button class="btn btn-sm btn-secondary" id="add-stat-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Add Badge</span>
            </button>
          </div>

          <div class="stats-manager-grid" id="stats-list">
            <!-- Rendered by renderStatsList -->
          </div>
        </div>
      </div>

      <!-- Right Column: Visual Media Assets, Status & Social Channels -->
      <div class="profile-aside">
        <!-- 4. Visual Media & Brand Assets Card -->
        <div class="card-box">
          <div class="card-box-header">
            <div class="card-box-title-wrap">
              <span class="card-header-icon">🖼️</span>
              <div>
                <h3>Visual Media & Assets</h3>
                <p class="card-desc">Upload your avatar and brand logo with direct storage sync.</p>
              </div>
            </div>
          </div>

          <!-- Avatar / Memoji Section -->
          <div class="media-asset-section">
            <div class="media-asset-label">Profile Avatar / Memoji</div>
            <div class="avatar-hero-card">
              <div class="avatar-frame-wrap" id="avatar-frame">
                <img id="avatar-img-preview" src="${escapeHtml(profile.avatarUrl || "../assets/avatar.png")}" alt="Profile Avatar" class="avatar-img-view" onerror="this.src='https://ui-avatars.com/api/?name=Satwinder+Singh&background=00d9ff&color=050814&bold=true'">
                <div class="avatar-upload-overlay" id="btn-trigger-avatar-upload" title="Upload new photo / Memoji">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <span>Upload</span>
                </div>
              </div>
              <div class="avatar-asset-details">
                <div class="avatar-asset-title">Main Profile Photo</div>
                <div class="avatar-asset-hint">Recommended square PNG or JPG, up to 5MB.</div>
                <div class="avatar-asset-actions">
                  <button type="button" class="btn btn-sm btn-secondary" id="btn-upload-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>Upload Image</span>
                  </button>
                  <button type="button" class="btn-text-action" id="btn-toggle-avatar-url">Custom URL</button>
                </div>
              </div>
            </div>

            <input type="file" id="avatar-file-input" accept="image/*" style="display: none;">
            
            <div class="media-url-drawer" id="avatar-url-drawer" style="display: none;">
              <input type="url" id="prof-avatar-url" class="form-input form-input-sm" value="${escapeHtml(profile.avatarUrl || "")}" placeholder="Paste direct image URL (https://...)">
            </div>
          </div>

          <div class="media-divider"></div>

          <!-- Brand Logo Section -->
          <div class="media-asset-section">
            <div class="media-asset-label">Brand Mark / Site Logo</div>
            <div class="logo-hero-card">
              <div class="logo-frame-wrap" id="logo-frame">
                <img id="logo-img-preview" src="${escapeHtml(profile.logoUrl || "")}" alt="Brand Logo" class="logo-img-view" onerror="this.style.display='none'; document.getElementById('logo-placeholder').style.display='flex';">
                <div class="logo-placeholder" id="logo-placeholder" style="${profile.logoUrl ? "display:none;" : "display:flex;"}">SX</div>
              </div>
              <div class="avatar-asset-details">
                <div class="avatar-asset-title">Nav Brand Mark</div>
                <div class="avatar-asset-hint">Displayed in site top navigation and mobile header.</div>
                <div class="avatar-asset-actions">
                  <button type="button" class="btn btn-sm btn-secondary" id="btn-upload-logo">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>Upload Logo</span>
                  </button>
                  <button type="button" class="btn-text-action" id="btn-toggle-logo-url">Custom URL</button>
                </div>
              </div>
            </div>

            <input type="file" id="logo-file-input" accept="image/*" style="display: none;">

            <div class="media-url-drawer" id="logo-url-drawer" style="display: none;">
              <input type="url" id="prof-logo-url" class="form-input form-input-sm" value="${escapeHtml(profile.logoUrl || "")}" placeholder="Paste direct logo URL (https://...)">
            </div>
          </div>
        </div>

        <!-- 5. Availability Status Pill -->
        <div class="card-box">
          <div class="card-box-header">
            <div class="card-box-title-wrap">
              <span class="card-header-icon">🟢</span>
              <div>
                <h3>Availability Status</h3>
                <p class="card-desc">Toggle your hire availability badge on the public portfolio header.</p>
              </div>
            </div>
          </div>
          <div class="form-group">
            <div class="switch-row-custom">
              <div class="switch-row-text">
                <span class="switch-main-label">Open for Senior Roles</span>
                <span class="switch-sub-label" id="avail-status-tag">${profile.availability !== false ? "Active on Portfolio" : "Disabled (Hidden)"}</span>
              </div>
              <label class="switch">
                <input type="checkbox" id="prof-availability" ${profile.availability !== false ? "checked" : ""}>
                <span class="slider round"></span>
              </label>
            </div>
          </div>
          <div class="form-group" style="margin-top: 14px;">
            <label for="prof-avail-text">Status Pill Text</label>
            <input type="text" id="prof-avail-text" class="form-input" value="${escapeHtml(profile.availabilityText || "Available for Senior Roles")}">
          </div>
        </div>

        <!-- 6. Social Profiles Hub with Active / Inactive Switches -->
        <div class="card-box">
          <div class="card-box-header">
            <div class="card-box-title-wrap">
              <span class="card-header-icon">🌐</span>
              <div>
                <h3>Social Profiles & Channels</h3>
                <p class="card-desc">Individual channel controls. Use the switch to make any profile Active or Inactive on the live site.</p>
              </div>
            </div>
          </div>
          <div class="social-channels-list" id="social-channels-list">
            <!-- Rendered by renderSocialChannels -->
          </div>
        </div>
      </div>
    </div>
  `;

  // ============================================================
  //  Render Highlight Badges (Stats) List
  // ============================================================
  const renderStatsList = () => {
    const listEl = container.querySelector("#stats-list");
    if (!listEl) return;

    if (stats.length === 0) {
      listEl.innerHTML = `
        <div class="stats-empty-state">
          <span>No highlight badges configured.</span>
          <button class="btn btn-sm btn-primary" id="empty-add-stat-btn">+ Add First Badge</button>
        </div>
      `;
      listEl.querySelector("#empty-add-stat-btn")?.addEventListener("click", () => {
        stats.push({ icon: "🚀", value: "10+", label: "New Metric", visible: true, order: stats.length });
        renderStatsList();
      });
      return;
    }

    listEl.innerHTML = stats.map((st, idx) => `
      <div class="stat-badge-card ${st.visible ? "active-badge" : "inactive-badge"}" data-index="${idx}">
        <!-- Top row: Status Switch, Icon, & Ordering -->
        <div class="stat-badge-header">
          <div class="stat-badge-left">
            <div class="stat-icon-badge" title="Click to change icon">${escapeHtml(st.icon || "📱")}</div>
            <div class="stat-status-badge ${st.visible ? "status-live" : "status-hidden"}">
              ${st.visible ? "● Active on Site" : "○ Inactive (Hidden)"}
            </div>
          </div>
          <div class="stat-badge-controls">
            <label class="switch switch-sm" title="Toggle visibility on portfolio">
              <input type="checkbox" class="stat-visibility-toggle" data-index="${idx}" ${st.visible ? "checked" : ""}>
              <span class="slider round"></span>
            </label>
            <button type="button" class="btn-icon-subtle move-up-stat" data-index="${idx}" ${idx === 0 ? "disabled" : ""} title="Move up">▲</button>
            <button type="button" class="btn-icon-subtle move-down-stat" data-index="${idx}" ${idx === stats.length - 1 ? "disabled" : ""} title="Move down">▼</button>
            <button type="button" class="btn-icon-subtle delete-stat-btn" data-index="${idx}" title="Delete badge">✕</button>
          </div>
        </div>

        <!-- Live Portfolio Card Simulation Preview -->
        <div class="stat-preview-pod ${st.visible ? "" : "pod-dimmed"}">
          <div class="stat-preview-val">${escapeHtml(st.value || "0")}</div>
          <div class="stat-preview-lbl">${escapeHtml(st.label || "Metric Label")}</div>
        </div>

        <!-- Inputs Row -->
        <div class="stat-inputs-grid">
          <div class="form-group-compact">
            <label>Icon / Emoji</label>
            <input type="text" class="form-input form-input-sm stat-icon-input" value="${escapeHtml(st.icon || "📱")}" placeholder="📱" maxlength="4">
          </div>
          <div class="form-group-compact">
            <label>Counter Value</label>
            <input type="text" class="form-input form-input-sm stat-val-input" value="${escapeHtml(st.value || "")}" placeholder="e.g. 10+, 99.9%">
          </div>
          <div class="form-group-compact full-span">
            <label>Metric Label</label>
            <input type="text" class="form-input form-input-sm stat-lbl-input" value="${escapeHtml(st.label || "")}" placeholder="e.g. Production Apps">
          </div>
        </div>
      </div>
    `).join("");

    // Bind visibility toggle switches
    listEl.querySelectorAll(".stat-visibility-toggle").forEach(toggle => {
      toggle.addEventListener("change", (e) => {
        const i = parseInt(toggle.dataset.index, 10);
        stats[i].visible = toggle.checked;
        renderStatsList();
      });
    });

    // Bind inputs
    listEl.querySelectorAll(".stat-badge-card").forEach(card => {
      const idx = parseInt(card.dataset.index, 10);
      const iconInput = card.querySelector(".stat-icon-input");
      const valInput = card.querySelector(".stat-val-input");
      const lblInput = card.querySelector(".stat-lbl-input");
      const valPreview = card.querySelector(".stat-preview-val");
      const lblPreview = card.querySelector(".stat-preview-lbl");
      const iconPreview = card.querySelector(".stat-icon-badge");

      iconInput?.addEventListener("input", () => {
        stats[idx].icon = iconInput.value.trim();
        if (iconPreview) iconPreview.textContent = stats[idx].icon || "📱";
      });
      valInput?.addEventListener("input", () => {
        stats[idx].value = valInput.value;
        if (valPreview) valPreview.textContent = stats[idx].value || "0";
      });
      lblInput?.addEventListener("input", () => {
        stats[idx].label = lblInput.value;
        if (lblPreview) lblPreview.textContent = stats[idx].label || "Metric Label";
      });
    });

    // Bind reorder
    listEl.querySelectorAll(".move-up-stat").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.index, 10);
        if (i > 0) {
          const item = stats.splice(i, 1)[0];
          stats.splice(i - 1, 0, item);
          renderStatsList();
        }
      });
    });
    listEl.querySelectorAll(".move-down-stat").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.index, 10);
        if (i < stats.length - 1) {
          const item = stats.splice(i, 1)[0];
          stats.splice(i + 1, 0, item);
          renderStatsList();
        }
      });
    });

    // Bind delete
    listEl.querySelectorAll(".delete-stat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.index, 10);
        stats.splice(i, 1);
        renderStatsList();
      });
    });
  };

  // Add Stat Button
  container.querySelector("#add-stat-btn")?.addEventListener("click", () => {
    stats.push({
      icon: "⚡",
      value: "100%",
      label: "Performance",
      visible: true,
      order: stats.length
    });
    renderStatsList();
  });

  // ============================================================
  //  Render Social Profiles Hub with Active / Inactive Switches
  // ============================================================
  const renderSocialChannels = () => {
    const listEl = container.querySelector("#social-channels-list");
    if (!listEl) return;

    const channels = [
      {
        key: "github",
        name: "GitHub",
        showKey: "showGithub",
        brandColor: "#ffffff",
        iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`,
        placeholder: "https://github.com/satwinder777"
      },
      {
        key: "linkedin",
        name: "LinkedIn",
        showKey: "showLinkedin",
        brandColor: "#0a66c2",
        iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`,
        placeholder: "https://linkedin.com/in/satwinder777"
      },
      {
        key: "whatsapp",
        name: "WhatsApp",
        showKey: "showWhatsapp",
        brandColor: "#25d366",
        iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>`,
        placeholder: "+91 9876543210 or wa.me/..."
      },
      {
        key: "instagram",
        name: "Instagram",
        showKey: "showInstagram",
        brandColor: "#e1306c",
        iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
        placeholder: "https://instagram.com/..."
      },
      {
        key: "email",
        name: "Direct Email",
        showKey: "showEmail",
        brandColor: "#00d9ff",
        iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
        placeholder: "satwinder88721@gmail.com"
      }
    ];

    listEl.innerHTML = channels.map(ch => {
      const val = socialLinks[ch.key] || "";
      const isVisible = socialLinks[ch.showKey] !== false;

      return `
        <div class="social-channel-row ${isVisible ? "channel-active" : "channel-inactive"}" data-key="${ch.key}">
          <div class="social-channel-header">
            <div class="social-channel-left">
              <div class="social-channel-icon" style="color: ${ch.brandColor};">${ch.iconSvg}</div>
              <div class="social-channel-info">
                <span class="social-channel-name">${ch.name}</span>
                <span class="social-status-pill ${isVisible ? "status-live" : "status-hidden"}">
                  ${isVisible ? "● Active on Site" : "○ Inactive (Hidden)"}
                </span>
              </div>
            </div>
            <div class="social-channel-toggle-wrap">
              <label class="switch switch-sm" title="Toggle visibility on live site">
                <input type="checkbox" class="social-visibility-toggle" data-showkey="${ch.showKey}" ${isVisible ? "checked" : ""}>
                <span class="slider round"></span>
              </label>
            </div>
          </div>
          <div class="social-channel-input-wrap">
            <input type="text" class="form-input form-input-sm social-url-input" data-key="${ch.key}" value="${escapeHtml(val)}" placeholder="${ch.placeholder}">
            ${val ? `
              <a href="${escapeHtml(val.startsWith("http") || val.includes("@") ? val : "https://" + val)}" target="_blank" rel="noopener noreferrer" class="social-test-link" title="Open Link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            ` : ""}
          </div>
        </div>
      `;
    }).join("");

    // Bind visibility switches
    listEl.querySelectorAll(".social-visibility-toggle").forEach(toggle => {
      toggle.addEventListener("change", () => {
        const showKey = toggle.dataset.showkey;
        socialLinks[showKey] = toggle.checked;
        renderSocialChannels();
      });
    });

    // Bind URL inputs
    listEl.querySelectorAll(".social-url-input").forEach(input => {
      input.addEventListener("input", () => {
        const key = input.dataset.key;
        socialLinks[key] = input.value.trim();
      });
    });
  };

  // Initial render of sub-components
  renderStatsList();
  renderSocialChannels();

  // ============================================================
  //  Media Upload Handlers (Supabase Storage integration)
  // ============================================================
  const avatarFileInput = container.querySelector("#avatar-file-input");
  const logoFileInput = container.querySelector("#logo-file-input");
  const avatarImgPreview = container.querySelector("#avatar-img-preview");
  const logoImgPreview = container.querySelector("#logo-img-preview");
  const logoPlaceholder = container.querySelector("#logo-placeholder");
  const avatarUrlInput = container.querySelector("#prof-avatar-url");
  const logoUrlInput = container.querySelector("#prof-logo-url");

  // Avatar Trigger
  const triggerAvatar = () => avatarFileInput?.click();
  container.querySelector("#btn-upload-avatar")?.addEventListener("click", triggerAvatar);
  container.querySelector("#btn-trigger-avatar-upload")?.addEventListener("click", triggerAvatar);

  avatarFileInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const btn = container.querySelector("#btn-upload-avatar");
    if (btn) btn.innerHTML = `<span>Uploading...</span>`;

    try {
      toast.info("Uploading avatar to Supabase Storage...");
      const publicUrl = await uploadToSupabase(file, "profile-images", `avatar_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`);
      profile.avatarUrl = publicUrl;
      if (avatarImgPreview) avatarImgPreview.src = publicUrl;
      if (avatarUrlInput) avatarUrlInput.value = publicUrl;
      toast.success("Avatar uploaded successfully!");
    } catch (err) {
      toast.error("Avatar upload failed: " + err.message);
    } finally {
      if (btn) btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Upload Image</span>`;
      avatarFileInput.value = "";
    }
  });

  // Logo Trigger
  const triggerLogo = () => logoFileInput?.click();
  container.querySelector("#btn-upload-logo")?.addEventListener("click", triggerLogo);

  logoFileInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const btn = container.querySelector("#btn-upload-logo");
    if (btn) btn.innerHTML = `<span>Uploading...</span>`;

    try {
      toast.info("Uploading site logo to Supabase Storage...");
      const publicUrl = await uploadToSupabase(file, "profile-images", `site_logo_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`);
      profile.logoUrl = publicUrl;
      if (logoImgPreview) {
        logoImgPreview.src = publicUrl;
        logoImgPreview.style.display = "block";
      }
      if (logoPlaceholder) logoPlaceholder.style.display = "none";
      if (logoUrlInput) logoUrlInput.value = publicUrl;
      toast.success("Brand Logo uploaded successfully!");
    } catch (err) {
      toast.error("Logo upload failed: " + err.message);
    } finally {
      if (btn) btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Upload Logo</span>`;
      logoFileInput.value = "";
    }
  });

  // Toggle Custom URL Drawers
  container.querySelector("#btn-toggle-avatar-url")?.addEventListener("click", () => {
    const drawer = container.querySelector("#avatar-url-drawer");
    if (drawer) drawer.style.display = drawer.style.display === "none" ? "block" : "none";
  });
  container.querySelector("#btn-toggle-logo-url")?.addEventListener("click", () => {
    const drawer = container.querySelector("#logo-url-drawer");
    if (drawer) drawer.style.display = drawer.style.display === "none" ? "block" : "none";
  });

  avatarUrlInput?.addEventListener("input", () => {
    profile.avatarUrl = avatarUrlInput.value.trim();
    if (avatarImgPreview && profile.avatarUrl) avatarImgPreview.src = profile.avatarUrl;
  });
  logoUrlInput?.addEventListener("input", () => {
    profile.logoUrl = logoUrlInput.value.trim();
    if (logoImgPreview && profile.logoUrl) {
      logoImgPreview.src = profile.logoUrl;
      logoImgPreview.style.display = "block";
      if (logoPlaceholder) logoPlaceholder.style.display = "none";
    }
  });

  // Availability switch pill text update
  const availToggle = container.querySelector("#prof-availability");
  const availTag = container.querySelector("#avail-status-tag");
  availToggle?.addEventListener("change", () => {
    if (availTag) {
      availTag.textContent = availToggle.checked ? "Active on Portfolio" : "Disabled (Hidden)";
    }
  });

  // ============================================================
  //  SAVE ALL CHANGES (Profile + Stats + Socials)
  // ============================================================
  const saveBtn = container.querySelector("#save-profile-btn");
  saveBtn?.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>Saving...</span>`;

    // 1. Gather Profile
    const updatedProfile = {
      name: container.querySelector("#prof-name")?.value.trim() || profile.name || "",
      title: container.querySelector("#prof-title")?.value.trim() || profile.title || "",
      tagline: container.querySelector("#prof-tagline")?.value.trim() || profile.tagline || "",
      bio: container.querySelector("#prof-bio")?.value.trim() || profile.bio || "",
      mindsetTitle: container.querySelector("#prof-mindset-title")?.value.trim() || "Engineering Mindset",
      mindsetDescription: container.querySelector("#prof-mindset-desc")?.value.trim() || "",
      avatarUrl: profile.avatarUrl || avatarUrlInput?.value.trim() || "",
      logoUrl: profile.logoUrl || logoUrlInput?.value.trim() || "",
      availability: availToggle?.checked ?? true,
      availabilityText: container.querySelector("#prof-avail-text")?.value.trim() || "Available for Senior Roles",
    };

    // 2. Gather Stats (normalize order)
    const updatedStats = stats.map((s, idx) => ({
      icon: s.icon || "📱",
      value: s.value.trim(),
      label: s.label.trim(),
      visible: s.visible !== false,
      order: idx
    }));

    // 3. Gather Social Links
    const updatedSocialLinks = { ...socialLinks };

    try {
      toast.info("Saving changes to Firestore...");
      await updatePortfolioField("profile", updatedProfile);
      await updatePortfolioField("stats", updatedStats);
      await updatePortfolioField("socialLinks", updatedSocialLinks);

      // Update local state
      state.portfolio.profile = updatedProfile;
      state.portfolio.stats = updatedStats;
      state.portfolio.socialLinks = updatedSocialLinks;

      toast.success("Profile, highlight badges and social channels published live!");
    } catch (err) {
      toast.error(err.message || "Failed to save profile changes.");
      if (err.code === "auth-required" && typeof appRouter?.showQuickFirebaseConnectModal === "function") {
        appRouter.showQuickFirebaseConnectModal();
      }
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span>Save All Changes</span>`;
    }
  });
}
