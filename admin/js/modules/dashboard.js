// ============================================================
//  admin/js/modules/dashboard.js
//  Overview KPIs, Live Toggles, System Health & Shortcuts
// ============================================================

import { updatePortfolioField, updatePortfolioFields } from "../firebase-admin.js";
import { toast } from "../toast.js";

export function renderDashboard(container, state, appRouter) {
  const portfolio = state.portfolio || {};
  const profile = portfolio.profile || {};
  const projects = portfolio.projects || [];
  const experience = portfolio.experience || [];
  const skills = portfolio.technicalArsenal || [];
  const siteBanner = portfolio.siteBanner || {};
  const feedback = state.feedback || [];
  const inbox = state.inbox || [];
  const logs = state.logs || [];

  const pendingFeedback = feedback.filter(f => f.status === "in_review" || !f.status).length;
  const unreadInbox = inbox.filter(i => !i.isRead && !i.isArchived).length;
  const errorLogs = logs.filter(l => l.level === "error" || l.level === "fatal").length;
  const featuredProjects = projects.filter(p => p.featured).length;

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Command Center</h1>
        <p class="view-subtitle">Real-time status and operational controls for Satwinder Singh's portfolio CMS.</p>
      </div>
      <div class="header-actions">
        <span class="live-status-pill ${profile.availability ? "status-online" : "status-idle"}">
          <span class="status-dot"></span>
          ${profile.availability ? (profile.availabilityText || "Available for Senior Roles") : "Not Available"}
        </span>
      </div>
    </div>

    <!-- Quick Stat Cards -->
    <div class="kpi-grid">
      <div class="kpi-card" data-route="projects">
        <div class="kpi-icon icon-cyan">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/></svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Showcase Projects</span>
          <div class="kpi-value">${projects.length} <span class="kpi-sub">(${featuredProjects} featured)</span></div>
        </div>
      </div>

      <div class="kpi-card" data-route="experience">
        <div class="kpi-icon icon-purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Career Milestones</span>
          <div class="kpi-value">${experience.length} <span class="kpi-sub">Positions</span></div>
        </div>
      </div>

      <div class="kpi-card" data-route="feedback">
        <div class="kpi-icon icon-amber">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Signal Feedback</span>
          <div class="kpi-value">${feedback.length} <span class="kpi-sub font-amber">(${pendingFeedback} pending)</span></div>
        </div>
      </div>

      <div class="kpi-card" data-route="inbox">
        <div class="kpi-icon icon-blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Contact Inquiries</span>
          <div class="kpi-value">${inbox.length} <span class="kpi-sub font-blue">(${unreadInbox} unread)</span></div>
        </div>
      </div>

      <div class="kpi-card" data-route="skills">
        <div class="kpi-icon icon-emerald">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Technical Arsenal</span>
          <div class="kpi-value">${skills.length} <span class="kpi-sub">Skill Chips</span></div>
        </div>
      </div>

      <div class="kpi-card" data-route="logs">
        <div class="kpi-icon icon-rose">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Telemetry & Logs</span>
          <div class="kpi-value">${logs.length} <span class="kpi-sub ${errorLogs > 0 ? "font-rose" : ""}">(${errorLogs} errors)</span></div>
        </div>
      </div>
    </div>

    <!-- Live Site Toggles Section -->
    <div class="dashboard-section">
      <h2 class="section-title">Live Portfolio Control Switches</h2>
      <div class="toggles-grid">
        <div class="toggle-card">
          <div class="toggle-info">
            <span class="toggle-title">Availability Badge</span>
            <span class="toggle-desc">Controls the header badge ("${profile.availabilityText || "Available for Senior Roles"}") on the public site.</span>
          </div>
          <label class="switch">
            <input type="checkbox" id="switch-availability" ${profile.availability ? "checked" : ""}>
            <span class="slider round"></span>
          </label>
        </div>

        <div class="toggle-card">
          <div class="toggle-info">
            <span class="toggle-title">Live Announcement Banner</span>
            <span class="toggle-desc">${siteBanner.message ? `"${siteBanner.message.substring(0, 55)}..."` : "Top of page ticker banner"}</span>
          </div>
          <label class="switch">
            <input type="checkbox" id="switch-site-banner" ${siteBanner.enabled ? "checked" : ""}>
            <span class="slider round"></span>
          </label>
        </div>

        <div class="toggle-card">
          <div class="toggle-info">
            <span class="toggle-title">Contact Submissions Form</span>
            <span class="toggle-desc">Enables or disables public submissions through the portfolio contact form.</span>
          </div>
          <label class="switch">
            <input type="checkbox" id="switch-contact-enabled" ${portfolio.contactEnabled !== false ? "checked" : ""}>
            <span class="slider round"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- Quick Shortcuts & Recent Inquiries -->
    <div class="dashboard-cols">
      <div class="dashboard-col">
        <div class="card-box">
          <div class="card-box-header">
            <h3>Recent Inquiries</h3>
            <button class="btn btn-sm btn-ghost" id="view-all-inbox">View All</button>
          </div>
          <div class="inbox-quick-list">
            ${inbox.length === 0 ? `<div class="empty-state-sm">No messages received yet.</div>` : ""}
            ${inbox.slice(0, 4).map(item => `
              <div class="quick-inbox-item ${!item.isRead ? "unread" : ""}">
                <div class="quick-inbox-meta">
                  <span class="sender-name">${escapeHtml(item.name || "Anonymous")}</span>
                  <span class="sender-time">${formatDate(item.submittedAt)}</span>
                </div>
                <div class="quick-inbox-preview">${escapeHtml(item.message || item.type || "(No message body)")}</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <div class="dashboard-col">
        <div class="card-box">
          <div class="card-box-header">
            <h3>Quick Actions</h3>
          </div>
          <div class="quick-actions-list">
            <button class="quick-action-btn qa-btn-cyan" id="qa-new-project">
              <span class="qa-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/></svg>
              </span>
              <div class="qa-text">
                <strong>Add New Project</strong>
                <small>Create an app showcase card with tech stack</small>
              </div>
            </button>
            <button class="quick-action-btn qa-btn-purple" id="qa-new-experience">
              <span class="qa-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              </span>
              <div class="qa-text">
                <strong>Add Career Milestone</strong>
                <small>Add new role, company, or promotion timeline</small>
              </div>
            </button>
            <button class="quick-action-btn qa-btn-amber" id="qa-review-feedback">
              <span class="qa-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </span>
              <div class="qa-text">
                <strong>Review Feedback <span class="font-amber">(${pendingFeedback})</span></strong>
                <small>Moderate visitor suggestions & send replies</small>
              </div>
            </button>
            <button class="quick-action-btn qa-btn-emerald" id="qa-edit-banner">
              <span class="qa-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 14.959V9a2 2 0 012-2h2l4-4v18l-4-4H4a2 2 0 01-2-2z"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>
              </span>
              <div class="qa-text">
                <strong>Update Site Banner</strong>
                <small>Change announcement text or developer tag</small>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind KPI card clicks to routes
  container.querySelectorAll(".kpi-card").forEach(card => {
    card.addEventListener("click", () => {
      const route = card.dataset.route;
      if (route && appRouter) appRouter.navigate(route);
    });
  });

  // Bind live switches
  const switchAvailability = container.querySelector("#switch-availability");
  switchAvailability.addEventListener("change", async () => {
    const newVal = switchAvailability.checked;
    try {
      const updatedProfile = { ...(portfolio.profile || {}), availability: newVal };
      await updatePortfolioField("profile", updatedProfile);
      toast.success(`Availability badge set to ${newVal ? "Active" : "Disabled"}`);
    } catch (e) {
      toast.error("Failed to update availability: " + e.message);
      switchAvailability.checked = !newVal;
    }
  });

  const switchBanner = container.querySelector("#switch-site-banner");
  switchBanner.addEventListener("change", async () => {
    const newVal = switchBanner.checked;
    try {
      const updatedBanner = { ...(portfolio.siteBanner || {}), enabled: newVal };
      await updatePortfolioField("siteBanner", updatedBanner);
      toast.success(`Live Announcement Banner ${newVal ? "Enabled" : "Disabled"}`);
    } catch (e) {
      toast.error("Failed to toggle banner: " + e.message);
      switchBanner.checked = !newVal;
    }
  });

  const switchContact = container.querySelector("#switch-contact-enabled");
  switchContact.addEventListener("change", async () => {
    const newVal = switchContact.checked;
    try {
      await updatePortfolioField("contactEnabled", newVal);
      toast.success(`Contact Form Submissions ${newVal ? "Enabled" : "Disabled"}`);
    } catch (e) {
      toast.error("Failed to toggle contact submissions: " + e.message);
      switchContact.checked = !newVal;
    }
  });

  // Quick Action Buttons
  container.querySelector("#view-all-inbox")?.addEventListener("click", () => appRouter.navigate("inbox"));
  container.querySelector("#qa-new-project")?.addEventListener("click", () => {
    appRouter.navigate("projects");
    window.dispatchEvent(new CustomEvent("admin:open-new-project"));
  });
  container.querySelector("#qa-new-experience")?.addEventListener("click", () => {
    appRouter.navigate("experience");
    window.dispatchEvent(new CustomEvent("admin:open-new-experience"));
  });
  container.querySelector("#qa-review-feedback")?.addEventListener("click", () => appRouter.navigate("feedback"));
  container.querySelector("#qa-edit-banner")?.addEventListener("click", () => appRouter.navigate("site_content"));
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
