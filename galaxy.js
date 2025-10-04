// galaxy.js - Enhanced 3D Interactive Motto Galaxy with Better Mobile UX
// Three mottos: Grenzenüberschreitung, Perspektivenwechsel, Selbstverwirklichung

class MottoGalaxy {
    constructor() {
        this.container = document.getElementById('motto-galaxy');
        this.currentIndex = 0;
        this.mottos = [
            'GRENZENÜBERSCHREITUNG',
            'PERSPEKTIVENWECHSEL', 
            'SELBSTVERWIRKLICHUNG'
        ];
        // Enhanced touch/drag tracking with better gesture detection
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.threshold = 60; // Minimum horizontal drag distance
        this.verticalThreshold = 30; // Vertical movement threshold
        this.gestureDecided = false; // Track if gesture type is determined
        // Animation state
        this.isAnimating = false;
        this.isMobile = window.innerWidth < 768;
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.error('Motto Galaxy: Container #motto-galaxy not found');
            return;
        }
        if (typeof THREE === 'undefined') {
            console.error('Three.js not available in MottoGalaxy class');
            return;
        }
        try {
            this.setupThreeJS();
            this.createEnhancedGalaxy();
            this.setupEventListeners();
            this.animate();
            this.showCurrentMotto();
            const loading = this.container.querySelector('.loading');
            if (loading) loading.style.display = 'none';
            console.log('Enhanced Galaxy initialized successfully');
        } catch (error) {
            console.error('Error during galaxy initialization:', error);
            this.container.innerHTML = '<div style="color: #ff6b6b; text-align: center; padding: 50px;">Failed to initialize 3D galaxy</div>';
        }
    }
    
    setupThreeJS() {
        this.scene = new THREE.Scene();
        // Enhanced camera with better FOV for immersion
        this.camera = new THREE.PerspectiveCamera(
            60, // Reduced FOV for more dramatic perspective
            this.container.offsetWidth / this.container.offsetHeight,
            0.1,
            1000
        );
        this.camera.position.z = 6;
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance' // Mobile optimization
        });
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createEnhancedGalaxy() {
        this.galaxyGroup = new THREE.Group();
        // CHANGE PARTICLES HERE: Increase the numbers for more particles/stars
        // You can fine tune these values for more or less stars!
        this.createParticleLayer(5000, 2, 4, 0.04); // Outer layer (was 600)
        this.createParticleLayer(1000, 1, 2.5, 0.06); // Middle layer (was 400)
        this.createParticleLayer(400, 0.5, 1.5, 0.08); // Inner layer (was 200)
        // Enhanced central orbs with glow
        this.createEnhancedCentralOrbs();
        // Add ambient light effect
        this.createAmbientGlow();
        this.scene.add(this.galaxyGroup);
    }
    
    createParticleLayer(count, minRadius, maxRadius, size) {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        // Enhanced color palette with more vibrant colors
        const colorPalette = [
            new THREE.Color(0x64C8FF), // Cyan
            new THREE.Color(0xFFFFFF), // White
            new THREE.Color(0xFF69B4), // Hot pink
            new THREE.Color(0x9D4EDD), // Purple
            new THREE.Color(0x32CD32), // Lime green
            new THREE.Color(0xFFC300), // Gold
            new THREE.Color(0x00D9FF), // Bright cyan
        ];
        for (let i = 0; i < count; i++) {
            // Spherical distribution with better spread
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            const radius = minRadius + Math.random() * (maxRadius - minRadius);
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            sizes[i] = Math.random() * 4 + 1;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        const material = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            map: this.createParticleTexture(),
            depthTest: false
        });
        const particles = new THREE.Points(geometry, material);
        if (!this.particles) {
            this.particles = particles;
        } else {
            this.galaxyGroup.add(particles);
        }
        this.galaxyGroup.add(particles);
    }
    
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        // Create gradient for softer particles
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }
    
    createEnhancedCentralOrbs() {
        this.centralOrbs = [];
        const orbConfigs = [
            { color: 0xFF69B4, glow: 0xFF1493 }, // Pink
            { color: 0x64C8FF, glow: 0x0099FF }, // Blue
            { color: 0x32CD32, glow: 0x00FF00 }, // Green
        ];
        orbConfigs.forEach((config, index) => {
            // Main orb
            const geometry = new THREE.SphereGeometry(0.4, 32, 32);
            const material = new THREE.MeshBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: 0.9
            });
            const orb = new THREE.Mesh(geometry, material);
            orb.visible = index === 0;
            // Glow ring
            const ringGeometry = new THREE.RingGeometry(0.9, 0.5, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: config.glow,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.visible = index === 0;
            orb.add(ring);
            this.centralOrbs.push({ orb, ring });
            this.galaxyGroup.add(orb);
        });
    }
    
    createAmbientGlow() {
        // Add subtle ambient particles in background
        const ambientCount = this.isMobile ? 50 : 100;
        const positions = new Float32Array(ambientCount * 3);
        for (let i = 0; i < ambientCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = -5 - Math.random() * 5;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            size: 0.1,
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.3,
            sizeAttenuation: true
        });
        const ambient = new THREE.Points(geometry, material);
        this.scene.add(ambient);
    }
    
    setupEventListeners() {
        const canvas = this.renderer.domElement;
        // Mouse events (desktop)
        canvas.addEventListener('mousedown', (e) => this.handleStart(e.clientX, e.clientY));
        canvas.addEventListener('mousemove', (e) => this.handleMove(e.clientX, e.clientY));
        canvas.addEventListener('mouseup', () => this.handleEnd());
        canvas.addEventListener('mouseleave', () => this.handleEnd());
        // Touch events (mobile) - IMPROVED for better scroll handling
        canvas.addEventListener('touchstart', (e) => {
            this.handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true }); // Passive for better scroll performance
        canvas.addEventListener('touchmove', (e) => {
            this.handleMove(e.touches[0].clientX, e.touches[0].clientY);
            // Only prevent default if horizontal swipe is detected
            if (this.gestureDecided && Math.abs(this.currentX - this.startX) > Math.abs(this.currentY - this.startY)) {
                e.preventDefault();
            }
        }, { passive: false }); // Non-passive to allow preventDefault
        canvas.addEventListener('touchend', (e) => {
            this.handleEnd();
        }, { passive: true });
    }
    
    handleStart(clientX, clientY) {
        if (this.isAnimating) return;
        this.isDragging = true;
        this.startX = clientX;
        this.startY = clientY;
        this.currentX = clientX;
        this.currentY = clientY;
        this.gestureDecided = false;
    }
    
    handleMove(clientX, clientY) {
        if (!this.isDragging || this.isAnimating) return;
        const deltaX = clientX - this.startX;
        const deltaY = clientY - this.startY;
        this.currentX = clientX;
        this.currentY = clientY;
        // Determine gesture type (horizontal swipe vs vertical scroll)
        if (!this.gestureDecided && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
            this.gestureDecided = true;
        }
        // Only apply visual feedback for horizontal movement
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            this.galaxyGroup.rotation.y = deltaX * 0.008;
        }
    }
    
    handleEnd() {
        if (!this.isDragging || this.isAnimating) return;
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        // Only trigger motto change if horizontal swipe is dominant
        if (Math.abs(deltaX) > this.threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                this.previousMotto();
            } else {
                this.nextMotto();
            }
        } else {
            // Reset rotation if no motto change
            this.animateRotationReset();
        }
        this.isDragging = false;
        this.gestureDecided = false;
    }
    
    nextMotto() {
        this.currentIndex = (this.currentIndex + 1) % this.mottos.length;
        this.transitionToMotto();
    }
    
    previousMotto() {
        this.currentIndex = (this.currentIndex - 1 + this.mottos.length) % this.mottos.length;
        this.transitionToMotto();
    }
    
    transitionToMotto() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        document.querySelectorAll('.motto-text').forEach(el => {
            el.classList.remove('active');
        });
        this.animateGalaxyTransition().then(() => {
            this.showCurrentMotto();
            this.isAnimating = false;
        });
    }
    
    animateGalaxyTransition() {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const duration = 1200; // Slightly longer for smoother feel
            const startRotation = this.galaxyGroup.rotation.y;
            const targetRotation = startRotation + Math.PI * 0.6;
            this.centralOrbs.forEach(({ orb, ring }) => {
                orb.visible = false;
                ring.visible = false;
            });
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeInOutQuart(progress);
                this.galaxyGroup.rotation.y = startRotation + (targetRotation - startRotation) * eased;
                // Enhanced scale transition
                if (progress > 0.4) {
                    const orbProgress = (progress - 0.4) / 0.6;
                    const currentOrb = this.centralOrbs[this.currentIndex];
                    currentOrb.orb.visible = true;
                    currentOrb.ring.visible = true;
                    currentOrb.orb.scale.setScalar(this.easeOutBack(orbProgress));
                    currentOrb.ring.scale.setScalar(this.easeOutBack(orbProgress));
                }
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }
    
    animateRotationReset() {
        const startTime = Date.now();
        const duration = 400;
        const startRotation = this.galaxyGroup.rotation.y;
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeOutCubic(progress);
            this.galaxyGroup.rotation.y = startRotation * (1 - eased);
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    showCurrentMotto() {
        const mottoElement = document.getElementById(`motto-${this.currentIndex + 1}`);
        if (mottoElement) {
            setTimeout(() => {
                mottoElement.classList.add('active');
            }, 300);
        }
        this.centralOrbs.forEach(({ orb, ring }, index) => {
            const isVisible = index === this.currentIndex;
            orb.visible = isVisible;
            ring.visible = isVisible;
            if (isVisible) {
                orb.scale.setScalar(1);
                ring.scale.setScalar(1);
            }
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        const time = Date.now() * 0.001;
        // Continuous gentle rotation
        if (!this.isDragging && !this.isAnimating) {
            this.galaxyGroup.rotation.y += 0.001;
        }
        // Enhanced particle animation
        this.galaxyGroup.children.forEach((child, index) => {
            if (child instanceof THREE.Points) {
                child.rotation.x = Math.sin(time * 0.3 + index) * 0.1;
                child.rotation.z = Math.cos(time * 0.2 + index) * 0.1;
            }
        });
        // Animated orbs and rings
        this.centralOrbs.forEach(({ orb, ring }, index) => {
            if (orb.visible) {
                const pulse = 1 + Math.sin(time * 2 + index) * 0.08;
                orb.scale.setScalar(pulse);
                ring.rotation.z = time * 0.5;
                ring.material.opacity = 0.3 + Math.sin(time * 3) * 0.2;
            }
        });
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        const width = this.container.offsetWidth;
        const height = this.container.offsetHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.isMobile = window.innerWidth < 768;
    }
    
    // Enhanced easing functions
    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
    }
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded! Make sure the CDN link is in your HTML head.');
        const container = document.getElementById('motto-galaxy');
        if (container) {
            container.innerHTML = '<div style="color: #ff6b6b; text-align: center; padding: 50px; font-family: Arial, sans-serif;">Error: Three.js library not found.<br>Please check your internet connection.</div>';
        }
        return;
    }
    try {
        new MottoGalaxy();
    } catch (error) {
        console.error('Galaxy initialization error:', error);
        const container = document.getElementById('motto-galaxy');
        if (container) {
            container.innerHTML = '<div style="color: #ff6b6b; text-align: center; padding: 50px; font-family: Arial, sans-serif;">Error loading 3D galaxy.<br>Check browser console for details.</div>';
        }
    }
});

// Prevent context menu on long press (mobile)
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#motto-galaxy')) {
        e.preventDefault();
    }
});
