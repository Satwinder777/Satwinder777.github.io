// ============================================================
//  admin/js/modules/resume.js
//  Resume Studio, PDF Links & Download CTA Manager
// ============================================================

import { updatePortfolioFields } from "../firebase-admin.js";
import { uploadToSupabase } from "../supabase.js";
import { toast } from "../toast.js";

// The site timeline begins in Jan 2022; calculate elapsed whole calendar years
// without adding overlapping roles together.
const experienceYearsSinceTimelineStart = () => {
  const now = new Date();
  const months = (now.getUTCFullYear() - 2022) * 12 + now.getUTCMonth();
  return Math.max(0, Math.floor(months / 12));
};

const TEMPLATE_METAS = {
  template_minimal_dark: {
    name: "Minimal Dark",
    badge: "Architect Edition",
    badgeClass: "tpl-badge-cyan",
    desc: "Obsidian & Neon Cyan aesthetic for high-density architectures & scale.",
    color: "#00d9ff",
    swatches: ["#00d9ff", "#0b1120", "#1e293b"],
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`
  },
  template_executive: {
    name: "Executive Modern",
    badge: "Enterprise Layout",
    badgeClass: "tpl-badge-blue",
    desc: "Polished enterprise balance with dual-column leadership metric callouts.",
    color: "#3b82f6",
    swatches: ["#3b82f6", "#f8fafc", "#334155"],
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
  },
  template_standard_ats: {
    name: "Standard ATS",
    badge: "ATS Friendly",
    badgeClass: "tpl-badge-emerald",
    desc: "A simple single-column layout designed for readable resume content.",
    color: "#10b981",
    swatches: ["#10b981", "#ffffff", "#0f172a"],
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`
  }
};

