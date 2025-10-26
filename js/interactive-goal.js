// Interactive Goal Statement with Springy Word Effects
class InteractiveGoalText {
    constructor(elementId) {
        this.textElement = document.getElementById(elementId);
        if (!this.textElement) return;

        this.words = [];
        this.init();
    }

    init() {
        // Find all highlight words
        const highlightWords = this.textElement.querySelectorAll('.highlight-word');

        highlightWords.forEach((word, index) => {
            const wordData = {
                element: word,
                originalX: 0,
                originalY: 0,
                currentX: 0,
                currentY: 0,
                velocityX: 0,
                velocityY: 0,
                isDragging: false
            };

            this.words.push(wordData);
            this.setupWordInteraction(wordData);
        });
    }

    setupWordInteraction(wordData) {
        const word = wordData.element;
        let startX = 0;
        let startY = 0;

        // Get card boundaries
        const getCardBounds = () => {
            const card = this.textElement.closest('.goal-statement-card');
            if (!card) return null;
            return card.getBoundingClientRect();
        };

        // Clamp movement within card bounds
        const clampToCard = (deltaX, deltaY) => {
            const cardBounds = getCardBounds();
            if (!cardBounds) return { x: deltaX, y: deltaY };

            const wordRect = word.getBoundingClientRect();
            const padding = 20; // Keep word at least 20px inside card

            // Calculate max allowed movement
            const maxLeft = cardBounds.left - wordRect.left + padding;
            const maxRight = cardBounds.right - wordRect.right - padding;
            const maxTop = cardBounds.top - wordRect.top + padding;
            const maxBottom = cardBounds.bottom - wordRect.bottom - padding;

            // Clamp deltaX and deltaY
            const clampedX = Math.max(maxLeft, Math.min(maxRight, deltaX));
            const clampedY = Math.max(maxTop, Math.min(maxBottom, deltaY));

            return { x: clampedX, y: clampedY };
        };

        // Mouse events
        word.addEventListener('mousedown', (e) => {
            e.preventDefault();
            wordData.isDragging = true;
            word.classList.add('dragging');
            startX = e.clientX;
            startY = e.clientY;

            const rect = word.getBoundingClientRect();
            wordData.originalX = rect.left;
            wordData.originalY = rect.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (!wordData.isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // Clamp to card boundaries
            const clamped = clampToCard(deltaX, deltaY);

            wordData.currentX = clamped.x;
            wordData.currentY = clamped.y;

            word.style.transform = `translate(${clamped.x}px, ${clamped.y}px) scale(1.3)`;
        });

        document.addEventListener('mouseup', () => {
            if (!wordData.isDragging) return;

            wordData.isDragging = false;
            word.classList.remove('dragging');

            // Calculate velocity for spring effect
            wordData.velocityX = wordData.currentX * 0.3;
            wordData.velocityY = wordData.currentY * 0.3;

            this.animateSpringBack(wordData);
        });

        // Touch events
        word.addEventListener('touchstart', (e) => {
            e.preventDefault();
            wordData.isDragging = true;
            word.classList.add('dragging');

            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;

            const rect = word.getBoundingClientRect();
            wordData.originalX = rect.left;
            wordData.originalY = rect.top;
        });

        document.addEventListener('touchmove', (e) => {
            if (!wordData.isDragging) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;

            // Clamp to card boundaries
            const clamped = clampToCard(deltaX, deltaY);

            wordData.currentX = clamped.x;
            wordData.currentY = clamped.y;

            word.style.transform = `translate(${clamped.x}px, ${clamped.y}px) scale(1.3)`;
        });

        document.addEventListener('touchend', () => {
            if (!wordData.isDragging) return;

            wordData.isDragging = false;
            word.classList.remove('dragging');

            // Calculate velocity for spring effect
            wordData.velocityX = wordData.currentX * 0.3;
            wordData.velocityY = wordData.currentY * 0.3;

            this.animateSpringBack(wordData);
        });
    }

    animateSpringBack(wordData) {
        const word = wordData.element;
        const startTime = performance.now();
        const duration = 800; // Spring animation duration

        const spring = (t) => {
            // Elastic easing out
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        };

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = spring(progress);

            // Calculate current position with spring
            const currentX = wordData.currentX * (1 - eased);
            const currentY = wordData.currentY * (1 - eased);

            // Update transform
            if (progress < 1) {
                word.style.transform = `translate(${currentX}px, ${currentY}px) scale(${1.3 - (0.3 * eased)})`;
                requestAnimationFrame(animate);
            } else {
                // Reset to original state
                word.style.transform = '';
                wordData.currentX = 0;
                wordData.currentY = 0;
                wordData.velocityX = 0;
                wordData.velocityY = 0;
            }
        };

        requestAnimationFrame(animate);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new InteractiveGoalText('interactive-goal-text');
    });
} else {
    new InteractiveGoalText('interactive-goal-text');
}
