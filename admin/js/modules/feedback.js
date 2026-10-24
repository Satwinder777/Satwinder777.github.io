// ============================================================
//  admin/js/modules/feedback.js
//  Signal Studio Visitor Feedback Moderation & Reply Dispatcher
// ============================================================

import { updateFeedbackItem, deleteFeedbackItem } from "../firebase-admin.js";
import { FEEDBACK_STATUSES } from "../config.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

export function renderFeedback(container, state) {
  let feedback = Array.isArray(state.feedback) ? [...state.feedback] : [];
  let currentFilter = "all";
  let searchQuery = "";

  const renderView = () => {
    const filtered = feedback.filter(item => {
      const statusKey = item.status || "in_review";
      const matchFilter = currentFilter === "all" || statusKey === currentFilter;
      const matchQuery = !searchQuery ||
        (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.suggestion || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.developerReply || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchQuery;
    });

    const pendingCount = feedback.filter(f => (f.status || "in_review") === "in_review").length;
    const reviewedCount = feedback.filter(f => f.status === "reviewed").length;
    const resolvedCount = feedback.filter(f => f.status === "resolved").length;
    const publicCount = feedback.filter(f => f.visibleOnWeb !== false && Boolean(f.developerReply)).length;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Signal Studio Moderation</h1>
          <p class="view-subtitle">Visitor suggestions, bug reports, and UX critiques from the live portfolio.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="simulate-feedback-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            + Simulate Signal
          </button>
          <span class="badge ${pendingCount > 0 ? "badge-warning" : "badge-neutral"}">
            <span class="status-pulse-dot"></span>
            ${pendingCount} Pending Review
          </span>
        </div>
      </div>

      <!-- Quick Metrics Overview -->
      <div class="stats-overview-grid" style="margin-bottom: 22px;">
        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(0, 217, 255, 0.12); color: var(--accent-cyan);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div>
            <div class="stat-number">${feedback.length}</div>
            <div class="stat-label">Total Signals</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(234, 179, 8, 0.12); color: #eab308;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div class="stat-number">${pendingCount}</div>
            <div class="stat-label">In Review</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(16, 185, 129, 0.12); color: #10b981;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <div class="stat-number">${reviewedCount + resolvedCount}</div>
            <div class="stat-label">Reviewed & Resolved</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(168, 85, 247, 0.12); color: #c084fc;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <div>
            <div class="stat-number">${publicCount}</div>
            <div class="stat-label">Publicly Broadcast</div>
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="filter-bar">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="feedback-search" placeholder="Search feedback by text, author, type..." value="${escapeHtml(searchQuery)}">
        </div>

        <div class="category-tabs">
          <button class="tab-pill ${currentFilter === "all" ? "active" : ""}" data-status="all">All (${feedback.length})</button>
          ${FEEDBACK_STATUSES.map(st => {
            const count = feedback.filter(f => (f.status || "in_review") === st.key).length;
            return `<button class="tab-pill ${currentFilter === st.key ? "active" : ""}" data-status="${st.key}">${st.label} (${count})</button>`;
          }).join("")}
        </div>
      </div>

      <!-- Submissions List -->
      <div class="feedback-list-container">
        ${filtered.length === 0 ? `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <h3>No feedback signals found</h3>
            <p>${searchQuery ? "Try refining your search keyword." : "Signals submitted through the public Signal Studio will appear here."}</p>
            <button class="btn btn-primary" id="empty-simulate-btn" style="margin-top: 14px;">
              + Create Demo Signal
            </button>
          </div>
        ` : `
          <div class="feedback-feed">
            ${filtered.map(item => {
              const currentStatus = FEEDBACK_STATUSES.find(s => s.key === (item.status || "in_review")) || FEEDBACK_STATUSES[0];
              const typeClass = (item.type || "").toLowerCase().includes("bug") ? "type-bug" :
                                (item.type || "").toLowerCase().includes("feature") ? "type-feature" : "type-ux";
              return `
                <div class="feedback-admin-card ${item.status === "in_review" ? "is-in-review" : ""}" data-id="${item.id}">
                  <div class="feedback-card-top">
                    <div class="author-block">
                      <div class="author-avatar">${(item.name || "A").charAt(0).toUpperCase()}</div>
                      <div>
                        <div class="author-name-row">
                          <strong class="author-name">${escapeHtml(item.name || "Anonymous Visitor")}</strong>
                          <span class="badge-type ${typeClass}">${escapeHtml(item.type || "Feedback")}</span>
                        </div>
                        <div class="feedback-meta-sub">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span class="meta-date">${formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div class="status-control-box">
                      <select class="form-select status-select" data-id="${item.id}">
                        ${FEEDBACK_STATUSES.map(st => `
                          <option value="${st.key}" ${(item.status || "in_review") === st.key ? "selected" : ""}>${st.label}</option>
                        `).join("")}
                      </select>
                      <button class="btn-icon delete-feedback-btn" data-id="${item.id}" title="Delete signal">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>

                  <div class="suggestion-content">
                    <p>${escapeHtml(item.suggestion || "(No message body provided)")}</p>
                  </div>

                  <!-- Developer Reply Box -->
                  <div class="developer-reply-section">
                    <div class="reply-header">
                      <span class="reply-title">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                        Transmit Reply to Public Studio:
                      </span>
                      <label class="switch-row-sm">
                        <span>Visible on Web Feed</span>
                        <input type="checkbox" class="vis-check" data-id="${item.id}" ${item.visibleOnWeb !== false ? "checked" : ""}>
                      </label>
                    </div>

                    <!-- Quick Reply Chips -->
                    <div class="quick-reply-chips">
                      <span class="chip-hint">Quick Presets:</span>
                      <button type="button" class="quick-chip" data-text="⚡ Fixed in the latest build! Thanks for reporting.">⚡ Fixed in build</button>
                      <button type="button" class="quick-chip" data-text="🚀 Great idea! Added to our upcoming Q1 roadmap.">🚀 Added to roadmap</button>
                      <button type="button" class="quick-chip" data-text="🙏 Appreciate the thoughtful critique and UI insight!">🙏 Thanks for critique</button>
                    </div>

                    <div class="reply-input-row">
                      <textarea class="form-textarea reply-textarea" data-id="${item.id}" rows="2" placeholder="Write official developer response...">${escapeHtml(item.developerReply || "")}</textarea>
                      <button class="btn btn-sm btn-primary transmit-reply-btn" data-id="${item.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Transmit
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>
    `;

    // Listeners
    container.querySelector("#simulate-feedback-btn")?.addEventListener("click", () => simulateDemoSignal());
    container.querySelector("#empty-simulate-btn")?.addEventListener("click", () => simulateDemoSignal());

    // Listeners
    container.querySelector("#feedback-search")?.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderView();
    });

    container.querySelectorAll(".category-tabs .tab-pill").forEach(tab => {
      tab.addEventListener("click", () => {
        currentFilter = tab.dataset.status;
        renderView();
      });
    });

    // Status dropdown change
    container.querySelectorAll(".status-select").forEach(select => {
      select.addEventListener("change", async () => {
        const id = select.dataset.id;
        const newStatus = select.value;
        const item = feedback.find(f => f.id === id);
        if (!item) return;

        try {
          await updateFeedbackItem(id, {
            status: newStatus,
            developerReply: item.developerReply || "",
            visibleOnWeb: item.visibleOnWeb !== false
          });
          item.status = newStatus;
          toast.success(`Feedback status changed to "${newStatus}"`);
        } catch (e) {
          toast.error("Status update failed: " + e.message);
        }
      });
    });

    // Transmit reply
    container.querySelectorAll(".transmit-reply-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const card = btn.closest(".feedback-admin-card");
        const replyText = card.querySelector(".reply-textarea").value.trim();
        const isVisible = card.querySelector(".vis-check").checked;
        const item = feedback.find(f => f.id === id);
        if (!item) return;

        btn.disabled = true;
        btn.innerText = "Transmitting...";

        try {
          // If replying to an in_review item, automatically advance to 'reviewed'
          const newStatus = (item.status === "in_review" || !item.status) ? "reviewed" : item.status;
          await updateFeedbackItem(id, {
            status: newStatus,
            developerReply: replyText,
            visibleOnWeb: isVisible
          });

          item.developerReply = replyText;
          item.visibleOnWeb = isVisible;
          item.status = newStatus;

          toast.success("Reply transmitted live to Signal Studio!");
          renderView();
        } catch (e) {
          toast.error("Failed to transmit reply: " + e.message);
        } finally {
          btn.disabled = false;
        }
      });
    });

    // Quick preset reply chips
    container.querySelectorAll(".quick-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const card = chip.closest(".feedback-admin-card");
        const textarea = card.querySelector(".reply-textarea");
        textarea.value = chip.dataset.text;
        textarea.focus();
      });
    });

    // Delete feedback
    container.querySelectorAll(".delete-feedback-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const item = feedback.find(f => f.id === id);
        if (!item) return;

        const ok = await modal.confirm({
          title: "Delete Feedback Signal?",
          message: `Permanently delete submission from "${item.name || "Anonymous"}"?`,
          confirmText: "Delete Signal",
          isDanger: true
        });

        if (ok) {
          try {
            await deleteFeedbackItem(id);
            feedback = feedback.filter(f => f.id !== id);
            state.feedback = feedback;
            toast.success("Feedback signal removed.");
            renderView();
          } catch (e) {
            toast.error("Failed to delete signal: " + e.message);
          }
        }
      });
    });
  };

  const simulateDemoSignal = () => {
    const demos = [
      {
        id: "demo_sig_" + Date.now(),
        name: "Alex Vance",
        type: "Feature Suggestion",
        status: "in_review",
        suggestion: "Would love to see an interactive 3D model viewer for Flutter widgets inside the portfolio projects. Amazing work on 120fps animations!",
        developerReply: "",
        visibleOnWeb: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "demo_sig_" + (Date.now() + 1),
        name: "Devon Chen",
        type: "Bug Report",
        status: "in_review",
        suggestion: "On iOS Safari with low power mode enabled, the fluid canvas slows down slightly. Suggest disabling high particle counts on throttled GPUs.",
        developerReply: "",
        visibleOnWeb: true,
        createdAt: new Date().toISOString()
      }
    ];

    const pick = demos[Math.floor(Math.random() * demos.length)];
    feedback.unshift(pick);
    state.feedback = feedback;
    toast.success("✨ Simulated incoming feedback signal!");
    renderView();
  };

  renderView();
}

function formatDate(date) {
  if (!date) return "";
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (_) {
    return "";
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
