/**
 * Springy Text - Controlled wiggly text with proper physics
 * Uses anime.js for smooth spring animations
 */

class SpringyText {
    constructor(element, options = {}) {
        this.element = element;
        this.originalText = element.textContent.trim();

        // Configuration
        this.config = {
            // Spring physics
            springStiffness: options.springStiffness || 300,
            springDamping: options.springDamping || 20,

            // Wiggle settings
            wiggleAmount: options.wiggleAmount || 3,
            wiggleSpeed: options.wiggleSpeed || 2000,

            // Scroll effect
            scrollEffect: options.scrollEffect !== false,
            scrollStrength: options.scrollStrength || 15,

            // Drag settings
            draggable: options.draggable !== false,
            dragDistance: options.dragDistance || 50,

            ...options
        };

        this.letters = [];
        this.isDragging = false;
        this.draggedLetter = null;
        this.lastScrollY = window.scrollY;
        this.wiggleInterval = null;

        this.init();
    }

    init() {
        // Check if element is in viewport
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.startWiggle();
                } else {
                    this.stopWiggle();
                }
            });
        }, { threshold: 0.1 });

        this.observer.observe(this.element);

        // Create letter elements
        this.createLetters();

        // Setup interactions
        this.setupScrollEffect();
    }

    createLetters() {
        this.element.innerHTML = '';
        this.element.style.display = 'block';
        this.element.style.textAlign = 'center';

        const words = this.originalText.split(' ');

        words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.style.display = 'inline-block';
            wordSpan.style.whiteSpace = 'nowrap';
            wordSpan.style.marginRight = '0.25em';

            [...word].forEach((char, charIndex) => {
                const letterSpan = document.createElement('span');
                letterSpan.textContent = char;
                letterSpan.className = 'springy-letter';
                letterSpan.style.display = 'inline-block';
                letterSpan.style.position = 'relative';
                letterSpan.style.transformOrigin = 'center center';
                letterSpan.style.cursor = this.config.draggable ? 'grab' : 'default';
                letterSpan.style.userSelect = 'none';

                const letterData = {
                    element: letterSpan,
                    index: this.letters.length,
                    x: 0,
                    y: 0,
                    rotation: 0,
                    baseDelay: (this.letters.length * 50)
                };

                this.letters.push(letterData);

                if (this.config.draggable) {
                    this.makeDraggable(letterData);
                }

                wordSpan.appendChild(letterSpan);
            });

            this.element.appendChild(wordSpan);
        });
    }

    makeDraggable(letterData) {
        const el = letterData.element;
        let startX, startY, initialX, initialY;
        let animationId = null;

        const onStart = (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.draggedLetter = letterData;
            el.style.cursor = 'grabbing';
            el.style.zIndex = '1000';

            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            initialX = letterData.x;
            initialY = letterData.y;
        };

        const onMove = (e) => {
            if (!this.isDragging || this.draggedLetter !== letterData) return;
            e.preventDefault();

            const touch = e.touches ? e.touches[0] : e;
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;

            // Limit drag distance
            const maxDist = this.config.dragDistance;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const limitedDistance = Math.min(distance, maxDist);
            const angle = Math.atan2(deltaY, deltaX);

            letterData.x = initialX + Math.cos(angle) * limitedDistance;
            letterData.y = initialY + Math.sin(angle) * limitedDistance;
            letterData.rotation = (deltaX / maxDist) * 15; // Max 15 degrees rotation

            this.updateLetterTransform(letterData);
        };

        const onEnd = () => {
            if (!this.isDragging || this.draggedLetter !== letterData) return;

            this.isDragging = false;
            this.draggedLetter = null;
            el.style.cursor = 'grab';
            el.style.zIndex = '';

            // Animate back to original position with spring
            this.animateToPosition(letterData, 0, 0, 0);
        };

        el.addEventListener('mousedown', onStart);
        el.addEventListener('touchstart', onStart, { passive: false });

        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });

        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    }

    animateToPosition(letterData, targetX, targetY, targetRotation) {
        const duration = 800;
        const startTime = performance.now();
        const startX = letterData.x;
        const startY = letterData.y;
        const startRotation = letterData.rotation;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Spring easing
            const spring = this.easeOutElastic(progress);

            letterData.x = startX + (targetX - startX) * spring;
            letterData.y = startY + (targetY - startY) * spring;
            letterData.rotation = startRotation + (targetRotation - startRotation) * spring;

            this.updateLetterTransform(letterData);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    easeOutElastic(x) {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 :
            Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    updateLetterTransform(letterData) {
        letterData.element.style.transform =
            `translate(${letterData.x}px, ${letterData.y}px) rotate(${letterData.rotation}deg)`;
    }

    startWiggle() {
        if (this.wiggleInterval) return;

        const wiggle = () => {
            this.letters.forEach((letterData, index) => {
                if (this.isDragging && this.draggedLetter === letterData) return;

                const time = Date.now() / 1000;
                const offset = index * 0.1;

                const targetY = Math.sin(time * 2 + offset) * this.config.wiggleAmount;
                const targetRotation = Math.sin(time * 1.5 + offset) * 2;

                // Smooth transition to wiggle position
                letterData.y += (targetY - letterData.y) * 0.1;
                letterData.rotation += (targetRotation - letterData.rotation) * 0.1;

                this.updateLetterTransform(letterData);
            });
        };

        this.wiggleInterval = setInterval(wiggle, 1000 / 60); // 60fps
    }

    stopWiggle() {
        if (this.wiggleInterval) {
            clearInterval(this.wiggleInterval);
            this.wiggleInterval = null;

            // Return to rest position
            this.letters.forEach(letterData => {
                if (!this.isDragging || this.draggedLetter !== letterData) {
                    this.animateToPosition(letterData, 0, 0, 0);
                }
            });
        }
    }

    setupScrollEffect() {
        if (!this.config.scrollEffect) return;

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            const scrollDelta = window.scrollY - this.lastScrollY;
            this.lastScrollY = window.scrollY;

            // Check if element is in viewport
            const rect = this.element.getBoundingClientRect();
            const inViewport = rect.top < window.innerHeight && rect.bottom > 0;

            if (inViewport && Math.abs(scrollDelta) > 2) {
                this.applyScrollWiggle(scrollDelta);
            }

            clearTimeout(scrollTimeout);
        }, { passive: true });
    }

    applyScrollWiggle(scrollDelta) {
        const strength = Math.min(Math.abs(scrollDelta), 50) / 50; // Normalize to 0-1
        const direction = scrollDelta > 0 ? 1 : -1;

        this.letters.forEach((letterData, index) => {
            if (this.isDragging && this.draggedLetter === letterData) return;

            const delay = index * 20;

            setTimeout(() => {
                const targetY = direction * this.config.scrollStrength * strength;
                const targetRotation = direction * 5 * strength * (Math.random() - 0.5);

                // Quick jump
                letterData.y = targetY;
                letterData.rotation = targetRotation;
                this.updateLetterTransform(letterData);

                // Bounce back with spring
                setTimeout(() => {
                    this.animateToPosition(letterData, 0, 0, 0);
                }, 50);
            }, delay);
        });
    }

    destroy() {
        this.stopWiggle();
        if (this.observer) {
            this.observer.disconnect();
        }
        this.element.innerHTML = this.originalText;
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.springy-text');
    elements.forEach(el => {
        new SpringyText(el, {
            wiggleAmount: parseFloat(el.dataset.wiggleAmount) || 3,
            scrollStrength: parseFloat(el.dataset.scrollStrength) || 15,
            dragDistance: parseFloat(el.dataset.dragDistance) || 50
        });
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpringyText;
}
