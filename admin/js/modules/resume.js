// ============================================================
//  admin/js/modules/resume.js
//  Resume Studio, PDF Links & Download CTA Manager
// ============================================================

import { updatePortfolioFields } from "../firebase-admin.js";
import { toast } from "../toast.js";

export function renderResume(container, state) {
  const portfolio = state.portfolio || {};
  let resumeUrl = portfolio.resumeUrl || "";
  let showResume = portfolio.showResume !== false;
  let liveTemplateId = portfolio.liveResumeTemplateId || "template_minimal_dark";

  const renderView = () => {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Resume Studio & Links</h1>
          <p class="view-subtitle">Manage public resume PDF downloads, template IDs, and showcase toggles.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" id="save-resume-btn">Save Resume Settings</button>
        </div>
      </div>

      <div class="resume-layout">
        <div class="card-box">
          <div class="card-box-header">
            <h3>Resume Configuration</h3>
            <label class="switch-row">
              <span>Show Resume CTA on Website</span>
              <label class="switch">
                <input type="checkbox" id="res-show" ${showResume ? "checked" : ""}>
                <span class="slider round"></span>
              </label>
            </label>
          </div>

          <div class="form-grid">
            <div class="form-group full-width">
              <label for="res-url">Public PDF Download URL</label>
              <input type="text" id="res-url" class="form-input" value="${escapeHtml(resumeUrl)}" placeholder="https://storage.googleapis.com/... or https://...">
              <small class="field-hint">Direct link to hosted resume PDF (Supabase, Firebase Storage, Google Drive or CDN).</small>
            </div>

            <div class="form-group">
              <label for="res-template">Active Template ID</label>
              <select id="res-template" class="form-select">
                <option value="template_minimal_dark" ${liveTemplateId === "template_minimal_dark" ? "selected" : ""}>Minimal Dark (Architect Edition)</option>
                <option value="template_executive" ${liveTemplateId === "template_executive" ? "selected" : ""}>Executive Modern (Clean Grid)</option>
                <option value="template_standard_ats" ${liveTemplateId === "template_standard_ats" ? "selected" : ""}>Standard ATS Friendly</option>
              </select>
            </div>
          </div>

          <div class="resume-preview-actions" style="margin-top: 24px;">
            ${resumeUrl ? `
              <a href="${resumeUrl}" target="_blank" rel="noopener" class="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Open / Test PDF Link
              </a>
            ` : `
              <span class="text-muted">Enter a valid PDF URL above to enable the test preview.</span>
            `}
          </div>
        </div>

        <div class="card-box">
          <div class="card-box-header">
            <h3>Mobile & Web Integration</h3>
          </div>
          <p class="card-desc">
            Changes made here sync in real-time with both the GitHub Pages portfolio website and the <code>satwinderx</code> mobile app.
          </p>
          <div class="integration-status-list">
            <div class="integration-item">
              <span class="integration-dot status-ok"></span>
              <div>
                <strong>Portfolio Web Button:</strong>
                <span>${showResume ? "Visible in navigation & hero" : "Hidden from public view"}</span>
              </div>
            </div>
            <div class="integration-item">
              <span class="integration-dot status-ok"></span>
              <div>
                <strong>Storage Endpoint:</strong>
                <span>${resumeUrl ? "Connected" : "No URL set"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelector("#save-resume-btn")?.addEventListener("click", async () => {
      const url = container.querySelector("#res-url").value.trim();
      const show = container.querySelector("#res-show").checked;
      const tId = container.querySelector("#res-template").value;

      try {
        await updatePortfolioFields({
          resumeUrl: url,
          showResume: show,
          liveResumeTemplateId: tId
        });

        state.portfolio.resumeUrl = url;
        state.portfolio.showResume = show;
        state.portfolio.liveResumeTemplateId = tId;
        resumeUrl = url;
        showResume = show;
        liveTemplateId = tId;

        toast.success("Resume configuration saved!");
        renderView();
      } catch (e) {
        toast.error("Failed to save: " + e.message);
      }
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
