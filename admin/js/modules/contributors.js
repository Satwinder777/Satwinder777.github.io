// ============================================================
//  admin/js/modules/contributors.js
//  "Built With Great People" Contributor Showcase Manager
// ============================================================

import { updatePortfolioField } from "../firebase-admin.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

export function renderContributors(container, state) {
  const portfolio = state.portfolio || {};
  let section = portfolio.contributorsSection || {
    enabled: true,
    title: "Built With Great People",
    subtitle: "Talented engineers and collaborators who shaped these projects.",
    items: []
  };

  let items = Array.isArray(section.items) ? [...section.items] : [];

  function getDualInitials(name) {
    if (!name) return "CO";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  function getAvatarGradient(idx) {
    const gradients = [
      "linear-gradient(135deg, #00d9ff 0%, #3b82f6 50%, #8b5cf6 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #ec4899 100%)",
      "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
      "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
      "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)"
    ];
    return gradients[idx % gradients.length];
  }

  function getHaloColor(idx) {
    const halos = [
      "rgba(0, 217, 255, 0.6)",
      "rgba(236, 72, 153, 0.6)",
      "rgba(16, 185, 129, 0.6)",
      "rgba(139, 92, 246, 0.6)",
      "rgba(245, 158, 11, 0.6)"
    ];
    return halos[idx % halos.length];
  }

  function getAccentGradient(idx) {
    const bars = [
      "linear-gradient(90deg, #00d9ff 0%, #8b5cf6 50%, #ec4899 100%)",
      "linear-gradient(90deg, #00d9ff 0%, #ec4899 100%)",
      "linear-gradient(90deg, #10b981 0%, #00d9ff 100%)",
      "linear-gradient(90deg, #f43f5e 0%, #fb923c 100%)"
    ];
    return bars[idx % bars.length];
  }

  function getRoleAccent(idx, role) {
    const r = (role || "").toLowerCase();
    if (r.includes("manager") || r.includes("lead") || r.includes("founder")) return "#00d9ff";
    if (r.includes("contributor") || r.includes("engineer")) return "#ec4899";
    if (r.includes("design") || r.includes("ui")) return "#8b5cf6";
    const colors = ["#00d9ff", "#ec4899", "#10b981", "#8b5cf6", "#f59e0b"];
    return colors[idx % colors.length];
  }

  const renderView = () => {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Contributors & Team Showcase</h1>
          <p class="view-subtitle">Acknowledge peers, co-engineers, and mentors in the "Built With Great People" section.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" id="save-section-meta-btn">Save Section Config</button>
        </div>
      </div>

      <!-- Section Level Config -->
      <div class="card-box" style="margin-bottom: 24px;">
        <div class="card-box-header">
          <div class="card-box-title-wrap">
            <div class="card-header-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <h3>Section Configuration</h3>
              <p class="card-desc">Show or hide the "Built With Great People" section across the live portfolio.</p>
            </div>
          </div>
          <label class="switch-row">
            <span>Show on Website</span>
            <label class="switch">
              <input type="checkbox" id="sec-enabled" ${section.enabled ? "checked" : ""}>
              <span class="slider round"></span>
            </label>
          </label>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label for="sec-title">Section Title</label>
            <input type="text" id="sec-title" class="form-input" value="${escapeHtml(section.title || "Built With Great People")}">
          </div>
          <div class="form-group">
            <label for="sec-subtitle">Section Subtitle</label>
            <input type="text" id="sec-subtitle" class="form-input" value="${escapeHtml(section.subtitle || "Talented engineers and collaborators...")}">
          </div>
        </div>
      </div>

      <!-- Contributors Cards List -->
      <div class="card-box">
        <div class="card-box-header">
          <div class="card-box-title-wrap">
            <div class="card-header-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            </div>
            <div>
              <h3>Contributors &amp; Collaborators (${items.length})</h3>
              <p class="card-desc">Individual profile cards with avatar, role, and social links.</p>
            </div>
          </div>
          <button class="btn btn-secondary" id="add-contributor-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Contributor
          </button>
        </div>

        <div class="contributors-admin-grid">
          ${items.length === 0 ? `
            <div class="empty-state-sm full-width">No contributors added yet. Click "+ Add Contributor" above.</div>
          ` : items.map((c, idx) => `
            <div class="contributor-admin-card ${c.visible === false ? "is-inactive-card" : ""}" data-idx="${idx}">
              <!-- Top Neon Glowing Line -->
              <div class="contrib-top-gradient-bar" style="background: ${getAccentGradient(idx)};"></div>

              <div class="contrib-card-body">
                <!-- Avatar with Glowing Halo Ring -->
                <div class="contrib-avatar-halo" style="--halo-color: ${getHaloColor(idx)};">
                  ${c.avatarUrl ? `
                    <img src="${escapeHtml(c.avatarUrl)}" alt="${escapeHtml(c.name)}" class="contrib-avatar-img" onerror="this.onerror=null; this.src='../favicon.ico';">
                  ` : `
                    <div class="contrib-avatar-circle" style="background: ${getAvatarGradient(idx)};">
                      ${escapeHtml(getDualInitials(c.name))}
                    </div>
                  `}
                </div>

                <!-- Info Block: Name, Role Pill, Social Links -->
                <div class="contrib-main-content">
                  <div class="contrib-name-row">
                    <h3 class="contrib-name-title" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</h3>
                  </div>

                  <div class="contrib-role-wrapper">
                    <span class="contrib-role-pill" style="--role-accent: ${getRoleAccent(idx, c.role)};">
                      <span class="role-pulse-dot"></span>
                      <span>${escapeHtml(c.role || "Contributor")}</span>
                    </span>
                  </div>

                  <!-- Social Links Row (Image 2 style) -->
                  <div class="contrib-links-row">
                    ${c.github ? `
                      <a href="${escapeHtml(c.github)}" target="_blank" rel="noopener" class="contrib-link-pill link-github" title="GitHub">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        <span>GitHub</span>
                      </a>
                    ` : `
                      <span class="contrib-link-pill link-github link-disabled" title="No GitHub link configured">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        <span>GitHub</span>
                      </span>
                    `}

                    ${c.linkedin ? `
                      <a href="${escapeHtml(c.linkedin)}" target="_blank" rel="noopener" class="contrib-link-pill link-linkedin" title="LinkedIn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        <span>LinkedIn</span>
                      </a>
                    ` : `
                      <span class="contrib-link-pill link-linkedin link-disabled" title="No LinkedIn link configured">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        <span>LinkedIn</span>
                      </span>
                    `}

                    ${c.website ? `
                      <a href="${escapeHtml(c.website)}" target="_blank" rel="noopener" class="contrib-link-pill link-website" title="Website / Portfolio">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        <span>Web</span>
                      </a>
                    ` : `
                      <span class="contrib-link-pill link-website link-disabled" title="No Website link configured">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        <span>Web</span>
                      </span>
                    `}
                  </div>
                </div>

                <!-- Right Action Column: Live/Hidden Toggle Button & Order/Actions -->
                <div class="contrib-card-actions">
                  <!-- Live & Hidden Working Toggle Feature -->
                  <button class="contrib-status-btn ${c.visible !== false ? "is-live" : "is-hidden"} toggle-c-vis-btn" data-idx="${idx}" title="Toggle Live / Hidden on portfolio website">
                    ${c.visible !== false ? `
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span>Live</span>
                    ` : `
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      <span>Hidden</span>
                    `}
                  </button>

                  <div class="contrib-order-group">
                    <!-- Order Index Badge (01, 02) -->
                    <span class="contrib-order-badge">${String(idx + 1).padStart(2, "0")}</span>

                    <!-- Reorder Toggle Button (Moves up or down) -->
                    <button class="contrib-reorder-btn move-c-cycle" data-idx="${idx}" title="Click to reorder (moves up or down)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 15l5 5 5-5M7 9l5-5 5-5"/></svg>
                    </button>

                    <!-- Edit Contributor Profile Button -->
                    <button class="contrib-action-btn edit-contrib-btn" data-idx="${idx}" title="Edit Contributor Profile">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>

                    <!-- Delete Contributor Button -->
                    <button class="contrib-action-btn btn-danger del-contrib-btn" data-idx="${idx}" title="Delete Contributor">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // Listeners
    container.querySelector("#sec-enabled")?.addEventListener("change", (e) => {
      section.enabled = e.target.checked;
    });

    container.querySelector("#save-section-meta-btn")?.addEventListener("click", () => {
      section.title = container.querySelector("#sec-title").value.trim();
      section.subtitle = container.querySelector("#sec-subtitle").value.trim();
      section.items = items;
      saveSection(section);
    });

    container.querySelector("#add-contributor-btn")?.addEventListener("click", () => openContributorEditor(null));

    // Live & Hidden Toggle Click Listener
    container.querySelectorAll(".toggle-c-vis-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        if (items[idx]) {
          const isNowVisible = items[idx].visible === false ? true : false;
          items[idx].visible = isNowVisible;
          section.items = items;
          saveSection(section);
          toast.success(`"${items[idx].name}" is now ${isNowVisible ? "Live on website" : "Hidden from website"}`);
        }
      });
    });

    // Edit Contributor Listener
    container.querySelectorAll(".edit-contrib-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        openContributorEditor(items[idx], idx);
      });
    });

    // Delete Contributor Listener
    container.querySelectorAll(".del-contrib-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        const ok = await modal.confirm({
          title: "Remove Contributor?",
          message: `Remove "${items[idx]?.name || "Contributor"}"?`,
          isDanger: true
        });
        if (ok) {
          items.splice(idx, 1);
          section.items = items;
          saveSection(section);
        }
      });
    });

    // Reorder Cycle (Click to move up/down)
    container.querySelectorAll(".move-c-cycle").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        if (items.length <= 1) return;
        
        // Move item to next position, or wrap to start
        const nextIdx = idx < items.length - 1 ? idx + 1 : 0;
        const [moved] = items.splice(idx, 1);
        items.splice(nextIdx, 0, moved);
        
        section.items = items;
        saveSection(section);
        toast.success(`Moved "${moved.name}" to position #${nextIdx + 1}`);
      });
    });
  };

  const saveSection = async (sec) => {
    try {
      const tInput = container.querySelector("#sec-title");
      const sInput = container.querySelector("#sec-subtitle");
      if (tInput && tInput.value.trim()) sec.title = tInput.value.trim();
      if (sInput && sInput.value.trim()) sec.subtitle = sInput.value.trim();
      await updatePortfolioField("contributorsSection", sec);
      state.portfolio.contributorsSection = sec;
      section = sec;
      items = sec.items;
      renderView();
    } catch (e) {
      toast.error("Failed to save: " + e.message);
    }
  };

  const openContributorEditor = (cur, idx) => {
    const isNew = cur === null;
    const c = cur || {
      name: "",
      role: "Software Engineer",
      avatarUrl: "",
      github: "",
      linkedin: "",
      website: "",
      visible: true,
      order: items.length
    };

    const modalBodyHtml = `
      <form id="contrib-form" class="editor-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="f-cname">Full Name *</label>
            <input type="text" id="f-cname" class="form-input" required value="${escapeHtml(c.name)}" placeholder="e.g. Sadhak Singh Sher Gill">
          </div>
          <div class="form-group">
            <label for="f-crole">Role / Contribution *</label>
            <input type="text" id="f-crole" class="form-input" value="${escapeHtml(c.role)}" placeholder="e.g. Product Manager, Contributor">
          </div>
          <div class="form-group full-width">
            <label for="f-cavatar">Avatar Image URL (Optional)</label>
            <input type="text" id="f-cavatar" class="form-input" value="${escapeHtml(c.avatarUrl)}" placeholder="https://github.com/username.png (or leaves dual letter avatar)">
          </div>
          <div class="form-group">
            <label for="f-cgithub">GitHub Profile URL</label>
            <input type="text" id="f-cgithub" class="form-input" value="${escapeHtml(c.github)}" placeholder="https://github.com/...">
          </div>
          <div class="form-group">
            <label for="f-clinkedin">LinkedIn Profile URL</label>
            <input type="text" id="f-clinkedin" class="form-input" value="${escapeHtml(c.linkedin)}" placeholder="https://linkedin.com/in/...">
          </div>
          <div class="form-group full-width">
            <label for="f-cweb">Website / Portfolio URL</label>
            <input type="text" id="f-cweb" class="form-input" value="${escapeHtml(c.website)}" placeholder="https://...">
          </div>
          <div class="form-group full-width">
            <label class="switch-row">
              <span>Active on Live Portfolio (Live / Hidden)</span>
              <label class="switch">
                <input type="checkbox" id="f-cvis" ${c.visible !== false ? "checked" : ""}>
                <span class="slider round"></span>
              </label>
            </label>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" id="modal-c-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-c-save">${isNew ? "Add Contributor" : "Save Changes"}</button>
    `;

    const modalEl = modal.open({
      title: isNew ? "Add Contributor Profile" : `Edit: ${c.name}`,
      bodyHtml: modalBodyHtml,
      footerHtml,
      size: "md"
    });

    modalEl.querySelector("#modal-c-cancel").addEventListener("click", () => modal.close());

    modalEl.querySelector("#modal-c-save").addEventListener("click", () => {
      const name = modalEl.querySelector("#f-cname").value.trim();
      if (!name) {
        toast.error("Name is required.");
        return;
      }

      const updated = {
        ...c,
        name,
        role: modalEl.querySelector("#f-crole").value.trim() || "Contributor",
        avatarUrl: modalEl.querySelector("#f-cavatar").value.trim(),
        github: modalEl.querySelector("#f-cgithub").value.trim(),
        linkedin: modalEl.querySelector("#f-clinkedin").value.trim(),
        website: modalEl.querySelector("#f-cweb").value.trim(),
        visible: modalEl.querySelector("#f-cvis") ? modalEl.querySelector("#f-cvis").checked : true
      };

      if (isNew) {
        items.push(updated);
      } else {
        items[idx] = updated;
      }

      section.items = items;
      modal.close();
      saveSection(section);
      toast.success(isNew ? "Contributor added!" : "Contributor updated!");
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
