// Welcome Wave Animation
(function() {
    const welcomeText = document.querySelector('.welcome-text');

    if (!welcomeText) return;

    let isAnimating = false;

    function triggerWave(e) {
        // Prevent animation if already animating
        if (isAnimating) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            return;
        }

        // Prevent default for touch events
        if (e && e.type === 'touchstart' && e.preventDefault) {
            e.preventDefault();
        }

        // Set animating flag
        isAnimating = true;

        // Add waving class
        welcomeText.classList.add('waving');

        // Remove class after animation completes
        setTimeout(() => {
            welcomeText.classList.remove('waving');
            isAnimating = false;
        }, 1000);
    }

    // Hover support for desktop
    welcomeText.addEventListener('mouseenter', triggerWave);

    // Touch support for mobile
    welcomeText.addEventListener('touchstart', triggerWave, { passive: false });

    // Click support for desktop and mobile (backup)
    welcomeText.addEventListener('click', triggerWave);
})();
