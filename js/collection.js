/**
 * Collection Page - Section Switching Logic
 */

document.addEventListener('DOMContentLoaded', function() {
  initializeSectionSwitching();
});

/**
 * Initialize section switching functionality
 */
function initializeSectionSwitching() {
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  const sections = document.querySelectorAll('.content-section');

  sidebarItems.forEach(item => {
    item.addEventListener('click', function() {
      const targetSection = this.getAttribute('data-section');

      // Remove active class from all sidebar items
      sidebarItems.forEach(i => i.classList.remove('active'));

      // Add active class to clicked item
      this.classList.add('active');

      // Hide all sections
      sections.forEach(section => {
        section.classList.remove('active');
      });

      // Show target section with animation
      const targetSectionElement = document.getElementById(`${targetSection}-section`);
      if (targetSectionElement) {
        targetSectionElement.classList.add('active');
      }

      // Smooth scroll to top of main content on mobile
      if (window.innerWidth <= 768) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  });

  // Handle keyboard navigation
  document.addEventListener('keydown', function(e) {
    const activeItem = document.querySelector('.sidebar-item.active');
    if (!activeItem) return;

    let nextItem = null;

    // Arrow key navigation
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      nextItem = activeItem.nextElementSibling;
      if (nextItem && nextItem.classList.contains('sidebar-item')) {
        e.preventDefault();
        nextItem.click();
        nextItem.focus();
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      nextItem = activeItem.previousElementSibling;
      if (nextItem && nextItem.classList.contains('sidebar-item')) {
        e.preventDefault();
        nextItem.click();
        nextItem.focus();
      }
    }
  });

  // Optional: Deep linking support (URL hash navigation)
  handleDeepLinking();
}

/**
 * Handle deep linking via URL hash
 */
function handleDeepLinking() {
  const hash = window.location.hash.substring(1); // Remove '#'

  if (hash) {
    const targetButton = document.querySelector(`[data-section="${hash}"]`);
    if (targetButton) {
      targetButton.click();
    }
  }

  // Update URL hash when section changes
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  sidebarItems.forEach(item => {
    item.addEventListener('click', function() {
      const section = this.getAttribute('data-section');
      window.history.replaceState(null, null, `#${section}`);
    });
  });
}

/**
 * Add smooth reveal animations to cards as they come into view
 */
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 100);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });

  // Observe all cards
  document.querySelectorAll('.content-card, .quote-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
  });
}
