/**
 * ASTEROID GAME - Ultra Polished Edition
 * Immersive space shooter with particle effects and smooth gameplay
 */

(function() {
  'use strict';

  // ============================================
  // GAME CONFIGURATION
  // ============================================
  const CONFIG = {
    // Canvas
    FPS: 60,

    // Player Ship
    SHIP_SIZE: 25,
    SHIP_SPEED: 5,
    SHIP_COLOR: '#e94560',
    SHIP_GLOW: 'rgba(233, 69, 96, 0.5)',
    INVINCIBILITY_TIME: 2000, // 2 seconds after hit

    // Bullets
    BULLET_SPEED: 8,
    BULLET_SIZE: 4,
    BULLET_COLOR: '#e94560',
    FIRE_RATE: 150, // milliseconds between shots

    // Asteroids (Normal)
    ASTEROID_MIN_SIZE: 20,
    ASTEROID_MAX_SIZE: 60,
    ASTEROID_MIN_SPEED: 1,
    ASTEROID_MAX_SPEED: 3,
    ASTEROID_SPAWN_RATE: 1500, // milliseconds
    ASTEROID_COLOR: '#6b7280',
    ASTEROID_EDGE_COLOR: '#e94560',

    // Armored Asteroid (Dark, durable)
    ARMORED_SIZE: 35,
    ARMORED_HEALTH: 5, // Takes 5 hits
    ARMORED_COLOR: '#2d3748',
    ARMORED_CRACK_COLOR: '#e94560',
    ARMORED_LAVA_GLOW: 'rgba(233, 69, 96, 0.8)',
    ARMORED_POINTS: 400,

    // Space Garbage (Indestructible)
    GARBAGE_MIN_SIZE: 30,
    GARBAGE_MAX_SIZE: 50,
    GARBAGE_SPEED: 0.8, // Slower than normal asteroids
    GARBAGE_COLOR: '#4a5568',
    GARBAGE_STRIPE_COLOR: '#fbbf24',

    // Splitting
    SPLIT_ASTEROIDS: 2, // How many pieces large asteroids split into
    SPLIT_SIZE_THRESHOLD: 35, // Asteroids larger than this split

    // Difficulty - Score based tiers
    SCORE_TIER_1: 500,
    SCORE_TIER_2: 1500,
    DIFFICULTY_INCREASE_INTERVAL: 10000, // Every 10 seconds
    SPEED_INCREASE_FACTOR: 0.15,
    SPAWN_RATE_DECREASE: 100,
    MIN_SPAWN_RATE: 400,

    // Particles
    PARTICLE_COUNT: 20,
    PARTICLE_LIFETIME: 30,

    // Score
    SMALL_ASTEROID_POINTS: 100,
    MEDIUM_ASTEROID_POINTS: 50,
    LARGE_ASTEROID_POINTS: 20,

    // Power-ups
    POWERUP_SIZE: 20,
    POWERUP_SPEED: 2,
    POWERUP_SPAWN_INTERVAL: 30000, // 30 seconds average
    POWERUP_SPAWN_VARIANCE: 10000, // ±10 seconds randomness

    // Power-up durations
    SHIELD_DURATION: 30000, // 30 seconds
    ROCKET_DURATION: 20000, // 20 seconds
    SHIELD_EXPLOSION_RADIUS: 150,
    ROCKET_FIRE_RATE: 1000, // Fire rocket every 1 second
    ROCKET_DAMAGE: 2,

    // Power-up quality tiers (score-based)
    TIER1_POWERUP_SCORE: 500,  // Shield/Rocket more common
    TIER2_POWERUP_SCORE: 1500, // Double Shot more common
    TIER3_POWERUP_SCORE: 3000, // Triple Shot appears
  };

  // ============================================
  // GAME STATE
  // ============================================
  let canvas, ctx;
  let gameRunning = false;
  let gamePaused = false;
  let gameActive = false; // True when game is started (not game over)
  let animationId;
  let lastTime = 0;

  // Game objects
  let ship = null;
  let bullets = [];
  let asteroids = [];
  let particles = [];
  let stars = [];
  let powerups = [];
  let rockets = []; // Rocket power-up projectiles

  // Game stats
  let score = 0;
  let lives = 3;
  let highScore = 0;
  let lastShot = 0;
  let lastAsteroidSpawn = 0;
  let lastPowerupSpawn = 0;
  let lastRocketFire = 0;
  let difficultyTimer = 0;
  let currentSpawnRate = CONFIG.ASTEROID_SPAWN_RATE;
  let currentSpeedMultiplier = 1;

  // Power-up state (max 3 active)
  let activePowerups = {
    shield: null,        // { active: true, expiresAt: timestamp }
    doubleShot: 0,       // count (permanent)
    tripleShot: 0,       // count (permanent)
    rocket: null         // { active: true, expiresAt: timestamp }
  };

  // Input
  const keys = {};

  // Touch controls
  let touchActive = false;
  let touchX = 0;
  let touchY = 0;

  // UI Elements
  let startButton, restartButton, pauseButton;
  let startOverlay, gameOverOverlay, gameUI, pauseOverlay;
  let scoreDisplay, highScoreDisplay, finalScoreDisplay;
  let hearts = [];

  // Leaderboard UI Elements
  let highScoreModal, submitScoreButton, playerNameInput, modalFinalScore;
  let iconButtons = [];
  let selectedIcon = '🚀';
  let viewLeaderboardButton, leaderboardModal, closeLeaderboardButton;

  // Power-up UI Elements
  let powerupDisplays = {};

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    canvas = document.getElementById('asteroidCanvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Get UI elements
    startButton = document.getElementById('startButton');
    restartButton = document.getElementById('restartButton');
    pauseButton = document.getElementById('pauseButton');
    startOverlay = document.getElementById('startOverlay');
    gameOverOverlay = document.getElementById('gameOverOverlay');
    pauseOverlay = document.getElementById('pauseOverlay');
    gameUI = document.getElementById('gameUI');
    scoreDisplay = document.getElementById('currentScore');
    highScoreDisplay = document.getElementById('highScore');
    finalScoreDisplay = document.getElementById('finalScore');

    hearts = [
      document.getElementById('heart1'),
      document.getElementById('heart2'),
      document.getElementById('heart3')
    ];

    // Get leaderboard UI elements
    highScoreModal = document.getElementById('highScoreModal');
    submitScoreButton = document.getElementById('submitScoreButton');
    playerNameInput = document.getElementById('playerName');
    modalFinalScore = document.getElementById('modalFinalScore');
    viewLeaderboardButton = document.getElementById('viewLeaderboardButton');
    leaderboardModal = document.getElementById('leaderboardModal');
    closeLeaderboardButton = document.getElementById('closeLeaderboardButton');

    // Get icon buttons
    iconButtons = document.querySelectorAll('.icon-btn');

    // Get power-up UI elements
    powerupDisplays = {
      shield: document.getElementById('powerupShield'),
      doubleShot: document.getElementById('powerupDoubleShot'),
      tripleShot: document.getElementById('powerupTripleShot'),
      rocket: document.getElementById('powerupRocket')
    };

    // Load high score
    highScore = parseInt(localStorage.getItem('asteroidHighScore') || '0');
    document.getElementById('displayHighScore').textContent = highScore;
    highScoreDisplay.textContent = highScore;

    // Event listeners
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    pauseButton.addEventListener('click', togglePause);
    document.getElementById('resumeButton').addEventListener('click', togglePause);

    // Leaderboard event listeners
    setupLeaderboardListeners();

    // Keyboard controls - with scroll prevention
    window.addEventListener('keydown', (e) => {
      // Only process game keys if game is active
      if (gameActive) {
        const gameKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];
        if (gameKeys.includes(e.key.toLowerCase())) {
          e.preventDefault(); // Prevent scrolling
          keys[e.key.toLowerCase()] = true;
          keys[e.key] = true;
        }
      }

      // ESC to pause
      if (e.key === 'Escape' && gameActive && !gamePaused) {
        togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (gameActive) {
        keys[e.key.toLowerCase()] = false;
        keys[e.key] = false;
      }
    });

    // Touch controls for mobile
    canvas.addEventListener('touchstart', (e) => {
      if (!gameActive || gamePaused) return;
      e.preventDefault();
      touchActive = true;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      touchX = touch.clientX - rect.left;
      touchY = touch.clientY - rect.top;
    });

    canvas.addEventListener('touchmove', (e) => {
      if (!gameActive || gamePaused || !touchActive) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      touchX = touch.clientX - rect.left;
      touchY = touch.clientY - rect.top;
    });

    canvas.addEventListener('touchend', (e) => {
      if (!gameActive) return;
      e.preventDefault();
      touchActive = false;
    });

    canvas.addEventListener('touchcancel', (e) => {
      if (!gameActive) return;
      e.preventDefault();
      touchActive = false;
    });

    // Create starfield
    createStarfield();

    // Draw initial state
    drawStars();
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  function createStarfield() {
    stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.5 + 0.3
      });
    }
  }

  // ============================================
  // GAME LOOP
  // ============================================
  function startGame() {
    // Hide start overlay, show game UI
    startOverlay.classList.add('hidden');
    gameUI.classList.remove('hidden');

    // Reset game state
    gameRunning = true;
    gameActive = true; // Enable game controls
    gamePaused = false;
    score = 0;
    lives = 3;
    bullets = [];
    asteroids = [];
    particles = [];
    currentSpawnRate = CONFIG.ASTEROID_SPAWN_RATE;
    currentSpeedMultiplier = 1;
    difficultyTimer = 0;
    lastAsteroidSpawn = 0;

    // Reset power-ups
    powerups = [];
    rockets = [];
    activePowerups = {
      shield: null,
      doubleShot: 0,
      tripleShot: 0,
      rocket: null
    };
    lastPowerupSpawn = performance.now();
    lastRocketFire = performance.now();

    // Update UI
    updateScore();
    updateLives();

    // Create ship
    ship = {
      x: canvas.width / 2,
      y: canvas.height - 80,
      vx: 0,
      vy: 0,
      angle: 0,
      invincible: false,
      invincibleTimer: 0
    };

    // Start game loop
    lastTime = performance.now();
    gameLoop(lastTime);
  }

  function restartGame() {
    gameOverOverlay.classList.add('hidden');
    startGame();
  }

  function togglePause() {
    if (!gameActive || lives <= 0) return;

    gamePaused = !gamePaused;

    if (gamePaused) {
      // Show pause overlay
      pauseOverlay.classList.remove('hidden');
      gameRunning = false;
      cancelAnimationFrame(animationId);
    } else {
      // Resume game
      pauseOverlay.classList.add('hidden');
      gameRunning = true;
      lastTime = performance.now();
      gameLoop(lastTime);
    }
  }

  function gameLoop(currentTime) {
    if (!gameRunning) return;

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Update
    update(deltaTime);

    // Draw
    draw();

    // Continue loop
    animationId = requestAnimationFrame(gameLoop);
  }

  function update(deltaTime) {
    // Update difficulty
    difficultyTimer += deltaTime;
    if (difficultyTimer >= CONFIG.DIFFICULTY_INCREASE_INTERVAL) {
      difficultyTimer = 0;
      increaseDifficulty();
    }

    // Update ship
    if (ship) {
      updateShip(deltaTime);
    }

    // Auto-shoot
    const now = performance.now();
    if (gameRunning && now - lastShot > CONFIG.FIRE_RATE) {
      shootBullet();
      lastShot = now;
    }

    // Spawn asteroids
    if (now - lastAsteroidSpawn > currentSpawnRate) {
      spawnAsteroid();
      lastAsteroidSpawn = now;
    }

    // Spawn power-ups
    const timeSinceLastPowerup = now - lastPowerupSpawn;
    const spawnInterval = CONFIG.POWERUP_SPAWN_INTERVAL +
      (Math.random() * CONFIG.POWERUP_SPAWN_VARIANCE * 2 - CONFIG.POWERUP_SPAWN_VARIANCE);

    if (timeSinceLastPowerup > spawnInterval && window.PowerupSystem) {
      powerups.push(window.PowerupSystem.createPowerup(canvas.width, score));
      lastPowerupSpawn = now;
    }

    // Update power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
      if (window.PowerupSystem) {
        window.PowerupSystem.updatePowerup(powerups[i]);
        if (window.PowerupSystem.isPowerupOffScreen(powerups[i], canvas.height)) {
          powerups.splice(i, 1);
        }
      }
    }

    // Auto-fire rockets
    if (ship && activePowerups.rocket && activePowerups.rocket.active && window.PowerupSystem) {
      if (now - lastRocketFire >= CONFIG.ROCKET_FIRE_RATE) {
        const rocket = window.PowerupSystem.createRocket(ship, CONFIG.BULLET_SPEED, CONFIG.BULLET_SIZE);
        rockets.push(rocket);
        lastRocketFire = now;
      }
    }

    // Update rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      rockets[i].y += rockets[i].vy;
      if (window.PowerupSystem) {
        window.PowerupSystem.updateRocketTrail(rockets[i]);
      }
      if (rockets[i].y < -10) {
        rockets.splice(i, 1);
      }
    }

    // Update power-up expirations
    if (window.PowerupSystem) {
      window.PowerupSystem.updatePowerupExpirations(activePowerups, now);
      updatePowerupUI();
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      // Remove if off screen
      if (bullet.y < 0 || bullet.x < 0 || bullet.x > canvas.width) {
        bullets.splice(i, 1);
      }
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const asteroid = asteroids[i];
      asteroid.x += asteroid.vx;
      asteroid.y += asteroid.vy;

      // Handle rotation based on type
      if (asteroid.type === 'garbage' && asteroid.tumbleSpeed > 0) {
        // Garbage tumbles faster when hit
        asteroid.rotation += asteroid.rotationSpeed + asteroid.tumbleSpeed;
        asteroid.tumbleSpeed *= 0.98; // Gradually slow down tumbling
      } else {
        asteroid.rotation += asteroid.rotationSpeed;
      }

      // Handle hit flash for armored asteroids
      if (asteroid.type === 'armored' && asteroid.hitFlash > 0) {
        asteroid.hitFlash--;
      }

      // Remove if off screen (bottom)
      if (asteroid.y - asteroid.size > canvas.height) {
        asteroids.splice(i, 1);
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.opacity = p.life / CONFIG.PARTICLE_LIFETIME;

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update stars (parallax effect)
    for (let star of stars) {
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    }

    // Check collisions
    checkCollisions();
  }

  function updateShip(deltaTime) {
    // Handle invincibility
    if (ship.invincible) {
      ship.invincibleTimer -= deltaTime;
      if (ship.invincibleTimer <= 0) {
        ship.invincible = false;
      }
    }

    // Movement
    let moveX = 0;
    let moveY = 0;

    // Touch controls (mobile)
    if (touchActive) {
      const dx = touchX - ship.x;
      const dy = touchY - ship.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) {
        moveX = dx / distance;
        moveY = dy / distance;
      }
    } else {
      // Keyboard controls
      if (keys['arrowleft'] || keys['a']) moveX -= 1;
      if (keys['arrowright'] || keys['d']) moveX += 1;
      if (keys['arrowup'] || keys['w']) moveY -= 1;
      if (keys['arrowdown'] || keys['s']) moveY += 1;

      // Normalize diagonal movement
      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.707;
        moveY *= 0.707;
      }
    }

    ship.x += moveX * CONFIG.SHIP_SPEED;
    ship.y += moveY * CONFIG.SHIP_SPEED;

    // Keep ship in bounds
    ship.x = Math.max(CONFIG.SHIP_SIZE, Math.min(canvas.width - CONFIG.SHIP_SIZE, ship.x));
    ship.y = Math.max(CONFIG.SHIP_SIZE, Math.min(canvas.height - CONFIG.SHIP_SIZE, ship.y));

    // Engine particles
    if ((moveX !== 0 || moveY !== 0) && Math.random() < 0.5) {
      createEngineParticle(ship.x, ship.y + CONFIG.SHIP_SIZE / 2);
    }
  }

  function shootBullet() {
    if (!ship) return;

    // Use power-up system to create shot pattern
    if (window.PowerupSystem) {
      const newBullets = window.PowerupSystem.createShotPattern(
        ship,
        activePowerups,
        CONFIG.BULLET_SPEED,
        CONFIG.BULLET_SIZE,
        CONFIG.BULLET_COLOR
      );
      bullets.push(...newBullets);
    } else {
      // Fallback if PowerupSystem not loaded
      bullets.push({
        x: ship.x,
        y: ship.y - 15,
        vx: 0,
        vy: -CONFIG.BULLET_SPEED,
        size: CONFIG.BULLET_SIZE,
        color: CONFIG.BULLET_COLOR
      });
    }
  }

  function spawnAsteroid() {
    // Determine object type based on score (difficulty tiers)
    const type = getSpawnType();

    let size, speed;

    if (type === 'armored') {
      // Armored asteroid
      size = CONFIG.ARMORED_SIZE;
      speed = (Math.random() * (CONFIG.ASTEROID_MAX_SPEED - CONFIG.ASTEROID_MIN_SPEED) + CONFIG.ASTEROID_MIN_SPEED) * currentSpeedMultiplier;

      const position = getSpawnPosition(size, speed);

      asteroids.push({
        x: position.x,
        y: position.y,
        vx: position.vx,
        vy: position.vy,
        size,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
        points: generateAsteroidShape(size),
        type: 'armored',
        health: CONFIG.ARMORED_HEALTH,
        maxHealth: CONFIG.ARMORED_HEALTH,
        hitFlash: 0
      });
    } else if (type === 'garbage') {
      // Space garbage
      size = Math.random() * (CONFIG.GARBAGE_MAX_SIZE - CONFIG.GARBAGE_MIN_SIZE) + CONFIG.GARBAGE_MIN_SIZE;
      speed = CONFIG.GARBAGE_SPEED * currentSpeedMultiplier;

      const position = getSpawnPosition(size, speed);

      asteroids.push({
        x: position.x,
        y: position.y,
        vx: position.vx,
        vy: position.vy,
        size,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        tumbleSpeed: 0, // Will increase when hit
        type: 'garbage',
        garbageParts: generateGarbageParts(size)
      });
    } else {
      // Normal asteroid
      size = Math.random() * (CONFIG.ASTEROID_MAX_SIZE - CONFIG.ASTEROID_MIN_SIZE) + CONFIG.ASTEROID_MIN_SIZE;
      speed = (Math.random() * (CONFIG.ASTEROID_MAX_SPEED - CONFIG.ASTEROID_MIN_SPEED) + CONFIG.ASTEROID_MIN_SPEED) * currentSpeedMultiplier;

      const position = getSpawnPosition(size, speed);

      asteroids.push({
        x: position.x,
        y: position.y,
        vx: position.vx,
        vy: position.vy,
        size,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        points: generateAsteroidShape(size),
        type: 'normal'
      });
    }
  }

  function getSpawnType() {
    // Score-based spawn probability
    const rand = Math.random() * 100;

    if (score < CONFIG.SCORE_TIER_1) {
      // Tier 1 (0-500): Mostly normal
      if (rand < 80) return 'normal';
      if (rand < 95) return 'armored';
      return 'garbage';
    } else if (score < CONFIG.SCORE_TIER_2) {
      // Tier 2 (500-1500): More variety
      if (rand < 60) return 'normal';
      if (rand < 90) return 'armored';
      return 'garbage';
    } else {
      // Tier 3 (1500+): Heavy mix
      if (rand < 40) return 'normal';
      if (rand < 80) return 'armored';
      return 'garbage';
    }
  }

  function getSpawnPosition(size, speed) {
    const spawnSide = Math.floor(Math.random() * 3); // 0=top, 1=left, 2=right
    let x, y, vx, vy;

    if (spawnSide === 0) {
      // Top
      x = Math.random() * canvas.width;
      y = -size;
      vx = (Math.random() - 0.5) * speed;
      vy = speed;
    } else if (spawnSide === 1) {
      // Left
      x = -size;
      y = Math.random() * canvas.height * 0.5;
      vx = speed;
      vy = speed * 0.5;
    } else {
      // Right
      x = canvas.width + size;
      y = Math.random() * canvas.height * 0.5;
      vx = -speed;
      vy = speed * 0.5;
    }

    return { x, y, vx, vy };
  }

  function generateGarbageParts(size) {
    // Generate satellite debris parts
    const parts = [];
    const numParts = 3 + Math.floor(Math.random() * 3); // 3-5 parts

    for (let i = 0; i < numParts; i++) {
      const partType = Math.random();
      if (partType < 0.4) {
        // Solar panel
        parts.push({
          type: 'panel',
          x: (Math.random() - 0.5) * size * 0.6,
          y: (Math.random() - 0.5) * size * 0.6,
          width: size * 0.4,
          height: size * 0.15
        });
      } else if (partType < 0.7) {
        // Metal scrap
        parts.push({
          type: 'scrap',
          x: (Math.random() - 0.5) * size * 0.5,
          y: (Math.random() - 0.5) * size * 0.5,
          size: size * 0.2
        });
      } else {
        // Antenna
        parts.push({
          type: 'antenna',
          x: (Math.random() - 0.5) * size * 0.4,
          y: (Math.random() - 0.5) * size * 0.4,
          length: size * 0.3
        });
      }
    }

    return parts;
  }

  function generateAsteroidShape(size) {
    const points = [];
    const numPoints = 8;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = size * (0.8 + Math.random() * 0.4);
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }
    return points;
  }

  function increaseDifficulty() {
    currentSpeedMultiplier += CONFIG.SPEED_INCREASE_FACTOR;
    currentSpawnRate = Math.max(CONFIG.MIN_SPAWN_RATE, currentSpawnRate - CONFIG.SPAWN_RATE_DECREASE);
  }

  function checkCollisions() {
    // Bullets vs Asteroids
    for (let i = bullets.length - 1; i >= 0; i--) {
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const bullet = bullets[i];
        const asteroid = asteroids[j];

        if (circleCollision(bullet.x, bullet.y, CONFIG.BULLET_SIZE, asteroid.x, asteroid.y, asteroid.size)) {

          // Handle different asteroid types
          if (asteroid.type === 'garbage') {
            // Space garbage - bullets pass through but make it tumble
            asteroid.tumbleSpeed += 0.05;
            bullets.splice(i, 1);
            break;
          } else if (asteroid.type === 'armored') {
            // Armored asteroid - takes multiple hits
            asteroid.health--;
            asteroid.hitFlash = 10; // Flash effect
            bullets.splice(i, 1);

            // Create small impact particles
            createImpactParticles(asteroid.x, asteroid.y);

            if (asteroid.health <= 0) {
              // Destroyed!
              createExplosion(asteroid.x, asteroid.y, asteroid.size * 1.5);
              addScore(CONFIG.ARMORED_POINTS);
              asteroids.splice(j, 1);
            }
            break;
          } else {
            // Normal asteroid
            createExplosion(asteroid.x, asteroid.y, asteroid.size);

            // Add score based on size
            if (asteroid.size > 50) {
              addScore(CONFIG.LARGE_ASTEROID_POINTS);
            } else if (asteroid.size > 35) {
              addScore(CONFIG.MEDIUM_ASTEROID_POINTS);
            } else {
              addScore(CONFIG.SMALL_ASTEROID_POINTS);
            }

            // Split asteroid if large enough
            if (asteroid.size > CONFIG.SPLIT_SIZE_THRESHOLD) {
              splitAsteroid(asteroid);
            }

            // Remove bullet and asteroid
            bullets.splice(i, 1);
            asteroids.splice(j, 1);
            break;
          }
        }
      }
    }

    // Ship vs Power-ups
    if (ship && window.PowerupSystem) {
      for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        const dx = ship.x - powerup.x;
        const dy = ship.y - powerup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CONFIG.SHIP_SIZE + powerup.size) {
          if (window.PowerupSystem.activatePowerup(activePowerups, powerup, performance.now())) {
            powerups.splice(i, 1);
            updatePowerupUI();
          }
        }
      }
    }

    // Rockets vs Asteroids
    if (window.PowerupSystem) {
      for (let i = rockets.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
          const rocket = rockets[i];
          const asteroid = asteroids[j];

          if (circleCollision(rocket.x, rocket.y, rocket.size, asteroid.x, asteroid.y, asteroid.size)) {
            if (asteroid.type === 'armored') {
              asteroid.health -= CONFIG.ROCKET_DAMAGE;
              asteroid.hitFlash = 10;
              createImpactParticles(asteroid.x, asteroid.y);

              if (asteroid.health <= 0) {
                createExplosion(asteroid.x, asteroid.y, asteroid.size * 1.5);
                addScore(CONFIG.ARMORED_POINTS);
                asteroids.splice(j, 1);
              }
            } else if (asteroid.type !== 'garbage') {
              createExplosion(asteroid.x, asteroid.y, asteroid.size);

              if (asteroid.size > 50) addScore(CONFIG.LARGE_ASTEROID_POINTS);
              else if (asteroid.size > 35) addScore(CONFIG.MEDIUM_ASTEROID_POINTS);
              else addScore(CONFIG.SMALL_ASTEROID_POINTS);

              if (asteroid.size > CONFIG.SPLIT_SIZE_THRESHOLD) {
                splitAsteroid(asteroid);
              }

              asteroids.splice(j, 1);
            }

            rockets.splice(i, 1);
            break;
          }
        }
      }
    }

    // Ship vs Asteroids (all types damage ship)
    if (ship && !ship.invincible) {
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];

        if (circleCollision(ship.x, ship.y, CONFIG.SHIP_SIZE * 0.6, asteroid.x, asteroid.y, asteroid.size)) {
          // Hit!
          hitShip();
          createExplosion(asteroid.x, asteroid.y, asteroid.size);

          // Only destroy normal asteroids on ship collision
          if (asteroid.type !== 'garbage') {
            asteroids.splice(i, 1);
          }
          break;
        }
      }
    }
  }

  function circleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
  }

  function splitAsteroid(asteroid) {
    const newSize = asteroid.size / 2;
    const splitSpeed = Math.sqrt(asteroid.vx * asteroid.vx + asteroid.vy * asteroid.vy) * 1.2;

    for (let i = 0; i < CONFIG.SPLIT_ASTEROIDS; i++) {
      const angle = Math.random() * Math.PI * 2;
      asteroids.push({
        x: asteroid.x,
        y: asteroid.y,
        vx: Math.cos(angle) * splitSpeed,
        vy: Math.sin(angle) * splitSpeed,
        size: newSize,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        points: generateAsteroidShape(newSize),
        type: 'normal' // Split asteroids are always normal
      });
    }
  }

  function hitShip() {
    // Check if shield is active
    if (activePowerups.shield && activePowerups.shield.active && window.PowerupSystem) {
      // Shield absorbs hit and explodes
      window.PowerupSystem.explodeShield(
        ship,
        asteroids,
        CONFIG.SHIELD_EXPLOSION_RADIUS,
        createExplosion,
        addScore,
        CONFIG
      );

      // Deactivate shield
      activePowerups.shield = null;
      updatePowerupUI();

      // Brief invincibility
      ship.invincible = true;
      ship.invincibleTimer = CONFIG.INVINCIBILITY_TIME / 2;
      return;
    }

    // Normal hit
    lives--;
    updateLives();

    // Shake heart
    if (lives >= 0 && hearts[lives]) {
      hearts[lives].classList.add('hit');
      setTimeout(() => hearts[lives].classList.remove('hit'), 500);
    }

    if (lives <= 0) {
      gameOver();
    } else {
      // Grant invincibility
      ship.invincible = true;
      ship.invincibleTimer = CONFIG.INVINCIBILITY_TIME;
    }
  }

  function createExplosion(x, y, size) {
    const count = Math.floor(size / 2);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? '#e94560' : '#ffffff',
        life: CONFIG.PARTICLE_LIFETIME,
        opacity: 1
      });
    }
  }

  function createImpactParticles(x, y) {
    // Small impact particles for armored asteroid hits
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1,
        color: '#e94560',
        life: CONFIG.PARTICLE_LIFETIME / 3,
        opacity: 1
      });
    }
  }

  function createEngineParticle(x, y) {
    particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + Math.random() * 5,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 2 + 1,
      size: Math.random() * 2 + 1,
      color: '#e94560',
      life: CONFIG.PARTICLE_LIFETIME / 2,
      opacity: 1
    });
  }

  function addScore(points) {
    score += points;
    updateScore();

    // Pulse animation
    scoreDisplay.classList.add('pulse');
    setTimeout(() => scoreDisplay.classList.remove('pulse'), 300);

    // Check high score
    if (score > highScore) {
      highScore = score;
      highScoreDisplay.textContent = highScore;
      localStorage.setItem('asteroidHighScore', highScore);
    }
  }

  function updateScore() {
    scoreDisplay.textContent = score;
  }

  function updateLives() {
    for (let i = 0; i < 3; i++) {
      if (i < lives) {
        hearts[i].classList.add('filled');
        hearts[i].classList.remove('empty');
      } else {
        hearts[i].classList.remove('filled');
        hearts[i].classList.add('empty');
      }
    }
  }

  function updatePowerupUI() {
    if (!window.PowerupSystem || !powerupDisplays.shield) return;

    const now = performance.now();

    // Shield
    if (activePowerups.shield && activePowerups.shield.active) {
      powerupDisplays.shield.classList.remove('hidden');
      const timeLeft = Math.ceil((activePowerups.shield.expiresAt - now) / 1000);
      powerupDisplays.shield.querySelector('.powerup-timer').textContent = `${timeLeft}s`;
    } else {
      powerupDisplays.shield.classList.add('hidden');
    }

    // Double Shot
    if (activePowerups.doubleShot > 0) {
      powerupDisplays.doubleShot.classList.remove('hidden');
      powerupDisplays.doubleShot.querySelector('.powerup-count').textContent = `x${activePowerups.doubleShot}`;
    } else {
      powerupDisplays.doubleShot.classList.add('hidden');
    }

    // Triple Shot
    if (activePowerups.tripleShot > 0) {
      powerupDisplays.tripleShot.classList.remove('hidden');
      powerupDisplays.tripleShot.querySelector('.powerup-count').textContent = `x${activePowerups.tripleShot}`;
    } else {
      powerupDisplays.tripleShot.classList.add('hidden');
    }

    // Rocket
    if (activePowerups.rocket && activePowerups.rocket.active) {
      powerupDisplays.rocket.classList.remove('hidden');
      const timeLeft = Math.ceil((activePowerups.rocket.expiresAt - now) / 1000);
      powerupDisplays.rocket.querySelector('.powerup-timer').textContent = `${timeLeft}s`;
    } else {
      powerupDisplays.rocket.classList.add('hidden');
    }
  }

  async function gameOver() {
    gameRunning = false;
    gameActive = false; // Disable game controls
    cancelAnimationFrame(animationId);

    // Clear all keys
    for (let key in keys) {
      keys[key] = false;
    }

    // Check if this is a new personal high score
    const isNewHighScore = score > highScore;

    // Check if score qualifies for global leaderboard (with timeout and error handling)
    let qualifiesForLeaderboard = false;

    if (window.LeaderboardAPI) {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), 2000));
        const checkPromise = window.LeaderboardAPI.isTopScore(score);

        qualifiesForLeaderboard = await Promise.race([checkPromise, timeoutPromise]);
      } catch (error) {
        console.error('Error checking leaderboard qualification:', error);
        qualifiesForLeaderboard = false;
      }
    }

    // Only show high score modal if it's a NEW high score AND qualifies for leaderboard
    if (qualifiesForLeaderboard && isNewHighScore) {
      // Show high score submission modal with confetti
      showHighScoreSubmission();
    } else {
      // Show normal game over screen (pass if it's a new personal record)
      showGameOverScreen(isNewHighScore);
    }
  }

  function showHighScoreSubmission() {
    // Launch confetti celebration
    if (window.LeaderboardAPI) {
      window.LeaderboardAPI.launchConfetti(3000);
    }

    // Hide game UI, show high score modal
    gameUI.classList.add('hidden');
    highScoreModal.classList.remove('hidden');
    modalFinalScore.textContent = score;

    // Clear previous input
    playerNameInput.value = '';
    document.getElementById('charCount').textContent = '0';

    // Focus on name input
    setTimeout(() => playerNameInput.focus(), 100);
  }

  function showGameOverScreen(isNewPersonalRecord = false) {
    // Hide game UI, show game over
    gameUI.classList.add('hidden');
    gameOverOverlay.classList.remove('hidden');

    // Update final score
    finalScoreDisplay.textContent = score;
    document.getElementById('displayHighScore').textContent = highScore;

    // Show congratulations message if new personal record (but not top 3)
    const gameOverTitle = document.querySelector('#gameOverOverlay .game-over-title');
    if (isNewPersonalRecord) {
      gameOverTitle.textContent = '🎉 NEUER PERSÖNLICHER REKORD! 🎉';
      gameOverTitle.style.color = '#ffd700';
    } else {
      gameOverTitle.textContent = 'MISSION GESCHEITERT';
      gameOverTitle.style.color = '#e94560';
    }

    // Load and display global leaderboard
    if (window.LeaderboardAPI) {
      window.LeaderboardAPI.displayLeaderboard('leaderboardList');
    }
  }

  // ============================================
  // DRAWING
  // ============================================
  function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    drawStars();

    // Draw particles
    drawParticles();

    // Draw asteroids
    drawAsteroids();

    // Draw bullets
    drawBullets();

    // Draw power-ups
    if (window.PowerupSystem) {
      for (let powerup of powerups) {
        window.PowerupSystem.drawPowerup(ctx, powerup);
      }

      // Draw rockets
      for (let rocket of rockets) {
        window.PowerupSystem.drawRocket(ctx, rocket);
      }
    }

    // Draw ship
    if (ship) {
      drawShip();
    }
  }

  function drawStars() {
    for (let star of stars) {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);

    // Draw shield if active
    if (activePowerups.shield && activePowerups.shield.active) {
      const shieldRadius = CONFIG.SHIP_SIZE * 1.5;
      const time = performance.now() / 1000;

      // Pulsing shield effect
      const pulse = Math.sin(time * 3) * 0.1 + 0.9;

      // Outer glow
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#3b82f6';

      // Shield circle
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.6 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Inner shield circle
      ctx.strokeStyle = `rgba(147, 197, 253, ${0.4 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius * 0.85 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Shield fill
      ctx.fillStyle = `rgba(59, 130, 246, ${0.15 * pulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    }

    // Invincibility flicker
    if (ship.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    const size = CONFIG.SHIP_SIZE;

    // Glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = CONFIG.SHIP_GLOW;

    // Main ship body (sleek fuselage)
    ctx.fillStyle = '#d0d0d0'; // Light gray
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.6); // Nose
    ctx.lineTo(-size * 0.3, size * 0.4); // Left back
    ctx.lineTo(0, size * 0.2); // Center back
    ctx.lineTo(size * 0.3, size * 0.4); // Right back
    ctx.closePath();
    ctx.fill();

    // Cockpit window
    ctx.fillStyle = '#4dd4ff'; // Bright cyan
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.3, size * 0.15, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left wing
    ctx.fillStyle = CONFIG.SHIP_COLOR; // Pink
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, 0);
    ctx.lineTo(-size * 0.6, size * 0.3);
    ctx.lineTo(-size * 0.4, size * 0.35);
    ctx.lineTo(-size * 0.25, size * 0.1);
    ctx.closePath();
    ctx.fill();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(size * 0.2, 0);
    ctx.lineTo(size * 0.6, size * 0.3);
    ctx.lineTo(size * 0.4, size * 0.35);
    ctx.lineTo(size * 0.25, size * 0.1);
    ctx.closePath();
    ctx.fill();

    // Engine glow (left)
    ctx.fillStyle = '#ff6b9d'; // Bright pink
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff6b9d';
    ctx.beginPath();
    ctx.arc(-size * 0.2, size * 0.35, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Engine glow (right)
    ctx.beginPath();
    ctx.arc(size * 0.2, size * 0.35, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Engine trails
    ctx.fillStyle = 'rgba(255, 107, 157, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillRect(-size * 0.25, size * 0.4, size * 0.1, size * 0.3);
    ctx.fillRect(size * 0.15, size * 0.4, size * 0.1, size * 0.3);

    // Detail lines on body
    ctx.strokeStyle = '#a0a0a0';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(0, size * 0.2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawBullets() {
    for (let bullet of bullets) {
      // Trail effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = CONFIG.BULLET_COLOR;

      ctx.fillStyle = CONFIG.BULLET_COLOR;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, CONFIG.BULLET_SIZE, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }

  function drawAsteroids() {
    for (let asteroid of asteroids) {
      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.rotate(asteroid.rotation);

      if (asteroid.type === 'armored') {
        // Draw armored asteroid with cracks
        drawArmoredAsteroid(asteroid);
      } else if (asteroid.type === 'garbage') {
        // Draw space garbage
        drawSpaceGarbage(asteroid);
      } else {
        // Draw normal asteroid with improved graphics
        drawNormalAsteroid(asteroid);
      }

      ctx.restore();
    }
  }

  function drawNormalAsteroid(asteroid) {
    const size = asteroid.size;

    // Simple two-tone fill for depth (no expensive gradients)
    ctx.fillStyle = CONFIG.ASTEROID_COLOR;
    ctx.strokeStyle = '#505968'; // Slightly lighter edge
    ctx.lineWidth = 2;

    // Draw irregular asteroid shape
    ctx.beginPath();
    ctx.moveTo(asteroid.points[0].x, asteroid.points[0].y);
    for (let i = 1; i < asteroid.points.length; i++) {
      ctx.lineTo(asteroid.points[i].x, asteroid.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Add just 2-3 simple craters (no animation, static)
    ctx.fillStyle = '#2d3748';
    const numCraters = size > 40 ? 3 : 2;

    for (let i = 0; i < numCraters; i++) {
      const angle = (Math.PI * 2 * i) / numCraters;
      const dist = size * 0.4;
      const craterX = Math.cos(angle) * dist;
      const craterY = Math.sin(angle) * dist;
      const craterSize = size * 0.12;

      ctx.beginPath();
      ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawArmoredAsteroid(asteroid) {
    const size = asteroid.size;
    const healthPercent = asteroid.health / asteroid.maxHealth;

    // Base color - dark gray
    ctx.fillStyle = CONFIG.ARMORED_COLOR;
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 3;

    // Draw angular, armor-plated shape
    ctx.beginPath();
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (Math.PI * 2 * i) / segments;
      const variation = Math.random() * 0.1 + 0.9; // Slight randomness
      const x = Math.cos(angle) * size * variation;
      const y = Math.sin(angle) * size * variation;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Add hit flash effect
    if (asteroid.hitFlash > 0) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = CONFIG.ARMORED_CRACK_COLOR;
      ctx.strokeStyle = CONFIG.ARMORED_CRACK_COLOR;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw cracks based on damage taken
    if (healthPercent < 1) {
      const crackIntensity = 1 - healthPercent; // 0 = no damage, 1 = almost destroyed
      const numCracks = Math.floor(crackIntensity * 5) + 2; // 2-7 cracks

      ctx.strokeStyle = CONFIG.ARMORED_CRACK_COLOR;
      ctx.lineWidth = 2;

      // Glowing lava effect on cracks
      ctx.shadowBlur = 10 + crackIntensity * 15;
      ctx.shadowColor = CONFIG.ARMORED_CRACK_COLOR;

      for (let i = 0; i < numCracks; i++) {
        const angle = (Math.PI * 2 * i) / numCracks + asteroid.rotation * 0.5;
        const startDist = size * (0.3 + Math.random() * 0.2);
        const endDist = size * (0.8 + Math.random() * 0.2);

        ctx.beginPath();
        ctx.moveTo(
          Math.cos(angle) * startDist,
          Math.sin(angle) * startDist
        );

        // Jagged crack path
        const segments = 3 + Math.floor(crackIntensity * 3);
        for (let j = 1; j <= segments; j++) {
          const t = j / segments;
          const dist = startDist + (endDist - startDist) * t;
          const offsetAngle = angle + (Math.random() - 0.5) * 0.3;
          ctx.lineTo(
            Math.cos(offsetAngle) * dist,
            Math.sin(offsetAngle) * dist
          );
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    }

    // Draw armor panels
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 * i) / 3;
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * size * 0.5,
        Math.sin(angle) * size * 0.5,
        size * 0.15,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }

  function drawSpaceGarbage(asteroid) {
    const size = asteroid.size;
    const parts = asteroid.garbageParts;

    // Draw realistic metal scraps and debris
    for (let part of parts) {
      ctx.save();
      ctx.translate(part.offsetX, part.offsetY);
      ctx.rotate(part.rotation);

      if (part.type === 'panel') {
        // Damaged solar panel
        ctx.fillStyle = '#3a4a5a';
        ctx.strokeStyle = '#fbbf24'; // Yellow warning
        ctx.lineWidth = 2;

        // Main panel body
        ctx.fillRect(-part.size * 1.2, -part.size * 0.4, part.size * 2.4, part.size * 0.8);
        ctx.strokeRect(-part.size * 1.2, -part.size * 0.4, part.size * 2.4, part.size * 0.8);

        // Panel grid lines
        ctx.strokeStyle = '#4a5a6a';
        ctx.lineWidth = 1;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(part.size * i * 0.6, -part.size * 0.4);
          ctx.lineTo(part.size * i * 0.6, part.size * 0.4);
          ctx.stroke();
        }

        // Hazard stripe
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-part.size * 1.2, part.size * 0.2, part.size * 2.4, part.size * 0.15);

      } else if (part.type === 'scrap') {
        // Jagged metal piece
        ctx.fillStyle = '#505865';
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 2;

        // Irregular torn metal shape
        ctx.beginPath();
        ctx.moveTo(0, -part.size);
        ctx.lineTo(part.size * 0.7, -part.size * 0.3);
        ctx.lineTo(part.size * 0.9, part.size * 0.2);
        ctx.lineTo(part.size * 0.3, part.size);
        ctx.lineTo(-part.size * 0.4, part.size * 0.7);
        ctx.lineTo(-part.size, part.size * 0.1);
        ctx.lineTo(-part.size * 0.6, -part.size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rivets/bolts
        ctx.fillStyle = '#3a4048';
        ctx.beginPath();
        ctx.arc(part.size * 0.3, 0, part.size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-part.size * 0.3, part.size * 0.3, part.size * 0.1, 0, Math.PI * 2);
        ctx.fill();

      } else if (part.type === 'antenna') {
        // Broken antenna with wires
        ctx.strokeStyle = '#707070';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -part.size * 0.8);
        ctx.lineTo(part.size * 0.1, -part.size * 0.3);
        ctx.lineTo(-part.size * 0.1, part.size * 0.2);
        ctx.lineTo(0, part.size);
        ctx.stroke();

        // Broken end
        ctx.fillStyle = '#ff6b6b';
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -part.size * 0.8, part.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Hanging wire
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -part.size * 0.7);
        ctx.lineTo(part.size * 0.2, -part.size * 0.5);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Central damaged hull piece
    ctx.fillStyle = '#404852';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;

    // Irregular hull shape
    const hullSize = size * 0.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const variation = 0.8 + Math.random() * 0.4;
      ctx.lineTo(
        Math.cos(angle) * hullSize * variation,
        Math.sin(angle) * hullSize * variation
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hazard symbol (triangle with !)
    ctx.strokeStyle = '#fbbf24';
    ctx.fillStyle = '#fbbf24';
    ctx.lineWidth = 2;

    const symbolSize = size * 0.25;
    ctx.beginPath();
    ctx.moveTo(0, -symbolSize);
    ctx.lineTo(-symbolSize * 0.8, symbolSize * 0.6);
    ctx.lineTo(symbolSize * 0.8, symbolSize * 0.6);
    ctx.closePath();
    ctx.stroke();

    // Exclamation mark
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-symbolSize * 0.1, -symbolSize * 0.5, symbolSize * 0.2, symbolSize * 0.6);
    ctx.beginPath();
    ctx.arc(0, symbolSize * 0.4, symbolSize * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawParticles() {
    for (let p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // ============================================
  // LEADERBOARD FUNCTIONS
  // ============================================
  function setupLeaderboardListeners() {
    // Icon picker
    iconButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        iconButtons.forEach(b => b.classList.remove('active'));
        // Add active to clicked button
        btn.classList.add('active');
        // Update selected icon
        selectedIcon = btn.dataset.icon;
      });
    });

    // Character counter for name input
    playerNameInput.addEventListener('input', (e) => {
      const count = e.target.value.length;
      document.getElementById('charCount').textContent = count;
    });

    // Submit score button
    submitScoreButton.addEventListener('click', async () => {
      const name = playerNameInput.value.trim();

      if (!name) {
        alert('Bitte gib deinen Namen ein!');
        return;
      }

      // Disable button during submission
      submitScoreButton.disabled = true;
      const btnText = submitScoreButton.querySelector('.btn-text');
      const originalText = btnText.textContent;
      btnText.textContent = 'WIRD GESENDET...';

      // Always proceed to game over after a short delay (testing mode without Firebase)
      setTimeout(() => {
        console.log(`Score would be submitted: ${name} (${selectedIcon}) - ${score} points`);

        // Try Firebase if available
        if (window.LeaderboardAPI) {
          window.LeaderboardAPI.submitScore(name, selectedIcon, score).catch(() => {
            console.log('Firebase not configured, skipping submission');
          });
        }

        // Show success and proceed
        highScoreModal.classList.add('hidden');
        submitScoreButton.disabled = false;
        btnText.textContent = originalText;
        showGameOverScreen();
      }, 800);
    });

    // View leaderboard button
    viewLeaderboardButton.addEventListener('click', () => {
      leaderboardModal.classList.remove('hidden');
      if (window.LeaderboardAPI) {
        window.LeaderboardAPI.displayLeaderboard('standaloneLeaderboardList');
      }
    });

    // Close leaderboard modal
    closeLeaderboardButton.addEventListener('click', () => {
      leaderboardModal.classList.add('hidden');
    });

    // Close on background click
    leaderboardModal.addEventListener('click', (e) => {
      if (e.target === leaderboardModal) {
        leaderboardModal.classList.add('hidden');
      }
    });
  }

  // ============================================
  // START THE GAME
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
