// galaxy.js - 3D Interactive Motto Galaxy
// Three mottos: Grenzenüberschreitung, Perspektivenwechsel, Selbstverwirklichung

class MottoGalaxy {
    constructor() {
        this.container = document.getElementById('motto-galaxy');
        this.currentIndex = 0; // Start with "Grenzenüberschreitung"
        this.mottos = [
            'GRENZENÜBERSCHREITUNG',
            'PERSPEKTIVENWECHSEL', 
            'SELBSTVERWIRKLICHUNG'
        ];
        
        // Touch/drag tracking
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.threshold = 50; // Minimum drag distance
        
        // Animation state
        this.isAnimating = false;
        
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.error('Motto Galaxy: Container #motto-galaxy not found');
            return;
        }
        
        // Check Three.js availability again
        if (typeof THREE === 'undefined') {
            console.error('Three.js not available in MottoGalaxy class');
            return;
        }
        
        try {
            this.setupThreeJS();
            this.createGalaxy();
            this.setupEventListeners();
            this.animate();
            this.showCurrentMotto();
            
            // Hide loading indicator
            const loading = this.container.querySelector('.loading');
            if (loading) loading.style.display = 'none';
            
            console.log('Galaxy initialized successfully');
        } catch (error) {
            console.error('Error during galaxy initialization:', error);
            this.container.innerHTML = '<div style="color: #ff6b6b; text-align: center; padding: 50px;">Failed to initialize 3D galaxy</div>';
        }
    }
    
    setupThreeJS() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera setup - perspective for 3D effect
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.offsetWidth / this.container.offsetHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true
        });
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance optimization
        this.container.appendChild(this.renderer.domElement);
        
        // Resize handler
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createGalaxy() {
        this.galaxyGroup = new THREE.Group();
        
        // Create hemisphere of particles (stars)
        const particleCount = window.innerWidth < 768 ? 400 : 800; // Fewer on mobile
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const colorPalette = [
            new THREE.Color(0x64C8FF), // Light blue
            new THREE.Color(0xFFFFFF), // White
            new THREE.Color(0x87CEEB), // Sky blue
            new THREE.Color(0xFF69B4), // Pink accent
            new THREE.Color(0x228B22), // Forest green
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Hemisphere distribution
            const phi = Math.acos(Math.random()); // 0 to π/2 for hemisphere
            const theta = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 3;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi) - 1; // Offset for hemisphere
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            // Random color from palette
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            sizes[i] = Math.random() * 3 + 1;
        }
        
        // Create geometry and material
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create circular particle texture
        const texture = this.createParticleTexture();
        
        // Particle material with texture for round particles
        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            map: texture, // Use texture for round shape
            depthTest: false // Helps with blending
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.galaxyGroup.add(this.particles);
        
        // Central orb for current motto
        this.createCentralOrbs();
        
        this.scene.add(this.galaxyGroup);
    }
    
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        context.beginPath();
        context.arc(16, 16, 16, 0, Math.PI * 2, false);
        context.fillStyle = '#FFFFFF';
        context.fill();
        return new THREE.CanvasTexture(canvas);
    }
    
    createCentralOrbs() {
        this.centralOrbs = [];
        
        const orbColors = [
            0xFF69B4, // Pink for Grenzenüberschreitung
            0x64C8FF, // Blue for Perspektivenwechsel
            0x32CD32, // Green for Selbstverwirklichung
        ];
        
        orbColors.forEach((color, index) => {
            const geometry = new THREE.SphereGeometry(0.15, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });
            
            const orb = new THREE.Mesh(geometry, material);
            orb.visible = index === 0; // Only first orb visible initially
            
            this.centralOrbs.push(orb);
            this.galaxyGroup.add(orb);
        });
    }
    
    setupEventListeners() {
        const canvas = this.renderer.domElement;
        
        // Mouse events (desktop)
        canvas.addEventListener('mousedown', (e) => this.handleStart(e.clientX));
        canvas.addEventListener('mousemove', (e) => this.handleMove(e.clientX));
        canvas.addEventListener('mouseup', () => this.handleEnd());
        canvas.addEventListener('mouseleave', () => this.handleEnd());
        
        // Touch events (mobile)
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0].clientX);
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0].clientX);
        });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd();
        });
        
        // Hover effects for desktop
        canvas.addEventListener('mousemove', (e) => this.handleHover(e));
    }
    
    handleStart(clientX) {
        if (this.isAnimating) return;
        this.isDragging = true;
        this.startX = clientX;
        this.currentX = clientX;
    }
    
    handleMove(clientX) {
        if (!this.isDragging || this.isAnimating) return;
        
        const deltaX = clientX - this.startX;
        this.currentX = clientX;
        
        // Visual feedback - slight rotation
        this.galaxyGroup.rotation.y = deltaX * 0.01;
    }
    
    handleEnd() {
        if (!this.isDragging || this.isAnimating) return;
        
        const deltaX = this.currentX - this.startX;
        
        if (Math.abs(deltaX) > this.threshold) {
            if (deltaX > 0) {
                // Swipe right - previous motto
                this.previousMotto();
            } else {
                // Swipe left - next motto
                this.nextMotto();
            }
        }
        
        this.isDragging = false;
        
        // Reset rotation
        this.animateRotationReset();
    }
    
    handleHover(event) {
        if (this.isDragging) return;
        
        // Create subtle particle glow effect on hover
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        
        // Add subtle glow to nearby particles (simplified for performance)
        this.particles.material.opacity = 0.8 + Math.sin(Date.now() * 0.002) * 0.2;
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
        
        // Hide current text
        document.querySelectorAll('.motto-text').forEach(el => {
            el.classList.remove('active');
        });
        
        // Animate galaxy rotation and orb transition
        this.animateGalaxyTransition().then(() => {
            this.showCurrentMotto();
            this.isAnimating = false;
        });
    }
    
    animateGalaxyTransition() {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const duration = 1000;
            const startRotation = this.galaxyGroup.rotation.y;
            const targetRotation = startRotation + Math.PI * 0.5;
            
            // Hide all orbs
            this.centralOrbs.forEach(orb => orb.visible = false);
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeInOutCubic(progress);
                
                // Rotate galaxy
                this.galaxyGroup.rotation.y = startRotation + (targetRotation - startRotation) * eased;
                
                // Scale transition for central orb
                if (progress > 0.5) {
                    const orbProgress = (progress - 0.5) * 2;
                    const currentOrb = this.centralOrbs[this.currentIndex];
                    currentOrb.visible = true;
                    currentOrb.scale.setScalar(orbProgress);
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
        const duration = 300;
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
            }, 200);
        }
        
        // Show current orb
        this.centralOrbs.forEach((orb, index) => {
            orb.visible = index === this.currentIndex;
            if (orb.visible) {
                orb.scale.setScalar(1);
            }
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Continuous galaxy rotation
        if (!this.isDragging && !this.isAnimating) {
            this.galaxyGroup.rotation.y += 0.002;
        }
        
        // Animate particles
        const time = Date.now() * 0.001;
        this.particles.rotation.x = Math.sin(time * 0.2) * 0.1;
        this.particles.rotation.z = Math.cos(time * 0.3) * 0.1;
        
        // Pulse central orbs
        this.centralOrbs.forEach((orb, index) => {
            if (orb.visible) {
                const pulse = 1 + Math.sin(time * 2) * 0.1;
                orb.scale.setScalar(pulse);
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
    }
    
    // Easing functions
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
}

// Initialize when DOM is loaded - with error handling
document.addEventListener('DOMContentLoaded', () => {
    // Check if Three.js is loaded
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