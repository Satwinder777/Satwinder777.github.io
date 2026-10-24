// ============================================================
//  admin/js/modules/experience.js
//  Career Trajectory, Roles & Milestones Timeline CMS
// ============================================================

import { updatePortfolioField } from "../firebase-admin.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

export function renderExperience(container, state) {
  const portfolio = state.portfolio || {};
  let experience = Array.isArray(portfolio.experience) ? [...portfolio.experience] : [];

  const renderView = () => {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Career Trajectory & Experience</h1>
          <p class="view-subtitle">Organize your professional timeline, company milestones, and accomplishments.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" id="add-exp-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add New Milestone
          </button>
        </div>
      </div>

      <div class="experience-list-container">
        ${experience.length === 0 ? `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
            <h3>No experience milestones added</h3>
            <p>Click "Add New Milestone" above to record your career timeline.</p>
          </div>
        ` : `
          <div class="timeline-admin">
            ${experience.map((exp, idx) => `
              <div class="exp-item-card" data-id="${exp.id}">
                <div class="exp-meta-bar">
                  <div class="exp-role-info">
                    <h3 class="exp-title">${escapeHtml(exp.title)}</h3>
                    <div class="exp-company-row">
                      <span class="exp-company">${escapeHtml(exp.company)}</span>
                      <span class="exp-dot">•</span>
                      <span class="exp-location">${escapeHtml(exp.location || "Remote")}</span>
                      ${exp.isCurrent ? `<span class="badge badge-success">Present</span>` : ""}
                    </div>
                  </div>
                  <div class="exp-date-pill">
                    ${formatExpDates(exp.startDate, exp.endDate, exp.isCurrent)}
                  </div>
                </div>

                <div class="exp-desc-box">
                  <p>${escapeHtml(exp.description || "No description provided.")}</p>
                </div>

                ${(exp.technologies || []).length > 0 ? `
                  <div class="exp-tech-tags">
                    ${(exp.technologies || []).map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("")}
                  </div>
                ` : ""}

                <div class="exp-card-footer">
                  <div class="reorder-btns">
                    <button class="btn-icon move-exp-up" data-id="${exp.id}" title="Move Up" ${idx === 0 ? "disabled" : ""}>↑</button>
                    <button class="btn-icon move-exp-down" data-id="${exp.id}" title="Move Down" ${idx === experience.length - 1 ? "disabled" : ""}>↓</button>
                  </div>
                  <div class="right-actions">
                    <button class="btn btn-sm btn-ghost edit-exp-btn" data-id="${exp.id}">Edit</button>
                    <button class="btn btn-sm btn-danger-ghost delete-exp-btn" data-id="${exp.id}">Delete</button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;

    // Listeners
    container.querySelector("#add-exp-btn")?.addEventListener("click", () => openExperienceEditor(null));

    container.querySelectorAll(".move-exp-up").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const idx = experience.findIndex(e => e.id === id);
        if (idx > 0) {
          const temp = experience[idx];
          experience[idx] = experience[idx - 1];
          experience[idx - 1] = temp;
          saveExperience(experience);
        }
      });
    });

    container.querySelectorAll(".move-exp-down").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const idx = experience.findIndex(e => e.id === id);
        if (idx < experience.length - 1 && idx !== -1) {
          const temp = experience[idx];
          experience[idx] = experience[idx + 1];
          experience[idx + 1] = temp;
          saveExperience(experience);
        }
      });
    });

    container.querySelectorAll(".edit-exp-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const item = experience.find(e => e.id === id);
        if (item) openExperienceEditor(item);
      });
    });

    container.querySelectorAll(".delete-exp-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const item = experience.find(e => e.id === id);
        if (!item) return;

        const ok = await modal.confirm({
          title: "Delete Milestone?",
          message: `Are you sure you want to remove "${item.title} at ${item.company}" from your career trajectory?`,
          confirmText: "Delete",
          isDanger: true
        });

        if (ok) {
          experience = experience.filter(e => e.id !== id);
          saveExperience(experience);
        }
      });
    });
  };

  const saveExperience = async (updatedList) => {
    try {
      await updatePortfolioField("experience", updatedList);
      state.portfolio.experience = updatedList;
      experience = updatedList;
      toast.success("Experience timeline updated successfully!");
      renderView();
    } catch (e) {
      toast.error("Failed to save experience: " + e.message);
    }
  };

  const openExperienceEditor = (existing) => {
    const isNew = !existing;
    const e = existing || {
      id: "exp_" + Date.now(),
      title: "",
      company: "",
      companyLogoUrl: "",
      location: "Remote",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
      technologies: ["Flutter", "Dart", "BLoC"],
      order: experience.length
    };

    const modalBodyHtml = `
      <form id="exp-form" class="editor-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="f-etitle">Job Title *</label>
            <input type="text" id="f-etitle" class="form-input" required value="${escapeHtml(e.title)}" placeholder="e.g. Senior Flutter Engineer">
          </div>

          <div class="form-group">
            <label for="f-ecompany">Company / Organization *</label>
            <input type="text" id="f-ecompany" class="form-input" required value="${escapeHtml(e.company)}" placeholder="e.g. Tech Innovations Inc">
          </div>

          <div class="form-group">
            <label for="f-elocation">Location</label>
            <input type="text" id="f-elocation" class="form-input" value="${escapeHtml(e.location || "Remote")}" placeholder="e.g. Chandigarh / Remote">
          </div>

          <div class="form-group">
            <label for="f-elogo">Company Logo URL</label>
            <input type="text" id="f-elogo" class="form-input" value="${escapeHtml(e.companyLogoUrl || "")}" placeholder="https://...">
          </div>

          <div class="form-group">
            <label for="f-estart">Start Date (e.g. Jan 2023)</label>
            <input type="text" id="f-estart" class="form-input" value="${escapeHtml(e.startDate || "")}" placeholder="Jan 2023">
          </div>

          <div class="form-group">
            <label for="f-eend">End Date (or leave blank if current)</label>
            <input type="text" id="f-eend" class="form-input" value="${escapeHtml(e.endDate || "")}" placeholder="Present / Dec 2024" ${e.isCurrent ? "disabled" : ""}>
          </div>

          <div class="form-group full-width">
            <label class="switch-row">
              <span>Currently Working in this Role (Present)</span>
              <label class="switch">
                <input type="checkbox" id="f-ecurrent" ${e.isCurrent ? "checked" : ""}>
                <span class="slider round"></span>
              </label>
            </label>
          </div>

          <div class="form-group full-width">
            <label for="f-etech">Technologies Used (Comma separated)</label>
            <input type="text" id="f-etech" class="form-input" value="${escapeHtml((e.technologies || []).join(", "))}" placeholder="Flutter, Dart, Clean Architecture, CI/CD">
          </div>

          <div class="form-group full-width">
            <label for="f-edesc">Milestone Summary & Achievements</label>
            <textarea id="f-edesc" class="form-textarea" rows="5" placeholder="Bullet points of key architectural implementations, speed improvements, crash rate reduction...">${escapeHtml(e.description || "")}</textarea>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" id="modal-exp-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-exp-save">${isNew ? "Add Milestone" : "Save Milestone"}</button>
    `;

    const modalEl = modal.open({
      title: isNew ? "Add Career Milestone" : `Edit Milestone: ${e.title}`,
      bodyHtml: modalBodyHtml,
      footerHtml,
      size: "md"
    });

    const isCurrentCheck = modalEl.querySelector("#f-ecurrent");
    const endInput = modalEl.querySelector("#f-eend");
    isCurrentCheck.addEventListener("change", () => {
      endInput.disabled = isCurrentCheck.checked;
      if (isCurrentCheck.checked) endInput.value = "";
    });

    modalEl.querySelector("#modal-exp-cancel").addEventListener("click", () => modal.close());

    modalEl.querySelector("#modal-exp-save").addEventListener("click", async () => {
      const titleVal = modalEl.querySelector("#f-etitle").value.trim();
      const compVal = modalEl.querySelector("#f-ecompany").value.trim();
      if (!titleVal || !compVal) {
        toast.error("Job title and company name are required.");
        return;
      }

      const techRaw = modalEl.querySelector("#f-etech").value;
      const technologies = techRaw.split(",").map(t => t.trim()).filter(Boolean);

      const updatedExp = {
        ...e,
        title: titleVal,
        company: compVal,
        location: modalEl.querySelector("#f-elocation").value.trim(),
        companyLogoUrl: modalEl.querySelector("#f-elogo").value.trim(),
        startDate: modalEl.querySelector("#f-estart").value.trim(),
        endDate: isCurrentCheck.checked ? null : modalEl.querySelector("#f-eend").value.trim(),
        isCurrent: isCurrentCheck.checked,
        technologies,
        description: modalEl.querySelector("#f-edesc").value.trim()
      };

      if (isNew) {
        experience.unshift(updatedExp);
      } else {
        const idx = experience.findIndex(x => x.id === e.id);
        if (idx !== -1) experience[idx] = updatedExp;
      }

      modal.close();
      await saveExperience(experience);
    });
  };

  window.addEventListener("admin:open-new-experience", () => openExperienceEditor(null), { once: true });

  renderView();
}

function formatExpDates(start, end, isCurrent) {
  const parseOne = (val) => {
    if (!val) return "";
    if (typeof val === "object" && typeof val.seconds === "number") {
      const d = new Date(val.seconds * 1000);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    let str = String(val);
    str = str.replace(/Timestamp\(seconds=(\d+)[^)]*\)/g, (_, sec) => {
      const d = new Date(parseInt(sec, 10) * 1000);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    });
    str = str.replace(/seconds=(\d+)/g, (_, sec) => {
      const d = new Date(parseInt(sec, 10) * 1000);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    });
    return str.trim();
  };

  const s = parseOne(start);
  if (isCurrent) return `${s || "Started"} — Present`;
  const e = parseOne(end);
  if (s && e) {
    if (s.includes("—")) return s;
    return `${s} — ${e}`;
  }
  return s || e || "Timeline";
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
