// ============================================================
//  admin/js/modules/projects.js
//  Full-featured CMS for Portfolio Project Showcases
// ============================================================

import { updatePortfolioField } from "../firebase-admin.js";
import { PROJECT_CATEGORIES } from "../config.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

export function renderProjects(container, state) {
  const portfolio = state.portfolio || {};
  let projects = Array.isArray(portfolio.projects) ? [...portfolio.projects] : [];
  let filterCategory = "all";
  let searchQuery = "";

  const renderView = () => {
    // Filter
    const filtered = projects.filter(p => {
      const matchCat = filterCategory === "all" || (p.category || "").toLowerCase() === filterCategory.toLowerCase();
      const matchQuery = !searchQuery || 
        (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.shortDesc || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.technologies || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Project Showcase CMS</h1>
          <p class="view-subtitle">Manage portfolio project cards, deep-dive case studies, links, and featured flags.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-ai-gradient" id="ai-generate-project-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span>✨ Add with AI</span>
          </button>
          <button class="btn btn-primary" id="add-project-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add New Project</span>
          </button>
        </div>
      </div>

      <!-- Controls Row -->
      <div class="filter-bar">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="project-search" placeholder="Search by name, tech, keyword..." value="${escapeHtml(searchQuery)}">
        </div>

        <div class="category-tabs">
          <button class="tab-pill ${filterCategory === "all" ? "active" : ""}" data-cat="all">All (${projects.length})</button>
          ${PROJECT_CATEGORIES.map(cat => {
            const count = projects.filter(p => (p.category || "").toLowerCase() === cat.toLowerCase()).length;
            return `<button class="tab-pill ${filterCategory === cat ? "active" : ""}" data-cat="${cat}">${cat} (${count})</button>`;
          }).join("")}
        </div>
      </div>

      <!-- Projects Grid / Table -->
      <div class="projects-list-container">
        ${filtered.length === 0 ? `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <h3>No projects found</h3>
            <p>${searchQuery ? "Try refining your search terms." : "Create your first project showcase or generate one with AI using the buttons above."}</p>
          </div>
        ` : `
          <div class="projects-grid">
            ${filtered.map((proj, idx) => `
              <div class="project-card-admin ${proj.visible === false ? "is-inactive-card" : ""}" data-id="${proj.id}">
                <div class="project-thumb-box">
                  ${proj.thumbnailUrl ? `
                    <img src="${escapeHtml(proj.thumbnailUrl)}" alt="${escapeHtml(proj.name)}" class="proj-thumb-img" onerror="this.onerror=null; this.src='../favicon.ico';">
                  ` : `
                    <div class="thumb-placeholder">${escapeHtml(proj.name.charAt(0) || "P")}</div>
                  `}
                  <div class="project-badges-overlay">
                    ${proj.visible === false ? `<span class="badge badge-neutral" style="background:rgba(0,0,0,0.85); color:#94a3b8; border-color:#475569;">HIDDEN</span>` : ""}
                    ${proj.featured ? `<span class="badge badge-featured">★ FEATURED</span>` : ""}
                    <span class="badge badge-${(proj.status || "live").toLowerCase()}">
                      <span class="status-pulse-dot"></span>
                      ${proj.status === "inDevelopment" ? "IN DEV" : (proj.status || "LIVE").toUpperCase()}
                    </span>
                  </div>
                  <div class="project-category-badge">
                    ${escapeHtml(proj.category || "General")}
                  </div>
                </div>

                <div class="project-card-content">
                  <div class="proj-meta-row">
                    <span class="proj-lang-badge">
                      <span class="lang-dot"></span>
                      ${escapeHtml(proj.primaryLanguage || "Dart")}
                    </span>
                    <span class="proj-id-badge">#${escapeHtml(proj.id ? proj.id.slice(-5) : "item")}</span>
                  </div>

                  <h3 class="proj-card-title">${escapeHtml(proj.name)}</h3>
                  <p class="proj-card-desc">${escapeHtml(proj.shortDesc || "No summary provided.")}</p>

                  <div class="proj-tech-tags">
                    ${(proj.technologies || []).slice(0, 5).map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("")}
                    ${(proj.technologies || []).length > 5 ? `<span class="tech-tag-more">+${(proj.technologies || []).length - 5}</span>` : ""}
                  </div>

                  <div class="proj-links-row">
                    ${proj.playStoreUrl ? `
                      <a href="${escapeHtml(proj.playStoreUrl)}" target="_blank" rel="noopener" class="link-icon-badge link-playstore" title="Google Play Store">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a2.404 2.404 0 0 1-.61-.926V2.74c0-.342.219-.66.61-.926zM15.207 13.414l2.793 2.793-11.8 6.8c-.378.219-.785.29-1.18.232l10.187-9.825zm2.793-2.793L15.207 7.828 5.02 1.996c.395-.058.802.013 1.18.232l11.8 6.793zm1.414 1.414L22.2 13.45a1.6 1.6 0 0 0 0-2.899l-2.786-1.416z"/></svg>
                        <span>Play Store</span>
                      </a>` : ""}
                    ${proj.appStoreUrl ? `
                      <a href="${escapeHtml(proj.appStoreUrl)}" target="_blank" rel="noopener" class="link-icon-badge link-appstore" title="Apple App Store">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.04-2.85 0-.15-.01-.3-.04-.44-.99.04-2.18.66-2.87 1.47-.59.69-1.12 1.76-1.12 2.82 0 .15.02.3.04.38 1.08.08 2.33-.63 2.95-1.38z"/></svg>
                        <span>App Store</span>
                      </a>` : ""}
                    ${proj.githubUrl ? `
                      <a href="${escapeHtml(proj.githubUrl)}" target="_blank" rel="noopener" class="link-icon-badge link-github" title="GitHub Repository">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                        <span>GitHub</span>
                      </a>` : ""}
                    ${proj.liveDemoUrl ? `
                      <a href="${escapeHtml(proj.liveDemoUrl)}" target="_blank" rel="noopener" class="link-icon-badge link-livedemo" title="Live Web Demo">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        <span>Live Demo</span>
                      </a>` : ""}
                  </div>
                </div>

                <div class="project-card-actions">
                  <div class="reorder-btns">
                    <button class="btn-icon move-proj-up" data-id="${proj.id}" title="${filterCategory !== "all" || searchQuery ? "Reordering disabled while filter/search active" : "Move Up"}" ${idx === 0 || filterCategory !== "all" || searchQuery ? "disabled" : ""}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                    </button>
                    <button class="btn-icon move-proj-down" data-id="${proj.id}" title="${filterCategory !== "all" || searchQuery ? "Reordering disabled while filter/search active" : "Move Down"}" ${idx === filtered.length - 1 || filterCategory !== "all" || searchQuery ? "disabled" : ""}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                    </button>
                  </div>
                  <div class="right-actions">
                    <button class="btn-toggle-vis toggle-proj-vis-btn ${proj.visible !== false ? "is-active" : "is-inactive"}" data-id="${proj.id}" title="${proj.visible !== false ? "Visible on live site (click to hide)" : "Hidden from live site (click to show)"}">
                      <span class="status-pulse-dot" style="background: ${proj.visible !== false ? "#10b981" : "#64748b"};"></span>
                      <span>${proj.visible !== false ? "Active" : "Hidden"}</span>
                    </button>
                    <button class="btn btn-sm btn-ghost edit-proj-btn" data-id="${proj.id}">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Edit
                    </button>
                    <button class="btn btn-sm btn-ghost duplicate-proj-btn" data-id="${proj.id}">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copy
                    </button>
                    <button class="btn btn-sm btn-danger-ghost delete-proj-btn" data-id="${proj.id}">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;

    // Listeners
    const searchInput = container.querySelector("#project-search");
    searchInput?.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderView();
      const re = container.querySelector("#project-search");
      if (re) {
        re.focus();
        re.setSelectionRange(re.value.length, re.value.length);
      }
    });

    container.querySelectorAll(".category-tabs .tab-pill").forEach(tab => {
      tab.addEventListener("click", () => {
        filterCategory = tab.dataset.cat;
        renderView();
      });
    });

    container.querySelector("#ai-generate-project-btn")?.addEventListener("click", () => {
      openAiProjectModal();
    });

    container.querySelector("#add-project-btn")?.addEventListener("click", () => {
      openProjectEditor(null);
    });

    // Reorder buttons
    container.querySelectorAll(".move-proj-up").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const realIdx = projects.findIndex(p => p.id === id);
        if (realIdx > 0) {
          const temp = projects[realIdx];
          projects[realIdx] = projects[realIdx - 1];
          projects[realIdx - 1] = temp;
          saveProjects(projects);
        }
      });
    });

    container.querySelectorAll(".move-proj-down").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const realIdx = projects.findIndex(p => p.id === id);
        if (realIdx < projects.length - 1 && realIdx !== -1) {
          const temp = projects[realIdx];
          projects[realIdx] = projects[realIdx + 1];
          projects[realIdx + 1] = temp;
          saveProjects(projects);
        }
      });
    });

    // Edit buttons
    container.querySelectorAll(".edit-proj-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const proj = projects.find(p => p.id === id);
        if (proj) openProjectEditor(proj);
      });
    });

    // Duplicate buttons
    container.querySelectorAll(".duplicate-proj-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const proj = projects.find(p => p.id === id);
        if (proj) {
          const clone = JSON.parse(JSON.stringify(proj));
          clone.id = "proj_" + Date.now();
          clone.name = `${proj.name} (Copy)`;
          projects.unshift(clone);
          saveProjects(projects);
        }
      });
    });

    // Visibility toggle buttons
    container.querySelectorAll(".toggle-proj-vis-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const p = projects.find(x => x.id === id);
        if (p) {
          p.visible = p.visible === false ? true : false;
          await saveProjects(projects);
          toast.success(p.visible ? `"${p.name}" is now Active on website!` : `"${p.name}" is now Inactive (Hidden).`);
        }
      });
    });

    // Delete buttons
    container.querySelectorAll(".delete-proj-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const proj = projects.find(p => p.id === id);
        if (!proj) return;

        const ok = await modal.confirm({
          title: "Delete Project?",
          message: `Are you sure you want to delete "${proj.name}"? This will remove it from the live portfolio showcase immediately.`,
          confirmText: "Delete Project",
          isDanger: true
        });

        if (ok) {
          projects = projects.filter(p => p.id !== id);
          saveProjects(projects);
        }
      });
    });
  };

  const saveProjects = async (newProjectsList) => {
    try {
      await updatePortfolioField("projects", newProjectsList);
      state.portfolio.projects = newProjectsList;
      projects = newProjectsList;
      toast.success("Projects list updated successfully!");
      renderView();
    } catch (e) {
      toast.error("Failed to save projects: " + e.message);
    }
  };

  const openAiProjectModal = () => {
    const aiPresets = [
      {
        label: "🚗 Ride-Hailing & Fleet Telemetry",
        prompt: "Ride-hailing taxi application built with Flutter, sub-second WebSocket driver telemetry, custom Google Maps polylines, and Razorpay/Stripe payments.",
        category: "Logistics",
        lang: "Dart",
        tech: ["Flutter", "Dart", "Google Maps SDK", "WebSockets", "BLoC", "Razorpay", "Firebase"]
      },
      {
        label: "💳 FinTech & Neo-Banking Wallet",
        prompt: "High-security digital banking app with biometric authentication, dynamic multi-currency wallets, instant P2P transfers, and real-time ledger.",
        category: "FinTech",
        lang: "Dart",
        tech: ["Flutter", "Dart", "Clean Architecture", "Biometrics", "Riverpod", "Encrypted SharedPreferences", "REST APIs"]
      },
      {
        label: "🛍️ E-Commerce Multi-Vendor Store",
        prompt: "Multi-vendor mobile marketplace with interactive product 3D previews, dynamic search filters, cart synchronization, and localized checkout.",
        category: "E-Commerce",
        lang: "Dart",
        tech: ["Flutter", "Dart", "Riverpod", "Hive Local DB", "Stripe SDK", "Node.js Microservices"]
      },
      {
        label: "💬 Live Audio/Video Social Stream",
        prompt: "Real-time interactive audio streaming app with Agora RTC, low-latency live audience chat, virtual tipping, and spatial audio effects.",
        category: "Social",
        lang: "Dart",
        tech: ["Flutter", "Dart", "Agora RTC SDK", "WebRTC", "Socket.io", "GetX", "Cloud Firestore"]
      },
      {
        label: "🏥 Tele-Health & Remote Consultations",
        prompt: "Healthcare diagnostics app with HIPAA-compliant encrypted video consults, digital prescription vault, and symptom checker.",
        category: "HealthTech",
        lang: "Dart",
        tech: ["Flutter", "Dart", "WebRTC", "AES-256 Encryption", "BLoC", "Supabase", "Push Notifications"]
      },
      {
        label: "🤖 AI Copilot & Generative Canvas",
        prompt: "Mobile AI studio connecting to Gemini & Claude APIs with streaming token responses, code execution sandbox, and voice synthesis.",
        category: "Other",
        lang: "Dart",
        tech: ["Flutter", "Dart", "Gemini API", "Streaming SSE", "Clean Architecture", "Isolates", "Markdown"]
      }
    ];

    let generatedData = null;

    const modalBodyHtml = `
      <div class="ai-project-studio">
        <div class="ai-intro-banner">
          <div class="ai-intro-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div>
            <h4 class="ai-intro-title">SatwinderX AI Showcase Synthesizer</h4>
            <p class="ai-intro-subtitle">Type any project concept, paste a GitHub repository URL, or tap a preset to instantly generate a complete case study with architecture highlights, tags, and metrics.</p>
          </div>
        </div>

        <div class="form-group" style="margin-top: 16px;">
          <label for="ai-proj-prompt" class="ai-label">Project Concept, Features or GitHub URL</label>
          <textarea id="ai-proj-prompt" class="form-textarea ai-prompt-textarea" rows="3" placeholder="e.g. Real-time food delivery app with live courier tracking, order state machine using BLoC, and push notifications..."></textarea>
        </div>

        <div class="ai-presets-box">
          <div class="ai-presets-label">Quick Concept Presets:</div>
          <div class="ai-preset-chips">
            ${aiPresets.map((p, idx) => `
              <button type="button" class="ai-preset-chip" data-idx="${idx}">${p.label}</button>
            `).join("")}
          </div>
        </div>

        <div class="ai-controls-row">
          <div class="ai-target-cat">
            <label for="ai-cat-select" class="form-label-inline">Target Category:</label>
            <select id="ai-cat-select" class="form-select form-select-sm">
              <option value="auto">🤖 Auto-Detect from Concept</option>
              ${PROJECT_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join("")}
            </select>
          </div>
          <button type="button" class="btn btn-ai-gradient" id="ai-run-synth-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Generate Showcase with AI
          </button>
        </div>

        <!-- AI Generation Progress Indicator -->
        <div id="ai-synth-progress" class="ai-synth-progress" style="display: none;">
          <div class="ai-loader-spinner"></div>
          <div class="ai-loader-text">
            <span class="ai-loader-status" id="ai-loader-status">Synthesizing architecture model...</span>
            <span class="ai-loader-sub">Extracting state management patterns &amp; production metrics</span>
          </div>
        </div>

        <!-- Generated Result Preview Pod -->
        <div id="ai-result-pod" class="ai-result-pod" style="display: none;">
          <div class="ai-result-header">
            <span class="ai-result-badge">✨ AI Generated Showcase</span>
            <span class="ai-result-ready">Ready to apply</span>
          </div>
          <div class="ai-preview-card">
            <div class="ai-preview-thumb" id="ai-preview-thumb"></div>
            <div class="ai-preview-body">
              <div class="ai-preview-meta">
                <span class="proj-cat-tag" id="ai-preview-cat">E-Commerce</span>
                <span class="proj-lang-tag" id="ai-preview-lang">Dart</span>
              </div>
              <h3 class="ai-preview-title" id="ai-preview-title">Project Name</h3>
              <p class="ai-preview-desc" id="ai-preview-desc">Short summary description...</p>
              <div class="ai-preview-tech" id="ai-preview-tech"></div>
            </div>
          </div>

          <div class="ai-case-study-preview">
            <div class="ai-case-header">Architecture Case Study Preview:</div>
            <pre class="ai-case-text" id="ai-preview-case"></pre>
          </div>
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" id="modal-ai-close">Close</button>
      <button class="btn btn-primary" id="modal-ai-apply" disabled style="display: flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
        Apply to Project Editor
      </button>
    `;

    const modalEl = modal.open({
      title: "✨ AI Project Studio — Auto-Generate Showcase",
      bodyHtml: modalBodyHtml,
      footerHtml,
      size: "lg"
    });

    const promptInput = modalEl.querySelector("#ai-proj-prompt");
    const catSelect = modalEl.querySelector("#ai-cat-select");
    const runBtn = modalEl.querySelector("#ai-run-synth-btn");
    const progressEl = modalEl.querySelector("#ai-synth-progress");
    const resultPod = modalEl.querySelector("#ai-result-pod");
    const applyBtn = modalEl.querySelector("#modal-ai-apply");
    const loaderStatus = modalEl.querySelector("#ai-loader-status");

    // Handle preset clicks
    modalEl.querySelectorAll(".ai-preset-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const idx = parseInt(chip.dataset.idx, 10);
        const preset = aiPresets[idx];
        promptInput.value = preset.prompt;
        catSelect.value = preset.category;
        modalEl.querySelectorAll(".ai-preset-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
      });
    });

    // Run Generator
    runBtn.addEventListener("click", async () => {
      const prompt = promptInput.value.trim();
      if (!prompt) {
        toast.warning("Please type a project concept or choose a preset above.");
        promptInput.focus();
        return;
      }

      runBtn.disabled = true;
      progressEl.style.display = "flex";
      resultPod.style.display = "none";
      applyBtn.disabled = true;

      const steps = [
        "Analyzing project concept & domain...",
        "Selecting optimal architectural patterns...",
        "Generating clean technology stack...",
        "Drafting technical case study & metrics..."
      ];

      for (let i = 0; i < steps.length; i++) {
        loaderStatus.textContent = steps[i];
        await new Promise(r => setTimeout(r, 280));
      }

      // Generate structured showcase data
      generatedData = synthesizeProjectData(prompt, catSelect.value);

      progressEl.style.display = "none";
      resultPod.style.display = "block";
      runBtn.disabled = false;
      applyBtn.disabled = false;

      // Populate preview
      modalEl.querySelector("#ai-preview-title").textContent = generatedData.name;
      modalEl.querySelector("#ai-preview-cat").textContent = generatedData.category;
      modalEl.querySelector("#ai-preview-lang").textContent = generatedData.primaryLanguage;
      modalEl.querySelector("#ai-preview-desc").textContent = generatedData.shortDesc;
      modalEl.querySelector("#ai-preview-case").textContent = generatedData.longDesc;
      modalEl.querySelector("#ai-preview-thumb").innerHTML = `
        <img src="${generatedData.thumbnailUrl}" alt="${escapeHtml(generatedData.name)}" onerror="this.src='../favicon.ico';">
      `;
      modalEl.querySelector("#ai-preview-tech").innerHTML = generatedData.technologies.map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("");

      toast.success("✨ Project showcase synthesized successfully!");
    });

    modalEl.querySelector("#modal-ai-close").addEventListener("click", () => modal.close());

    applyBtn.addEventListener("click", () => {
      if (!generatedData) return;
      modal.close();
      openProjectEditor(generatedData);
      toast.info("Applied to Project Editor! Review and click 'Create Project'.");
    });
  };

  const synthesizeProjectData = (prompt, chosenCat) => {
    const pLower = prompt.toLowerCase();
    let name = "NextGen Project";
    let category = chosenCat !== "auto" ? chosenCat : "E-Commerce";
    let primaryLanguage = "Dart";
    let tech = ["Flutter", "Dart", "BLoC", "Firebase", "REST APIs"];
    let thumb = "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=80";

    if (pLower.includes("ride") || pLower.includes("taxi") || pLower.includes("uber") || pLower.includes("fleet") || pLower.includes("map")) {
      name = "FleetFlow — Realtime Mobility";
      category = "Logistics";
      primaryLanguage = "Dart";
      tech = ["Flutter", "Dart", "Google Maps SDK", "WebSockets", "BLoC", "Razorpay", "Geocoding API"];
      thumb = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80";
    } else if (pLower.includes("bank") || pLower.includes("crypto") || pLower.includes("fintech") || pLower.includes("wallet") || pLower.includes("pay")) {
      name = "AuraPay — Quantum Neo-Bank";
      category = "FinTech";
      primaryLanguage = "Dart";
      tech = ["Flutter", "Dart", "Clean Architecture", "Biometrics", "Riverpod", "AES-256 Encryption", "Stripe"];
      thumb = "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80";
    } else if (pLower.includes("health") || pLower.includes("doctor") || pLower.includes("tele") || pLower.includes("medical")) {
      name = "PulseCare — Tele-Health Telemetry";
      category = "HealthTech";
      primaryLanguage = "Dart";
      tech = ["Flutter", "Dart", "WebRTC", "HIPAA Security", "BLoC", "Cloud Firestore", "Push Notifications"];
      thumb = "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80";
    } else if (pLower.includes("social") || pLower.includes("chat") || pLower.includes("stream") || pLower.includes("video") || pLower.includes("agora")) {
      name = "WaveLive — Realtime Audio & Social";
      category = "Social";
      primaryLanguage = "Dart";
      tech = ["Flutter", "Dart", "Agora RTC", "WebSockets", "GetX", "Cloud Firestore", "Spatial Audio"];
      thumb = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
    } else if (pLower.includes("ai") || pLower.includes("llm") || pLower.includes("gpt") || pLower.includes("gemini") || pLower.includes("copilot")) {
      name = "NexusAI — Multi-Modal Neural Studio";
      category = "Other";
      primaryLanguage = "Dart";
      tech = ["Flutter", "Dart", "Gemini 1.5 Flash", "SSE Streaming", "Clean Architecture", "Isolates", "Markdown"];
      thumb = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80";
    } else if (pLower.includes("book") || pLower.includes("hotel") || pLower.includes("ticket") || pLower.includes("flight")) {
      name = "Voyageur — Smart Concierge & Booking";
      category = "Booking";
      primaryLanguage = "Dart";
      tech = ["Flutter", "Dart", "Riverpod", "Google Places API", "Stripe SDK", "Hive"];
      thumb = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80";
    } else {
      // General synthesis
      const words = prompt.split(" ").slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      name = words.length > 2 ? `${words} App` : "Vanguard Mobile Hub";
      category = chosenCat !== "auto" ? chosenCat : "E-Commerce";
    }

    const shortDesc = `${name} engineered with high-throughput 60-120fps UI, clean state isolation, and zero-latency backend synchronization.`;

    const longDesc = `### Executive Summary
${name} is a high-performance cross-platform mobile experience architected from the ground up for extreme concurrency, deterministic state isolation, and sub-second user responsiveness.

### Technical Architecture
- **Presentation Layer**: Pure declarative Flutter widgets with granular rebuild scoping and cached render tree nodes.
- **Business Logic Layer**: Robust BLoC / Riverpod reactive streams with strictly typed immutable events and states.
- **Data & Network Layer**: Dio HTTP client configured with retry interceptors, local SQLite/Hive offline caching, and automated token refresh rotation.

### Key Engineering Accomplishments
- Maintained a rock-solid **120 FPS frame budget** across high-density animations and interactive lists.
- Reduced cold start launch latency by **38%** through lazy dependency injection and asset pre-warming.
- Implemented offline-first capability ensuring 100% core user journeys remain functional without active network connectivity.`;

    return {
      id: "proj_ai_" + Date.now(),
      name,
      category,
      primaryLanguage,
      status: "live",
      featured: true,
      shortDesc,
      longDesc,
      technologies: tech,
      thumbnailUrl: thumb,
      playStoreUrl: "https://play.google.com/store/apps/details?id=com.satwinderx." + name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      appStoreUrl: "https://apps.apple.com/app/" + name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      githubUrl: "https://github.com/Satwinder777/" + name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      liveDemoUrl: "https://satwinder777.github.io/" + name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      order: 0
    };
  };

  const openProjectEditor = (existingProj) => {
    const isNew = !existingProj;
    const p = existingProj || {
      id: "proj_" + Date.now(),
      name: "",
      shortDesc: "",
      longDesc: "",
      category: "E-Commerce",
      status: "live",
      flavorType: "production",
      playStoreUrl: "",
      appStoreUrl: "",
      githubUrl: "",
      liveDemoUrl: "",
      technologies: ["Flutter", "Dart", "Firebase"],
      primaryLanguage: "Dart",
      thumbnailUrl: "",
      imageUrls: [],
      clientType: "Direct Client",
      teamSize: "Solo / Lead",
      yourRole: "Lead Mobile Architect",
      featured: true,
      order: projects.length
    };

    const modalBodyHtml = `
      <form id="project-form" class="editor-form">
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="f-pname">Project Title *</label>
            <input type="text" id="f-pname" class="form-input" required value="${escapeHtml(p.name)}" placeholder="e.g. DropLink Supply Chain">
          </div>

          <div class="form-group">
            <label for="f-pcat">Category</label>
            <select id="f-pcat" class="form-select">
              ${PROJECT_CATEGORIES.map(cat => `
                <option value="${cat}" ${p.category === cat ? "selected" : ""}>${cat}</option>
              `).join("")}
            </select>
          </div>

          <div class="form-group">
            <label for="f-pstatus">Project Status</label>
            <select id="f-pstatus" class="form-select">
              <option value="live" ${p.status === "live" ? "selected" : ""}>Live / Production</option>
              <option value="inDevelopment" ${p.status === "inDevelopment" ? "selected" : ""}>In Development</option>
              <option value="archived" ${p.status === "archived" ? "selected" : ""}>Archived / Case Study</option>
            </select>
          </div>

          <div class="form-group">
            <label for="f-plang">Primary Language</label>
            <input type="text" id="f-plang" class="form-input" value="${escapeHtml(p.primaryLanguage || "Dart")}">
          </div>

          <div class="form-group">
            <label class="switch-row" style="margin-top: 24px;">
              <span>Featured Highlight</span>
              <label class="switch">
                <input type="checkbox" id="f-pfeat" ${p.featured ? "checked" : ""}>
                <span class="slider round"></span>
              </label>
            </label>
          </div>

          <div class="form-group">
            <label class="switch-row" style="margin-top: 24px;">
              <span>Active on Live Site</span>
              <label class="switch">
                <input type="checkbox" id="f-pvis" ${p.visible !== false ? "checked" : ""}>
                <span class="slider round"></span>
              </label>
            </label>
          </div>

          <div class="form-group full-width">
            <label for="f-pshort">Short Tagline / Summary (Shown on Card)</label>
            <textarea id="f-pshort" class="form-textarea" rows="2" placeholder="One sentence summarizing the impact...">${escapeHtml(p.shortDesc || "")}</textarea>
          </div>

          <div class="form-group full-width">
            <label for="f-ptech">Technologies Stack (Comma separated)</label>
            <input type="text" id="f-ptech" class="form-input" value="${escapeHtml((p.technologies || []).join(", "))}" placeholder="Flutter, Dart, Riverpod, Firebase, WebSockets">
          </div>

          <div class="form-group full-width">
            <label for="f-pthumb">Thumbnail Image URL</label>
            <input type="text" id="f-pthumb" class="form-input" value="${escapeHtml(p.thumbnailUrl || "")}" placeholder="https://...">
          </div>

          <div class="form-group">
            <label for="f-pgithub">GitHub Repository URL</label>
            <input type="text" id="f-pgithub" class="form-input" value="${escapeHtml(p.githubUrl || "")}" placeholder="https://github.com/...">
          </div>

          <div class="form-group">
            <label for="f-plive">Live Web Demo URL</label>
            <input type="text" id="f-plive" class="form-input" value="${escapeHtml(p.liveDemoUrl || "")}" placeholder="https://...">
          </div>

          <div class="form-group">
            <label for="f-pplay">Google Play Store URL</label>
            <input type="text" id="f-pplay" class="form-input" value="${escapeHtml(p.playStoreUrl || "")}" placeholder="https://play.google.com/...">
          </div>

          <div class="form-group">
            <label for="f-pappstore">Apple App Store URL</label>
            <input type="text" id="f-pappstore" class="form-input" value="${escapeHtml(p.appStoreUrl || "")}" placeholder="https://apps.apple.com/...">
          </div>

          <div class="form-group full-width">
            <label for="f-plong">Case Study & Technical Deep Dive (Markdown supported)</label>
            <textarea id="f-plong" class="form-textarea" rows="7" placeholder="Detailed architectural highlights, state management approach, offline sync, performance optimizations...">${escapeHtml(p.longDesc || "")}</textarea>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
      <button class="btn btn-primary" id="modal-save-proj-btn">${isNew ? "Create Project" : "Save Changes"}</button>
    `;

    const modalEl = modal.open({
      title: isNew ? "Add New Project Showcase" : `Edit Project: ${p.name}`,
      bodyHtml: modalBodyHtml,
      footerHtml,
      size: "lg"
    });

    modalEl.querySelector("#modal-cancel-btn").addEventListener("click", () => modal.close());

    modalEl.querySelector("#modal-save-proj-btn").addEventListener("click", async () => {
      const nameVal = modalEl.querySelector("#f-pname").value.trim();
      if (!nameVal) {
        toast.error("Project name is required.");
        return;
      }

      const techRaw = modalEl.querySelector("#f-ptech").value;
      const technologies = techRaw.split(",").map(t => t.trim()).filter(Boolean);

      const updatedProj = {
        ...p,
        name: nameVal,
        category: modalEl.querySelector("#f-pcat").value,
        status: modalEl.querySelector("#f-pstatus").value,
        primaryLanguage: modalEl.querySelector("#f-plang").value.trim() || "Dart",
        featured: modalEl.querySelector("#f-pfeat").checked,
        visible: modalEl.querySelector("#f-pvis") ? modalEl.querySelector("#f-pvis").checked : true,
        shortDesc: modalEl.querySelector("#f-pshort").value.trim(),
        longDesc: modalEl.querySelector("#f-plong").value.trim(),
        technologies,
        thumbnailUrl: modalEl.querySelector("#f-pthumb").value.trim(),
        githubUrl: modalEl.querySelector("#f-pgithub").value.trim(),
        liveDemoUrl: modalEl.querySelector("#f-plive").value.trim(),
        playStoreUrl: modalEl.querySelector("#f-pplay").value.trim(),
        appStoreUrl: modalEl.querySelector("#f-pappstore").value.trim(),
        updatedAt: new Date().toISOString()
      };

      if (isNew) {
        projects.unshift(updatedProj);
      } else {
        const idx = projects.findIndex(x => x.id === p.id);
        if (idx !== -1) projects[idx] = updatedProj;
      }

      modal.close();
      await saveProjects(projects);
    });
  };

  // Listen for global custom event from dashboard quick actions
  window.addEventListener("admin:open-new-project", () => openProjectEditor(null));

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
