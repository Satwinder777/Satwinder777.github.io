// ============================================================
//  theme-switcher.js
//  Client-side 3-Way Theme Switcher for Satwinder's Portfolio
//  Themes:
//    - default: Midnight Cyberpunk (Current Baseline)
//    - light: Clean Slate Apple/Linear Day Mode
//    - dark: Onyx Noir AMOLED Pitch Black
// ============================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'satwinder_portfolio_theme';
  const THEMES = ['default', 'light', 'dark'];

  const THEME_CONFIG = {
    default: {
      name: 'Default',
      desc: 'Midnight Cyberpunk',
      icon: 'sparkles',
      metaColor: '#0a0e27'
    },
    light: {
      name: 'Light',
      desc: 'Clean Slate Day',
      icon: 'sun',
      metaColor: '#f8fafc'
    },
    dark: {
      name: 'Dark',
      desc: 'Onyx AMOLED Night',
      icon: 'moon',
      metaColor: '#000000'
    }
  };

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES.includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.warn('[theme] could not read localStorage:', e);
    }
    // Default is always the current Cyberpunk look
    return 'default';
  }

  function applyTheme(theme, persist) {
    if (!THEMES.includes(theme)) theme = 'default';

    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', THEME_CONFIG[theme].metaColor);
    }

    if (persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {
        console.warn('[theme] could not save to localStorage:', e);
      }
    }

    // Update UI elements if present
    updateThemeUi(theme);

    // Dispatch event for other modules (e.g. fluid simulation, AI chatbot)
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  function updateThemeUi(theme) {
    const activeLabel = document.getElementById('theme-active-label');
    const activeIcon = document.getElementById('theme-active-icon');
    const toggleBtn = document.getElementById('theme-toggle-btn');

    if (activeLabel) {
      activeLabel.textContent = THEME_CONFIG[theme].name;
    }

    if (activeIcon) {
      activeIcon.innerHTML = `<i data-lucide="${THEME_CONFIG[theme].icon}" class="w-3.5 h-3.5"></i>`;
    }

    if (toggleBtn) {
      toggleBtn.setAttribute('title', `Current Theme: ${THEME_CONFIG[theme].name} (${THEME_CONFIG[theme].desc})`);
    }

    // Update options checkmark & active state
    document.querySelectorAll('.theme-opt').forEach((btn) => {
      const val = btn.getAttribute('data-theme-value');
      const isActive = val === theme;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function initThemeSwitcher() {
    const currentTheme = getSavedTheme();
    applyTheme(currentTheme, false);

    const switcher = document.getElementById('theme-switcher');
    const toggleBtn = document.getElementById('theme-toggle-btn');
    const menu = document.getElementById('theme-menu');

    if (!switcher || !toggleBtn || !menu) return;

    function toggleMenu(force) {
      const isOpen = typeof force === 'boolean' ? force : !switcher.classList.contains('is-open');
      switcher.classList.toggle('is-open', isOpen);
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    // Option clicks
    menu.querySelectorAll('.theme-opt').forEach((optBtn) => {
      optBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const selected = optBtn.getAttribute('data-theme-value');
        if (selected) {
          applyTheme(selected, true);
        }
        toggleMenu(false);
      });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) {
        toggleMenu(false);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && switcher.classList.contains('is-open')) {
        toggleMenu(false);
        toggleBtn.focus();
      }
    });
  }

  // Expose global methods for programmatic access or testing
  window.setPortfolioTheme = function (theme) {
    applyTheme(theme, true);
  };
  window.getPortfolioTheme = getSavedTheme;
  window.togglePortfolioTheme = function () {
    const curr = getSavedTheme();
    const nextIdx = (THEMES.indexOf(curr) + 1) % THEMES.length;
    applyTheme(THEMES[nextIdx], true);
    return THEMES[nextIdx];
  };

  // Pre-apply theme early to prevent FOUC
  const preTheme = getSavedTheme();
  document.documentElement.setAttribute('data-theme', preTheme);

  // Initialize interactive components when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSwitcher);
  } else {
    initThemeSwitcher();
  }
})();
