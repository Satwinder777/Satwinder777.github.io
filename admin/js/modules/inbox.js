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
          <span class="badge ${unreadCount > 0 ? "badge-info" : "badge-neutral"}">
            ${unreadCount} Unread Inquiries
          </span>
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
          </div>
        ` : `
          <div class="inbox-feed">
            ${filtered.map(item => `
              <div class="inbox-card ${!item.isRead ? "card-unread" : ""}" data-id="${item.id}">
                <div class="inbox-card-top">
                  <div class="inbox-sender-meta">
                    <strong class="sender-name">${escapeHtml(item.name || "(No Name)")}</strong>
                    <div class="sender-sub-details">
                      ${item.email ? `<a href="mailto:${item.email}" class="meta-link">${escapeHtml(item.email)}</a>` : ""}
                      ${item.phone ? `<span class="meta-dot">•</span><span class="meta-phone">${escapeHtml(item.phone)}</span>` : ""}
                      ${item.company ? `<span class="meta-dot">•</span><span class="meta-company">${escapeHtml(item.company)}</span>` : ""}
                    </div>
                  </div>

                  <div class="inbox-date-actions">
                    <span class="inbox-date">${formatDate(item.submittedAt)}</span>
                    ${item.type ? `<span class="badge badge-neutral">${escapeHtml(item.type)}</span>` : ""}
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
                      ${item.isRead ? "Mark Unread" : "Mark as Read"}
                    </button>
                    <button class="btn btn-sm btn-ghost toggle-archive-btn" data-id="${item.id}">
                      ${item.isArchived ? "Unarchive" : "Archive"}
                    </button>
                    <button class="btn btn-sm btn-danger-ghost delete-inbox-btn" data-id="${item.id}">
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
