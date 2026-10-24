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
    const infoCount = logs.filter(l => (l.level || "").toLowerCase() === "info" || (l.level || "").toLowerCase() === "debug").length;

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
          <p class="view-subtitle">Real-time error stream, uncaught client exceptions, WebGL canvas performance, and telemetry events.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="btn-simulate-log" title="Generate test error log for verification">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            Simulate Diagnostic Log
          </button>
          <button class="btn btn-danger-ghost" id="clear-logs-btn" ${logs.length === 0 ? "disabled" : ""}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            Clear Telemetry Logs
          </button>
        </div>
      </div>

      <!-- Stats Overview Grid -->
      <div class="stats-overview-grid">
        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-number">${errorCount}</span>
            <span class="stat-label">Critical & Fatal Errors</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-number">${warnCount}</span>
            <span class="stat-label">Runtime Warnings</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-number">${infoCount}</span>
            <span class="stat-label">Info & Analytics Events</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-pod" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-number" style="font-size: 1.25rem; font-weight: 700; color: #10b981;">Online</span>
            <span class="stat-label">Realtime Error Listener Active</span>
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="filter-bar">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="logs-search" placeholder="Search message, URL, category, or trace..." value="${escapeHtml(searchQuery)}">
        </div>

        <div class="category-tabs">
          <button class="tab-pill ${currentLevelFilter === "all" ? "active" : ""}" data-level="all">All (${logs.length})</button>
          <button class="tab-pill ${currentLevelFilter === "error" ? "active" : ""}" data-level="error">Errors (${errorCount})</button>
          <button class="tab-pill ${currentLevelFilter === "warning" ? "active" : ""}" data-level="warning">Warnings (${warnCount})</button>
          <button class="tab-pill ${currentLevelFilter === "info" ? "active" : ""}" data-level="info">Info (${infoCount})</button>
        </div>
      </div>

      <!-- Logs Stream Table / Cards -->
      <div class="logs-list-container">
        ${filtered.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon-pod" style="background: rgba(16, 185, 129, 0.12); color: #10b981;">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3>Clean Telemetry Stream</h3>
            <p>No telemetry diagnostics or unhandled exceptions match your criteria. The production application is running smoothly.</p>
            <button class="btn btn-secondary" id="btn-empty-simulate" style="margin-top: 14px;">
              Simulate Sample Diagnostic Event
            </button>
          </div>
        ` : `
          <div class="logs-feed">
            ${filtered.map(item => {
              const lvl = (item.level || "info").toLowerCase();
              const isErr = (lvl === "error" || lvl === "fatal");
              const isWarn = (lvl === "warning" || lvl === "warn");
              const badgeClass = isErr ? "badge-danger" : isWarn ? "badge-warning" : "badge-info";
              const pulseColor = isErr ? "#ef4444" : isWarn ? "#f59e0b" : "#06b6d4";

              return `
                <div class="log-item-card ${isErr ? "log-is-error" : isWarn ? "log-is-warn" : ""} ${item.read ? "log-read" : ""}" data-id="${item.id}">
                  <div class="log-top-row">
                    <div class="log-meta">
                      <span class="log-pulse-dot" style="background: ${pulseColor}; box-shadow: 0 0 8px ${pulseColor};"></span>
                      <span class="badge ${badgeClass}">${(item.level || "INFO").toUpperCase()}</span>
                      <span class="log-category-pill">${escapeHtml(item.category || item.source || "runtime")}</span>
                      <span class="log-timestamp">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: -1px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        ${formatDate(item.createdAt)}
                      </span>
                    </div>
                    <div class="log-actions">
                      <button class="btn btn-sm btn-secondary inspect-log-btn" data-id="${item.id}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Inspect Details
                      </button>
                    </div>
                  </div>

                  <div class="log-message-row">
                    <pre class="log-message-code"><code>${escapeHtml(item.message || "(No message body provided)")}</code></pre>
                  </div>

                  <div class="log-bottom-row">
                    ${item.url ? `
                      <span class="log-url-chip">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                        ${escapeHtml(item.url)}
                      </span>
                    ` : `
                      <span class="log-url-chip">Internal Engine Source</span>
                    `}
                    ${item.stack ? `
                      <span class="badge badge-neutral" style="font-size: 0.72rem;">Stack Trace Attached</span>
                    ` : ""}
                  </div>
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
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      renderView();
      const re = container.querySelector("#logs-search");
      if (re) {
        re.focus();
        try { re.setSelectionRange(start, end); } catch (_) {}
      }
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

    // Simulate Log Helper
    const runSimulation = () => {
      const mockEvent = {
        id: "sim-" + Date.now(),
        level: Math.random() > 0.4 ? "error" : "warning",
        category: "WebGL Canvas Shader",
        source: "gl-fluid-stream",
        url: window.location.origin + "/#experience",
        message: "Uncaught WebGLContextEvent: Failed to compile fluid velocity fragment shader at uniform location (fluid_damping: highp float).",
        stack: "Error: Uniform highp float compilation warning\n    at FluidSimulation.render (fluid.js:142:18)\n    at requestAnimationFrame (app.js:284:12)",
        metadata: {
          gpuRenderer: "Apple M2 Pro Metal GL",
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          fps: 58.4,
          timestamp: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      };
      logs.unshift(mockEvent);
      state.logs = logs;
      toast.info("Generated simulated telemetry event for verification!");
      renderView();
    };

    container.querySelector("#btn-simulate-log")?.addEventListener("click", runSimulation);
    container.querySelector("#btn-empty-simulate")?.addEventListener("click", runSimulation);

    // Clear All Logs
    container.querySelector("#clear-logs-btn")?.addEventListener("click", async () => {
      const ok = await modal.confirm({
        title: "Clear Telemetry Logs?",
        message: "This will permanently purge all logged client diagnostics, uncaught browser exceptions, and telemetry records from Firestore.",
        confirmText: "Clear All Logs",
        isDanger: true
      });

      if (ok) {
        try {
          await clearAllLogs();
          logs = [];
          state.logs = [];
          toast.success("Telemetry log stream cleared!");
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
          <strong>Severity Level:</strong>
          <span class="badge ${item.level === "error" || item.level === "fatal" ? "badge-danger" : item.level === "warning" ? "badge-warning" : "badge-info"}">
            ${(item.level || "INFO").toUpperCase()}
          </span>
        </div>
        <div class="log-detail-row">
          <strong>Recorded Timestamp:</strong>
          <span>${formatDate(item.createdAt)}</span>
        </div>
        <div class="log-detail-row">
          <strong>Source / Category:</strong>
          <span>${escapeHtml(item.source || "client")} &bull; <code>${escapeHtml(item.category || "web")}</code></span>
        </div>
        ${item.url ? `
          <div class="log-detail-row">
            <strong>Origin Client URL:</strong>
            <code style="word-break: break-all;">${escapeHtml(item.url)}</code>
          </div>
        ` : ""}

        <div class="log-detail-block">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong>Exception Message:</strong>
            <button class="btn btn-sm btn-ghost" id="copy-msg-btn">Copy Text</button>
          </div>
          <pre class="log-pre">${escapeHtml(item.message || "")}</pre>
        </div>

        ${item.stack || item.stackTrace ? `
          <div class="log-detail-block">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong>Call Stack Trace:</strong>
              <button class="btn btn-sm btn-ghost" id="copy-stack-btn">Copy Stack Trace</button>
            </div>
            <pre class="log-pre stack-pre">${escapeHtml(item.stack || item.stackTrace || "")}</pre>
          </div>
        ` : ""}

        ${item.meta || item.metadata ? `
          <div class="log-detail-block">
            <strong>Client Environment & Metadata:</strong>
            <pre class="log-pre json-pre">${escapeHtml(JSON.stringify(item.meta || item.metadata, null, 2))}</pre>
          </div>
        ` : ""}
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" id="modal-log-close">Close Inspector</button>
    `;

    const modalEl = modal.open({
      title: "Telemetry Event Inspector",
      bodyHtml: modalBodyHtml,
      footerHtml,
      size: "lg"
    });

    modalEl.querySelector("#modal-log-close")?.addEventListener("click", () => modal.close());
    modalEl.querySelector("#copy-msg-btn")?.addEventListener("click", () => {
      navigator.clipboard.writeText(item.message || "");
      toast.success("Error message copied!");
    });
    modalEl.querySelector("#copy-stack-btn")?.addEventListener("click", () => {
      navigator.clipboard.writeText(item.stack || item.stackTrace || "");
      toast.success("Stack trace copied!");
    });
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
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
