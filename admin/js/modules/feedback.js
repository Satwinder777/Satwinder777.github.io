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

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Signal Studio Moderation</h1>
          <p class="view-subtitle">Visitor suggestions, bug reports, and UX critiques from the live portfolio.</p>
        </div>
        <div class="header-actions">
          <span class="badge ${pendingCount > 0 ? "badge-warning" : "badge-neutral"}">
            ${pendingCount} Pending Review
          </span>
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
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <h3>No feedback signals found</h3>
            <p>${searchQuery ? "Try refining your search keyword." : "Signals submitted through the public Signal Studio will appear here."}</p>
          </div>
        ` : `
          <div class="feedback-feed">
            ${filtered.map(item => {
              const currentStatus = FEEDBACK_STATUSES.find(s => s.key === (item.status || "in_review")) || FEEDBACK_STATUSES[0];
              return `
                <div class="feedback-admin-card" data-id="${item.id}">
                  <div class="feedback-card-top">
                    <div class="author-block">
                      <div class="author-avatar">${(item.name || "A").charAt(0).toUpperCase()}</div>
                      <div>
                        <strong class="author-name">${escapeHtml(item.name || "Anonymous Visitor")}</strong>
                        <div class="feedback-meta-sub">
                          <span class="badge-type">${escapeHtml(item.type || "Feedback")}</span>
                          <span class="meta-dot">•</span>
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
                      <button class="btn-icon delete-feedback-btn" data-id="${item.id}" title="Delete signal">&times;</button>
                    </div>
                  </div>

                  <div class="suggestion-content">
                    <p>${escapeHtml(item.suggestion || "(No message)")}</p>
                  </div>

                  <!-- Developer Reply Accordion / Box -->
                  <div class="developer-reply-section">
                    <div class="reply-header">
                      <span class="reply-title">Transmit Reply to Public Studio:</span>
                      <label class="switch-row-sm">
                        <span>Visible on Web Feed</span>
                        <input type="checkbox" class="vis-check" data-id="${item.id}" ${item.visibleOnWeb !== false ? "checked" : ""}>
                      </label>
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
