// ============================================================
//  admin/js/modules/inbox.js
//  Contact Inquiries & Messages Management Module (Enhanced)
// ============================================================

import { updateContactStatus, deleteContactSubmission } from "../firebase-admin.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

export function renderInbox(container, state) {
  let inbox = Array.isArray(state.inbox) ? [...state.inbox] : [];
  let currentFilter = "all"; // 'all' | 'unread' | 'starred' | 'archived'
  let searchQuery = "";
  const openDrawers = new Set(); // tracks open quick response drawers

  const renderView = () => {
    const unreadCount = inbox.filter(i => !i.isRead && !i.isArchived).length;
    const starredCount = inbox.filter(i => i.isStarred && !i.isArchived).length;
    const archivedCount = inbox.filter(i => i.isArchived).length;
    const activeCount = inbox.filter(i => !i.isArchived).length;

    const filtered = inbox.filter(item => {
      const isUnread = !item.isRead && !item.isArchived;
      const isStarred = Boolean(item.isStarred && !item.isArchived);
      const isArchived = Boolean(item.isArchived);

      let matchFilter = true;
      if (currentFilter === "unread") matchFilter = isUnread;
      if (currentFilter === "starred") matchFilter = isStarred;
      if (currentFilter === "archived") matchFilter = isArchived;
      if (currentFilter === "all") matchFilter = !isArchived;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (item.name || "").toLowerCase().includes(q) ||
        (item.email || "").toLowerCase().includes(q) ||
        (item.company || "").toLowerCase().includes(q) ||
        (item.type || "").toLowerCase().includes(q) ||
        (item.message || "").toLowerCase().includes(q);

      return matchFilter && matchQuery;
    });

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Inquiries & Contact Inbox</h1>
          <p class="view-subtitle">Review incoming leads, high-ticket engineering contracts, and collaboration proposals.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="export-inbox-btn" title="Export inquiries as JSON">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Leads
          </button>
          <button class="btn btn-secondary" id="mark-all-read-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/><polyline points="20 12 9 23 4 18"/></svg>
            Mark All Read
          </button>
          <button class="btn btn-primary" id="simulate-inquiry-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            + Simulate Inquiry
          </button>
        </div>
      </div>

      <!-- Quick Metrics Overview -->
      <div class="stats-overview-grid" style="margin-bottom: 22px;">
        <div class="stat-card" style="border-top: 3px solid var(--accent-cyan);">
          <div class="stat-icon-pod" style="background: rgba(0, 217, 255, 0.12); color: var(--accent-cyan);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div>
            <div class="stat-number">${activeCount}</div>
            <div class="stat-label">Active Inquiries</div>
          </div>
        </div>

        <div class="stat-card" style="border-top: 3px solid #fbbf24;">
          <div class="stat-icon-pod" style="background: rgba(251, 191, 36, 0.12); color: #fbbf24;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <div class="stat-number">${unreadCount}</div>
            <div class="stat-label">Unread Messages</div>
          </div>
        </div>

        <div class="stat-card" style="border-top: 3px solid #a855f7;">
          <div class="stat-icon-pod" style="background: rgba(168, 85, 247, 0.12); color: #c084fc;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div>
            <div class="stat-number">${starredCount}</div>
            <div class="stat-label">Priority Starred</div>
          </div>
        </div>

        <div class="stat-card" style="border-top: 3px solid #10b981;">
          <div class="stat-icon-pod" style="background: rgba(16, 185, 129, 0.12); color: #10b981;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <div class="stat-number">100%</div>
            <div class="stat-label">Delivery SLA</div>
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="filter-bar">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="inbox-search" placeholder="Search sender, email, company, message..." value="${escapeHtml(searchQuery)}">
        </div>

        <div class="category-tabs">
          <button class="tab-pill ${currentFilter === "all" ? "active" : ""}" data-filter="all">Active (${activeCount})</button>
          <button class="tab-pill ${currentFilter === "unread" ? "active" : ""}" data-filter="unread">Unread (${unreadCount})</button>
          <button class="tab-pill ${currentFilter === "starred" ? "active" : ""}" data-filter="starred">Starred (${starredCount})</button>
          <button class="tab-pill ${currentFilter === "archived" ? "active" : ""}" data-filter="archived">Archived (${archivedCount})</button>
        </div>
      </div>

      <!-- Inbox List -->
      <div class="inbox-list-container">
        ${filtered.length === 0 ? `
          <div class="empty-state">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <h3 style="margin-top: 14px;">No messages match this filter</h3>
            <p>${searchQuery ? "Try refining or clearing your search keywords." : "New leads from your live portfolio contact form will appear here in real-time."}</p>
            <button class="btn btn-primary" id="empty-inquiry-btn" style="margin-top: 16px;">
              + Create Demo Inquiry
            </button>
          </div>
        ` : `
          <div class="inbox-feed">
            ${filtered.map(item => {
              const typeClass = getTypeClass(item.type);
              const avatarClass = getAvatarClass(item.type);
              const isDrawerOpen = openDrawers.has(item.id);
              const initial = (item.name || "S").charAt(0).toUpperCase();

              return `
              <div class="inbox-card ${!item.isRead ? "card-unread" : ""} ${item.isStarred ? "card-starred" : ""} ${item.isArchived ? "card-archived" : ""}" data-id="${item.id}">
                <div class="inbox-card-top">
                  <div class="inbox-sender-meta">
                    <div class="sender-avatar-wrap">
                      <div class="sender-avatar ${avatarClass}">${initial}</div>
                    </div>
                    <div class="sender-details-pod">
                      <div class="sender-title-row">
                        <strong class="sender-name">${escapeHtml(item.name || "(No Name)")}</strong>
                        ${!item.isRead ? `<span class="badge-new-pill"><span class="pulse-dot"></span>NEW</span>` : ""}
                        ${item.type ? `
                          <span class="inbox-type-badge ${typeClass}">
                            ${getTypeIcon(item.type)}
                            ${escapeHtml(item.type)}
                          </span>
                        ` : ""}
                      </div>

                      <div class="sender-meta-chips">
                        ${item.email ? `
                          <div class="contact-meta-chip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            <a href="mailto:${escapeHtml(item.email)}">${escapeHtml(item.email)}</a>
                            <button class="chip-copy-icon-btn copy-chip-btn" data-copy="${escapeHtml(item.email)}" title="Copy email address">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </button>
                          </div>
                        ` : ""}

                        ${item.phone ? `
                          <div class="contact-meta-chip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            <a href="tel:${escapeHtml(item.phone)}">${escapeHtml(item.phone)}</a>
                            <button class="chip-copy-icon-btn copy-chip-btn" data-copy="${escapeHtml(item.phone)}" title="Copy phone number">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </button>
                          </div>
                        ` : ""}

                        ${item.company ? `
                          <div class="contact-meta-chip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>
                            <span>${escapeHtml(item.company)}</span>
                          </div>
                        ` : ""}
                      </div>
                    </div>
                  </div>

                  <div class="inbox-date-and-actions">
                    <button class="star-inbox-btn ${item.isStarred ? "is-starred" : ""}" data-id="${item.id}" title="${item.isStarred ? "Unstar inquiry" : "Star as high-priority lead"}">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="${item.isStarred ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </button>
                    <span class="inbox-date">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      ${formatDate(item.submittedAt)}
                    </span>
                  </div>
                </div>

                <!-- Frosted Glass Quote Bubble -->
                <div class="inbox-msg-bubble">
                  <div class="inbox-quote-icon-pod">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                  </div>
                  <div class="inbox-msg-text">${escapeHtml(item.message || "(No message content provided)")}</div>
                </div>

                <!-- Collapsible Reply Drawer -->
                <div class="inbox-reply-drawer ${isDrawerOpen ? "drawer-open" : ""}" id="drawer-${item.id}">
                  <div class="inbox-drawer-header">
                    <span>&gt;__ COMPOSE RESPONSE TO ${escapeHtml(item.name || item.email || "CLIENT")}</span>
                    <button class="btn btn-sm btn-ghost close-drawer-btn" data-id="${item.id}" style="padding: 2px 6px;">✕ Close</button>
                  </div>

                  <div class="inbox-presets-row">
                    <span style="font-size: 0.76rem; color: var(--text-muted); margin-right: 4px;">1-Click Templates:</span>
                    <button class="inbox-preset-chip" data-id="${item.id}" data-template="chat">🗓 Schedule Tech Chat</button>
                    <button class="inbox-preset-chip" data-id="${item.id}" data-template="deck">📄 Send Portfolio &amp; Deck</button>
                    <button class="inbox-preset-chip" data-id="${item.id}" data-template="rates">💼 Rates &amp; Availability</button>
                    <button class="inbox-preset-chip" data-id="${item.id}" data-template="decline">🙏 Politely Decline</button>
                  </div>

                  <textarea class="inbox-reply-textarea" id="reply-text-${item.id}" placeholder="Draft professional reply to ${escapeHtml(item.name || "sender")}...">${getDefaultDraft(item)}</textarea>

                  <div class="inbox-drawer-footer">
                    <div style="font-size: 0.78rem; color: var(--text-muted);">
                      Draft will open in your default mail app or copy to clipboard.
                    </div>
                    <div style="display: flex; gap: 8px;">
                      <button class="btn btn-sm btn-secondary copy-draft-btn" data-id="${item.id}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copy Draft
                      </button>
                      <button class="btn btn-sm btn-primary launch-email-btn" data-id="${item.id}" data-email="${escapeHtml(item.email || "")}" data-name="${escapeHtml(item.name || "")}" data-type="${escapeHtml(item.type || "Inquiry")}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Launch Email App
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Card Actions Footer -->
                <div class="inbox-card-footer">
                  <div class="inbox-left-actions">
                    <button class="btn btn-sm btn-primary toggle-drawer-btn" data-id="${item.id}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      ${isDrawerOpen ? "Hide Composer" : "Quick Reply"}
                    </button>
                    ${item.email ? `
                      <a href="mailto:${escapeHtml(item.email)}?subject=Re:%20${encodeURIComponent(item.type || "Inquiry")}%20via%20Portfolio&body=Hi%20${encodeURIComponent(item.name || "")}," class="btn btn-sm btn-ghost" title="Direct mailto link">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        Mail Client
                      </a>
                    ` : ""}
                  </div>

                  <div class="inbox-right-actions">
                    <button class="btn btn-sm btn-ghost toggle-read-btn" data-id="${item.id}">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                      ${item.isRead ? "Mark Unread" : "Mark Read"}
                    </button>
                    <button class="btn btn-sm btn-ghost toggle-archive-btn" data-id="${item.id}">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                      ${item.isArchived ? "Restore to Inbox" : "Archive"}
                    </button>
                    <button class="btn btn-sm btn-danger-ghost delete-inbox-btn" data-id="${item.id}">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Delete
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

    attachEventListeners();
  };

  const attachEventListeners = () => {
    // Header Actions
    container.querySelector("#simulate-inquiry-btn")?.addEventListener("click", () => simulateDemoInquiry());
    container.querySelector("#empty-inquiry-btn")?.addEventListener("click", () => simulateDemoInquiry());

    // Export Leads
    container.querySelector("#export-inbox-btn")?.addEventListener("click", () => {
      const activeItems = inbox.filter(i => !i.isArchived);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeItems, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `satwinder_leads_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(`Exported ${activeItems.length} leads successfully!`);
    });

    // Mark All Read
    container.querySelector("#mark-all-read-btn")?.addEventListener("click", async () => {
      const unreadItems = inbox.filter(i => !i.isRead && !i.isArchived);
      if (unreadItems.length === 0) {
        toast.info("All inquiries are already marked as read.");
        return;
      }
      try {
        await Promise.all(
          unreadItems
            .filter(item => !String(item.id).startsWith("inq_demo_"))
            .map(item => updateContactStatus(item.id, { isRead: true }))
        );
        unreadItems.forEach(item => { item.isRead = true; });
        toast.success(`Marked ${unreadItems.length} inquiries as read.`);
        renderView();
      } catch (e) {
        toast.error("Failed to mark all as read: " + e.message);
      }
    });

    // Search query with focus & caret retention
    container.querySelector("#inbox-search")?.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      renderView();
      const re = container.querySelector("#inbox-search");
      if (re) {
        re.focus();
        try { re.setSelectionRange(start, end); } catch (_) {}
      }
    });

    // Filter pills
    container.querySelectorAll(".category-tabs .tab-pill").forEach(tab => {
      tab.addEventListener("click", () => {
        currentFilter = tab.dataset.filter;
        renderView();
      });
    });

    // Copy chip button
    container.querySelectorAll(".copy-chip-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const text = btn.dataset.copy;
        if (text) {
          navigator.clipboard.writeText(text);
          toast.success(`Copied: ${text}`);
        }
      });
    });

    // Toggle Star
    container.querySelectorAll(".star-inbox-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const item = inbox.find(i => i.id === id);
        if (!item) return;

        const nextStarred = !item.isStarred;
        try {
          if (!id.startsWith("inq_demo_")) {
            await updateContactStatus(id, { isStarred: nextStarred });
          }
          item.isStarred = nextStarred;
          toast.success(nextStarred ? "⭐ Lead starred as priority!" : "Removed from starred.");
          renderView();
        } catch (e) {
          toast.error("Failed to update star: " + e.message);
        }
      });
    });

    // Toggle Drawer
    container.querySelectorAll(".toggle-drawer-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (openDrawers.has(id)) {
          openDrawers.delete(id);
        } else {
          openDrawers.add(id);
        }
        renderView();
      });
    });

    // Close Drawer
    container.querySelectorAll(".close-drawer-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        openDrawers.delete(id);
        renderView();
      });
    });

    // Preset Templates
    container.querySelectorAll(".inbox-preset-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const template = btn.dataset.template;
        const item = inbox.find(i => i.id === id);
        const textarea = container.querySelector(`#reply-text-${id}`);
        if (!textarea || !item) return;

        textarea.value = getTemplateText(template, item);
        toast.info("Applied template draft.");
      });
    });

    // Copy Draft
    container.querySelectorAll(".copy-draft-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const textarea = container.querySelector(`#reply-text-${id}`);
        if (textarea && textarea.value) {
          navigator.clipboard.writeText(textarea.value);
          toast.success("Draft response copied to clipboard!");
        }
      });
    });

    // Launch Email App
    container.querySelectorAll(".launch-email-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const email = btn.dataset.email;
        const name = btn.dataset.name;
        const type = btn.dataset.type;
        const textarea = container.querySelector(`#reply-text-${id}`);
        const body = textarea ? textarea.value : "";
        const subject = `Re: ${type} inquiry — Satwinder Singh (Lead Mobile Engineer)`;

        const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
        toast.success("Opening in default mail client...");
      });
    });

    // Toggle Read
    container.querySelectorAll(".toggle-read-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const item = inbox.find(i => i.id === id);
        if (!item) return;

        const nextRead = !item.isRead;
        try {
          if (!id.startsWith("inq_demo_")) {
            await updateContactStatus(id, { isRead: nextRead });
          }
          item.isRead = nextRead;
          toast.success(nextRead ? "Marked as read." : "Marked as unread.");
          renderView();
        } catch (e) {
          toast.error("Failed to update status: " + e.message);
        }
      });
    });

    // Toggle Archive
    container.querySelectorAll(".toggle-archive-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const item = inbox.find(i => i.id === id);
        if (!item) return;

        const nextArchived = !item.isArchived;
        try {
          if (!id.startsWith("inq_demo_")) {
            await updateContactStatus(id, { isArchived: nextArchived });
          }
          item.isArchived = nextArchived;
          toast.success(nextArchived ? "Moved to archive." : "Restored to active inbox.");
          renderView();
        } catch (e) {
          toast.error("Failed to update status: " + e.message);
        }
      });
    });

    // Delete
    container.querySelectorAll(".delete-inbox-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const item = inbox.find(i => i.id === id);
        if (!item) return;

        const ok = await modal.confirm({
          title: "Delete Inquiry?",
          message: `Permanently delete message from "${item.name || item.email || "Sender"}"? This cannot be undone.`,
          confirmText: "Delete Lead",
          isDanger: true
        });

        if (ok) {
          try {
            if (!id.startsWith("inq_demo_")) {
              await deleteContactSubmission(id);
            }
            inbox = inbox.filter(i => i.id !== id);
            state.inbox = inbox;
            openDrawers.delete(id);
            toast.success("Inquiry deleted.");
            renderView();
          } catch (e) {
            toast.error("Failed to delete message: " + e.message);
          }
        }
      });
    });
  };

  const simulateDemoInquiry = () => {
    const demos = [
      {
        id: "inq_demo_" + Date.now(),
        name: "Marcus Thorne",
        email: "marcus.thorne@fintechalpha.io",
        phone: "+1 (415) 890-2341",
        company: "FinTech Alpha Global",
        type: "Hiring / Contract",
        message: "Hi Satwinder, we reviewed your Flutter portfolio and would like to discuss a mobile app project. Please let us know how we can share more details.",
        isRead: false,
        isStarred: true,
        isArchived: false,
        submittedAt: new Date().toISOString()
      },
      {
        id: "inq_demo_" + (Date.now() + 1),
        name: "Elena Rostova",
        email: "elena@quantummobility.de",
        phone: "+49 30 9283 112",
        company: "Quantum Mobility",
        type: "Architecture Consulting",
        message: "Hello Satwinder! We need an expert consultation on sub-second WebSocket telemetry and Google Maps polylines optimization for a 50,000+ driver fleet in Germany. What is your consulting availability?",
        isRead: false,
        isStarred: false,
        isArchived: false,
        submittedAt: new Date().toISOString()
      },
      {
        id: "inq_demo_" + (Date.now() + 2),
        name: "Devin Vance",
        email: "devin@apexventures.io",
        phone: "+1 (650) 412-8800",
        company: "Apex Ventures Studio",
        type: "Full-Stack Collaboration",
        message: "Hey Satwinder, loved the fluid WebGL holographic design and Clean Architecture demo. We are incubating 3 stealth mobile apps in 2027 and would love to contract you as Fractional Principal Architect. Let's discuss scope!",
        isRead: false,
        isStarred: true,
        isArchived: false,
        submittedAt: new Date().toISOString()
      }
    ];

    const pick = demos[Math.floor(Math.random() * demos.length)];
    inbox.unshift(pick);
    state.inbox = inbox;
    toast.success("✨ Simulated incoming high-value client lead!");
    renderView();
  };

  renderView();
}

