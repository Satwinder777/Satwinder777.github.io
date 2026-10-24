// ============================================================
//  admin/js/modules/skills.js
//  Technical Arsenal Chips & Expertise Cards Manager
// ============================================================

import { updatePortfolioField } from "../firebase-admin.js";
import { SKILL_CATEGORIES } from "../config.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

const CATEGORY_THEMES = {
  frontend: {
    accent: "#00d9ff",
    bgIcon: "rgba(0, 217, 255, 0.15)",
    border: "rgba(0, 217, 255, 0.3)",
    tag: "Mobile & UI",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`
  },
  backend: {
    accent: "#c084fc",
    bgIcon: "rgba(168, 85, 247, 0.15)",
    border: "rgba(168, 85, 247, 0.3)",
    tag: "Cloud & APIs",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`
  },
  architecture: {
    accent: "#fbbf24",
    bgIcon: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.3)",
    tag: "Patterns & Scale",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`
  },
  devops: {
    accent: "#34d399",
    bgIcon: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.3)",
    tag: "CI/CD & Release",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
  },
  other: {
    accent: "#38bdf8",
    bgIcon: "rgba(56, 189, 248, 0.15)",
    border: "rgba(56, 189, 248, 0.3)",
    tag: "Tooling & Systems",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
};

export function renderSkills(container, state) {
  const portfolio = state.portfolio || {};
  let skills = Array.isArray(portfolio.technicalArsenal) ? [...portfolio.technicalArsenal] : [];
  let expertise = Array.isArray(portfolio.expertise) ? [...portfolio.expertise] : [];
  let searchQuery = "";

  const renderView = () => {
    const frontendCount = skills.filter(s => (s.category || "").toLowerCase() === "frontend").length;
    const backendCount = skills.filter(s => (s.category || "").toLowerCase() === "backend").length;
    const archCount = skills.filter(s => (s.category || "").toLowerCase() === "architecture").length;
    const devopsCount = skills.filter(s => (s.category || "").toLowerCase() === "devops" || (s.category || "").toLowerCase() === "other").length;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Technical Arsenal & Expertise</h1>
          <p class="view-subtitle">Curate your technology skills chips, categorized by domain, and core competencies.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="seed-skills-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Reset to Defaults
          </button>
          <button class="btn btn-primary" id="add-skill-chip-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Skill Chip
          </button>
        </div>
      </div>

      <!-- Quick Metrics Overview Grid -->
      <div class="stats-overview-grid">
        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(0, 217, 255, 0.15); color: #00d9ff;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-number">${skills.length}</span>
            <span class="stat-label">Total Curated Skills</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(14, 165, 233, 0.15); color: #0ea5e9;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-number">${frontendCount}</span>
            <span class="stat-label">Frontend & Mobile</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(168, 85, 247, 0.15); color: #a855f7;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-number">${backendCount}</span>
            <span class="stat-label">Backend & Cloud APIs</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-number">${archCount + devopsCount}</span>
            <span class="stat-label">Architecture & DevOps</span>
          </div>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="filter-bar" style="margin-bottom: 24px;">
        <div class="search-box full-width">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="skills-search-input" placeholder="Quick filter across all domains (e.g. Flutter, Kotlin, Firebase, CI/CD)..." value="${escapeHtml(searchQuery)}">
        </div>
      </div>

      <!-- Categories Layout Grid -->
      <div class="skills-categories-grid">
        ${SKILL_CATEGORIES.map(cat => {
          const theme = CATEGORY_THEMES[cat.key.toLowerCase()] || CATEGORY_THEMES.other;
          let catSkills = skills.filter(s => (s.category || "other").toLowerCase() === cat.key.toLowerCase());
          
          if (searchQuery) {
            catSkills = catSkills.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()));
          }

          return `
            <div class="card-box skill-cat-card" data-category="${cat.key}" style="border-top: 3px solid ${theme.accent};">
              <div class="card-box-header" style="margin-bottom: 14px;">
                <div class="card-box-title-wrap">
                  <div class="card-header-icon-box" style="background: ${theme.bgIcon}; color: ${theme.accent}; border-color: ${theme.border};">
                    ${theme.icon}
                  </div>
                  <div>
                    <h3 class="cat-card-title">${cat.label}</h3>
                    <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                      <span class="badge badge-neutral" style="font-size: 0.72rem;">${catSkills.length} skills</span>
                      <span style="font-size: 0.72rem; color: var(--text-muted);">${theme.tag}</span>
                    </div>
                  </div>
                </div>
                <button class="btn btn-sm btn-secondary add-in-cat-btn" data-category="${cat.key}" title="Add skill to ${cat.label}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add
                </button>
              </div>

              <!-- Chips Container -->
              <div class="skill-chips-wrap">
                ${catSkills.length === 0 ? `
                  <div class="empty-chips-msg">${searchQuery ? "No matching skills found." : `No skills listed in ${cat.label}.`}</div>
                ` : catSkills.map(s => `
                  <div class="skill-chip-item" style="border-left: 2px solid ${theme.accent};">
                    <span class="chip-color-dot" style="background: ${theme.accent}; box-shadow: 0 0 6px ${theme.accent};"></span>
                    <span class="chip-label">${escapeHtml(s.label)}</span>
                    <button class="chip-del-btn" data-label="${escapeHtml(s.label)}" title="Remove skill">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                `).join("")}
              </div>

              <!-- Quick Inline Add Row -->
              <div class="quick-inline-add-row" style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed var(--border-subtle);">
                <div class="inline-add-wrap">
                  <input type="text" class="inline-skill-input" data-category="${cat.key}" placeholder="+ Type skill & press Enter...">
                  <button type="button" class="btn btn-xs btn-ghost inline-add-btn" data-category="${cat.key}">Add</button>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <!-- Expertise Cards Section -->
      <div class="expertise-section" style="margin-top: 40px;">
        <div class="section-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 class="section-title" style="font-size: 1.35rem; font-family: var(--font-heading); color: var(--text-primary);">Core Competency Highlights</h2>
            <p class="section-subtitle" style="font-size: 0.85rem; color: var(--text-secondary);">Deep architectural proficiencies, frame budget tuning, and signature engineering strengths.</p>
          </div>
          <button class="btn btn-secondary" id="add-expertise-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Competency
          </button>
        </div>

        <div class="expertise-grid">
          ${expertise.length === 0 ? `
            <div class="empty-state-sm full-width">No competency cards created. Click "+ Add Competency".</div>
          ` : expertise.map((exp, idx) => `
            <div class="expertise-admin-card" data-id="${exp.id}">
              <div class="exp-card-top">
                <div class="comp-icon-box">
                  ${getCompetencyIconSvg(exp.icon)}
                </div>
                <div class="comp-title-box" style="flex: 1; min-width: 0;">
                  <h4 class="comp-title" style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">${escapeHtml(exp.title)}</h4>
                  <span class="badge badge-info" style="font-size: 0.72rem;">${escapeHtml(exp.icon || "core")}</span>
                </div>
                <div class="comp-card-actions" style="display: flex; gap: 4px;">
                  <button class="btn-icon edit-expertise-btn" data-idx="${idx}" title="Edit Competency">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                  <button class="btn-icon del-expertise-btn" data-idx="${idx}" title="Delete Competency">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
              <p class="comp-desc" style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-top: 8px;">${escapeHtml(exp.description || "")}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // Listeners for skill chip deletions
    container.querySelectorAll(".chip-del-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const label = btn.dataset.label;
        skills = skills.filter(s => s.label !== label);
        saveSkills(skills);
      });
    });

    // Search filter
    const searchInput = container.querySelector("#skills-search-input");
    searchInput?.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      renderView();
      // refocus search
      const re = container.querySelector("#skills-search-input");
      if (re) {
        re.focus();
        re.setSelectionRange(re.value.length, re.value.length);
      }
    });

    // Inline add handlers
    container.querySelectorAll(".inline-skill-input").forEach(inp => {
      const cat = inp.dataset.category;
      const submitInline = () => {
        const val = inp.value.trim();
        if (!val) return;
        if (skills.some(s => s.label.toLowerCase() === val.toLowerCase())) {
          toast.warning(`"${val}" already exists in skills.`);
          return;
        }
        skills.push({ label: val, category: cat, order: skills.length });
        saveSkills(skills);
      };

      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitInline();
        }
      });
    });

    container.querySelectorAll(".inline-add-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.category;
        const inp = container.querySelector(`.inline-skill-input[data-category="${cat}"]`);
        if (inp && inp.value.trim()) {
          const val = inp.value.trim();
          if (skills.some(s => s.label.toLowerCase() === val.toLowerCase())) {
            toast.warning(`"${val}" already exists.`);
            return;
          }
          skills.push({ label: val, category: cat, order: skills.length });
          saveSkills(skills);
        }
      });
    });

    // Quick add button in category header
    container.querySelectorAll(".add-in-cat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.category;
        openAddSkillModal(cat);
      });
    });

    container.querySelector("#add-skill-chip-btn")?.addEventListener("click", () => {
      openAddSkillModal("frontend");
    });

    // Reset to defaults
    container.querySelector("#seed-skills-btn")?.addEventListener("click", async () => {
      const ok = await modal.confirm({
        title: "Reset Skills to Defaults?",
        message: "This will restore the standard Flutter, Dart, Architecture, and DevOps skill set.",
        confirmText: "Restore Defaults"
      });
      if (ok) {
        skills = getDefaultSkills();
        saveSkills(skills);
      }
    });

    // Expertise Cards Listeners
    container.querySelector("#add-expertise-btn")?.addEventListener("click", () => openExpertiseEditor(null));

    container.querySelectorAll(".edit-expertise-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        openExpertiseEditor(expertise[idx], idx);
      });
    });

    container.querySelectorAll(".del-expertise-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const ok = await modal.confirm({
          title: "Delete Competency?",
          message: `Delete "${expertise[idx]?.title || "Item"}"?`,
          isDanger: true
        });
        if (ok) {
          expertise.splice(idx, 1);
          saveExpertise(expertise);
        }
      });
    });
  };

  const saveSkills = async (updatedSkills) => {
    try {
      await updatePortfolioField("technicalArsenal", updatedSkills);
      state.portfolio.technicalArsenal = updatedSkills;
      skills = updatedSkills;
      toast.success("Skill chips saved successfully!");
      renderView();
    } catch (e) {
      toast.error("Failed to save skills: " + e.message);
    }
  };

  const saveExpertise = async (updatedExpertise) => {
    try {
      await updatePortfolioField("expertise", updatedExpertise);
      state.portfolio.expertise = updatedExpertise;
      expertise = updatedExpertise;
      toast.success("Competencies saved successfully!");
      renderView();
    } catch (e) {
      toast.error("Failed to save competencies: " + e.message);
    }
  };

  const openAddSkillModal = (defaultCategory) => {
    const modalBodyHtml = `
      <form id="skill-chip-form" class="editor-form">
        <div class="form-group">
          <label for="f-slabel">Skill Label *</label>
          <input type="text" id="f-slabel" class="form-input" required placeholder="e.g. Kotlin Coroutines, GraphQL, Docker">
        </div>
        <div class="form-group">
          <label for="f-scat">Category Domain</label>
          <select id="f-scat" class="form-select">
            ${SKILL_CATEGORIES.map(c => `
              <option value="${c.key}" ${c.key === defaultCategory ? "selected" : ""}>${c.label}</option>
            `).join("")}
          </select>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" id="modal-skill-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-skill-save">Add Chip</button>
    `;

    const modalEl = modal.open({
      title: "Add Technical Skill Chip",
      bodyHtml: modalBodyHtml,
      footerHtml,
      size: "sm"
    });

    modalEl.querySelector("#modal-skill-cancel").addEventListener("click", () => modal.close());

    modalEl.querySelector("#modal-skill-save").addEventListener("click", () => {
      const label = modalEl.querySelector("#f-slabel").value.trim();
      const category = modalEl.querySelector("#f-scat").value;
      if (!label) {
        toast.error("Skill label is required.");
        return;
      }

      if (skills.some(s => s.label.toLowerCase() === label.toLowerCase())) {
        toast.warning("Skill chip already exists.");
        return;
      }

      skills.push({ label, category, order: skills.length });
      modal.close();
      saveSkills(skills);
    });
  };

  const openExpertiseEditor = (item, idx) => {
    const isNew = item === null;
    const cur = item || {
      id: "exp_" + Date.now(),
      title: "",
      description: "",
      icon: "bolt",
      visible: true,
      order: expertise.length
    };

    const iconPresets = [
      { key: "bolt", label: "⚡ Bolt / Perf" },
      { key: "mobile", label: "📱 Mobile App" },
      { key: "layers", label: "🗂️ Architecture" },
      { key: "code", label: "💻 Code / SDKs" },
      { key: "database", label: "🗄️ Database" },
      { key: "graph", label: "📈 Real-Time" },
      { key: "map", label: "🗺️ Geo Maps" },
      { key: "palette", label: "🎨 UI / Canvas" },
      { key: "shield", label: "🛡️ Security" },
      { key: "wifi", label: "📶 Offline Sync" }
    ];

    const modalBodyHtml = `
      <form id="expertise-form" class="editor-form">
        <div class="form-group">
          <label for="f-exptitle">Competency Title *</label>
          <input type="text" id="f-exptitle" class="form-input" required value="${escapeHtml(cur.title)}" placeholder="e.g. 120fps Perf. Tuning">
        </div>
        
        <div class="form-group">
          <label for="f-expicon">Icon Identifier or Emoji</label>
          <input type="text" id="f-expicon" class="form-input" value="${escapeHtml(cur.icon || "bolt")}" placeholder="e.g. bolt, mobile, layers, database">
          <div class="icon-preset-pills" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            ${iconPresets.map(p => `
              <button type="button" class="btn-preset-pill ${cur.icon === p.key ? "active" : ""}" data-key="${p.key}">
                ${p.label}
              </button>
            `).join("")}
          </div>
        </div>

        <div class="form-group full-width">
          <label for="f-expdesc">Description & Technical Highlights</label>
          <textarea id="f-expdesc" class="form-textarea" rows="4" placeholder="Explain your core capabilities, frame budgeting, or architecture patterns...">${escapeHtml(cur.description || "")}</textarea>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" id="modal-exp-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-exp-save">${isNew ? "Add Card" : "Save Changes"}</button>
    `;

    const modalEl = modal.open({
      title: isNew ? "Add Core Competency" : `Edit: ${cur.title}`,
      bodyHtml: modalBodyHtml,
      footerHtml,
      size: "sm"
    });

    const iconInput = modalEl.querySelector("#f-expicon");
    modalEl.querySelectorAll(".btn-preset-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        iconInput.value = pill.dataset.key;
        modalEl.querySelectorAll(".btn-preset-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
      });
    });

    modalEl.querySelector("#modal-exp-cancel").addEventListener("click", () => modal.close());

    modalEl.querySelector("#modal-exp-save").addEventListener("click", () => {
      const title = modalEl.querySelector("#f-exptitle").value.trim();
      if (!title) {
        toast.error("Title is required.");
        return;
      }

      const updated = {
        ...cur,
        title,
        icon: iconInput.value.trim() || "bolt",
        description: modalEl.querySelector("#f-expdesc").value.trim()
      };

      if (isNew) {
        expertise.push(updated);
      } else {
        expertise[idx] = updated;
      }

      modal.close();
      saveExpertise(expertise);
    });
  };

  renderView();
}

function getCompetencyIconSvg(iconName) {
  const key = String(iconName || "bolt").toLowerCase().trim();
  switch (key) {
    case "bolt":
    case "zap":
    case "⚡":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    case "mobile":
    case "smartphone":
    case "phone":
    case "📱":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`;
    case "layers":
    case "architecture":
    case "stack":
    case "🗂️":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
    case "code":
    case "code-2":
    case "terminal":
    case "💻":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
    case "database":
    case "storage":
    case "server":
    case "🗄️":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`;
    case "graph":
    case "activity":
    case "pulse":
    case "stream":
    case "📈":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
    case "map":
    case "location":
    case "pin":
    case "🗺️":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 combat 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`;
    case "palette":
    case "paint":
    case "ui":
    case "canvas":
    case "🎨":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`;
    case "shield":
    case "security":
    case "lock":
    case "🛡️":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    case "wifi":
    case "wifi-off":
    case "offline":
    case "📶":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`;
    default:
      if (iconName && iconName.length <= 2) {
        return `<span style="font-size: 20px;">${escapeHtml(iconName)}</span>`;
      }
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`;
  }
}

function getDefaultSkills() {
  return [
    { label: "Flutter (Advanced)", category: "frontend", order: 0 },
    { label: "Dart", category: "frontend", order: 1 },
    { label: "Android (Native)", category: "frontend", order: 2 },
    { label: "Kotlin", category: "frontend", order: 3 },
    { label: "Method Channels", category: "frontend", order: 4 },
    { label: "Isolates", category: "frontend", order: 5 },
    { label: "Custom Painters", category: "frontend", order: 6 },
    { label: "Clean Architecture", category: "architecture", order: 7 },
    { label: "BLoC / Riverpod", category: "architecture", order: 8 },
    { label: "GetX", category: "architecture", order: 9 },
    { label: "MVVM", category: "architecture", order: 10 },
    { label: "Firebase (Full Suite)", category: "backend", order: 11 },
    { label: "WebSockets", category: "backend", order: 12 },
    { label: "Google Maps API", category: "backend", order: 13 },
    { label: "CI/CD (Fastlane)", category: "devops", order: 14 },
  ];
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