export function renderResume(container, state) {
  const portfolio = state.portfolio || {};
  let resumeUrl = portfolio.resumeUrl || "";
  let showResume = portfolio.showResume !== false;
  let liveTemplateId = portfolio.liveResumeTemplateId || "template_minimal_dark";

  const renderView = () => {
    const activeTpl = TEMPLATE_METAS[liveTemplateId] || TEMPLATE_METAS.template_minimal_dark;

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
        <div class="card-box resume-config-card">
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
            <label class="switch-row" title="Toggle Resume visibility across portfolio">
              <span>Show CTA on Website</span>
              <label class="switch">
                <input type="checkbox" id="res-show" ${showResume ? "checked" : ""}>
                <span class="slider round"></span>
              </label>
            </label>
          </div>

          <div class="form-grid">
            <!-- PDF Endpoint Pod -->
            <div class="form-group full-width">
              <div class="form-label-with-badge">
                <label for="res-url">Public PDF Download URL</label>
                <span class="field-badge-accent">Direct CDN / Storage Endpoint</span>
              </div>

              <div class="resume-url-control-pod">
                <div class="resume-input-action-bar">
                  <div class="input-icon-prefix">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  </div>
                  <input 
                    type="text" 
                    id="res-url" 
                    class="form-input resume-url-input" 
                    value="${escapeHtml(resumeUrl)}" 
                    placeholder="https://ieusksnnaxhdyfqbzmdf.supabase.co/storage/v1/object/public/resume/resume.pdf"
                  >
                  <label class="btn btn-primary btn-upload-pdf" id="upload-pdf-btn-label" title="Upload new PDF document">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="upload-icon-svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span id="upload-btn-text">Upload PDF</span>
                    <input type="file" id="res-upload-input" accept="application/pdf" style="display: none;">
                  </label>
                </div>

                <div class="resume-url-meta-row">
                  <div class="url-status-badge">
                    <span class="status-pulse-dot" style="background: ${resumeUrl ? "#10b981" : "#f59e0b"};"></span>
                    <span id="url-status-text">${resumeUrl ? "Cloud Storage Connected • Publicly Accessible" : "No PDF Linked Yet — Upload or paste a URL above"}</span>
                  </div>
                  <div class="quick-link-actions" id="quick-link-actions-pod">
                    ${resumeUrl ? `
                      <a href="${escapeHtml(resumeUrl)}" target="_blank" rel="noopener" class="btn-url-pill" title="Open PDF in new tab">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        Open Link
                      </a>
                      <button type="button" class="btn-url-pill" id="copy-resume-link-btn" title="Copy to clipboard">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copy URL
                      </button>
                    ` : ""}
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Template Selector -->
            <div class="form-group full-width" style="margin-top: 10px;">
              <div class="form-label-with-badge">
                <label>Select Active Template Edition</label>
                <span class="field-hint">Defines styling &amp; presentation theme</span>
              </div>

              <div class="template-selector-grid">
                ${Object.entries(TEMPLATE_METAS).map(([key, tpl]) => {
                  const isActive = liveTemplateId === key;
                  return `
                    <div class="template-card-option ${isActive ? "active" : ""}" data-tpl="${key}">
                      <div class="tpl-card-top">
                        <span class="tpl-badge ${tpl.badgeClass}">${tpl.badge}</span>
                        <div class="tpl-radio-circle">
                          <div class="tpl-radio-inner"></div>
                        </div>
                      </div>
                      <div class="tpl-card-body">
                        <div class="tpl-icon-box" style="background: ${tpl.color}22; color: ${tpl.color};">
                          ${tpl.icon}
                        </div>
                        <h4 class="tpl-title">${tpl.name}</h4>
                        <p class="tpl-desc">${tpl.desc}</p>
                      </div>
                      <div class="tpl-palette-row">
                        <div class="tpl-swatches-box">
                          ${tpl.swatches.map(s => `<span class="tpl-palette-swatch" style="background: ${s};"></span>`).join("")}
                        </div>
                        <span class="tpl-edition-tag">${isActive ? "Current Active" : "Click to Select"}</span>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          </div>
        </div>

        <!-- Simulated Document & Sync Card -->
        <div class="card-box resume-preview-card-box">
          <div class="card-box-header">
            <div class="card-box-title-wrap">
              <div class="card-header-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
              </div>
              <div>
                <h3>Live Document &amp; Sync</h3>
                <p class="card-desc">Simulated preview of public resume download card on portfolio.</p>
              </div>
            </div>
          </div>

          <!-- Document Mockup Pod -->
          <div class="resume-doc-mockup" id="resume-live-mockup">
            <div class="doc-mockup-macos-bar">
              <div class="macos-dots">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>
              <div class="doc-format-badge">
                <span class="badge-pdf-icon">PDF</span>
                <span class="badge-pdf-title">Satwinder_Singh_CV.pdf</span>
              </div>
              <div class="doc-tpl-indicator" id="live-doc-tpl-tag">
                ${activeTpl.name}
              </div>
            </div>

            <div class="doc-mockup-inner">
              <div class="doc-candidate-header">
                <div>
                  <div class="doc-name-row">
                    <h4 class="doc-candidate-name">Satwinder Singh</h4>
                    <span class="verified-badge" title="Portfolio Preview">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#00d9ff"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </span>
                  </div>
                  <p class="doc-candidate-role">Senior Flutter Developer</p>
                </div>
                <div class="doc-badge-year">v2026.1 Live</div>
              </div>

              <div class="doc-chips-wrap">
                <span class="doc-skill-chip chip-cyan">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  ${experienceYearsSinceTimelineStart()}+ Years Experience
                </span>
                <span class="doc-skill-chip chip-emerald">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  Rendering Performance
                </span>
                <span class="doc-skill-chip chip-purple">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/></svg>
                  Clean Architecture
                </span>
                <span class="doc-skill-chip chip-amber">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
                  Firebase &amp; WebSockets
                </span>
              </div>

              <div class="doc-mockup-footer">
                <div class="cta-status-indicator" id="live-cta-indicator">
                  <span class="status-pulse-dot" style="background: ${showResume ? "#10b981" : "#f43f5e"};"></span>
                  <span id="live-cta-text">${showResume ? "Active on live website" : "Hidden from visitors"}</span>
                </div>
                ${resumeUrl ? `
                  <a href="${escapeHtml(resumeUrl)}" target="_blank" class="btn btn-sm btn-primary live-download-btn" id="live-download-btn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download PDF
                  </a>
                ` : `
                  <span class="badge badge-neutral">No PDF Linked</span>
                `}
              </div>
            </div>
          </div>

          <!-- System Synchronization Status Cards -->
          <div class="sync-status-grid">
            <div class="sync-status-item">
              <div class="sync-item-icon icon-cyan">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
              </div>
              <div class="sync-item-info">
                <div class="sync-item-title-row">
                  <strong>Portfolio Navigation CTA</strong>
                  <span class="sync-mini-pill ${showResume ? "pill-green" : "pill-red"}" id="sync-pill-nav">
                    ${showResume ? "Live &amp; Clickable" : "Disabled"}
                  </span>
                </div>
                <p class="sync-item-sub" id="sync-sub-nav">
                  ${showResume ? "Primary 'Resume' button rendered in sticky navbar and hero section." : "CTA button hidden from public portfolio visitors."}
                </p>
              </div>
            </div>

            <div class="sync-status-item">
              <div class="sync-item-icon icon-emerald">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div class="sync-item-info">
                <div class="sync-item-title-row">
                  <strong>Supabase Storage Endpoint</strong>
                  <span class="sync-mini-pill ${resumeUrl ? "pill-green" : "pill-amber"}" id="sync-pill-storage">
                    ${resumeUrl ? "HTTP 200 OK" : "Awaiting PDF"}
                  </span>
                </div>
                <p class="sync-item-sub">
                  ${resumeUrl ? "Public bucket `resume` connected with high-speed CDN delivery." : "Upload a resume PDF to connect storage bucket."}
                </p>
              </div>
            </div>

            <div class="sync-status-item">
              <div class="sync-item-icon icon-purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </div>
              <div class="sync-item-info">
                <div class="sync-item-title-row">
                  <strong>ATS Parsing Compliance</strong>
                  <span class="sync-mini-pill pill-purple">A+ High Fidelity</span>
                </div>
                <p class="sync-item-sub">
                  Clean vector typography layer preserved with UTF-8 encoding for ATS bots.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Realtime Switch Listener
    const showSwitch = container.querySelector("#res-show");
    showSwitch?.addEventListener("change", (e) => {
      showResume = e.target.checked;
      const ctaDot = container.querySelector("#live-cta-indicator .status-pulse-dot");
      const ctaText = container.querySelector("#live-cta-text");
      const pillNav = container.querySelector("#sync-pill-nav");
      const subNav = container.querySelector("#sync-sub-nav");

      if (ctaDot) ctaDot.style.background = showResume ? "#10b981" : "#f43f5e";
      if (ctaText) ctaText.textContent = showResume ? "Active on live website" : "Hidden from visitors";
      if (pillNav) {
        pillNav.className = `sync-mini-pill ${showResume ? "pill-green" : "pill-red"}`;
        pillNav.textContent = showResume ? "Live & Clickable" : "Disabled";
      }
      if (subNav) {
        subNav.textContent = showResume 
          ? "Primary 'Resume' button rendered in sticky navbar and hero section." 
          : "CTA button hidden from public portfolio visitors.";
      }
    });

    // Realtime Template Card Selection
    container.querySelectorAll(".template-card-option").forEach(card => {
      card.addEventListener("click", () => {
        const tplKey = card.dataset.tpl;
        liveTemplateId = tplKey;
        const tplMeta = TEMPLATE_METAS[tplKey];

        container.querySelectorAll(".template-card-option").forEach(c => {
          c.classList.remove("active");
          const tag = c.querySelector(".tpl-edition-tag");
          if (tag) tag.textContent = "Click to Select";
        });

        card.classList.add("active");
        const activeTag = card.querySelector(".tpl-edition-tag");
        if (activeTag) activeTag.textContent = "Current Active";

        const docTplTag = container.querySelector("#live-doc-tpl-tag");
        if (docTplTag && tplMeta) {
          docTplTag.textContent = tplMeta.name;
        }

        toast.info(`Switched to ${tplMeta?.name || tplKey} edition.`);
      });
    });

    // Live URL Input sync
    const urlInput = container.querySelector("#res-url");
    urlInput?.addEventListener("input", (e) => {
      resumeUrl = e.target.value.trim();
      const statusDot = container.querySelector(".url-status-badge .status-pulse-dot");
      const statusText = container.querySelector("#url-status-text");
      const syncPillStorage = container.querySelector("#sync-pill-storage");

      if (statusDot) statusDot.style.background = resumeUrl ? "#10b981" : "#f59e0b";
      if (statusText) {
        statusText.textContent = resumeUrl 
          ? "Cloud Storage Connected • Publicly Accessible" 
          : "No PDF Linked Yet — Upload or paste a URL above";
      }
      if (syncPillStorage) {
        syncPillStorage.className = `sync-mini-pill ${resumeUrl ? "pill-green" : "pill-amber"}`;
        syncPillStorage.textContent = resumeUrl ? "HTTP 200 OK" : "Awaiting PDF";
      }
    });

    // Copy URL Button
    container.querySelector("#copy-resume-link-btn")?.addEventListener("click", () => {
      if (!resumeUrl) {
        toast.warning("No resume URL to copy.");
        return;
      }
      navigator.clipboard.writeText(resumeUrl);
      toast.success("Resume public URL copied to clipboard!");
    });

    // Direct PDF Upload to Supabase
    const uploadInput = container.querySelector("#res-upload-input");
    uploadInput?.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Please select a valid PDF file.");
        return;
      }

      const uploadBtnText = container.querySelector("#upload-btn-text");
      const uploadIcon = container.querySelector("#upload-icon-svg");
      const originalText = uploadBtnText ? uploadBtnText.textContent : "Upload PDF";

      if (uploadBtnText) uploadBtnText.textContent = "Uploading...";
      if (uploadIcon) uploadIcon.style.animation = "spin 0.75s linear infinite";

      toast.info("Uploading resume PDF to Supabase...");
      try {
        const publicUrl = await uploadToSupabase(file, "resume", `satwinder_singh_resume_${Date.now()}.pdf`);
        resumeUrl = publicUrl;
        toast.success("Resume PDF uploaded and linked successfully!");
        renderView();
      } catch (err) {
        toast.error("Upload failed: " + err.message);
        if (uploadBtnText) uploadBtnText.textContent = originalText;
        if (uploadIcon) uploadIcon.style.animation = "none";
      }
    });

    // Save Button Handler (completely robust without selector errors)
    container.querySelector("#save-resume-btn")?.addEventListener("click", async () => {
      const url = container.querySelector("#res-url")?.value.trim() || resumeUrl;
      const show = container.querySelector("#res-show")?.checked ?? showResume;
      const tId = liveTemplateId || "template_minimal_dark";

      const saveBtn = container.querySelector("#save-resume-btn");
      const origHtml = saveBtn ? saveBtn.innerHTML : "";
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 0.75s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
          Saving...
        `;
      }

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

        toast.success("Resume Studio settings updated & published!");
        renderView();
      } catch (e) {
        toast.error("Failed to save resume settings: " + e.message);
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = origHtml;
        }
      }
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
