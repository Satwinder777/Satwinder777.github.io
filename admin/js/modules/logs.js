// ============================================================
//  admin/js/modules/logs.js
//  Real-Time Telemetry & Client Error Stream Diagnostics
// ============================================================

import { clearAllLogs, markLogRead } from "../firebase-admin.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

export function renderLogs(container, state) {
  let logs = Array.isArray(state.logs) ? [...state.logs] : [];
  let currentLevelFilter = "all"; // 'all' | 'error' | 'warning' | 'info'
  let searchQuery = "";

  const renderView = () => {
    const errorCount = logs.filter(l => (l.level || "").toLowerCase() === "error" || (l.level || "").toLowerCase() === "fatal").length;
    const warnCount = logs.filter(l => (l.level || "").toLowerCase() === "warning" || (l.level || "").toLowerCase() === "warn").length;

    const filtered = logs.filter(item => {
      const lvl = (item.level || "info").toLowerCase();
      let matchLevel = true;
      if (currentLevelFilter === "error") matchLevel = lvl === "error" || lvl === "fatal";
      if (currentLevelFilter === "warning") matchLevel = lvl === "warning" || lvl === "warn";
      if (currentLevelFilter === "info") matchLevel = lvl === "info" || lvl === "debug";

      const matchQuery = !searchQuery ||
        (item.message || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.url || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.source || "").toLowerCase().includes(searchQuery.toLowerCase());

      return matchLevel && matchQuery;
    });

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Diagnostics & Telemetry Logs</h1>
          <p class="view-subtitle">Real-time error stream, uncaught browser exceptions, and CMS diagnostics.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-danger-ghost" id="clear-logs-btn" ${logs.length === 0 ? "disabled" : ""}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            Clear Telemetry Logs
          </button>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="filter-bar">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="logs-search" placeholder="Search message, URL, error trace..." value="${escapeHtml(searchQuery)}">
        </div>

        <div class="category-tabs">
          <button class="tab-pill ${currentLevelFilter === "all" ? "active" : ""}" data-level="all">All (${logs.length})</button>
          <button class="tab-pill ${currentLevelFilter === "error" ? "active" : ""}" data-level="error">Errors (${errorCount})</button>
          <button class="tab-pill ${currentLevelFilter === "warning" ? "active" : ""}" data-level="warning">Warnings (${warnCount})</button>
          <button class="tab-pill ${currentLevelFilter === "info" ? "active" : ""}" data-level="info">Info / Other</button>
        </div>
      </div>

      <!-- Logs Stream Table / Cards -->
      <div class="logs-list-container">
        ${filtered.length === 0 ? `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <h3>No telemetry events recorded</h3>
            <p>System runtime logs and website client diagnostics are completely clean.</p>
          </div>
        ` : `
          <div class="logs-feed">
            ${filtered.map(item => {
              const lvl = (item.level || "info").toLowerCase();
              const badgeClass = (lvl === "error" || lvl === "fatal") ? "badge-danger" : (lvl === "warning" || lvl === "warn") ? "badge-warning" : "badge-info";
              return `
                <div class="log-item-card ${item.read ? "log-read" : ""}" data-id="${item.id}">
                  <div class="log-top-row">
                    <div class="log-meta">
                      <span class="badge ${badgeClass}">${(item.level || "INFO").toUpperCase()}</span>
                      <span class="log-category-pill">${escapeHtml(item.category || item.source || "web")}</span>
                      <span class="log-timestamp">${formatDate(item.createdAt)}</span>
                    </div>
                    <div class="log-actions">
                      <button class="btn btn-sm btn-ghost inspect-log-btn" data-id="${item.id}">Inspect Details</button>
                    </div>
                  </div>

                  <div class="log-message-row">
                    <code>${escapeHtml(item.message || "(No message body)")}</code>
                  </div>

                  ${item.url ? `
                    <div class="log-url-row">
                      <small>Origin URL: <span class="url-text">${escapeHtml(item.url)}</span></small>
                    </div>
                  ` : ""}
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>
    `;

    // Listeners
    container.querySelector("#logs-search")?.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderView();
    });

    container.querySelectorAll(".category-tabs .tab-pill").forEach(tab => {
      tab.addEventListener("click", () => {
        currentLevelFilter = tab.dataset.level;
        renderView();
      });
    });

    // Inspect Details modal
    container.querySelectorAll(".inspect-log-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const item = logs.find(l => l.id === id);
        if (item) openLogInspector(item);
      });
    });

    // Clear All Logs
    container.querySelector("#clear-logs-btn")?.addEventListener("click", async () => {
      const ok = await modal.confirm({
        title: "Clear Telemetry Logs?",
        message: "This will delete all logged client-side diagnostics and errors permanently.",
        confirmText: "Clear All Logs",
        isDanger: true
      });

      if (ok) {
        try {
          await clearAllLogs();
          logs = [];
          state.logs = [];
          toast.success("Telemetry logs cleared!");
          renderView();
        } catch (e) {
          toast.error("Failed to clear logs: " + e.message);
        }
      }
    });
  };

  const openLogInspector = (item) => {
    // Mark as read in background
    markLogRead(item.id).catch(() => {});
    item.read = true;

    const modalBodyHtml = `
      <div class="log-detail-viewer">
        <div class="log-detail-row">
          <strong>Severity:</strong>
          <span class="badge ${item.level === "error" ? "badge-danger" : "badge-info"}">${(item.level || "INFO").toUpperCase()}</span>
        </div>
        <div class="log-detail-row">
          <strong>Timestamp:</strong>
          <span>${formatDate(item.createdAt)}</span>
        </div>
        <div class="log-detail-row">
          <strong>Source / Category:</strong>
          <span>${escapeHtml(item.source || "")} (${escapeHtml(item.category || "web")})</span>
        </div>
        ${item.url ? `
          <div class="log-detail-row">
            <strong>URL:</strong>
            <code>${escapeHtml(item.url)}</code>
          </div>
        ` : ""}

        <div class="log-detail-block">
          <strong>Message:</strong>
          <pre class="log-pre">${escapeHtml(item.message || "")}</pre>
        </div>

        ${item.stack || item.stackTrace ? `
          <div class="log-detail-block">
            <strong>Stack Trace:</strong>
            <pre class="log-pre stack-pre">${escapeHtml(item.stack || item.stackTrace || "")}</pre>
          </div>
        ` : ""}

        ${item.meta || item.metadata ? `
          <div class="log-detail-block">
            <strong>Metadata:</strong>
            <pre class="log-pre json-pre">${escapeHtml(JSON.stringify(item.meta || item.metadata, null, 2))}</pre>
          </div>
        ` : ""}
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" id="modal-log-close">Close</button>
    `;

    const modalEl = modal.open({
      title: "Telemetry Event Inspector",
      bodyHtml: modalBodyHtml,
      footerHtml,
      size: "lg"
    });

    modalEl.querySelector("#modal-log-close").addEventListener("click", () => modal.close());
  };

  renderView();
}

function formatDate(date) {
  if (!date) return "";
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
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
