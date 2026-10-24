// ============================================================
//  admin/js/modal.js
//  Modal dialog and confirmation prompt manager
// ============================================================

class ModalService {
  constructor() {
    this.activeModal = null;
    this._initListeners();
  }

  _initListeners() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activeModal) {
        this.close();
      }
    });
  }

  open({ title, bodyHtml, footerHtml = "", size = "md", onClose = null }) {
    this.close(); // Close any currently open modal

    const overlay = document.createElement("div");
    overlay.className = "admin-modal-overlay";
    overlay.id = "admin-active-modal-overlay";

    const container = document.createElement("div");
    container.className = `admin-modal-container size-${size}`;

    container.innerHTML = `
      <div class="admin-modal-header">
        <h3 class="admin-modal-title">${title}</h3>
        <button class="admin-modal-close" id="modal-close-btn" aria-label="Close modal">&times;</button>
      </div>
      <div class="admin-modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="admin-modal-footer">${footerHtml}</div>` : ""}
    `;

    overlay.appendChild(container);
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");

    // Close handlers
    const closeBtn = container.querySelector("#modal-close-btn");
    closeBtn.addEventListener("click", () => this.close());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close();
    });

    this.activeModal = {
      overlay,
      onClose
    };

    // Trigger appear animation
    requestAnimationFrame(() => {
      overlay.classList.add("modal-active");
    });

    return container;
  }

  close() {
    if (!this.activeModal) return;
    const { overlay, onClose } = this.activeModal;
    overlay.classList.remove("modal-active");
    document.body.classList.remove("modal-open");
    
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (typeof onClose === "function") onClose();
    }, 200);

    this.activeModal = null;
  }

  confirm({ title = "Are you sure?", message, confirmText = "Confirm", cancelText = "Cancel", isDanger = false }) {
    return new Promise((resolve) => {
      const footerHtml = `
        <button class="btn btn-secondary" id="confirm-cancel-btn">${cancelText}</button>
        <button class="btn ${isDanger ? "btn-danger" : "btn-primary"}" id="confirm-ok-btn">${confirmText}</button>
      `;

      const bodyHtml = `
        <div class="confirm-modal-content">
          ${isDanger ? `
            <div class="confirm-icon-danger">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          ` : ""}
          <p class="confirm-message">${message}</p>
        </div>
      `;

      const modalEl = this.open({
        title,
        bodyHtml,
        footerHtml,
        size: "sm",
        onClose: () => resolve(false)
      });

      modalEl.querySelector("#confirm-cancel-btn").addEventListener("click", () => {
        this.close();
        resolve(false);
      });

      modalEl.querySelector("#confirm-ok-btn").addEventListener("click", () => {
        this.close();
        resolve(true);
      });
    });
  }
}

export const modal = new ModalService();
