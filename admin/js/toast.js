// ============================================================
//  admin/js/toast.js
//  Floating notification system for the Web Admin
// ============================================================

class ToastService {
  constructor() {
    this.container = null;
    this._ensureContainer();
  }

  _ensureContainer() {
    if (this.container && document.body.contains(this.container)) return;
    let existing = document.getElementById("admin-toast-container");
    if (!existing) {
      existing = document.createElement("div");
      existing.id = "admin-toast-container";
      existing.className = "admin-toast-container";
      document.body.appendChild(existing);
    }
    this.container = existing;
  }

  show(message, type = "info", duration = 3500) {
    this._ensureContainer();

    const toast = document.createElement("div");
    toast.className = `admin-toast toast-${type}`;

    const iconMap = {
      success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6L9 17l-5-5"/></svg>`,
      error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    };

    toast.innerHTML = `
      <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
      <div class="toast-body">${this._escape(message)}</div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    const closeBtn = toast.querySelector(".toast-close");
    const removeToast = () => {
      toast.classList.add("toast-leaving");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    };

    closeBtn.addEventListener("click", removeToast);
    this.container.appendChild(toast);

    // Auto remove
    setTimeout(removeToast, duration);
  }

  success(msg, dur) { this.show(msg, "success", dur); }
  error(msg, dur) { this.show(msg, "error", dur || 5000); }
  warning(msg, dur) { this.show(msg, "warning", dur); }
  info(msg, dur) { this.show(msg, "info", dur); }

  _escape(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

export const toast = new ToastService();
