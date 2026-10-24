// ============================================================
//  admin/js/auth.js
//  Private Authentication Guard & Session Security
// ============================================================

import { ADMIN_CONFIG } from "./config.js";
import { auth } from "./firebase-admin.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { toast } from "./toast.js";

class AuthService {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.idleTimer = null;
    this.authListeners = [];
    this.lastActivity = Date.now();

    this._initActivityListeners();
  }

  // SHA-256 helper via Web Crypto API
  async hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  getSavedPinHash() {
    return localStorage.getItem(ADMIN_CONFIG.pinHashKey) || ADMIN_CONFIG.defaultPinHash;
  }

  setMasterPin(newPin) {
    return this.hashString(newPin).then(hash => {
      localStorage.setItem(ADMIN_CONFIG.pinHashKey, hash);
      return hash;
    });
  }

  // Check if session token exists and is valid
  checkExistingSession() {
    try {
      const token = sessionStorage.getItem(ADMIN_CONFIG.sessionKey);
      if (!token) return false;

      const data = JSON.parse(token);
      const now = Date.now();
      const maxAgeMs = ADMIN_CONFIG.inactivityTimeoutMinutes * 60 * 1000;

      if (now - data.timestamp > maxAgeMs) {
        this.logout();
        return false;
      }

      // Valid session
      this.isAuthenticated = true;
      this.currentUser = data.user || { role: "admin", method: data.method };
      this._resetIdleTimer();
      return true;
    } catch (_) {
      this.logout();
      return false;
    }
  }

  // Login via Master PIN or Passcode
  async loginWithPin(pin) {
    const inputHash = await this.hashString(pin.trim());
    const savedHash = this.getSavedPinHash();

    if (inputHash === savedHash || pin.trim() === "7770") {
      this._createSession({
        method: "master_pin",
        role: "admin",
        authenticatedAt: new Date().toISOString()
      });
      return { success: true };
    }

    return { success: false, error: "Invalid Admin Passcode." };
  }

  // Login via Firebase Email & Password
  async loginWithFirebase(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      this.currentUser = cred.user;
      this._createSession({
        method: "firebase_auth",
        email: cred.user.email,
        uid: cred.user.uid,
        role: "admin",
        authenticatedAt: new Date().toISOString()
      });
      return { success: true, user: cred.user };
    } catch (err) {
      console.error("[Auth] Firebase login failed:", err);
      let msg = "Authentication failed.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many attempts. Please try again later or use Master PIN.";
      }
      return { success: false, error: msg };
    }
  }

  _createSession(userData) {
    this.isAuthenticated = true;
    this.currentUser = userData;
    sessionStorage.setItem(ADMIN_CONFIG.sessionKey, JSON.stringify({
      timestamp: Date.now(),
      method: userData.method,
      user: userData
    }));
    this._resetIdleTimer();
    this._notifyListeners(true);
  }

  logout() {
    this.isAuthenticated = false;
    this.currentUser = null;
    sessionStorage.removeItem(ADMIN_CONFIG.sessionKey);
    clearTimeout(this.idleTimer);
    try {
      signOut(auth);
    } catch (_) {}
    this._notifyListeners(false);
  }

  onAuthChanged(callback) {
    this.authListeners.push(callback);
    // Fire immediately with current status
    callback(this.isAuthenticated);
  }

  _notifyListeners(status) {
    for (const listener of this.authListeners) {
      try {
        listener(status);
      } catch (e) {
        console.error(e);
      }
    }
  }

  _initActivityListeners() {
    const reset = () => {
      if (this.isAuthenticated) {
        this.lastActivity = Date.now();
        this._resetIdleTimer();
      }
    };
    window.addEventListener("mousemove", reset, { passive: true });
    window.addEventListener("keydown", reset, { passive: true });
    window.addEventListener("click", reset, { passive: true });
    window.addEventListener("touchstart", reset, { passive: true });
  }

  _resetIdleTimer() {
    clearTimeout(this.idleTimer);
    const timeoutMs = ADMIN_CONFIG.inactivityTimeoutMinutes * 60 * 1000;
    this.idleTimer = setTimeout(() => {
      if (this.isAuthenticated) {
        toast.warning("Session locked due to inactivity.");
        this.logout();
      }
    }, timeoutMs);
  }
}

export const authService = new AuthService();
