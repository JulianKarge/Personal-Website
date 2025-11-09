// ========================================
// MINI YOYO INTERACTIVE ANIMATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  const miniYoyoWrapper = document.getElementById('mini-yoyo-wrapper');

  if (!miniYoyoWrapper) return;

  let isPlaying = false;

  // Click handler for mini yoyo animation
  miniYoyoWrapper.addEventListener('click', function() {
    if (isPlaying) return; // Prevent multiple clicks during animation

    isPlaying = true;
    miniYoyoWrapper.classList.add('playing');

    // Remove playing class after animation completes
    setTimeout(() => {
      miniYoyoWrapper.classList.remove('playing');
      isPlaying = false;
    }, 2000); // Match animation duration (2 seconds)
  });

  // Add subtle bounce on hover
  miniYoyoWrapper.addEventListener('mouseenter', function() {
    if (!isPlaying) {
      miniYoyoWrapper.style.animation = 'none';
      // Trigger reflow
      void miniYoyoWrapper.offsetWidth;
    }
  });
});
