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

    // Click to wave (works on both mobile and desktop)
    welcomeText.addEventListener('click', triggerWave);
    welcomeText.style.cursor = 'pointer';

    // Desktop: Hover to wave
    if (!isMobile) {
        welcomeText.addEventListener('mouseenter', triggerWave);
    }

    // Random auto-waving every 8-15 seconds (both desktop and mobile)
    function scheduleRandomWave() {
        // Random interval between 8000ms (8s) and 15000ms (15s)
        const randomDelay = Math.random() * 7000 + 8000;

        setTimeout(() => {
            triggerWave();
            // Schedule next wave after this one completes
            setTimeout(scheduleRandomWave, 1000);
        }, randomDelay);
    }

    // Initial wave after 3 seconds, then start random schedule
    setTimeout(() => {
        triggerWave();
        // Start random schedule after first wave
        setTimeout(scheduleRandomWave, 1000);
    }, 3000);
})();
