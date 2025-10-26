// Welcome Wave Animation
(function() {
    const welcomeText = document.querySelector('.welcome-text');

    if (!welcomeText) return;

    let isAnimating = false;
    let isMobile = window.innerWidth <= 768;

    // Update mobile status on resize
    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= 768;
    });

    function triggerWave() {
        // Prevent animation if already animating
        if (isAnimating) return;

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

    // Desktop: Hover to wave
    if (!isMobile) {
        welcomeText.addEventListener('mouseenter', triggerWave);
    }

    // Mobile: Random auto-waving every 5-10 seconds
    function scheduleRandomWave() {
        if (!isMobile) return;

        // Random interval between 5000ms (5s) and 10000ms (10s)
        const randomDelay = Math.random() * 5000 + 5000;

        setTimeout(() => {
            triggerWave();
            // Schedule next wave after this one completes
            setTimeout(scheduleRandomWave, 1000);
        }, randomDelay);
    }

    // Start random waving for mobile
    if (isMobile) {
        // Initial wave after 2 seconds
        setTimeout(() => {
            triggerWave();
            // Start random schedule after first wave
            setTimeout(scheduleRandomWave, 1000);
        }, 2000);
    }
})();
