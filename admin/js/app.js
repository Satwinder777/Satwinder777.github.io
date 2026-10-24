// ============================================================
//  admin/js/app.js
//  Main Application Orchestrator, Router & Real-Time Sync
// ============================================================

import { authService } from "./auth.js";
import {
  getPortfolioData,
  subscribeToPortfolio,
  subscribeToFeedback,
  subscribeToInbox,
  subscribeToLogs
} from "./firebase-admin.js";
import { toast } from "./toast.js";

// Import view modules
import { renderDashboard } from "./modules/dashboard.js";
import { renderProfile } from "./modules/profile.js";
import { renderProjects } from "./modules/projects.js";
import { renderExperience } from "./modules/experience.js";
import { renderSkills } from "./modules/skills.js";
import { renderFeedback } from "./modules/feedback.js";
import { renderInbox } from "./modules/inbox.js";
import { renderContributors } from "./modules/contributors.js";
import { renderSiteContent } from "./modules/site-content.js";
import { renderResume } from "./modules/resume.js";
import { renderLogs } from "./modules/logs.js";
import { renderSettings } from "./modules/settings.js";

class AdminApp {
  constructor() {
    this.state = {
      portfolio: null,
      feedback: [],
      inbox: [],
      logs: [],
      currentRoute: "dashboard",
      theme: localStorage.getItem("satwinderx_admin_theme") || "dark"
    };

    this.unsubscribers = [];
    this.router = {
      navigate: (route) => this.navigateTo(route)
    };
  }

  init() {
    this.applyTheme(this.state.theme);
    this._bindAuthGate();

    authService.onAuthChanged((isAuth) => {
      if (isAuth) {
        this.onUserAuthenticated();
      } else {
        this.onUserLoggedOut();
      }
    });

    // Check existing session
    authService.checkExistingSession();
  }

