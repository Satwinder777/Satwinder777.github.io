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
              <div class="contrib-top">
                <div class="contrib-avatar-box">
                  ${c.avatarUrl ? `
                    <img src="${escapeHtml(c.avatarUrl)}" alt="${escapeHtml(c.name)}" class="contrib-avatar-img" onerror="this.onerror=null; this.src='../favicon.ico';">
                  ` : `
                    <div class="contrib-avatar-placeholder">${escapeHtml((c.name || "C").charAt(0).toUpperCase())}</div>
                  `}
                </div>
                <div class="contrib-info">
                  <h4 class="contrib-name">
                    ${escapeHtml(c.name)}
                    ${c.visible === false ? `<span class="badge badge-neutral" style="margin-left: 6px; font-size: 0.65rem; border: 1px dashed rgba(148, 163, 184, 0.4);">HIDDEN</span>` : ""}
                  </h4>
                  <span class="contrib-role-badge">${escapeHtml(c.role || "Collaborator")}</span>
                </div>
                <div class="contrib-actions-top" style="display: flex; gap: 4px; align-items: center;">
                  <button class="btn-toggle-vis toggle-c-vis-btn ${c.visible !== false ? "is-active" : "is-inactive"}" data-idx="${idx}" title="Toggle active/hidden on website" style="padding: 2px 7px; font-size: 0.7rem;">
                    <span class="status-pulse-dot" style="background: ${c.visible !== false ? "#10b981" : "#64748b"};"></span>
                    <span>${c.visible !== false ? "Active" : "Hidden"}</span>
                  </button>
                  <button class="btn-icon edit-contrib-btn" data-idx="${idx}" title="Edit Contributor">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                  <button class="btn-icon del-contrib-btn" data-idx="${idx}" title="Delete Contributor">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              <div class="contrib-links-row">
                ${c.github ? `
                  <a href="${escapeHtml(c.github)}" target="_blank" rel="noopener" class="contrib-link-pill link-github" title="GitHub">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                    GitHub
                  </a>
                ` : ""}
                ${c.linkedin ? `
                  <a href="${escapeHtml(c.linkedin)}" target="_blank" rel="noopener" class="contrib-link-pill link-linkedin" title="LinkedIn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    LinkedIn
                  </a>
                ` : ""}
                ${c.website ? `
                  <a href="${escapeHtml(c.website)}" target="_blank" rel="noopener" class="contrib-link-pill link-website" title="Website">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    Portfolio
                  </a>
                ` : ""}
              </div>

              <div class="contrib-card-footer">
                <div class="reorder-btns">
                  <button class="btn-icon move-c-up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Move Left">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  </button>
                  <button class="btn-icon move-c-down" data-idx="${idx}" ${idx === items.length - 1 ? "disabled" : ""} title="Move Right">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </div>
                <span class="contrib-index-tag">Order #${idx + 1}</span>
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

    container.querySelectorAll(".toggle-c-vis-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (items[idx]) {
          items[idx].visible = items[idx].visible === false ? true : false;
          section.items = items;
          saveSection(section);
        }
      });
    });

    container.querySelectorAll(".edit-contrib-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        openContributorEditor(items[idx], idx);
      });
    });

    container.querySelectorAll(".del-contrib-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
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

    container.querySelectorAll(".move-c-up").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (idx > 0) {
          const temp = items[idx];
          items[idx] = items[idx - 1];
          items[idx - 1] = temp;
          section.items = items;
          saveSection(section);
        }
      });
    });

    container.querySelectorAll(".move-c-down").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (idx < items.length - 1) {
          const temp = items[idx];
          items[idx] = items[idx + 1];
          items[idx + 1] = temp;
          section.items = items;
          saveSection(section);
        }
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
      toast.success("Contributors section updated!");
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
            <input type="text" id="f-cname" class="form-input" required value="${escapeHtml(c.name)}" placeholder="e.g. John Doe">
          </div>
          <div class="form-group">
            <label for="f-crole">Role / Contribution</label>
            <input type="text" id="f-crole" class="form-input" value="${escapeHtml(c.role)}" placeholder="e.g. Backend Lead, Co-creator">
          </div>
          <div class="form-group full-width">
            <label for="f-cavatar">Avatar Image URL</label>
            <input type="text" id="f-cavatar" class="form-input" value="${escapeHtml(c.avatarUrl)}" placeholder="https://github.com/username.png">
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
              <span>Show on Website (Active / Inactive)</span>
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
        role: modalEl.querySelector("#f-crole").value.trim() || "Collaborator",
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
