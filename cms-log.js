// ============================================================
//  cms-log.js — Portfolio website errors → Firestore cms_logs
//  (read in satwinderx app under Settings → Diagnostics)
// ============================================================

import { cmsLogsCol, addDoc, serverTimestamp } from "./firebase.js";

const _recent = new Map();
const DEDUPE_MS = 15000;

/**
 * @param {{ level?: string, category?: string, message: string, stack?: string, context?: string, meta?: object }} opts
 */
export async function reportCmsLog(opts) {
  const message = String(opts?.message ?? "").trim();
  if (!message) return;

  const key = `${opts?.category}:${message.slice(0, 120)}`;
  const now = Date.now();
  const last = _recent.get(key);
  if (last != null && now - last < DEDUPE_MS) return;
  _recent.set(key, now);

  try {
    await addDoc(cmsLogsCol, {
      source: "portfolio_web",
      category: String(opts?.category ?? "web").slice(0, 32),
      level: String(opts?.level ?? "ERROR").slice(0, 12),
      message: message.slice(0, 2000),
      stack: String(opts?.stack ?? "").slice(0, 8000),
      context: String(opts?.context ?? "").slice(0, 200),
      url: typeof location !== "undefined" ? String(location.href).slice(0, 500) : "",
      meta: opts?.meta && typeof opts.meta === "object" ? opts.meta : {},
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("[cms-log] could not report:", e);
  }
}

export function installWebErrorHandlers() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (ev) => {
    reportCmsLog({
      level: "ERROR",
      category: "web",
      message: ev.message || "Uncaught error",
      stack: ev.error?.stack || `${ev.filename}:${ev.lineno}:${ev.colno}`,
      context: "window.error",
    });
  });

  window.addEventListener("unhandledrejection", (ev) => {
    const reason = ev.reason;
    reportCmsLog({
      level: "ERROR",
      category: "web",
      message: reason?.message || String(reason ?? "Unhandled rejection"),
      stack: reason?.stack || "",
      context: "unhandledrejection",
    });
  });
}
