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

    // Timeframe counts for badge indicators
    const counts = {
      today: filterSessions(rawSessions, "today").length,
      week: filterSessions(rawSessions, "week").length,
      month: filterSessions(rawSessions, "month").length,
      year: filterSessions(rawSessions, "year").length,
      all: rawSessions.length
    };

    container.innerHTML = `
      <div class="analytics-view-wrapper">
        <!-- Top SaaS Header Banner with Radar Live Pulse -->
        <div class="analytics-header-banner">
          <div class="analytics-title-group">
            <h1>
              <span>Analytics &amp; Engagement Intelligence</span>
              <span class="live-pulse-pill">
                <span class="pulse-radar-dot"></span>
                LIVE STREAM
              </span>
            </h1>
            <p>Full-spectrum telemetry tracking visitor dwell times, section attention heatmaps, traffic sources, and feature clicks across satwinder777.github.io</p>
          </div>
          
          <div class="analytics-action-buttons">
            <button class="btn btn-seed-traffic" id="seed-demo-btn" ${isSeeding ? "disabled" : ""} title="Instantly populate 35 high-fidelity realistic visitor telemetry sessions">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>${isSeeding ? "Injecting Data..." : "⚡ Seed Demo Traffic"}</span>
            </button>
            <button class="btn btn-secondary" id="export-analytics-btn" title="Export Current Telemetry Dataset as JSON">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export Report</span>
            </button>
            <button class="btn btn-primary" id="refresh-analytics-btn" title="Fetch fresh records from Firestore">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <!-- Timeframe Segmented Control & Sort Dropdown -->
        <div class="analytics-filter-toolbar">
          <div class="timeframe-segmented-control" role="group" aria-label="Select Analytics Timeframe">
            <button class="tf-btn ${currentTimeframe === "today" ? "active" : ""}" data-tf="today">
              <span>Today (24h)</span>
              <span class="tf-badge">${counts.today}</span>
            </button>
            <button class="tf-btn ${currentTimeframe === "week" ? "active" : ""}" data-tf="week">
              <span>This Week</span>
              <span class="tf-badge">${counts.week}</span>
            </button>
            <button class="tf-btn ${currentTimeframe === "month" ? "active" : ""}" data-tf="month">
              <span>This Month</span>
              <span class="tf-badge">${counts.month}</span>
            </button>
            <button class="tf-btn ${currentTimeframe === "year" ? "active" : ""}" data-tf="year">
              <span>Yearly</span>
              <span class="tf-badge">${counts.year}</span>
            </button>
            <button class="tf-btn ${currentTimeframe === "all" ? "active" : ""}" data-tf="all">
              <span>All Time</span>
              <span class="tf-badge">${counts.all}</span>
            </button>
          </div>

          <div class="sort-selector-pod">
            <label for="analytics-sort-select">Sort Leaderboard By:</label>
            <select id="analytics-sort-select">
              <option value="dwell" ${currentSort === "dwell" ? "selected" : ""}>⏱ Most Attention &amp; Dwell Time</option>
              <option value="interactions" ${currentSort === "interactions" ? "selected" : ""}>⚡ Most Clicks &amp; Interactions</option>
              <option value="visitors" ${currentSort === "visitors" ? "selected" : ""}>👥 Feature Reach</option>
            </select>
          </div>
        </div>

        <!-- 4 Glowing Glassmorphism KPI Stat Cards -->
        <div class="analytics-kpi-grid">
          <!-- Card 1: Unique Profile Visitors (Cyan Glow) -->
          <div class="analytics-kpi-card kpi-cyan">
            <div class="kpi-top-row">
              <div class="kpi-icon-pod" style="background: rgba(0, 217, 255, 0.15); color: #00d9ff;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <span class="kpi-pill-badge" style="background: rgba(0, 217, 255, 0.12); color: #00d9ff; border: 1px solid rgba(0, 217, 255, 0.3);">
                +${newPercent}% NEW
              </span>
            </div>
            <div class="kpi-value-display">${stats.uniqueVisitorsCount}</div>
            <div class="kpi-label-text">Unique Profile Visitors</div>
            <div class="kpi-mini-ratio-bar">
              <div class="ratio-fill-new" style="width: ${newPercent}%;" title="New Visitors: ${stats.newVisitorsCount} (${newPercent}%)"></div>
              <div class="ratio-fill-ret" style="width: ${returningPercent}%;" title="Returning: ${stats.returningVisitorsCount} (${returningPercent}%)"></div>
            </div>
            <div class="kpi-micro-legend">
              <span><strong style="color: #00d9ff;">${newPercent}%</strong> New</span>
              <span><strong style="color: #c084fc;">${returningPercent}%</strong> Returning</span>
            </div>
          </div>

          <!-- Card 2: Total Sessions & Avg Duration (Purple Glow) -->
          <div class="analytics-kpi-card kpi-purple">
            <div class="kpi-top-row">
              <div class="kpi-icon-pod" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <span class="kpi-pill-badge" style="background: rgba(168, 85, 247, 0.12); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);">
                ACTIVE SESSIONS
              </span>
            </div>
            <div class="kpi-value-display">${stats.totalSessions}</div>
            <div class="kpi-label-text">Total Browser Sessions</div>
            <div class="kpi-detail-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Avg Dwell: <strong style="color: var(--text-primary);">${formatDuration(stats.avgSessionSeconds)}</strong></span>
            </div>
          </div>

          <!-- Card 3: #1 Most Viewed Feature (Gold Glow) -->
          <div class="analytics-kpi-card kpi-gold">
            <div class="kpi-top-row">
              <div class="kpi-icon-pod" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <span class="kpi-pill-badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);">
                #1 ATTENTION MAGNET
              </span>
            </div>
            <div class="kpi-top-feature-name" title="${escapeHtml(stats.topSectionName)}">
              ${escapeHtml(stats.topSectionName)}
            </div>
            <div class="kpi-label-text">Top Explored Feature</div>
            <div class="kpi-detail-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span>Total Time: <strong style="color: #fbbf24;">${formatDuration(stats.sectionDwellTotals[stats.topSectionKey] || 0)}</strong> (${Math.round(((stats.sectionDwellTotals[stats.topSectionKey] || 0) / Math.max(1, Object.values(stats.sectionDwellTotals).reduce((a, b) => a + b, 0))) * 100)}% share)</span>
            </div>
          </div>

          <!-- Card 4: Feature Actions & Clicks (Emerald Glow) -->
          <div class="analytics-kpi-card kpi-emerald">
            <div class="kpi-top-row">
              <div class="kpi-icon-pod" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 15l5 5-5 5"/><path d="M4 20h7a4 4 0 0 0 4-4V4"/></svg>
              </div>
              <span class="kpi-pill-badge" style="background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
                INTERACTIVE
              </span>
            </div>
            <div class="kpi-value-display">${stats.totalInteractionsCount}</div>
            <div class="kpi-label-text">Feature Actions &amp; Clicks</div>
            <div class="kpi-detail-badge">
              <span class="status-pulse-dot" style="background: #10b981; width: 6px; height: 6px;"></span>
              <span>Rate: <strong style="color: #34d399;">${stats.totalSessions > 0 ? (stats.totalInteractionsCount / stats.totalSessions).toFixed(1) : "0"} per visitor</strong></span>
            </div>
          </div>
        </div>

        <!-- 5 Interactive Chart Cards Grid -->
        <div class="analytics-charts-grid">
          <!-- Chart 1: Traffic & Visitor Trends (Span 2) -->
          <div class="chart-box-card span-two-cols">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Profile Visitor Traffic Over Time</h3>
                <p class="chart-card-subtitle">Page sessions and unique visitors across chronological timeline</p>
              </div>
              <span class="kpi-pill-badge" style="background: rgba(0, 217, 255, 0.12); color: #00d9ff; border: 1px solid rgba(0, 217, 255, 0.25);">
                Dual Spline Area
              </span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="chart-traffic-trend"></canvas>
            </div>
          </div>

          <!-- Chart 2: Feature Dwell Time Heatmap (Span 2) -->
          <div class="chart-box-card span-two-cols">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Feature Dwell Time &amp; Attention Heatmap (Time Spent)</h3>
                <p class="chart-card-subtitle">Exact attention seconds visitors spent reading and exploring each portfolio component</p>
              </div>
              <span class="kpi-pill-badge" style="background: rgba(168, 85, 247, 0.12); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.25);">
                Seconds Distribution
              </span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="chart-section-dwell"></canvas>
            </div>
          </div>

          <!-- Chart 3: Most Interacted Features -->
          <div class="chart-box-card">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Most Interacted Features</h3>
                <p class="chart-card-subtitle">Direct project clicks, skill explores &amp; modal triggers</p>
              </div>
              <span class="kpi-pill-badge" style="background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3);">
                Donut
              </span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="chart-interactions-dist"></canvas>
            </div>
          </div>

          <!-- Chart 4: Traffic Sources & Inbound Referrers -->
          <div class="chart-box-card">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Inbound Referral Channels</h3>
                <p class="chart-card-subtitle">Where visitors originated from</p>
              </div>
              <span class="kpi-pill-badge" style="background: rgba(52, 211, 153, 0.12); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.25);">
                Polar Area
              </span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="chart-traffic-sources"></canvas>
            </div>
          </div>

          <!-- Chart 5: Devices & Platforms Matrix -->
          <div class="chart-box-card">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Device &amp; Platform Matrix</h3>
                <p class="chart-card-subtitle">Desktop vs Mobile vs Tablet breakdowns</p>
              </div>
              <span class="kpi-pill-badge" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25);">
                Device Ratio
              </span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="chart-device-breakdown"></canvas>
            </div>
          </div>
        </div>

        <!-- Section 3: Feature Performance Leaderboard Table -->
        <div class="card-box" style="margin-top: 10px; margin-bottom: 28px;">
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

          <div class="leaderboard-container">
            <!-- Spacious Column Headers -->
            <div class="leaderboard-header-row">
              <div class="lb-col-rank">Rank</div>
              <div class="lb-col-feature">Feature / Section</div>
              <div class="lb-col-time">Time Spent</div>
              <div class="lb-col-clicks">Interactions</div>
              <div class="lb-col-share">Attention Share</div>
              <div class="lb-col-status">CMS Status</div>
            </div>

            <!-- Spacious Card Rows -->
            <div class="leaderboard-card-list">
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
                } else if (currentSort === "visitors") {
                  rows.sort((a, b) => b.share - a.share || b.dwell - a.dwell);
                } else {
                  rows.sort((a, b) => b.dwell - a.dwell || b.interactions - a.interactions);
                }

                return rows.map((r, idx) => `
                  <div class="leaderboard-card-row ${idx === 0 ? "podium-gold" : (idx === 1 ? "podium-silver" : (idx === 2 ? "podium-bronze" : ""))} ${r.isVisible ? "" : "is-hidden-feature"}">
                    <div class="lb-col-rank">
                      <span class="rank-badge ${idx === 0 ? "rank-gold" : (idx === 1 ? "rank-silver" : (idx === 2 ? "rank-bronze" : "rank-default"))}">
                        ${idx === 0 ? "★ 1" : (idx + 1)}
                      </span>
                    </div>

                    <div class="lb-col-feature">
                      <div class="feature-cell">
                        <span class="feature-icon-box">${SECTION_ICONS[r.key] || ""}</span>
                        <div class="feature-meta">
                          <strong class="feature-title">${escapeHtml(r.name)}</strong>
                          <span class="feature-slug-tag">#${r.key}</span>
                        </div>
                      </div>
                    </div>

                    <div class="lb-col-time">
                      <div class="time-spent-chip">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>${formatDuration(r.dwell)}</span>
                      </div>
                    </div>

                    <div class="lb-col-clicks">
                      <span class="clicks-pill ${r.interactions > 0 ? "clicks-positive" : "clicks-zero"}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        <span>${r.interactions} ${r.interactions === 1 ? "click" : "clicks"}</span>
                      </span>
                    </div>

                    <div class="lb-col-share">
                      <div class="share-cell-wrap">
                        <div class="progress-bar-wrap">
                          <div class="progress-bar-fill" style="width: ${r.share}%;"></div>
                        </div>
                        <span class="share-percent-display">${r.share}%</span>
                      </div>
                    </div>

                    <div class="lb-col-status">
                      <span class="status-pill ${r.isVisible ? "status-pill-active" : "status-pill-muted"}">
                        <span class="status-pulse-dot"></span>
                        <span>${r.isVisible ? "Active" : "Hidden"}</span>
                      </span>
                    </div>
                  </div>
                `).join("");
              })()}
            </div>
          </div>
        </div>

        <!-- Section 4: Live Visitor Telemetry Stream -->
        <div class="card-box" style="margin-top: 28px;">
          <div class="card-box-header">
            <div class="card-box-title-wrap">
              <div class="card-header-icon-box" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <h3>Recent Visitor Sessions Stream (${filtered.length} recorded)</h3>
                <p class="card-desc">Chronological feed of latest visitors, devices, referral channels, and user attention.</p>
              </div>
            </div>
            <button class="btn btn-sm btn-secondary" id="clear-analytics-btn" title="Purge telemetry records">Clear Sessions</button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="min-width: 140px;">Visitor ID</th>
                  <th style="min-width: 100px;">Visitor Type</th>
                  <th style="min-width: 150px;">Device &amp; Platform</th>
                  <th style="min-width: 120px;">Inbound Source</th>
                  <th style="min-width: 190px;">Top Viewed Feature</th>
                  <th style="min-width: 110px;">Time On Site</th>
                  <th style="min-width: 110px;">Interactions</th>
                  <th style="min-width: 130px;">Recorded Time</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
                      <p style="font-size: 1rem; margin-bottom: 8px;">No visitor sessions recorded yet for this timeframe.</p>
                      <button class="btn btn-seed-traffic btn-sm" id="empty-state-seed-btn" style="margin-top: 6px;">⚡ Seed 35 Realistic Sessions</button>
                    </td>
                  </tr>
                ` : filtered.slice(0, 15).map(s => `
                  <tr>
                    <td>
                      <div class="visitor-avatar-wrap">
                        <span class="visitor-avatar-dot" style="background: ${getVisitorAvatarBg(s.visitorId || s.sessionId)};">
                          ${(s.visitorId || "G")[0].toUpperCase()}
                        </span>
                        <code class="visitor-id-tag">${escapeHtml((s.visitorId || s.sessionId || "guest").substring(0, 14))}</code>
                      </div>
                    </td>
                    <td>
                      <span class="type-pill ${s.isNewVisitor ? "type-new" : "type-returning"}">
                        ${s.isNewVisitor ? "New" : "Returning"}
                      </span>
                    </td>
                    <td>
                      <div class="device-info-wrap">
                        <span class="device-label">${escapeHtml(s.device || "Desktop")}</span>
                        <span class="browser-label">${escapeHtml(s.browser || "Browser")}</span>
                      </div>
                    </td>
                    <td>
                      <span class="ref-tag ${getRefTagClass(s.referrerDomain || s.referrer)}">
                        ${escapeHtml(s.referrerDomain || s.referrer || "Direct")}
                      </span>
                    </td>
                    <td>
                      <span class="feature-link-badge">${escapeHtml(SECTION_NAMES[s.mostViewedSection] || s.mostViewedSection || "Projects")}</span>
                    </td>
                    <td>
                      <span class="session-dwell-tag">${formatDuration(s.durationSeconds || 0)}</span>
                    </td>
                    <td>
                      <span class="event-count-pill">${(s.interactions || []).length} events</span>
                    </td>
                    <td>
                      <span class="timestamp-tag">${formatDate(s.startedAt)}</span>
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
   * Determine avatar background color from hash
   */
  function getVisitorAvatarBg(id = "") {
    const palette = [
      "linear-gradient(135deg, #0284c7, #00d9ff)",
      "linear-gradient(135deg, #7c3aed, #c084fc)",
      "linear-gradient(135deg, #d97706, #fbbf24)",
      "linear-gradient(135deg, #059669, #34d399)",
      "linear-gradient(135deg, #e11d48, #fb7185)"
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
    return palette[Math.abs(hash) % palette.length];
  }

  /**
   * Determine CSS class for referrer tag badge
   */
  function getRefTagClass(ref = "") {
    const r = String(ref).toLowerCase();
    if (r.includes("github")) return "ref-github";
    if (r.includes("linkedin")) return "ref-linkedin";
    if (r.includes("google")) return "ref-google";
    if (r.includes("twitter") || r.includes("x.com")) return "ref-twitter";
    return "ref-direct";
  }

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
    const canvasTraffic = document.getElementById("chart-traffic-trend");
    const ctxTraffic = canvasTraffic?.getContext("2d");
    if (ctxTraffic) {
      // Sort sessions chronologically
      const sorted = [...filteredSessions].sort((a, b) => {
        const ta = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        const tb = b.startedAt ? new Date(b.startedAt).getTime() : 0;
        return ta - tb;
      });

      const timelineMap = {};
      const uniqueVisMap = {};

      if (sorted.length === 0) {
        timelineMap["Today"] = 0;
        uniqueVisMap["Today"] = new Set();
      } else {
        sorted.forEach(s => {
          const d = s.startedAt ? new Date(s.startedAt) : new Date();
          let key = "";
          if (currentTimeframe === "today") {
            key = `${String(d.getHours()).padStart(2, "0")}:00`;
          } else {
            key = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
          }

          timelineMap[key] = (timelineMap[key] || 0) + 1;
          if (!uniqueVisMap[key]) uniqueVisMap[key] = new Set();
          uniqueVisMap[key].add(s.visitorId || s.sessionId);
        });
      }

      const labels = Object.keys(timelineMap);
      const sessionsData = labels.map(l => timelineMap[l] || 0);
      const uniqueData = labels.map(l => uniqueVisMap[l]?.size || 0);

      // Gradient Fills with safe fallbacks
      let gradCyan = "rgba(0, 217, 255, 0.18)";
      let gradPurple = "rgba(192, 132, 252, 0.12)";
      try {
        const g1 = ctxTraffic.createLinearGradient(0, 0, 0, 260);
        g1.addColorStop(0, "rgba(0, 217, 255, 0.38)");
        g1.addColorStop(1, "rgba(0, 217, 255, 0.0)");
        gradCyan = g1;

        const g2 = ctxTraffic.createLinearGradient(0, 0, 0, 260);
        g2.addColorStop(0, "rgba(192, 132, 252, 0.28)");
        g2.addColorStop(1, "rgba(192, 132, 252, 0.0)");
        gradPurple = g2;
      } catch (e) {
        console.warn("[Analytics] Gradient fallback:", e);
      }

      try {
        chartInstances.traffic = new window.Chart(ctxTraffic, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Page Sessions",
                data: sessionsData,
                borderColor: "#00d9ff",
                backgroundColor: gradCyan,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: "#00d9ff",
                pointBorderColor: "#0f172a",
                pointBorderWidth: 2,
                borderWidth: 2.5
              },
              {
                label: "Unique Visitors",
                data: uniqueData,
                borderColor: "#c084fc",
                backgroundColor: gradPurple,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: "#c084fc",
                pointBorderColor: "#0f172a",
                pointBorderWidth: 2,
                borderWidth: 2.5
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false
            },
            plugins: {
              legend: {
                position: "top",
                align: "end",
                labels: {
                  color: textColor,
                  font: { family: "Outfit, sans-serif", size: 12.5, weight: "600" },
                  usePointStyle: true,
                  pointStyle: "circle",
                  padding: 16
                }
              },
              tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                titleColor: "#f8fafc",
                bodyColor: "#cbd5e1",
                borderColor: "rgba(255, 255, 255, 0.12)",
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
                boxPadding: 6
              }
            },
            scales: {
              x: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { family: "Outfit, sans-serif", size: 11.5 } }
              },
              y: {
                grid: { color: gridColor },
                ticks: { color: textColor, stepSize: 1, font: { family: "Outfit, sans-serif", size: 11.5 } },
                beginAtZero: true
              }
            }
          }
        });
      } catch (err) {
        console.error("[Analytics] Chart traffic error:", err);
      }
    }

    // Chart 2: Section Dwell Time Heatmap
    const canvasDwell = document.getElementById("chart-section-dwell");
    const ctxDwell = canvasDwell?.getContext("2d");
    if (ctxDwell) {
      try {
        const dwellLabels = ["Projects Grid", "Skills Arsenal", "Career History", "Capabilities", "Hero / About", "Upcoming", "Contributors", "Feedback", "Contact"];
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
              label: "Dwell Time (Seconds)",
              data: dwellValues,
              backgroundColor: colors,
              borderRadius: 8,
              borderSkipped: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                titleColor: "#f8fafc",
                bodyColor: "#cbd5e1",
                borderColor: "rgba(255, 255, 255, 0.12)",
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
                callbacks: {
                  label: (ctx) => ` Attention Time: ${formatDuration(ctx.raw)} (${ctx.raw}s)`
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  color: textColor,
                  font: { family: "Outfit, sans-serif", size: 11, weight: "600" },
                  maxRotation: 25,
                  minRotation: 25
                }
              },
              y: {
                grid: { color: gridColor },
                ticks: {
                  color: textColor,
                  font: { family: "Outfit, sans-serif", size: 11.5 },
                  callback: (v) => `${v}s`
                },
                beginAtZero: true
              }
            }
          }
        });
      } catch (err) {
        console.error("[Analytics] Chart dwell error:", err);
      }
    }

    // Chart 3: Most Used Feature Interactions (Donut)
    const canvasInteractions = document.getElementById("chart-interactions-dist");
    const ctxInteractions = canvasInteractions?.getContext("2d");
    if (ctxInteractions) {
      try {
        const featLabels = Object.keys(stats.actionCounts);
        const featValues = Object.values(stats.actionCounts);

        const displayLabels = featLabels.length ? featLabels.map(l => l.replace(/_/g, " ").toUpperCase()) : ["PROJECT DEMOS", "SKILL EXPLORE", "RESUME CLICKS", "THEME SWITCH", "CONTACT"];
        const displayValues = featValues.length ? featValues : [18, 14, 9, 6, 4];

        chartInstances.interactions = new window.Chart(ctxInteractions, {
          type: "doughnut",
          data: {
            labels: displayLabels,
            datasets: [{
              data: displayValues,
              backgroundColor: ["#00d9ff", "#c084fc", "#fbbf24", "#34d399", "#f43f5e", "#38bdf8"],
              borderWidth: 2,
              borderColor: isLight ? "#ffffff" : "#0f172a"
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  color: textColor,
                  font: { family: "Outfit, sans-serif", size: 11 },
                  boxWidth: 10,
                  padding: 10
                }
              },
              tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                titleColor: "#f8fafc",
                bodyColor: "#cbd5e1",
                borderColor: "rgba(255, 255, 255, 0.12)",
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8
              }
            },
            cutout: "68%"
          }
        });
      } catch (err) {
        console.error("[Analytics] Chart interactions error:", err);
      }
    }

    // Chart 4: Inbound Traffic Sources
    const canvasSources = document.getElementById("chart-traffic-sources");
    const ctxSources = canvasSources?.getContext("2d");
    if (ctxSources) {
      try {
        const srcLabels = Object.keys(stats.referrerCounts);
        const srcValues = Object.values(stats.referrerCounts);

        const dLabels = srcLabels.length ? srcLabels : ["Direct / Bookmark", "github.com", "linkedin.com", "google.com", "twitter.com"];
        const dValues = srcValues.length ? srcValues : [16, 12, 8, 5, 3];

        chartInstances.sources = new window.Chart(ctxSources, {
          type: "polarArea",
          data: {
            labels: dLabels,
            datasets: [{
              data: dValues,
              backgroundColor: [
                "rgba(0, 217, 255, 0.75)",
                "rgba(192, 132, 252, 0.75)",
                "rgba(251, 191, 36, 0.75)",
                "rgba(52, 211, 153, 0.75)",
                "rgba(244, 63, 94, 0.75)"
              ],
              borderWidth: 2,
              borderColor: isLight ? "#ffffff" : "#0f172a"
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: { color: textColor, font: { family: "Outfit, sans-serif", size: 11 }, boxWidth: 10, padding: 8 }
              },
              tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                titleColor: "#f8fafc",
                bodyColor: "#cbd5e1",
                borderColor: "rgba(255, 255, 255, 0.12)",
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8
              }
            },
            scales: {
              r: {
                grid: { color: gridColor },
                ticks: { display: false }
              }
            }
          }
        });
      } catch (err) {
        console.error("[Analytics] Chart sources error:", err);
      }
    }

    // Chart 5: Devices Matrix
    const canvasDevices = document.getElementById("chart-device-breakdown");
    const ctxDevices = canvasDevices?.getContext("2d");
    if (ctxDevices) {
      try {
        const devLabels = Object.keys(stats.deviceCounts);
        const devValues = Object.values(stats.deviceCounts);

        chartInstances.devices = new window.Chart(ctxDevices, {
          type: "pie",
          data: {
            labels: devLabels,
            datasets: [{
              data: devValues,
              backgroundColor: ["#00d9ff", "#c084fc", "#fbbf24"],
              borderWidth: 2,
              borderColor: isLight ? "#ffffff" : "#0f172a"
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: { color: textColor, font: { family: "Outfit, sans-serif", size: 11 }, boxWidth: 10, padding: 10 }
              },
              tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                titleColor: "#f8fafc",
                bodyColor: "#cbd5e1",
                borderColor: "rgba(255, 255, 255, 0.12)",
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8
              }
            }
          }
        });
      } catch (err) {
        console.error("[Analytics] Chart devices error:", err);
      }
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

    // Seed Demo Traffic button (Direct Execution with Instant Toast)
    const handleSeed = async () => {
      if (isSeeding) return;
      isSeeding = true;
      const seedBtn = container.querySelector("#seed-demo-btn");
      if (seedBtn) seedBtn.innerHTML = `<span>⚡ Injecting 35 Sessions...</span>`;
      
      try {
        const count = await seedDemoAnalytics(35);
        rawSessions = await getAnalyticsData(300);
        renderView();
        toast.success(`⚡ Injected ${count} realistic visitor sessions! Telemetry and charts updated.`);
      } catch (err) {
        toast.error("Failed to seed: " + err.message);
      } finally {
        isSeeding = false;
      }
    };

    container.querySelector("#seed-demo-btn")?.addEventListener("click", handleSeed);
    container.querySelector("#empty-state-seed-btn")?.addEventListener("click", handleSeed);

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
