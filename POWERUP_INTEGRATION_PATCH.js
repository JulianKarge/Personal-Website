// ============================================
// POWER-UP INTEGRATION PATCH
// ============================================
// Add these code snippets to asteroid-game.js at the locations specified

// ==========================================
// 1. In init() function, after line ~175 (after getting icon buttons)
// ==========================================
/*
    // Get power-up UI elements
    powerupDisplays = {
      shield: document.getElementById('powerupShield'),
      doubleShot: document.getElementById('powerupDoubleShot'),
      tripleShot: document.getElementById('powerupTripleShot'),
      rocket: document.getElementById('powerupRocket')
    };
*/

// ==========================================
// 2. In startGame() function, after resetting game state
// ==========================================
/*
    // Reset power-ups
    powerups = [];
    rockets = [];
    activePowerups = {
      shield: null,
      doubleShot: 0,
      tripleShot: 0,
      rocket: null
    };
    lastPowerupSpawn = Date.now();
    lastRocketFire = Date.now();
*/

// ==========================================
// 3. Replace the shoot() function completely (around line ~270)
// ==========================================
/*
  function shoot() {
    const now = Date.now();
    if (now - lastShot >= CONFIG.FIRE_RATE) {
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
      lastShot = now;
    }
  }
*/

// ==========================================
// 4. In update() function, add after asteroid spawning (after line ~340)
// ==========================================
/*
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
*/

// ==========================================
// 5. In checkCollisions(), add BEFORE "Ship vs Asteroids" section (before line ~674)
// ==========================================
/*
    // Ship vs Power-ups
    if (ship && window.PowerupSystem) {
      for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        const dx = ship.x - powerup.x;
        const dy = ship.y - powerup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CONFIG.SHIP_SIZE + powerup.size) {
          if (window.PowerupSystem.activatePowerup(activePowerups, powerup, Date.now())) {
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
*/

// ==========================================
// 6. Replace hitShip() function completely (around line ~760)
// ==========================================
/*
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

    if (lives <= 0) {
      gameOver();
    } else {
      ship.invincible = true;
      ship.invincibleTimer = CONFIG.INVINCIBILITY_TIME;
    }
  }
*/

// ==========================================
// 7. In draw() function, add after drawBullets() (around line ~1005)
// ==========================================
/*
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
*/

// ==========================================
// 8. Add new updatePowerupUI() function (add anywhere, e.g., after updateLives())
// ==========================================
/*
  function updatePowerupUI() {
    if (!window.PowerupSystem || !powerupDisplays.shield) return;

    const now = Date.now();

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
*/

// ==========================================
// DONE! Test by playing the game and collecting power-ups
// ==========================================