  _bindAuthGate() {
    const pinForm = document.getElementById("auth-pin-form");
    const pinInput = document.getElementById("auth-pin-input");
    const fbForm = document.getElementById("auth-fb-form");
    const fbEmail = document.getElementById("auth-fb-email");
    const fbPass = document.getElementById("auth-fb-password");
    const toggleToFb = document.getElementById("toggle-auth-fb");
    const toggleToPin = document.getElementById("toggle-auth-pin");

    pinForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const val = pinInput.value.trim();
      if (!val) return;

      const submitBtn = pinForm.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.innerText = "Verifying...";

      const res = await authService.loginWithPin(val);
      if (!res.success) {
        toast.error(res.error || "Incorrect Master PIN.");
        pinInput.value = "";
        pinInput.focus();
        submitBtn.disabled = false;
        submitBtn.innerText = "Unlock Admin";
      }
    });

    fbForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = fbEmail.value.trim();
      const pass = fbPass.value.trim();
      if (!email || !pass) return;

      const submitBtn = fbForm.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.innerText = "Authenticating...";

      const res = await authService.loginWithFirebase(email, pass);
      if (!res.success) {
        toast.error(res.error);
        submitBtn.disabled = false;
        submitBtn.innerText = "Sign In with Firebase";
      }
    });

    toggleToFb?.addEventListener("click", () => {
      pinForm.style.display = "none";
      fbForm.style.display = "block";
    });

    toggleToPin?.addEventListener("click", () => {
      fbForm.style.display = "none";
      pinForm.style.display = "block";
    });
  }

  async onUserAuthenticated() {
    document.getElementById("auth-screen").style.display = "none";
    document.getElementById("app-shell").style.display = "flex";

    toast.success("Authenticated. Initializing command center...");

    // Start live Firestore listeners
    this._startSubscriptions();

    // Bind navigation buttons & global shell controls
    this._bindShellControls();

    // Initial render
    this.navigateTo(this.state.currentRoute);
  }

  onUserLoggedOut() {
    this._stopSubscriptions();
    document.getElementById("app-shell").style.display = "none";
    document.getElementById("auth-screen").style.display = "flex";

    const pinInput = document.getElementById("auth-pin-input");
    if (pinInput) {
      pinInput.value = "";
      pinInput.focus();
    }
  }

  _startSubscriptions() {
    this._stopSubscriptions();

    // 1. Portfolio doc
    const unsubPortfolio = subscribeToPortfolio(
      (data) => {
        this.state.portfolio = data || {};
        this._updateHeaderStatus();
        this.renderCurrentView();
      },
      (err) => console.error("[Sync] Portfolio error:", err)
    );
    this.unsubscribers.push(unsubPortfolio);

    // 2. Feedback
    const unsubFeedback = subscribeToFeedback(
      (items) => {
        this.state.feedback = items;
        this._updateBadges();
        if (this.state.currentRoute === "feedback" || this.state.currentRoute === "dashboard") {
          this.renderCurrentView();
        }
      },
      (err) => console.error("[Sync] Feedback error:", err)
    );
    this.unsubscribers.push(unsubFeedback);

    // 3. Inbox
    const unsubInbox = subscribeToInbox(
      (items) => {
        this.state.inbox = items;
        this._updateBadges();
        if (this.state.currentRoute === "inbox" || this.state.currentRoute === "dashboard") {
          this.renderCurrentView();
        }
      },
      (err) => console.error("[Sync] Inbox error:", err)
    );
    this.unsubscribers.push(unsubInbox);

    // 4. Logs
    const unsubLogs = subscribeToLogs(
      (items) => {
        this.state.logs = items;
        this._updateBadges();
        if (this.state.currentRoute === "logs" || this.state.currentRoute === "dashboard") {
          this.renderCurrentView();
        }
      },
      (err) => console.error("[Sync] Logs error:", err)
    );
    this.unsubscribers.push(unsubLogs);
  }

  _stopSubscriptions() {
    for (const unsub of this.unsubscribers) {
      try {
        if (typeof unsub === "function") unsub();
      } catch (_) {}
    }
    this.unsubscribers = [];
  }

  _bindShellControls() {
    // Nav links
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const route = link.dataset.route;
        if (route) this.navigateTo(route);
        // On mobile close drawer
        document.getElementById("sidebar")?.classList.remove("sidebar-open");
      });
    });

    // Mobile drawer toggle
    const menuBtn = document.getElementById("mobile-menu-btn");
    menuBtn?.addEventListener("click", () => {
      document.getElementById("sidebar")?.classList.toggle("sidebar-open");
    });

    // Topbar lock button
    const lockBtn = document.getElementById("topbar-lock-btn");
    lockBtn?.addEventListener("click", () => {
      authService.logout();
      toast.info("Admin locked.");
    });

    // Topbar Theme Switcher
    const themeBtn = document.getElementById("topbar-theme-btn");
    themeBtn?.addEventListener("click", () => {
      const next = this.state.theme === "dark" ? "light" : "dark";
      this.applyTheme(next);
      toast.info(`Theme set to ${next}.`);
    });
  }

  applyTheme(theme) {
    this.state.theme = theme;
    localStorage.setItem("satwinderx_admin_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);

    const iconEl = document.getElementById("theme-btn-icon");
    if (iconEl) {
      iconEl.innerHTML = theme === "dark"
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
    }
  }

  navigateTo(route) {
    this.state.currentRoute = route;

    // Highlight active nav
    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.toggle("active", link.dataset.route === route);
    });

    this.renderCurrentView();
  }

  renderCurrentView() {
    const mainViewContainer = document.getElementById("main-view-container");
    if (!mainViewContainer) return;

    if (!this.state.portfolio) {
      mainViewContainer.innerHTML = `
        <div class="view-loading-state">
          <div class="admin-spinner"></div>
          <p>Connecting to Satwinder's portfolio data stream...</p>
        </div>
      `;
      return;
    }

    switch (this.state.currentRoute) {
      case "dashboard":
        renderDashboard(mainViewContainer, this.state, this.router);
        break;
      case "profile":
        renderProfile(mainViewContainer, this.state);
        break;
      case "projects":
        renderProjects(mainViewContainer, this.state);
        break;
      case "experience":
        renderExperience(mainViewContainer, this.state);
        break;
      case "skills":
        renderSkills(mainViewContainer, this.state);
        break;
      case "feedback":
        renderFeedback(mainViewContainer, this.state);
        break;
      case "inbox":
        renderInbox(mainViewContainer, this.state);
        break;
      case "contributors":
        renderContributors(mainViewContainer, this.state);
        break;
      case "site_content":
        renderSiteContent(mainViewContainer, this.state);
        break;
      case "resume":
        renderResume(mainViewContainer, this.state);
        break;
      case "logs":
        renderLogs(mainViewContainer, this.state);
        break;
      case "settings":
        renderSettings(mainViewContainer, this.state);
        break;
      default:
        renderDashboard(mainViewContainer, this.state, this.router);
    }
  }

  _updateBadges() {
    const pendingFeedback = this.state.feedback.filter(f => (f.status || "in_review") === "in_review").length;
    const unreadInbox = this.state.inbox.filter(i => !i.isRead && !i.isArchived).length;
    const errorLogs = this.state.logs.filter(l => (l.level || "").toLowerCase() === "error" || (l.level || "").toLowerCase() === "fatal").length;

    const bFeedback = document.getElementById("badge-feedback-count");
    if (bFeedback) {
      bFeedback.textContent = pendingFeedback > 0 ? pendingFeedback : "";
      bFeedback.style.display = pendingFeedback > 0 ? "inline-flex" : "none";
    }

    const bInbox = document.getElementById("badge-inbox-count");
    if (bInbox) {
      bInbox.textContent = unreadInbox > 0 ? unreadInbox : "";
      bInbox.style.display = unreadInbox > 0 ? "inline-flex" : "none";
    }

    const bLogs = document.getElementById("badge-logs-count");
    if (bLogs) {
      bLogs.textContent = errorLogs > 0 ? errorLogs : "";
      bLogs.style.display = errorLogs > 0 ? "inline-flex" : "none";
    }
  }

  _updateHeaderStatus() {
    const prof = this.state.portfolio?.profile || {};
    const nameEl = document.getElementById("sidebar-user-name");
    const roleEl = document.getElementById("sidebar-user-role");
    if (nameEl && prof.name) nameEl.textContent = prof.name;
    if (roleEl && prof.title) roleEl.textContent = prof.title;
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  const app = new AdminApp();
  app.init();
});
