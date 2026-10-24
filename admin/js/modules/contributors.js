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
          <h3>Section Configuration</h3>
          <label class="switch-row">
            <span>Show Section on Public Website</span>
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
          <div>
            <h3>Contributors List</h3>
            <p class="card-desc">Individual profile cards with avatar, role, and social links.</p>
          </div>
          <button class="btn btn-secondary" id="add-contributor-btn">+ Add Contributor</button>
        </div>

        <div class="contributors-admin-grid">
          ${items.length === 0 ? `
            <div class="empty-state-sm full-width">No contributors added yet. Click "+ Add Contributor".</div>
          ` : items.map((c, idx) => `
            <div class="contributor-admin-card" data-idx="${idx}">
              <div class="contrib-top">
                <div class="contrib-avatar-box">
                  ${c.avatarUrl ? `
                    <img src="${c.avatarUrl}" alt="${escapeHtml(c.name)}" class="contrib-avatar-img" onerror="this.onerror=null; this.src='../favicon.ico';">
                  ` : `
                    <div class="contrib-avatar-placeholder">${escapeHtml((c.name || "C").charAt(0).toUpperCase())}</div>
                  `}
                </div>
                <div class="contrib-info">
                  <h4 class="contrib-name">${escapeHtml(c.name)}</h4>
                  <span class="contrib-role">${escapeHtml(c.role || "Collaborator")}</span>
                </div>
                <div class="right-actions">
                  <button class="btn-icon edit-contrib-btn" data-idx="${idx}" title="Edit">✎</button>
                  <button class="btn-icon del-contrib-btn" data-idx="${idx}" title="Delete">&times;</button>
                </div>
              </div>

              <div class="contrib-links">
                ${c.github ? `<a href="${c.github}" target="_blank" class="meta-link">GitHub</a>` : ""}
                ${c.linkedin ? `<a href="${c.linkedin}" target="_blank" class="meta-link">LinkedIn</a>` : ""}
                ${c.website ? `<a href="${c.website}" target="_blank" class="meta-link">Web</a>` : ""}
              </div>

              <div class="contrib-bottom-reorder">
                <button class="btn-icon move-c-up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""}>↑</button>
                <button class="btn-icon move-c-down" data-idx="${idx}" ${idx === items.length - 1 ? "disabled" : ""}>↓</button>
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
        website: modalEl.querySelector("#f-cweb").value.trim()
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
    .replace(/>/g, "&gt;");
}
