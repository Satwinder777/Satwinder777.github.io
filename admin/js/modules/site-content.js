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

  let features = Array.isArray(portfolio.upcomingFeatures) ? [...portfolio.upcomingFeatures] : [];

  const renderView = () => {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Site Content & Roadmap</h1>
          <p class="view-subtitle">Live announcement banners and forward-looking roadmap items.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" id="save-banner-btn">Save Banner Settings</button>
        </div>
      </div>

      <!-- Live Top Announcement Banner -->
      <div class="card-box" style="margin-bottom: 24px;">
        <div class="card-box-header">
          <div>
            <h3>Live Announcement Banner</h3>
            <p class="card-desc">Top-of-page interactive ticker displayed on the portfolio website.</p>
          </div>
          <label class="switch-row">
            <span>Banner Enabled</span>
            <label class="switch">
              <input type="checkbox" id="banner-enabled" ${banner.enabled ? "checked" : ""}>
              <span class="slider round"></span>
            </label>
          </label>
        </div>

        <div class="form-grid">
          <div class="form-group full-width">
            <label for="banner-msg">Banner Message Text</label>
            <textarea id="banner-msg" class="form-textarea" rows="3" placeholder="Announcement text displayed in the marquee...">${escapeHtml(banner.message || "")}</textarea>
          </div>
          <div class="form-group">
            <label for="banner-dev">Developer Signature / Name</label>
            <input type="text" id="banner-dev" class="form-input" value="${escapeHtml(banner.developerName || "Satwinder Singh")}">
          </div>
        </div>

        <div class="banner-preview-box">
          <span class="preview-tag">Live Preview:</span>
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
          <div>
            <h3>Upcoming Features Roadmap</h3>
            <p class="card-desc">Showcase features in the pipeline to visitors and potential employers.</p>
          </div>
          <button class="btn btn-secondary" id="add-feature-btn">+ Add Roadmap Item</button>
        </div>

        <div class="features-roadmap-grid">
          ${features.length === 0 ? `
            <div class="empty-state-sm full-width">No roadmap items configured. Click "+ Add Roadmap Item".</div>
          ` : features.map((feat, idx) => `
            <div class="roadmap-admin-card" data-idx="${idx}">
              <div class="roadmap-top">
                <span class="roadmap-icon">${escapeHtml(feat.icon || "✨")}</span>
                <div class="roadmap-info">
                  <h4>${escapeHtml(feat.title)}</h4>
                  <span class="roadmap-eta">${escapeHtml(feat.eta ? `Target: ${feat.eta}` : "In Development")}</span>
                </div>
                <div class="right-actions">
                  <button class="btn-icon edit-feat-btn" data-idx="${idx}" title="Edit">✎</button>
                  <button class="btn-icon del-feat-btn" data-idx="${idx}" title="Delete">&times;</button>
                </div>
              </div>
              <p class="roadmap-desc">${escapeHtml(feat.description || "")}</p>
              <div class="roadmap-bottom-reorder">
                <button class="btn-icon move-feat-up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""}>↑</button>
                <button class="btn-icon move-feat-down" data-idx="${idx}" ${idx === features.length - 1 ? "disabled" : ""}>↓</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // Listeners
    container.querySelector("#banner-enabled")?.addEventListener("change", (e) => {
      banner.enabled = e.target.checked;
      const demo = container.querySelector(".live-banner-demo");
      if (demo) {
        demo.classList.toggle("is-active", banner.enabled);
        demo.classList.toggle("is-inactive", !banner.enabled);
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

    container.querySelector("#save-banner-btn")?.addEventListener("click", async () => {
      banner.enabled = container.querySelector("#banner-enabled").checked;
      banner.message = container.querySelector("#banner-msg").value.trim();
      banner.developerName = container.querySelector("#banner-dev").value.trim();

      try {
        await updatePortfolioField("siteBanner", banner);
        state.portfolio.siteBanner = banner;
        toast.success("Site Announcement Banner saved!");
      } catch (e) {
        toast.error("Failed to save banner: " + e.message);
      }
    });

    // Roadmap Features
    container.querySelector("#add-feature-btn")?.addEventListener("click", () => openFeatureEditor(null));

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
        description: modalEl.querySelector("#f-fdesc").value.trim()
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
    .replace(/>/g, "&gt;");
}
