// ============================================================
//  admin/js/modules/analytics.js
//  Full-Spectrum Telemetry, Feature Dwell Time, Visitor Insights & Charts
// ============================================================

import {
  subscribeToAnalytics,
  getAnalyticsData,
  seedDemoAnalytics,
  clearAllAnalytics
} from "../firebase-admin.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

// Chart instances tracker for clean destruction on view re-render
const chartInstances = {};

export function renderAnalytics(container, state) {
  let currentTimeframe = "week"; // "today" | "week" | "month" | "year" | "all"
  let currentSort = "dwell"; // "dwell" | "interactions" | "visitors"
  let rawSessions = [];
  let isSeeding = false;
  let autoRefresh = true;
  let unsubAnalytics = null;

  const SECTION_NAMES = {
    projects: "Engineered Projects Grid",
    skills: "Technical Arsenal (Skills)",
    experience: "Career Timeline & Milestones",
    expertise: "Core Capabilities & Architecture",
    about: "Hero & Executive Summary",
    upcoming: "Upcoming Roadmap Features",
    contributors: "Built With Great People",
    feedback: "Signal Feedback & Endorsements",
    contact: "Get In Touch / Contact Form",
    stats: "Quick Performance Metrics"
  };

  const SECTION_ICONS = {
    projects: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/></svg>`,
    skills: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    experience: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>`,
    expertise: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    about: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    upcoming: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>`,
    contributors: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
    feedback: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
    contact: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    stats: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
  };

  /**
   * Filter raw sessions by selected timeframe
   */
  function filterSessions(sessions, timeframe) {
    const now = Date.now();
    let cutoff = 0;

    if (timeframe === "today") cutoff = now - (24 * 60 * 60 * 1000);
    else if (timeframe === "week") cutoff = now - (7 * 24 * 60 * 60 * 1000);
    else if (timeframe === "month") cutoff = now - (30 * 24 * 60 * 60 * 1000);
    else if (timeframe === "year") cutoff = now - (365 * 24 * 60 * 60 * 1000);
    else cutoff = 0;

    return sessions.filter(s => {
      const time = s.startedAt ? new Date(s.startedAt).getTime() : 0;
      return time >= cutoff;
    });
  }

  /**
   * Compute aggregated metrics
   */
  function computeAnalytics(filteredSessions) {
    const totalSessions = filteredSessions.length;
    const uniqueVisitorsSet = new Set();
    let newVisitorsCount = 0;
    let returningVisitorsCount = 0;
    let totalDwellSeconds = 0;
    let totalInteractionsCount = 0;

    const sectionDwellTotals = {};
    const sectionInteractionTotals = {};
    const actionCounts = {};
    const referrerCounts = {};
    const deviceCounts = { Desktop: 0, Mobile: 0, Tablet: 0 };
    const browserCounts = {};

    Object.keys(SECTION_NAMES).forEach(k => {
      sectionDwellTotals[k] = 0;
      sectionInteractionTotals[k] = 0;
    });

    filteredSessions.forEach(s => {
      // Unique visitors
      const vid = s.visitorId || s.sessionId || Math.random().toString();
      uniqueVisitorsSet.add(vid);

      if (s.isNewVisitor) newVisitorsCount++;
      else returningVisitorsCount++;

      // Duration & Dwell
      totalDwellSeconds += s.durationSeconds || 0;

      if (s.sectionDwellTime && typeof s.sectionDwellTime === "object") {
        for (const [sec, secDwell] of Object.entries(s.sectionDwellTime)) {
          if (typeof secDwell === "number") {
            sectionDwellTotals[sec] = (sectionDwellTotals[sec] || 0) + secDwell;
          }
        }
      }

      // Feature Interactions
      if (Array.isArray(s.interactions)) {
        s.interactions.forEach(ev => {
          totalInteractionsCount++;
          const feat = ev.feature || "other";
          actionCounts[feat] = (actionCounts[feat] || 0) + 1;

          // Map interaction to section
          if (feat.includes("project")) sectionInteractionTotals.projects++;
          else if (feat.includes("skill")) sectionInteractionTotals.skills++;
          else if (feat.includes("resume")) sectionInteractionTotals.about++;
          else if (feat.includes("contact")) sectionInteractionTotals.contact++;
          else if (feat.includes("feedback")) sectionInteractionTotals.feedback++;
          else if (feat.includes("social")) sectionInteractionTotals.about++;
        });
      }

      // Referrers
      const ref = s.referrerDomain || "Direct / Bookmark";
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;

      // Devices & Browsers
      const dev = s.device || "Desktop";
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

      const br = s.browser || "Other";
      browserCounts[br] = (browserCounts[br] || 0) + 1;
    });

    const uniqueVisitorsCount = uniqueVisitorsSet.size;
    const avgSessionSeconds = totalSessions > 0 ? Math.round(totalDwellSeconds / totalSessions) : 0;

    // Determine top most engaging section by dwell time
    let topSectionKey = "projects";
    let maxSectionDwell = 0;
    for (const [k, v] of Object.entries(sectionDwellTotals)) {
      if (v > maxSectionDwell) {
        maxSectionDwell = v;
        topSectionKey = k;
      }
    }

    return {
      totalSessions,
      uniqueVisitorsCount,
      newVisitorsCount,
      returningVisitorsCount,
      avgSessionSeconds,
      totalInteractionsCount,
      topSectionKey,
      topSectionName: SECTION_NAMES[topSectionKey] || "Projects Grid",
      sectionDwellTotals,
      sectionInteractionTotals,
      actionCounts,
      referrerCounts,
      deviceCounts,
      browserCounts
    };
  }

  /**
   * Format seconds into readable duration (e.g., 2m 15s)
   */
  function formatDuration(sec) {
    if (!sec || sec <= 0) return "0s";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  }

  /**
   * Cleanup any active Chart.js canvas contexts
   */
  function destroyCharts() {
    Object.keys(chartInstances).forEach(k => {
      if (chartInstances[k] && typeof chartInstances[k].destroy === "function") {
        chartInstances[k].destroy();
        delete chartInstances[k];
      }
    });
  }

  /**
   * Main View Rendering
   */
  const renderView = () => {
    destroyCharts();

    const filtered = filterSessions(rawSessions, currentTimeframe);
    const stats = computeAnalytics(filtered);

    // Calculate percentage breakdown for new vs returning
    const totalVis = Math.max(1, stats.newVisitorsCount + stats.returningVisitorsCount);
    const newPercent = Math.round((stats.newVisitorsCount / totalVis) * 100);
    const returningPercent = 100 - newPercent;

    container.innerHTML = `
      <div class="analytics-view-wrapper">
        <!-- Header & Action Ribbon -->
        <div class="view-header">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              <h1 class="view-title" style="margin-bottom: 0;">Analytics &amp; Engagement Intelligence</h1>
              <span class="badge badge-success" style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; padding: 3px 8px;">
                <span class="status-pulse-dot" style="background: #10b981;"></span>
                LIVE TELEMETRY
              </span>
            </div>
            <p class="view-subtitle">High-precision visitor tracking, section dwell time heatmaps, and feature engagement metrics for satwinder777.github.io</p>
          </div>
          
          <div class="header-actions">
            <button class="btn btn-secondary" id="seed-demo-btn" ${isSeeding ? "disabled" : ""} title="Populate with high-fidelity realistic telemetry sessions">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>${isSeeding ? "Seeding..." : "Seed Demo Traffic"}</span>
            </button>
            <button class="btn btn-secondary" id="export-analytics-btn" title="Export Telemetry as JSON">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export Report</span>
            </button>
            <button class="btn btn-primary" id="refresh-analytics-btn" title="Refresh Telemetry">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <!-- Timeframe & Filter Bar -->
        <div class="analytics-filter-toolbar">
          <div class="timeframe-segmented-control" role="group" aria-label="Select Analytics Timeframe">
            <button class="tf-btn ${currentTimeframe === "today" ? "active" : ""}" data-tf="today">Today (24h)</button>
            <button class="tf-btn ${currentTimeframe === "week" ? "active" : ""}" data-tf="week">This Week</button>
            <button class="tf-btn ${currentTimeframe === "month" ? "active" : ""}" data-tf="month">This Month</button>
            <button class="tf-btn ${currentTimeframe === "year" ? "active" : ""}" data-tf="year">Yearly</button>
            <button class="tf-btn ${currentTimeframe === "all" ? "active" : ""}" data-tf="all">All Time</button>
          </div>

          <div class="sort-selector-pod">
            <label for="analytics-sort-select">Sort Features By:</label>
            <select id="analytics-sort-select" class="form-select-sm">
              <option value="dwell" ${currentSort === "dwell" ? "selected" : ""}>Most Attention &amp; Dwell Time</option>
              <option value="interactions" ${currentSort === "interactions" ? "selected" : ""}>Most Clicks &amp; Interactions</option>
              <option value="visitors" ${currentSort === "visitors" ? "selected" : ""}>Total Visitor Reach</option>
            </select>
          </div>
        </div>

        <!-- KPI Metrics Ribbon Grid -->
        <div class="analytics-kpi-grid">
          <!-- KPI 1: Unique Visitors -->
          <div class="stat-card kpi-card-glow">
            <div class="stat-icon-pod" style="background: rgba(0, 217, 255, 0.15); color: #00d9ff;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-number">${stats.uniqueVisitorsCount}</span>
              <span class="stat-label">Unique Profile Visitors</span>
              <div class="kpi-mini-ratio-bar">
                <div class="ratio-fill-new" style="width: ${newPercent}%;" title="New Visitors: ${stats.newVisitorsCount} (${newPercent}%)"></div>
                <div class="ratio-fill-ret" style="width: ${returningPercent}%;" title="Returning: ${stats.returningVisitorsCount} (${returningPercent}%)"></div>
              </div>
              <div class="kpi-micro-legend">
                <span><strong>${newPercent}%</strong> New</span>
                <span><strong>${returningPercent}%</strong> Returning</span>
              </div>
            </div>
          </div>

          <!-- KPI 2: Total Sessions & Avg Duration -->
          <div class="stat-card kpi-card-glow">
            <div class="stat-icon-pod" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-number">${stats.totalSessions}</span>
              <span class="stat-label">Total Browser Sessions</span>
              <div class="kpi-metric-badge">
                <span>Avg Dwell: <strong>${formatDuration(stats.avgSessionSeconds)}</strong></span>
              </div>
            </div>
          </div>

          <!-- KPI 3: #1 Most Engaging Feature -->
          <div class="stat-card kpi-card-glow">
            <div class="stat-icon-pod" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-number" style="font-size: 1.35rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
                ${stats.topSectionName}
              </span>
              <span class="stat-label">#1 Most Viewed Feature</span>
              <div class="kpi-metric-badge badge-warning">
                <span>Total Time: <strong>${formatDuration(stats.sectionDwellTotals[stats.topSectionKey] || 0)}</strong></span>
              </div>
            </div>
          </div>

          <!-- KPI 4: Total User Interactions -->
          <div class="stat-card kpi-card-glow">
            <div class="stat-icon-pod" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 15l5 5-5 5"/><path d="M4 20h7a4 4 0 0 0 4-4V4"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-number">${stats.totalInteractionsCount}</span>
              <span class="stat-label">Feature Actions &amp; Clicks</span>
              <div class="kpi-metric-badge badge-success">
                <span>Interactivity: High</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Interactive Charts Grid -->
        <div class="analytics-charts-grid">
          <!-- Chart 1: Traffic & Visitor Trends -->
          <div class="chart-box-card span-two-cols">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Profile Visitor Traffic Over Time</h3>
                <p class="chart-card-subtitle">Page sessions and unique visitors across selected period</p>
              </div>
              <span class="badge badge-neutral">Area Trend</span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="chart-traffic-trend"></canvas>
            </div>
          </div>

          <!-- Chart 2: Section Attention & Dwell Time -->
          <div class="chart-box-card span-two-cols">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Feature Dwell Time &amp; Attention Heatmap (Time Spent)</h3>
                <p class="chart-card-subtitle">Which section did visitors spend the most time exploring &amp; reading</p>
              </div>
              <span class="badge badge-info">Dwell Seconds</span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="chart-section-dwell"></canvas>
            </div>
          </div>

          <!-- Chart 3: Most Used Feature Interactions -->
          <div class="chart-box-card">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Most Interacted Features</h3>
                <p class="chart-card-subtitle">Clicks, demos, and modal triggers</p>
              </div>
              <span class="badge badge-neutral">Actions</span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="chart-interactions-dist"></canvas>
            </div>
          </div>

          <!-- Chart 4: Traffic Sources & Referrers -->
          <div class="chart-box-card">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Traffic Sources &amp; Referrers</h3>
                <p class="chart-card-subtitle">Where visitors arrived from</p>
              </div>
              <span class="badge badge-neutral">Inbound</span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="chart-traffic-sources"></canvas>
            </div>
          </div>

          <!-- Chart 5: Devices & Browsers Matrix -->
          <div class="chart-box-card">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Device &amp; Platform Breakdown</h3>
                <p class="chart-card-subtitle">Desktop vs Mobile vs Tablet</p>
              </div>
              <span class="badge badge-neutral">Devices</span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="chart-device-breakdown"></canvas>
            </div>
          </div>
        </div>

        <!-- Section 3: Feature Performance Leaderboard Table -->
        <div class="card-box" style="margin-top: 32px;">
          <div class="card-box-header">
            <div class="card-box-title-wrap">
              <div class="card-header-icon-box" style="background: rgba(0, 217, 255, 0.15); color: #00d9ff;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div>
                <h3>Feature Engagement Leaderboard</h3>
                <p class="card-desc">Ranked comparison of all 10 portfolio features by user attention and direct interaction.</p>
              </div>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table analytics-leaderboard-table">
              <thead>
                <tr>
                  <th style="width: 50px;">Rank</th>
                  <th>Feature / Section</th>
                  <th>Total Time Spent</th>
                  <th>Direct Clicks / Actions</th>
                  <th>Attention Share (%)</th>
                  <th>CMS Status</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
                  const visibilityMap = state.portfolio?.sectionVisibility || {};
                  const totalDwellAll = Math.max(1, Object.values(stats.sectionDwellTotals).reduce((a, b) => a + b, 0));

                  const rows = Object.keys(SECTION_NAMES).map(key => {
                    const dwell = stats.sectionDwellTotals[key] || 0;
                    const interactions = stats.sectionInteractionTotals[key] || 0;
                    const share = Math.round((dwell / totalDwellAll) * 100);
                    const isVisible = visibilityMap[key] !== false;

                    return {
                      key,
                      name: SECTION_NAMES[key],
                      dwell,
                      interactions,
                      share,
                      isVisible
                    };
                  });

                  // Sort according to currentSort
                  if (currentSort === "interactions") {
                    rows.sort((a, b) => b.interactions - a.interactions || b.dwell - a.dwell);
                  } else {
                    rows.sort((a, b) => b.dwell - a.dwell || b.interactions - a.interactions);
                  }

                  return rows.map((r, idx) => `
                    <tr>
                      <td>
                        <span class="rank-badge ${idx === 0 ? "rank-gold" : (idx === 1 ? "rank-silver" : (idx === 2 ? "rank-bronze" : ""))}">${idx + 1}</span>
                      </td>
                      <td>
                        <div class="feature-cell">
                          <span class="feature-icon">${SECTION_ICONS[r.key] || ""}</span>
                          <div>
                            <strong>${r.name}</strong>
                            <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">#${r.key}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style="color: var(--accent-cyan);">${formatDuration(r.dwell)}</strong>
                      </td>
                      <td>
                        <span class="badge badge-neutral">${r.interactions} clicks</span>
                      </td>
                      <td style="min-width: 140px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div class="progress-bar-wrap" style="flex: 1;">
                            <div class="progress-bar-fill" style="width: ${r.share}%;"></div>
                          </div>
                          <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); width: 32px;">${r.share}%</span>
                        </div>
                      </td>
                      <td>
                        <span class="badge ${r.isVisible ? "badge-success" : "badge-neutral"}">
                          ${r.isVisible ? "Active" : "Hidden"}
                        </span>
                      </td>
                    </tr>
                  `).join("");
                })()}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 4: Live Visitor Telemetry Stream -->
        <div class="card-box" style="margin-top: 32px;">
          <div class="card-box-header">
            <div class="card-box-title-wrap">
              <div class="card-header-icon-box" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <h3>Recent Visitor Sessions Stream (${filtered.length})</h3>
                <p class="card-desc">Chronological feed of latest visitors, devices, referral channels, and user attention.</p>
              </div>
            </div>
            <button class="btn btn-sm btn-secondary" id="clear-analytics-btn">Clear Sessions</button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Visitor ID</th>
                  <th>Type</th>
                  <th>Device &amp; OS</th>
                  <th>Inbound Referrer</th>
                  <th>Top Viewed Feature</th>
                  <th>Time On Site</th>
                  <th>Actions</th>
                  <th>Date &amp; Time</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align: center; padding: 36px; color: var(--text-muted);">
                      No visitor sessions recorded yet for this timeframe. Click "Seed Demo Traffic" above to generate realistic telemetry data.
                    </td>
                  </tr>
                ` : filtered.slice(0, 15).map(s => `
                  <tr>
                    <td>
                      <code style="font-size: 0.72rem; color: var(--text-primary);">${escapeHtml((s.visitorId || s.sessionId || "guest").substring(0, 14))}</code>
                    </td>
                    <td>
                      <span class="badge ${s.isNewVisitor ? "badge-info" : "badge-neutral"}" style="font-size: 0.7rem;">
                        ${s.isNewVisitor ? "New" : "Returning"}
                      </span>
                    </td>
                    <td>
                      <span style="font-size: 0.8rem; font-weight: 600;">${escapeHtml(s.device || "Desktop")}</span>
                      <span style="font-size: 0.72rem; color: var(--text-muted);">(${escapeHtml(s.browser || "Browser")})</span>
                    </td>
                    <td>
                      <span class="badge badge-neutral" style="font-size: 0.72rem;">${escapeHtml(s.referrerDomain || s.referrer || "Direct")}</span>
                    </td>
                    <td>
                      <strong style="color: var(--accent-cyan); font-size: 0.8rem;">${SECTION_NAMES[s.mostViewedSection] || s.mostViewedSection || "Projects"}</strong>
                    </td>
                    <td>
                      <span style="font-size: 0.8rem; font-weight: 600;">${formatDuration(s.durationSeconds || 0)}</span>
                    </td>
                    <td>
                      <span class="badge badge-neutral" style="font-size: 0.72rem;">${(s.interactions || []).length} events</span>
                    </td>
                    <td>
                      <span style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(s.startedAt)}</span>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Initialize Chart.js charts
    initCharts(filtered, stats);

    // Bind event listeners
    bindViewListeners();
  };

  /**
   * Initialize Chart.js graphs
   */
  function initCharts(filteredSessions, stats) {
    if (typeof window.Chart !== "function") {
      console.warn("[Analytics] Chart.js not loaded yet. Rendering fallback metrics.");
      return;
    }

    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    const textColor = isLight ? "#475569" : "#94a3b8";
    const gridColor = isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.06)";

    // Chart 1: Traffic & Visitor Trends
    const ctxTraffic = document.getElementById("chart-traffic-trend")?.getContext("2d");
    if (ctxTraffic) {
      // Aggregate into timeline buckets
      const timelineMap = {};
      const uniqueVisMap = {};

      filteredSessions.forEach(s => {
        const d = s.startedAt ? new Date(s.startedAt) : new Date();
        let key = "";
        if (currentTimeframe === "today") {
          key = `${d.getHours()}:00`;
        } else {
          key = `${d.getMonth() + 1}/${d.getDate()}`;
        }

        timelineMap[key] = (timelineMap[key] || 0) + 1;
        if (!uniqueVisMap[key]) uniqueVisMap[key] = new Set();
        uniqueVisMap[key].add(s.visitorId || s.sessionId);
      });

      const labels = Object.keys(timelineMap);
      if (labels.length === 0) {
        labels.push("Recent");
        timelineMap["Recent"] = 1;
        uniqueVisMap["Recent"] = new Set(["v1"]);
      }

      const sessionsData = labels.map(l => timelineMap[l] || 0);
      const uniqueData = labels.map(l => uniqueVisMap[l]?.size || 0);

      chartInstances.traffic = new window.Chart(ctxTraffic, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Page Sessions",
              data: sessionsData,
              borderColor: "#00d9ff",
              backgroundColor: "rgba(0, 217, 255, 0.12)",
              fill: true,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: "#00d9ff",
              borderWidth: 2.5
            },
            {
              label: "Unique Visitors",
              data: uniqueData,
              borderColor: "#c084fc",
              backgroundColor: "rgba(192, 132, 252, 0.08)",
              fill: true,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: "#c084fc",
              borderWidth: 2.5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: { family: "Outfit, sans-serif", size: 12 } } },
            tooltip: { padding: 10, cornerRadius: 8 }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 }, beginAtZero: true }
          }
        }
      });
    }

    // Chart 2: Section Dwell Time Heatmap
    const ctxDwell = document.getElementById("chart-section-dwell")?.getContext("2d");
    if (ctxDwell) {
      const dwellLabels = ["Projects", "Skills Arsenal", "Experience", "Capabilities", "Hero", "Upcoming", "Contributors", "Feedback", "Contact"];
      const dwellKeys = ["projects", "skills", "experience", "expertise", "about", "upcoming", "contributors", "feedback", "contact"];
      const dwellValues = dwellKeys.map(k => Math.round(stats.sectionDwellTotals[k] || 0));

      const colors = [
        "#00d9ff", "#c084fc", "#fbbf24", "#34d399", "#38bdf8", "#f43f5e", "#a855f7", "#ec4899", "#10b981"
      ];

      chartInstances.dwell = new window.Chart(ctxDwell, {
        type: "bar",
        data: {
          labels: dwellLabels,
          datasets: [{
            label: "Total Dwell Seconds",
            data: dwellValues,
            backgroundColor: colors,
            borderRadius: 6,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `Time: ${formatDuration(ctx.raw)} (${ctx.raw}s)`
              }
            }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
          }
        }
      });
    }

    // Chart 3: Most Used Feature Interactions
    const ctxInteractions = document.getElementById("chart-interactions-dist")?.getContext("2d");
    if (ctxInteractions) {
      const featLabels = Object.keys(stats.actionCounts);
      const featValues = Object.values(stats.actionCounts);

      const displayLabels = featLabels.length ? featLabels.map(l => l.replace(/_/g, " ").toUpperCase()) : ["PROJECT VIEW", "SKILL EXPLORE", "RESUME VIEW"];
      const displayValues = featValues.length ? featValues : [12, 8, 5];

      chartInstances.interactions = new window.Chart(ctxInteractions, {
        type: "doughnut",
        data: {
          labels: displayLabels,
          datasets: [{
            data: displayValues,
            backgroundColor: ["#00d9ff", "#c084fc", "#fbbf24", "#34d399", "#f43f5e", "#38bdf8"],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: textColor, boxWidth: 12 } }
          }
        }
      });
    }

    // Chart 4: Traffic Sources
    const ctxSources = document.getElementById("chart-traffic-sources")?.getContext("2d");
    if (ctxSources) {
      const srcLabels = Object.keys(stats.referrerCounts);
      const srcValues = Object.values(stats.referrerCounts);

      const dLabels = srcLabels.length ? srcLabels : ["Direct / Bookmark", "GitHub", "LinkedIn"];
      const dValues = srcValues.length ? srcValues : [10, 8, 6];

      chartInstances.sources = new window.Chart(ctxSources, {
        type: "polarArea",
        data: {
          labels: dLabels,
          datasets: [{
            data: dValues,
            backgroundColor: [
              "rgba(0, 217, 255, 0.7)",
              "rgba(192, 132, 252, 0.7)",
              "rgba(251, 191, 36, 0.7)",
              "rgba(52, 211, 153, 0.7)",
              "rgba(244, 63, 94, 0.7)"
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: textColor, boxWidth: 10 } }
          },
          scales: {
            r: { grid: { color: gridColor }, ticks: { display: false } }
          }
        }
      });
    }

    // Chart 5: Devices Breakdown
    const ctxDevices = document.getElementById("chart-device-breakdown")?.getContext("2d");
    if (ctxDevices) {
      const devLabels = Object.keys(stats.deviceCounts);
      const devValues = Object.values(stats.deviceCounts);

      chartInstances.devices = new window.Chart(ctxDevices, {
        type: "pie",
        data: {
          labels: devLabels,
          datasets: [{
            data: devValues,
            backgroundColor: ["#00d9ff", "#c084fc", "#fbbf24"],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: textColor, boxWidth: 12 } }
          }
        }
      });
    }
  }

  /**
   * Bind DOM event listeners
   */
  function bindViewListeners() {
    // Timeframe segmented buttons
    container.querySelectorAll(".tf-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        currentTimeframe = btn.dataset.tf;
        renderView();
      });
    });

    // Sort selector
    const sortSel = container.querySelector("#analytics-sort-select");
    sortSel?.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderView();
    });

    // Refresh button
    container.querySelector("#refresh-analytics-btn")?.addEventListener("click", async () => {
      toast.info("Refreshing telemetry stream...");
      try {
        const fresh = await getAnalyticsData(300);
        rawSessions = fresh;
        renderView();
        toast.success("Analytics refreshed successfully.");
      } catch (err) {
        toast.error("Failed to refresh: " + err.message);
      }
    });

    // Seed Demo Traffic button
    container.querySelector("#seed-demo-btn")?.addEventListener("click", async () => {
      const ok = await modal.confirm({
        title: "Seed Realistic Telemetry Data?",
        message: "This will inject 35 high-fidelity visitor sessions with realistic dwell times, devices, referrers, and feature clicks into Firestore. Charts will illuminate immediately.",
        confirmText: "Seed 35 Sessions"
      });

      if (ok) {
        isSeeding = true;
        renderView();
        try {
          const seeded = await seedDemoAnalytics(35);
          toast.success(`Generated ${seeded} realistic telemetry sessions.`);
        } catch (err) {
          toast.error("Failed to seed: " + err.message);
        } finally {
          isSeeding = false;
        }
      }
    });

    // Export report
    container.querySelector("#export-analytics-btn")?.addEventListener("click", () => {
      const filtered = filterSessions(rawSessions, currentTimeframe);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `satwinder_analytics_${currentTimeframe}_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Analytics report exported successfully.");
    });

    // Clear sessions
    container.querySelector("#clear-analytics-btn")?.addEventListener("click", async () => {
      const ok = await modal.confirm({
        title: "Clear All Analytics Sessions?",
        message: "Are you sure you want to purge all stored telemetry sessions from Firestore? This cannot be undone.",
        confirmText: "Clear All",
        isDanger: true
      });

      if (ok) {
        try {
          await clearAllAnalytics();
          rawSessions = [];
          renderView();
          toast.success("Analytics records purged.");
        } catch (err) {
          toast.error("Failed to clear: " + err.message);
        }
      }
    });
  }

  // Subscribe to live Firestore stream
  unsubAnalytics = subscribeToAnalytics(
    (sessions) => {
      rawSessions = sessions;
      renderView();
    },
    (err) => {
      console.warn("[Analytics] Real-time subscription error:", err);
      // Fallback: render view with whatever data is loaded
      renderView();
    }
  );

  // Return cleanup hook if needed
  return () => {
    destroyCharts();
    if (typeof unsubAnalytics === "function") unsubAnalytics();
  };
}

function formatDate(raw) {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return String(raw).substring(0, 16);
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
