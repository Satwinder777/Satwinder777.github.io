// ============================================================
//  admin/js/modules/skills.js
//  Technical Arsenal Chips & Expertise Cards Manager
// ============================================================

import { updatePortfolioField } from "../firebase-admin.js";
import { SKILL_CATEGORIES } from "../config.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

export function renderSkills(container, state) {
  const portfolio = state.portfolio || {};
  let skills = Array.isArray(portfolio.technicalArsenal) ? [...portfolio.technicalArsenal] : [];
  let expertise = Array.isArray(portfolio.expertise) ? [...portfolio.expertise] : [];

  const renderView = () => {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Technical Arsenal & Expertise</h1>
          <p class="view-subtitle">Curate your technology skills chips, categorized by domain, and core competencies.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="seed-skills-btn">Reset to Defaults</button>
          <button class="btn btn-primary" id="add-skill-chip-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Skill Chip
          </button>
        </div>
      </div>

      <!-- Categories Layout -->
      <div class="skills-categories-grid">
        ${SKILL_CATEGORIES.map(cat => {
          const catSkills = skills.filter(s => (s.category || "other").toLowerCase() === cat.key.toLowerCase());
          return `
            <div class="card-box skill-cat-card" data-category="${cat.key}">
              <div class="card-box-header">
                <div>
                  <h3 class="cat-card-title">${cat.label}</h3>
                  <span class="cat-count-badge">${catSkills.length} skills</span>
                </div>
                <button class="btn-icon add-in-cat-btn" data-category="${cat.key}" title="Add skill to ${cat.label}">+</button>
              </div>

              <div class="skill-chips-wrap">
                ${catSkills.length === 0 ? `<div class="empty-chips-msg">No skills listed in ${cat.label}.</div>` : ""}
                ${catSkills.map(s => `
                  <div class="skill-chip-item">
                    <span class="chip-label">${escapeHtml(s.label)}</span>
                    <button class="chip-del-btn" data-label="${escapeHtml(s.label)}" title="Remove">&times;</button>
                  </div>
                `).join("")}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <!-- Expertise Cards Section -->
      <div class="expertise-section" style="margin-top: 36px;">
        <div class="section-header-row">
          <div>
            <h2 class="section-title">Core Competency Cards</h2>
            <p class="section-subtitle">Deep domain expertise highlights shown on the portfolio.</p>
          </div>
          <button class="btn btn-secondary" id="add-expertise-btn">+ Add Competency</button>
        </div>

        <div class="expertise-grid">
          ${expertise.length === 0 ? `
            <div class="empty-state-sm full-width">No competency cards created. Click "+ Add Competency".</div>
          ` : expertise.map((exp, idx) => `
            <div class="expertise-admin-card" data-id="${exp.id}">
              <div class="exp-card-top">
                <span class="exp-icon">${escapeHtml(exp.icon || "★")}</span>
                <div class="exp-title-box">
                  <h4>${escapeHtml(exp.title)}</h4>
                </div>
                <div class="right-actions">
                  <button class="btn-icon edit-expertise-btn" data-idx="${idx}" title="Edit">✎</button>
                  <button class="btn-icon del-expertise-btn" data-idx="${idx}" title="Delete">&times;</button>
                </div>
              </div>
              <p class="exp-desc">${escapeHtml(exp.description || "")}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // Listeners for skill chip deletions
    container.querySelectorAll(".chip-del-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const label = btn.dataset.label;
        skills = skills.filter(s => s.label !== label);
        saveSkills(skills);
      });
    });

    // Quick add per category
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
        message: "This will restore the standard Flutter, Dart, Architecture and DevOps skill set.",
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
          <label for="f-scat">Category</label>
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
      icon: "⚡",
      visible: true,
      order: expertise.length
    };

    const modalBodyHtml = `
      <form id="expertise-form" class="editor-form">
        <div class="form-group">
          <label for="f-exptitle">Competency Title *</label>
          <input type="text" id="f-exptitle" class="form-input" required value="${escapeHtml(cur.title)}" placeholder="e.g. High-Framerate Rendering">
        </div>
        <div class="form-group">
          <label for="f-expicon">Icon / Emoji</label>
          <input type="text" id="f-expicon" class="form-input" value="${escapeHtml(cur.icon || "⚡")}" placeholder="⚡ or 📱 or 🚀">
        </div>
        <div class="form-group full-width">
          <label for="f-expdesc">Description</label>
          <textarea id="f-expdesc" class="form-textarea" rows="4" placeholder="Explain your core capabilities in this area...">${escapeHtml(cur.description || "")}</textarea>
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
        icon: modalEl.querySelector("#f-expicon").value.trim() || "⚡",
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
