// ============================================================
//  admin/js/modules/settings.js
//  Security PIN, Cloud Diagnostics, JSON Backup & Restore
// ============================================================

import { updatePortfolioField, getPortfolioData } from "../firebase-admin.js";
import { authService } from "../auth.js";
import { ADMIN_CONFIG } from "../config.js";
import { toast } from "../toast.js";
import { modal } from "../modal.js";

export function renderSettings(container, state) {
  const portfolio = state.portfolio || {};

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">System Settings & Security</h1>
        <p class="view-subtitle">Master PIN credentials, cloud diagnostics, and disaster recovery backup/restore.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" id="btn-lock-session">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Lock Admin Now
        </button>
      </div>
    </div>

    <div class="settings-grid">
      <!-- Master Access PIN Security -->
      <div class="card-box">
        <div class="card-box-header">
          <h3>Admin Master Passcode / PIN</h3>
        </div>
        <p class="card-desc">
          Update the private master secret passcode used to unlock this web admin panel.
        </p>

        <form id="pin-change-form" class="editor-form" style="margin-top: 16px;">
          <div class="form-group">
            <label for="old-pin">Current PIN / Passphrase</label>
            <input type="password" id="old-pin" class="form-input" required placeholder="Enter current PIN">
          </div>
          <div class="form-group">
            <label for="new-pin">New PIN / Passphrase</label>
            <input type="password" id="new-pin" class="form-input" required placeholder="Enter new PIN (min 4 characters)">
          </div>
          <div class="form-group">
            <label for="confirm-pin">Confirm New PIN</label>
            <input type="password" id="confirm-pin" class="form-input" required placeholder="Re-enter new PIN">
          </div>
          <button type="submit" class="btn btn-primary" style="margin-top: 8px;">Update Master PIN</button>
        </form>
      </div>

      <!-- Cloud Infrastructure Diagnostics -->
      <div class="card-box">
        <div class="card-box-header">
          <h3>Cloud Infrastructure Health</h3>
        </div>
        <p class="card-desc">Status of Firebase, Firestore documents, and storage buckets.</p>

        <div class="diag-list" style="margin-top: 16px;">
          <div class="diag-item">
            <div class="diag-info">
              <strong>Firebase Project</strong>
              <span>satwinder-portfolio</span>
            </div>
            <span class="badge badge-success">Connected</span>
          </div>

          <div class="diag-item">
            <div class="diag-info">
              <strong>Firestore Main Document</strong>
              <span>portfolio / satwinder</span>
            </div>
            <span class="badge badge-success">Synchronized</span>
          </div>

          <div class="diag-item">
            <div class="diag-info">
              <strong>Security Guard</strong>
              <span>Robots No-Index & Private Session</span>
            </div>
            <span class="badge badge-info">Enforced</span>
          </div>

          <div class="diag-item">
            <div class="diag-info">
              <strong>Auto-Lock Timer</strong>
              <span>${ADMIN_CONFIG.inactivityTimeoutMinutes} Minutes Inactivity</span>
            </div>
            <span class="badge badge-neutral">Active</span>
          </div>
        </div>
      </div>

      <!-- Disaster Recovery & Full JSON Backup -->
      <div class="card-box full-width">
        <div class="card-box-header">
          <div>
            <h3>Disaster Recovery & Portfolio Backup</h3>
            <p class="card-desc">Export a complete snapshot of all portfolio fields (projects, milestones, profile, skills, banner) as a JSON file, or restore from a previous backup.</p>
          </div>
        </div>

        <div class="backup-action-row" style="margin-top: 16px; display: flex; gap: 14px; flex-wrap: wrap;">
          <button class="btn btn-primary" id="export-json-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Full Portfolio Backup (.json)
          </button>

          <label class="btn btn-secondary file-upload-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Restore Backup from File
            <input type="file" id="import-json-input" accept=".json" style="display: none;">
          </label>
        </div>
      </div>
    </div>
  `;

  // Lock session
  container.querySelector("#btn-lock-session")?.addEventListener("click", () => {
    authService.logout();
    toast.info("Admin locked.");
  });

  // Change PIN handler
  container.querySelector("#pin-change-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldVal = container.querySelector("#old-pin").value.trim();
    const newVal = container.querySelector("#new-pin").value.trim();
    const confirmVal = container.querySelector("#confirm-pin").value.trim();

    if (newVal.length < 4) {
      toast.error("New PIN must be at least 4 characters.");
      return;
    }

    if (newVal !== confirmVal) {
      toast.error("New PIN and confirmation do not match.");
      return;
    }

    // Verify old PIN
    const testOld = await authService.loginWithPin(oldVal);
    if (!testOld.success) {
      toast.error("Current PIN is incorrect.");
      return;
    }

    try {
      await authService.setMasterPin(newVal);
      toast.success("Master PIN updated successfully! Remember this for your next login.");
      e.target.reset();
    } catch (err) {
      toast.error("Failed to update PIN: " + err.message);
    }
  });

  // Export JSON backup
  container.querySelector("#export-json-btn")?.addEventListener("click", async () => {
    try {
      toast.info("Generating portfolio snapshot...");
      const liveData = await getPortfolioData();
      const exportBlob = new Blob([JSON.stringify(liveData || portfolio, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(exportBlob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `portfolio-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded successfully!");
    } catch (e) {
      toast.error("Backup failed: " + e.message);
    }
  });

  // Import JSON backup
  const importInput = container.querySelector("#import-json-input");
  importInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ok = await modal.confirm({
      title: "Restore Portfolio Backup?",
      message: `Restoring will overwrite current portfolio data with the contents of "${file.name}". Are you sure you wish to continue?`,
      confirmText: "Restore Now",
      isDanger: true
    });

    if (!ok) {
      importInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("Invalid JSON document format.");
        }

        // Save fields
        for (const [key, val] of Object.entries(parsed)) {
          if (key === "lastPublishedAt") continue;
          await updatePortfolioField(key, val);
        }

        toast.success("Portfolio successfully restored from backup! Refreshing...");
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        toast.error("Restore failed: " + err.message);
      }
    };
    reader.readAsText(file);
  });
}