function getTypeClass(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("hiring") || t.includes("contract")) return "type-hiring";
  if (t.includes("consulting") || t.includes("architecture")) return "type-consulting";
  if (t.includes("collab") || t.includes("project")) return "type-collab";
  return "type-other";
}

function getAvatarClass(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("hiring") || t.includes("contract")) return "avatar-hiring";
  if (t.includes("consulting") || t.includes("architecture")) return "avatar-consulting";
  if (t.includes("collab") || t.includes("project")) return "avatar-collab";
  return "";
}

function getTypeIcon(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("hiring") || t.includes("contract")) {
    return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
  }
  if (t.includes("consulting") || t.includes("architecture")) {
    return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
  }
  if (t.includes("collab") || t.includes("project")) {
    return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;
  }
  return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
}

function getDefaultDraft(item) {
  const name = item.name || "there";
  return `Hi ${name},\n\nThank you for reaching out via my portfolio! I reviewed your message regarding "${item.type || "the opportunity"}" and would be glad to discuss it further.\n\nBest regards,\nSatwinder Singh\nSenior Flutter Developer\nhttps://satwinder777.github.io`;
}

function getTemplateText(template, item) {
  const name = item.name || "there";
  switch (template) {
    case "chat":
      return `Hi ${name},\n\nThank you for reaching out! I'd be glad to discuss this initiative. Please share a few times that work for you, and I will confirm my availability.\n\nBest regards,\nSatwinder Singh\nSenior Flutter Developer`;
    case "deck":
      return `Hi ${name},\n\nThank you for considering my portfolio. You can review the available portfolio information and public repositories here:\n- Portfolio: https://satwinder777.github.io\n- GitHub: https://github.com/Satwinder777\n\nBest regards,\nSatwinder Singh`;
    case "rates":
      return `Hi ${name},\n\nThank you for your inquiry. Please share the project scope and timing, and I can confirm availability and discuss a suitable estimate.\n\nYou can reach me through the portfolio contact section: https://satwinder777.github.io/#contact\n\nBest regards,\nSatwinder Singh`;
    case "decline":
      return `Hi ${name},\n\nThank you for considering me for this opportunity. After reviewing the details, I will not be moving forward with it. I appreciate your interest and wish you the best with the project.\n\nBest regards,\nSatwinder Singh`;
    default:
      return getDefaultDraft(item);
  }
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
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
