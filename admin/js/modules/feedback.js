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
  // Keep track of which card's reply composer is currently open
  const openComposerIds = new Set();

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
    const declinedCount = feedback.filter(f => f.status === "declined").length;
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
          <div class="stat-icon-pod" style="background: rgba(0, 217, 255, 0.15); color: var(--accent-cyan);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${feedback.length}</div>
            <div class="stat-label">Total Signals Received</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(234, 179, 8, 0.15); color: #eab308;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${pendingCount}</div>
            <div class="stat-label">Pending In Review</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${reviewedCount + resolvedCount}</div>
            <div class="stat-label">Reviewed & Resolved</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${publicCount}</div>
            <div class="stat-label">Publicly Broadcast</div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs & Search -->
      <div class="filter-bar" style="margin-bottom: 22px;">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="feedback-search-input" placeholder="Search feedback by author, message text, type..." value="${escapeHtml(searchQuery)}">
        </div>

        <div class="category-tabs">
          <button class="tab-pill ${currentFilter === "all" ? "active" : ""}" data-filter="all">All (${feedback.length})</button>
          <button class="tab-pill ${currentFilter === "in_review" ? "active" : ""}" data-filter="in_review">In Review (${pendingCount})</button>
          <button class="tab-pill ${currentFilter === "reviewed" ? "active" : ""}" data-filter="reviewed">Reviewed (${reviewedCount})</button>
          <button class="tab-pill ${currentFilter === "resolved" ? "active" : ""}" data-filter="resolved">Resolved (${resolvedCount})</button>
          <button class="tab-pill ${currentFilter === "declined" ? "active" : ""}" data-filter="declined">Declined (${declinedCount})</button>
        </div>
      </div>

      <!-- Signal Cards Stream -->
      <div class="feedback-feed-container">
        ${filtered.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon-pod" style="background: rgba(0, 217, 255, 0.12); color: var(--accent-cyan);">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3>No feedback signals found</h3>
            <p>No feedback entries match your current filter. Click "+ Simulate Signal" to preview the moderation workflow.</p>
          </div>
        ` : `
          <div class="feedback-feed">
            ${filtered.map(item => {
              const status = item.status || "in_review";
              const type = (item.type || "idea").toLowerCase();
              const typeBadgeClass = type.includes("bug") ? "type-bug" : type.includes("ux") ? "type-ux" : "type-feature";
              const typeIcon = type.includes("bug") ? "🐛" : type.includes("ux") ? "🎨" : "💡";
              const initial = (item.name || "A").trim().charAt(0).toUpperCase();
              const hasReply = Boolean(item.developerReply && item.developerReply.trim());
              const isComposerOpen = openComposerIds.has(item.id);

              return `
                <div class="feedback-admin-card" data-id="${item.id}">
                  <!-- Top Author & Controls Row -->
                  <div class="feedback-card-top">
                    <div class="author-block">
                      <div class="author-avatar">${initial}</div>
                      <div>
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                          <h4 class="author-name">${escapeHtml(item.name || "Anonymous Visitor")}</h4>
                          <span class="feedback-type-badge ${typeBadgeClass}">
                            ${typeIcon} ${escapeHtml((item.type || "Feature Idea").toUpperCase())}
                          </span>
                        </div>
                        <span class="feedback-timestamp">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: -1px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          ${formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div class="feedback-top-controls">
                      <div class="status-select-wrap">
                        <select class="form-select status-select" data-id="${item.id}">
                          ${FEEDBACK_STATUSES.map(s => `
                            <option value="${s.key}" ${status === s.key ? "selected" : ""}>${s.label}</option>
                          `).join("")}
                        </select>
                      </div>
                      <button class="btn-icon del-feedback-btn" data-id="${item.id}" title="Delete Signal">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Feedback Message Bubble -->
                  <div class="feedback-msg-bubble">
                    <svg class="quote-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>
                    <div class="feedback-msg-text">${renderFeedbackMessage(item.suggestion || "")}</div>
                  </div>

                  <!-- Developer Reply Area -->
                  ${hasReply && !isComposerOpen ? `
                    <div class="verified-reply-box">
                      <div class="reply-badge-row">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span class="badge badge-success">✓ Transmitted Response</span>
                          <span class="broadcast-flag ${item.visibleOnWeb !== false ? 'is-public' : 'is-private'}">
                            ${item.visibleOnWeb !== false ? '🌐 Public on Portfolio' : '🔒 Internal Note'}
                          </span>
                        </div>
                        <button class="btn btn-xs btn-secondary toggle-composer-btn" data-id="${item.id}">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                          Edit Response
                        </button>
                      </div>
                      <p class="verified-reply-text">${escapeHtml(item.developerReply)}</p>
                    </div>
                  ` : isComposerOpen ? `
                    <div class="developer-reply-section composer-active">
                      <div class="reply-header">
                        <div class="reply-title">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                          ${hasReply ? "Edit Developer Response" : "Compose Official Response"}
                        </div>
                        <label class="switch-row-sm">
                          <span style="font-size: 0.78rem; color: var(--text-secondary);">Visible on Public Feed</span>
                          <input type="checkbox" class="public-reply-toggle" data-id="${item.id}" ${item.visibleOnWeb !== false ? "checked" : ""}>
                        </label>
                      </div>

                      <div class="quick-reply-chips" style="margin-bottom: 10px;">
                        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">1-Click Presets:</span>
                        <button type="button" class="quick-chip" data-id="${item.id}" data-reply="⚡ Fixed in latest deployment! Thank you for the sharp critique.">Fixed in Build</button>
                        <button type="button" class="quick-chip" data-id="${item.id}" data-reply="🚀 Added to Q4 technical roadmap. Look out for the next release!">Added to Roadmap</button>
                        <button type="button" class="quick-chip" data-id="${item.id}" data-reply="🙏 Thank you for the critique! Will optimize frame budgets.">Thanks for Critique</button>
                      </div>

                      <div class="reply-input-row">
                        <textarea class="form-textarea reply-textarea" rows="2" placeholder="Write developer response to visitor..." data-id="${item.id}">${escapeHtml(item.developerReply || "")}</textarea>
                        <div class="composer-action-btns">
                          <button class="btn btn-sm btn-ghost cancel-composer-btn" data-id="${item.id}">Cancel</button>
                          <button class="btn btn-sm btn-primary save-reply-btn" data-id="${item.id}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            Transmit
                          </button>
                        </div>
                      </div>
                    </div>
                  ` : `
                    <div class="unreplied-action-row">
                      <button class="btn btn-sm btn-secondary toggle-composer-btn" data-id="${item.id}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Transmit Response
                      </button>
                      <span class="unreplied-hint">No response broadcasted yet</span>
                    </div>
                  `}
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>
    `;

    // Bind listeners
    const searchInput = container.querySelector("#feedback-search-input");
    searchInput?.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      renderView();
      const re = container.querySelector("#feedback-search-input");
      if (re) {
        re.focus();
        re.setSelectionRange(re.value.length, re.value.length);
      }
    });

    // Filter tabs
    container.querySelectorAll(".category-tabs .tab-pill").forEach(tab => {
      tab.addEventListener("click", () => {
        currentFilter = tab.dataset.filter;
        renderView();
      });
    });

    // Toggle composer
    container.querySelectorAll(".toggle-composer-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        openComposerIds.add(id);
        renderView();
      });
    });

    container.querySelectorAll(".cancel-composer-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        openComposerIds.delete(id);
        renderView();
      });
    });

    // Preset chips
    container.querySelectorAll(".quick-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const id = chip.dataset.id;
        const text = chip.dataset.reply;
        const textarea = container.querySelector(`.reply-textarea[data-id="${id}"]`);
        if (textarea) {
          textarea.value = text;
          toast.info("Applied response preset!");
        }
      });
    });

    // Save developer reply
    container.querySelectorAll(".save-reply-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const textarea = container.querySelector(`.reply-textarea[data-id="${id}"]`);
        const isPublicCheckbox = container.querySelector(`.public-reply-toggle[data-id="${id}"]`);
        const replyText = textarea ? textarea.value.trim() : "";
        const isPublic = isPublicCheckbox ? isPublicCheckbox.checked : true;

        try {
          await updateFeedbackItem(id, {
            developerReply: replyText,
            visibleOnWeb: isPublic,
            status: replyText ? "reviewed" : "in_review",
            repliedAt: new Date().toISOString()
          });

          // Update local state
          const item = feedback.find(f => f.id === id);
          if (item) {
            item.developerReply = replyText;
            item.visibleOnWeb = isPublic;
            if (replyText) item.status = "reviewed";
          }

          openComposerIds.delete(id);
          toast.success("Developer response transmitted successfully!");
          renderView();
        } catch (e) {
          toast.error("Failed to save response: " + e.message);
        }
      });
    });

    // Status select change
    container.querySelectorAll(".status-select").forEach(sel => {
      sel.addEventListener("change", async (e) => {
        const id = sel.dataset.id;
        const newStatus = e.target.value;
        try {
          await updateFeedbackItem(id, { status: newStatus });
          const item = feedback.find(f => f.id === id);
          if (item) item.status = newStatus;
          toast.success(`Signal status changed to ${newStatus}.`);
          renderView();
        } catch (err) {
          toast.error("Failed to update status: " + err.message);
        }
      });
    });

    // Delete feedback
    container.querySelectorAll(".del-feedback-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const ok = await modal.confirm({
          title: "Delete Signal Entry?",
          message: "Are you sure you wish to permanently delete this visitor feedback entry?",
          confirmText: "Delete",
          isDanger: true
        });

        if (ok) {
          try {
            await deleteFeedbackItem(id);
            feedback = feedback.filter(f => f.id !== id);
            state.feedback = feedback;
            toast.success("Feedback signal deleted.");
            renderView();
          } catch (e) {
            toast.error("Failed to delete: " + e.message);
          }
        }
      });
    });

    // Simulate sample feedback
    container.querySelector("#simulate-feedback-btn")?.addEventListener("click", () => {
      const demoSignal = {
        id: "sim-" + Date.now(),
        name: "Alex Vance",
        type: "idea",
        suggestion: "Would love to see an interactive 3D model viewer for Flutter widgets inside the portfolio projects. Amazing work on 120fps animations!",
        status: "in_review",
        createdAt: new Date().toISOString(),
        developerReply: "",
        visibleOnWeb: true
      };
      feedback.unshift(demoSignal);
      state.feedback = feedback;
      toast.info("Simulated test signal added!");
      renderView();
    });
  };

  renderView();
}

function renderFeedbackMessage(text) {
  if (!text) return "(No message content)";
  const escaped = escapeHtml(text);
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return escaped.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="feedback-bubble-link" title="Open external link">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      <span>${url}</span>
    </a>`;
  });
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
