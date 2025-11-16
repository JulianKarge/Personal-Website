/**
 * Theme Switcher - Manages color theme preferences
 */

// Theme configuration
const themes = {
  cyber: {
    name: 'Cyber',
    icon: 'fa-bolt'
  },
  sunset: {
    name: 'Sunset',
    icon: 'fa-sun'
  },
  forest: {
    name: 'Forest',
    icon: 'fa-leaf'
  },
  neon: {
    name: 'Neon',
    icon: 'fa-fire'
  }
};

// Initialize theme system
document.addEventListener('DOMContentLoaded', function() {
  initializeTheme();
  setupThemeSwitcher();
});

/**
 * Initialize theme from localStorage or default
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'cyber';
  applyTheme(savedTheme);
}

/**
 * Apply theme to document
 */
function applyTheme(themeName) {
  // Remove all theme classes
  document.documentElement.removeAttribute('data-theme');

  // Add new theme
  document.documentElement.setAttribute('data-theme', themeName);

  // Save to localStorage
  localStorage.setItem('theme', themeName);

  // Update active state in UI if it exists
  updateThemeUI(themeName);
}

/**
 * Setup theme switcher UI and event listeners
 */
function setupThemeSwitcher() {
  // Setup desktop theme switcher
  setupThemeButton('theme-button', 'theme-dropdown');

  // Setup mobile theme switcher
  setupThemeButton('theme-button-mobile', 'theme-dropdown-mobile');

  // Set initial button text for both
  const currentTheme = localStorage.getItem('theme') || 'cyber';
  updateButtonText(currentTheme);
  updateButtonText(currentTheme, true); // For mobile
}

/**
 * Setup individual theme button
 */
function setupThemeButton(buttonId, dropdownId) {
  const themeButton = document.getElementById(buttonId);
  const themeDropdown = document.getElementById(dropdownId);

  if (!themeButton || !themeDropdown) return;

  const themeOptions = themeDropdown.querySelectorAll('.theme-option');

  // Toggle dropdown
  themeButton.addEventListener('click', function(e) {
    e.stopPropagation();

    // Close other dropdown
    const otherDropdown = buttonId.includes('mobile')
      ? document.getElementById('theme-dropdown')
      : document.getElementById('theme-dropdown-mobile');
    if (otherDropdown) {
      otherDropdown.classList.remove('active');
    }

    themeDropdown.classList.toggle('active');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!themeButton.contains(e.target) && !themeDropdown.contains(e.target)) {
      themeDropdown.classList.remove('active');
    }
  });

  // Theme option clicks
  themeOptions.forEach(option => {
    option.addEventListener('click', function() {
      const theme = this.getAttribute('data-theme');
      applyTheme(theme);
      themeDropdown.classList.remove('active');

      // Update button text for both desktop and mobile
      updateButtonText(theme);
      updateButtonText(theme, true);
    });
  });
}

/**
 * Update theme UI to show active theme
 */
function updateThemeUI(themeName) {
  const themeOptions = document.querySelectorAll('.theme-option');

  themeOptions.forEach(option => {
    if (option.getAttribute('data-theme') === themeName) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

/**
 * Update theme button text
 */
function updateButtonText(themeName, isMobile = false) {
  const suffix = isMobile ? '-mobile' : '';
  const buttonText = document.getElementById(`theme-button-text${suffix}`);
  const buttonIcon = document.getElementById(`theme-button-icon${suffix}`);

  if (buttonText) {
    buttonText.textContent = themes[themeName].name;
  }

  if (buttonIcon) {
    // Remove all icon classes
    buttonIcon.className = 'fas';
    // Add new icon
    buttonIcon.classList.add(themes[themeName].icon);
  }
}

/**
 * Get current theme
 */
function getCurrentTheme() {
  return localStorage.getItem('theme') || 'cyber';
}

/**
 * Cycle to next theme (for keyboard shortcut)
 */
function cycleTheme() {
  const themeNames = Object.keys(themes);
  const currentTheme = getCurrentTheme();
  const currentIndex = themeNames.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themeNames.length;
  const nextTheme = themeNames[nextIndex];

  applyTheme(nextTheme);
  updateButtonText(nextTheme);
}

// Optional: Add keyboard shortcut (Ctrl/Cmd + Shift + T)
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
    e.preventDefault();
    cycleTheme();
  }
});
