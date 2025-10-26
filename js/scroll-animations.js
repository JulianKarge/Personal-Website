// Scroll-in Animations using Intersection Observer
(function() {
    // Configuration
    const config = {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element enters viewport
    };

    // Create observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add animation class when element enters viewport
                entry.target.classList.add('animate-in');

                // Optional: Stop observing after animation (one-time animation)
                // Uncomment the line below if you want animations to trigger only once
                // observer.unobserve(entry.target);
            } else {
                // Optional: Remove class when scrolling back up for re-animation
                // Comment this out if you want one-time animations
                entry.target.classList.remove('animate-in');
            }
        });
    }, config);

    // Wait for DOM to be ready
    function initScrollAnimations() {
        // Select all sections and cards to animate
        const elementsToAnimate = document.querySelectorAll(`
            section:not(#home),
            .achievement-card,
            .latest-video-card,
            .value-card,
            .goal-statement-card,
            .about-slide
        `);

        // Add scroll-animate class and observe each element
        elementsToAnimate.forEach(element => {
            element.classList.add('scroll-animate');
            observer.observe(element);
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollAnimations);
    } else {
        initScrollAnimations();
    }
})();
