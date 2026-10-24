// ============================================================
//  admin/js/modules/inbox.js
//  Contact Inquiries & Messages Management Module
// ============================================================

import { updateContactStatus, deleteContactSubmission } from "../firebase-admin.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

export function renderInbox(container, state) {
  let inbox = Array.isArray(state.inbox) ? [...state.inbox] : [];
  let currentFilter = "all"; // 'all' | 'unread' | 'archived'
  let searchQuery = "";

  const renderView = () => {
    const unreadCount = inbox.filter(i => !i.isRead && !i.isArchived).length;
    const archivedCount = inbox.filter(i => i.isArchived).length;

    const filtered = inbox.filter(item => {
      const isUnread = !item.isRead && !item.isArchived;
      const isArchived = Boolean(item.isArchived);

      let matchFilter = true;
      if (currentFilter === "unread") matchFilter = isUnread;
      if (currentFilter === "archived") matchFilter = isArchived;
      if (currentFilter === "all") matchFilter = !isArchived; // 'all' displays active inbox

      const matchQuery = !searchQuery ||
        (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.message || "").toLowerCase().includes(searchQuery.toLowerCase());

      return matchFilter && matchQuery;
    });

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Inquiries & Contact Inbox</h1>
          <p class="view-subtitle">Review messages, hiring inquiries, and client collaboration requests.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="simulate-inquiry-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            + Simulate Inquiry
          </button>
          <span class="badge ${unreadCount > 0 ? "badge-info" : "badge-neutral"}">
            <span class="status-pulse-dot"></span>
            ${unreadCount} Unread Inquiries
          </span>
        </div>
      </div>

      <!-- Quick Metrics Overview -->
      <div class="stats-overview-grid" style="margin-bottom: 22px;">
        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(0, 217, 255, 0.12); color: var(--accent-cyan);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div>
            <div class="stat-number">${inbox.filter(i => !i.isArchived).length}</div>
            <div class="stat-label">Active Inquiries</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <div class="stat-number">${unreadCount}</div>
            <div class="stat-label">Unread Messages</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(148, 163, 184, 0.12); color: #94a3b8;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
          </div>
          <div>
            <div class="stat-number">${archivedCount}</div>
            <div class="stat-label">Archived Inquiries</div>
          </div>
        </div>

        <div class="stat-card">
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
          <button class="tab-pill ${currentFilter === "all" ? "active" : ""}" data-filter="all">Active (${inbox.filter(i => !i.isArchived).length})</button>
          <button class="tab-pill ${currentFilter === "unread" ? "active" : ""}" data-filter="unread">Unread (${unreadCount})</button>
          <button class="tab-pill ${currentFilter === "archived" ? "active" : ""}" data-filter="archived">Archived (${archivedCount})</button>
        </div>
      </div>

      <!-- Inbox List -->
      <div class="inbox-list-container">
        ${filtered.length === 0 ? `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <h3>No messages found</h3>
            <p>${searchQuery ? "Try refining your search keyword." : "Messages sent from your portfolio contact form will arrive here."}</p>
            <button class="btn btn-primary" id="empty-inquiry-btn" style="margin-top: 14px;">
              + Create Demo Inquiry
            </button>
          </div>
        ` : `
          <div class="inbox-feed">
            ${filtered.map(item => `
              <div class="inbox-card ${!item.isRead ? "card-unread" : ""}" data-id="${item.id}">
                <div class="inbox-card-top">
                  <div class="inbox-sender-meta">
                    <div class="sender-avatar">${(item.name || "S").charAt(0).toUpperCase()}</div>
                    <div>
                      <div class="sender-title-row">
                        <strong class="sender-name">${escapeHtml(item.name || "(No Name)")}</strong>
                        ${!item.isRead ? `<span class="badge badge-info unread-pill">NEW</span>` : ""}
                        ${item.type ? `<span class="badge badge-neutral">${escapeHtml(item.type)}</span>` : ""}
                      </div>
                      <div class="sender-sub-details">
                        ${item.email ? `
                          <a href="mailto:${item.email}" class="meta-link sender-email">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            ${escapeHtml(item.email)}
                          </a>
                        ` : ""}
                        ${item.phone ? `
                          <span class="meta-dot">•</span>
                          <span class="meta-phone">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            ${escapeHtml(item.phone)}
                          </span>
                        ` : ""}
                        ${item.company ? `
                          <span class="meta-dot">•</span>
                          <span class="meta-company">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>
                            ${escapeHtml(item.company)}
                          </span>
                        ` : ""}
                      </div>
                    </div>
                  </div>

                  <div class="inbox-date-actions">
                    <span class="inbox-date">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      ${formatDate(item.submittedAt)}
                    </span>
                  </div>
                </div>

                <div class="inbox-message-body">
                  <p>${escapeHtml(item.message || "(No message body)")}</p>
                </div>

                <div class="inbox-card-footer">
                  <div class="left-actions">
                    ${item.email ? `
                      <a href="mailto:${item.email}?subject=Re:%20Inquiry%20via%20Portfolio&body=Hi%20${encodeURIComponent(item.name || "")}," class="btn btn-sm btn-primary reply-email-link">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Reply via Email
                      </a>
                    ` : ""}
                  </div>

                  <div class="right-actions">
                    <button class="btn btn-sm btn-ghost toggle-read-btn" data-id="${item.id}">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                      ${item.isRead ? "Mark Unread" : "Mark as Read"}
                    </button>
                    <button class="btn btn-sm btn-ghost toggle-archive-btn" data-id="${item.id}">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                      ${item.isArchived ? "Unarchive" : "Archive"}
                    </button>
                    <button class="btn btn-sm btn-danger-ghost delete-inbox-btn" data-id="${item.id}">
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

    container.querySelector("#simulate-inquiry-btn")?.addEventListener("click", () => simulateDemoInquiry());
    container.querySelector("#empty-inquiry-btn")?.addEventListener("click", () => simulateDemoInquiry());

    // Listeners
    container.querySelector("#inbox-search")?.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderView();
    });

    container.querySelectorAll(".category-tabs .tab-pill").forEach(tab => {
      tab.addEventListener("click", () => {
        currentFilter = tab.dataset.filter;
        renderView();
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
          await updateContactStatus(id, { isRead: nextRead });
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
          await updateContactStatus(id, { isArchived: nextArchived });
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
          title: "Delete Message?",
          message: `Permanently delete message from "${item.name || item.email || "Sender"}"?`,
          confirmText: "Delete",
          isDanger: true
        });

        if (ok) {
          try {
            await deleteContactSubmission(id);
            inbox = inbox.filter(i => i.id !== id);
            state.inbox = inbox;
            toast.success("Message deleted.");
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
        message: "Hi Satwinder, we came across your Flutter 120fps architecture showcase. We are looking for a Lead Mobile Engineer to architect our next-gen mobile trading terminal. Would love to schedule a technical chat this week.",
        isRead: false,
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
        isArchived: false,
        submittedAt: new Date().toISOString()
      }
    ];

    const pick = demos[Math.floor(Math.random() * demos.length)];
    inbox.unshift(pick);
    state.inbox = inbox;
    toast.success("✨ Simulated incoming client inquiry!");
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
