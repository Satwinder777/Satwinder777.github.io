// ============================================================
//  admin/js/modules/resume.js
//  Resume Studio, PDF Links & Download CTA Manager
// ============================================================

import { updatePortfolioFields } from "../firebase-admin.js";
import { uploadToSupabase } from "../supabase.js";
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
          <h1 class="view-title">Resume Studio &amp; Links</h1>
          <p class="view-subtitle">Manage public resume PDF downloads, template IDs, direct cloud upload, and showcase toggles.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" id="save-resume-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Resume Settings
          </button>
        </div>
      </div>

      <div class="resume-layout">
        <!-- Configuration Card -->
        <div class="card-box">
          <div class="card-box-header">
            <div class="card-box-title-wrap">
              <div class="card-header-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div>
                <h3>Resume Configuration</h3>
                <p class="card-desc">Configure PDF asset endpoint, public visibility, and CV template theme.</p>
              </div>
            </div>
            <label class="switch-row">
              <span>Show CTA on Website</span>
              <label class="switch">
                <input type="checkbox" id="res-show" ${showResume ? "checked" : ""}>
                <span class="slider round"></span>
              </label>
            </label>
          </div>

          <div class="form-grid">
            <div class="form-group full-width">
              <label for="res-url">Public PDF Download URL</label>
              <div class="input-with-action-row">
                <input type="text" id="res-url" class="form-input" value="${escapeHtml(resumeUrl)}" placeholder="https://storage.googleapis.com/... or https://...">
                <label class="btn btn-secondary upload-btn-inline" title="Upload PDF to Cloud">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>Upload PDF</span>
                  <input type="file" id="res-upload-input" accept="application/pdf" style="display: none;">
                </label>
              </div>
              <small class="field-hint">Direct link to hosted resume PDF (Supabase, Firebase Storage, Google Drive or CDN).</small>
            </div>

            <div class="form-group full-width">
              <label>Select Active Template Edition</label>
              <div class="template-selector-grid">
                <label class="template-card-option ${liveTemplateId === "template_minimal_dark" ? "active" : ""}">
                  <input type="radio" name="res-tpl" value="template_minimal_dark" ${liveTemplateId === "template_minimal_dark" ? "checked" : ""} style="display: none;">
                  <div class="template-radio-dot"></div>
                  <div class="template-info">
                    <strong>Minimal Dark</strong>
                    <span>Architect Edition (Obsidian & Cyan)</span>
                  </div>
                </label>

                <label class="template-card-option ${liveTemplateId === "template_executive" ? "active" : ""}">
                  <input type="radio" name="res-tpl" value="template_executive" ${liveTemplateId === "template_executive" ? "checked" : ""} style="display: none;">
                  <div class="template-radio-dot"></div>
                  <div class="template-info">
                    <strong>Executive Modern</strong>
                    <span>Clean Enterprise Layout</span>
                  </div>
                </label>

                <label class="template-card-option ${liveTemplateId === "template_standard_ats" ? "active" : ""}">
                  <input type="radio" name="res-tpl" value="template_standard_ats" ${liveTemplateId === "template_standard_ats" ? "checked" : ""} style="display: none;">
                  <div class="template-radio-dot"></div>
                  <div class="template-info">
                    <strong>Standard ATS</strong>
                    <span>Scanner & Parser Optimized</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div class="resume-preview-actions" style="margin-top: 24px;">
            ${resumeUrl ? `
              <a href="${resumeUrl}" target="_blank" rel="noopener" class="btn btn-secondary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Open / Test PDF Link
              </a>
              <button type="button" class="btn btn-ghost copy-link-btn" id="copy-resume-link-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy URL
              </button>
            ` : `
              <span class="text-muted">Upload a PDF or paste a URL above to enable test link preview.</span>
            `}
          </div>
        </div>

        <!-- Simulated Document & Sync Card -->
        <div class="card-box">
          <div class="card-box-header">
            <div class="card-box-title-wrap">
              <div class="card-header-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
              </div>
              <div>
                <h3>Live Document &amp; Sync</h3>
                <p class="card-desc">Simulated preview of public resume download card and cross-platform synchronization.</p>
              </div>
            </div>
          </div>

          <!-- Document Mockup Pod -->
          <div class="resume-doc-mockup">
            <div class="doc-mockup-header">
              <div class="doc-badge-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                PDF Document
              </div>
              <span class="doc-filesize">Updated 2026</span>
            </div>
            <div class="doc-mockup-body">
              <h4 class="doc-candidate-name">Satwinder Singh</h4>
              <p class="doc-candidate-title">Senior Flutter &amp; Mobile Architect</p>
              <div class="doc-tags-row">
                <span class="doc-tag">3+ Years Experience</span>
                <span class="doc-tag">120fps Perf</span>
                <span class="doc-tag">Clean Arch</span>
              </div>
            </div>
            <div class="doc-mockup-footer">
              <div class="cta-status-indicator">
                <span class="status-pulse-dot" style="background: ${showResume ? "#10b981" : "#94a3b8"};"></span>
                <span>${showResume ? "Active on live website" : "Hidden on live website"}</span>
              </div>
              ${resumeUrl ? `
                <a href="${resumeUrl}" target="_blank" class="btn btn-sm btn-primary">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download PDF
                </a>
              ` : `
                <span class="badge badge-neutral">No PDF Linked</span>
              `}
            </div>
          </div>

          <div class="integration-status-list" style="margin-top: 20px;">
            <div class="integration-item">
              <span class="integration-dot ${showResume ? "status-ok" : "status-warn"}"></span>
              <div>
                <strong>Portfolio Web Navigation:</strong>
                <span>${showResume ? "Active 'Resume' button in navbar & hero" : "CTA hidden from visitors"}</span>
              </div>
            </div>
            <div class="integration-item">
              <span class="integration-dot ${resumeUrl ? "status-ok" : "status-warn"}"></span>
              <div>
                <strong>Supabase / CDN Storage Endpoint:</strong>
                <span>${resumeUrl ? "Connected & Verifiable" : "Awaiting PDF URL"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Radio change
    container.querySelectorAll("input[name='res-tpl']").forEach(radio => {
      radio.addEventListener("change", (e) => {
        liveTemplateId = e.target.value;
        container.querySelectorAll(".template-card-option").forEach(card => card.classList.remove("active"));
        radio.closest(".template-card-option").classList.add("active");
      });
    });

    // Copy link
    container.querySelector("#copy-resume-link-btn")?.addEventListener("click", () => {
      navigator.clipboard.writeText(resumeUrl);
      toast.success("Resume URL copied to clipboard!");
    });

    // Direct PDF Upload to Supabase
    const uploadInput = container.querySelector("#res-upload-input");
    uploadInput?.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      toast.info("Uploading resume PDF to Supabase...");
      try {
        const publicUrl = await uploadToSupabase(file, "resume", `satwinder_singh_resume_${Date.now()}.pdf`);
        resumeUrl = publicUrl;
        container.querySelector("#res-url").value = publicUrl;
        toast.success("Resume PDF uploaded successfully!");
        renderView();
      } catch (err) {
        toast.error("Upload failed: " + err.message);
      }
    });

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
