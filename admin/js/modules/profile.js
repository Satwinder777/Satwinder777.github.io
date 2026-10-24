// ============================================================
//  admin/js/modules/profile.js
//  Profile, Hero Info, Mindset, Availability & Stats Manager
// ============================================================

import { updatePortfolioField } from "../firebase-admin.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

export function renderProfile(container, state) {
  const portfolio = state.portfolio || {};
  const profile = portfolio.profile || {};
  let stats = Array.isArray(portfolio.stats) ? [...portfolio.stats] : [];
  let socialLinks = Array.isArray(portfolio.socialLinks) ? [...portfolio.socialLinks] : [];

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Profile & Personal Brand</h1>
        <p class="view-subtitle">Customize hero identity, bio, engineering mindset, metrics and social profiles.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" id="save-profile-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save All Changes
        </button>
      </div>
    </div>

    <div class="profile-layout">
      <!-- Left Column: Core Identity & Availability -->
      <div class="profile-main">
        <div class="card-box">
          <div class="card-box-header">
            <h3>Hero Identity</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="prof-name">Full Name</label>
              <input type="text" id="prof-name" class="form-input" value="${escapeHtml(profile.name || "")}" placeholder="e.g. Satwinder Singh">
            </div>

            <div class="form-group">
              <label for="prof-title">Professional Title</label>
              <input type="text" id="prof-title" class="form-input" value="${escapeHtml(profile.title || "")}" placeholder="e.g. Senior Flutter Engineer">
            </div>

            <div class="form-group full-width">
              <label for="prof-tagline">Hero Headline / Tagline</label>
              <input type="text" id="prof-tagline" class="form-input" value="${escapeHtml(profile.tagline || "")}" placeholder="e.g. Architecting resilient mobile ecosystems...">
            </div>

            <div class="form-group full-width">
              <label for="prof-bio">Short Bio (Hero subline)</label>
              <textarea id="prof-bio" class="form-textarea" rows="2" placeholder="Brief intro appearing under headline...">${escapeHtml(profile.bio || "")}</textarea>
            </div>
          </div>
        </div>

        <div class="card-box">
          <div class="card-box-header">
            <h3>Engineering Mindset / About Section</h3>
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

        <!-- Metric Counter Cards (Stats) -->
        <div class="card-box">
          <div class="card-box-header">
            <div>
              <h3>Key Metric Counters</h3>
              <p class="card-desc">Highlight badges (e.g. "10+ Production Apps", "99.9% Crash-Free").</p>
            </div>
            <button class="btn btn-sm btn-secondary" id="add-stat-btn">+ Add Metric</button>
          </div>
          <div class="stats-manager-list" id="stats-list">
            <!-- Rendered by helper -->
          </div>
        </div>
      </div>

      <!-- Right Column: Media Assets, Status Badge & Socials -->
      <div class="profile-aside">
        <div class="card-box">
          <div class="card-box-header">
            <h3>Availability Status</h3>
          </div>
          <div class="form-group">
            <label class="switch-row">
              <span>Open to New Roles</span>
              <label class="switch">
                <input type="checkbox" id="prof-availability" ${profile.availability ? "checked" : ""}>
                <span class="slider round"></span>
              </label>
            </label>
          </div>
          <div class="form-group">
            <label for="prof-avail-text">Status Pill Text</label>
            <input type="text" id="prof-avail-text" class="form-input" value="${escapeHtml(profile.availabilityText || "Available for Senior Roles")}">
          </div>
        </div>

        <div class="card-box">
          <div class="card-box-header">
            <h3>Media URLs</h3>
          </div>
          <div class="form-group">
            <label for="prof-avatar">Avatar / Memoji URL</label>
            <input type="text" id="prof-avatar" class="form-input" value="${escapeHtml(profile.avatarUrl || "")}" placeholder="https://...">
            ${profile.avatarUrl ? `<div class="avatar-preview-box"><img src="${profile.avatarUrl}" alt="Avatar preview" class="avatar-preview-img" onerror="this.style.display='none'"></div>` : ""}
          </div>
          <div class="form-group">
            <label for="prof-logo">Brand Mark / Logo URL</label>
            <input type="text" id="prof-logo" class="form-input" value="${escapeHtml(profile.logoUrl || "")}" placeholder="https://...">
          </div>
        </div>

        <!-- Social Links -->
        <div class="card-box">
          <div class="card-box-header">
            <h3>Social Profiles</h3>
            <button class="btn btn-sm btn-secondary" id="add-social-btn">+ Add</button>
          </div>
          <div class="social-manager-list" id="social-list">
            <!-- Rendered by helper -->
          </div>
        </div>
      </div>
    </div>
  `;

  // Render Stats List
  const renderStatsList = () => {
    const listEl = container.querySelector("#stats-list");
    if (!listEl) return;
    if (stats.length === 0) {
      listEl.innerHTML = `<div class="empty-state-sm">No metrics added yet. Click "+ Add Metric".</div>`;
      return;
    }

    listEl.innerHTML = stats.map((st, idx) => `
      <div class="stat-item-row" data-index="${idx}">
        <span class="stat-icon-preview">${escapeHtml(st.icon || "📱")}</span>
        <div class="stat-row-content">
          <input type="text" class="stat-input-val form-input-sm" value="${escapeHtml(st.value || "")}" placeholder="Value (e.g. 10+)">
          <input type="text" class="stat-input-lbl form-input-sm" value="${escapeHtml(st.label || "")}" placeholder="Label (e.g. Production Apps)">
        </div>
        <div class="stat-actions">
          <button class="btn-icon delete-stat-btn" data-index="${idx}" title="Delete">&times;</button>
        </div>
      </div>
    `).join("");

    // Bind deletes
    listEl.querySelectorAll(".delete-stat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.index, 10);
        stats.splice(i, 1);
        renderStatsList();
      });
    });

    // Bind inputs
    listEl.querySelectorAll(".stat-item-row").forEach(row => {
      const idx = parseInt(row.dataset.index, 10);
      const valInput = row.querySelector(".stat-input-val");
      const lblInput = row.querySelector(".stat-input-lbl");
      valInput.addEventListener("input", () => { stats[idx].value = valInput.value; });
      lblInput.addEventListener("input", () => { stats[idx].label = lblInput.value; });
    });
  };

  // Render Socials List
  const renderSocialsList = () => {
    const listEl = container.querySelector("#social-list");
    if (!listEl) return;
    if (socialLinks.length === 0) {
      listEl.innerHTML = `<div class="empty-state-sm">No social links configured.</div>`;
      return;
    }

    listEl.innerHTML = socialLinks.map((s, idx) => `
      <div class="social-item-row" data-index="${idx}">
        <input type="text" class="social-input-platform form-input-sm" value="${escapeHtml(s.platform || "")}" placeholder="Platform">
        <input type="text" class="social-input-url form-input-sm" value="${escapeHtml(s.url || "")}" placeholder="https://...">
        <button class="btn-icon delete-social-btn" data-index="${idx}" title="Delete">&times;</button>
      </div>
    `).join("");

    listEl.querySelectorAll(".delete-social-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.index, 10);
        socialLinks.splice(i, 1);
        renderSocialsList();
      });
    });

    listEl.querySelectorAll(".social-item-row").forEach(row => {
      const idx = parseInt(row.dataset.index, 10);
      const pInput = row.querySelector(".social-input-platform");
      const uInput = row.querySelector(".social-input-url");
      pInput.addEventListener("input", () => { socialLinks[idx].platform = pInput.value; });
      uInput.addEventListener("input", () => { socialLinks[idx].url = uInput.value; });
    });
  };

  renderStatsList();
  renderSocialsList();

  // Add Stat button
  container.querySelector("#add-stat-btn")?.addEventListener("click", () => {
    stats.push({ icon: "⚡", value: "New", label: "Metric", visible: true, order: stats.length });
    renderStatsList();
  });

  // Add Social button
  container.querySelector("#add-social-btn")?.addEventListener("click", () => {
    socialLinks.push({ platform: "GitHub", url: "https://github.com/", icon: "github", visible: true, order: socialLinks.length });
    renderSocialsList();
  });

  // Save All Changes
  container.querySelector("#save-profile-btn")?.addEventListener("click", async () => {
    const saveBtn = container.querySelector("#save-profile-btn");
    saveBtn.disabled = true;
    saveBtn.innerHTML = `Saving...`;

    try {
      const updatedProfile = {
        name: container.querySelector("#prof-name").value.trim(),
        title: container.querySelector("#prof-title").value.trim(),
        tagline: container.querySelector("#prof-tagline").value.trim(),
        bio: container.querySelector("#prof-bio").value.trim(),
        mindsetTitle: container.querySelector("#prof-mindset-title").value.trim(),
        mindsetDescription: container.querySelector("#prof-mindset-desc").value.trim(),
        availability: container.querySelector("#prof-availability").checked,
        availabilityText: container.querySelector("#prof-avail-text").value.trim(),
        avatarUrl: container.querySelector("#prof-avatar").value.trim(),
        logoUrl: container.querySelector("#prof-logo").value.trim(),
        updatedAt: new Date().toISOString()
      };

      await updatePortfolioField("profile", updatedProfile);
      await updatePortfolioField("stats", stats);
      await updatePortfolioField("socialLinks", socialLinks);

      // Update local state
      state.portfolio.profile = updatedProfile;
      state.portfolio.stats = stats;
      state.portfolio.socialLinks = socialLinks;

      toast.success("Profile, metrics, and social links saved successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Error saving profile: " + e.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save All Changes
      `;
    }
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
