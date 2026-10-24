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
          <button class="btn btn-primary" id="add-project-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add New Project
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
            <p>${searchQuery ? "Try refining your search terms." : "Create your first project showcase using the button above."}</p>
          </div>
        ` : `
          <div class="projects-grid">
            ${filtered.map((proj, idx) => `
              <div class="project-card-admin" data-id="${proj.id}">
                <div class="project-thumb-box">
                  ${proj.thumbnailUrl ? `
                    <img src="${proj.thumbnailUrl}" alt="${escapeHtml(proj.name)}" class="proj-thumb-img" onerror="this.onerror=null; this.src='../favicon.ico';">
                  ` : `
                    <div class="thumb-placeholder">${escapeHtml(proj.name.charAt(0) || "P")}</div>
                  `}
                  <div class="project-badges-overlay">
                    ${proj.featured ? `<span class="badge badge-featured">★ Featured</span>` : ""}
                    <span class="badge badge-${(proj.status || "live").toLowerCase()}">${proj.status || "Live"}</span>
                  </div>
                </div>

                <div class="project-card-content">
                  <div class="proj-meta-row">
                    <span class="proj-cat-tag">${escapeHtml(proj.category || "General")}</span>
                    <span class="proj-lang-tag">${escapeHtml(proj.primaryLanguage || "Dart")}</span>
                  </div>

                  <h3 class="proj-card-title">${escapeHtml(proj.name)}</h3>
                  <p class="proj-card-desc">${escapeHtml(proj.shortDesc || "No summary provided.")}</p>

                  <div class="proj-tech-tags">
                    ${(proj.technologies || []).slice(0, 4).map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("")}
                    ${(proj.technologies || []).length > 4 ? `<span class="tech-tag-more">+${(proj.technologies || []).length - 4}</span>` : ""}
                  </div>

                  <div class="proj-links-row">
                    ${proj.playStoreUrl ? `<span class="link-icon-badge" title="Play Store">Play Store</span>` : ""}
                    ${proj.appStoreUrl ? `<span class="link-icon-badge" title="App Store">App Store</span>` : ""}
                    ${proj.githubUrl ? `<span class="link-icon-badge" title="GitHub">GitHub</span>` : ""}
                    ${proj.liveDemoUrl ? `<span class="link-icon-badge" title="Live Demo">Live Demo</span>` : ""}
                  </div>
                </div>

                <div class="project-card-actions">
                  <div class="reorder-btns">
                    <button class="btn-icon move-proj-up" data-id="${proj.id}" title="Move Up" ${idx === 0 ? "disabled" : ""}>↑</button>
                    <button class="btn-icon move-proj-down" data-id="${proj.id}" title="Move Down" ${idx === filtered.length - 1 ? "disabled" : ""}>↓</button>
                  </div>
                  <div class="right-actions">
                    <button class="btn btn-sm btn-ghost edit-proj-btn" data-id="${proj.id}">Edit</button>
                    <button class="btn btn-sm btn-ghost duplicate-proj-btn" data-id="${proj.id}">Copy</button>
                    <button class="btn btn-sm btn-danger-ghost delete-proj-btn" data-id="${proj.id}">Delete</button>
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
    });

    container.querySelectorAll(".category-tabs .tab-pill").forEach(tab => {
      tab.addEventListener("click", () => {
        filterCategory = tab.dataset.cat;
        renderView();
      });
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
  window.addEventListener("admin:open-new-project", () => openProjectEditor(null), { once: true });

  renderView();
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
