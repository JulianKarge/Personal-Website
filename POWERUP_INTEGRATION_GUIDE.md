# Power-Up System Integration Guide

## Overview
The power-up system is now set up with:
- ✅ `powerup-system.js` - Complete power-up logic
- ✅ CSS styles for UI display
- ✅ HTML elements for power-up UI
- ✅ Script tag added to index.html

## What You Need to Do Next

The power-up system is **modular** and ready to use. You need to integrate it into `asteroid-game.js` by adding these function calls at the right places:

### 1. In `init()` function - Get UI elements
```javascript
// After line ~170 (after getting other UI elements)
powerupDisplays = {
  shield: document.getElementById('powerupShield'),
  doubleShot: document.getElementById('powerupDoubleShot'),
  tripleShot: document.getElementById('powerupTripleShot'),
  rocket: document.getElementById('powerupRocket')
};
```

### 2. In `resetGame()` or `startGame()` - Reset power-ups
```javascript
// Clear power-ups
powerups = [];
rockets = [];
activePowerups = {
  shield: null,
  doubleShot: 0,
  tripleShot: 0,
  rocket: null
};
lastPowerupSpawn = 0;
lastRocketFire = 0;
updatePowerupUI();
```

### 3. In `update()` function - Spawn power-ups
```javascript
// After asteroid spawning logic (around line ~320)
// Spawn power-ups
const timeSinceLastPowerup = now - lastPowerupSpawn;
const spawnInterval = CONFIG.POWERUP_SPAWN_INTERVAL + (Math.random() * CONFIG.POWERUP_SPAWN_VARIANCE * 2 - CONFIG.POWERUP_SPAWN_VARIANCE);

if (timeSinceLastPowerup > spawnInterval) {
  powerups.push(window.PowerupSystem.createPowerup(canvas.width, score));
  lastPowerupSpawn = now;
}

// Update power-ups
for (let i = powerups.length - 1; i >= 0; i--) {
  window.PowerupSystem.updatePowerup(powerups[i]);

  if (window.PowerupSystem.isPowerupOffScreen(powerups[i], canvas.height)) {
    powerups.splice(i, 1);
  }
}

// Update rockets
for (let i = rockets.length - 1; i >= 0; i--) {
  rockets[i].y += rockets[i].vy;
  window.PowerupSystem.updateRocketTrail(rockets[i]);

  if (rockets[i].y < -10) {
    rockets.splice(i, 1);
  }
}

// Update power-up expirations
window.PowerupSystem.updatePowerupExpirations(activePowerups, now);
updatePowerupUI();
```

### 4. In `checkCollisions()` - Add power-up collision
```javascript
// After ship vs asteroids collision (around line ~690)
// Ship vs Power-ups
if (ship) {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const powerup = powerups[i];
    const dx = ship.x - powerup.x;
    const dy = ship.y - powerup.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < CONFIG.SHIP_SIZE + powerup.size) {
      // Collect power-up
      if (window.PowerupSystem.activatePowerup(activePowerups, powerup, Date.now())) {
        powerups.splice(i, 1);
        updatePowerupUI();
        // Optional: Play sound effect
      }
    }
  }
}

// Rockets vs Asteroids
for (let i = rockets.length - 1; i >= 0; i--) {
  for (let j = asteroids.length - 1; j >= 0; j--) {
    const rocket = rockets[i];
    const asteroid = asteroids[j];

    if (circleCollision(rocket.x, rocket.y, rocket.size, asteroid.x, asteroid.y, asteroid.size)) {
      // Rocket hits asteroid
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
```

### 5. Replace `shoot()` function - Add multi-shot
```javascript
function shoot() {
  const now = Date.now();
  if (now - lastShot >= CONFIG.FIRE_RATE) {
    // Use power-up system to create shot pattern
    const newBullets = window.PowerupSystem.createShotPattern(
      ship,
      activePowerups,
      CONFIG.BULLET_SPEED,
      CONFIG.BULLET_SIZE,
      CONFIG.BULLET_COLOR
    );

    bullets.push(...newBullets);
    lastShot = now;
  }
}
```

### 6. Add rocket auto-fire logic
```javascript
// In update() function, after checking if ship exists
if (ship && activePowerups.rocket && activePowerups.rocket.active) {
  const now = Date.now();
  if (now - lastRocketFire >= CONFIG.ROCKET_FIRE_RATE) {
    const rocket = window.PowerupSystem.createRocket(ship, CONFIG.BULLET_SPEED, CONFIG.BULLET_SIZE);
    rockets.push(rocket);
    lastRocketFire = now;
  }
}
```

### 7. Update `hitShip()` - Add shield logic
```javascript
function hitShip() {
  // Check if shield is active
  if (activePowerups.shield && activePowerups.shield.active) {
    // Shield absorbs hit and explodes
    const destroyed = window.PowerupSystem.explodeShield(
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

    // Still give brief invincibility
    ship.invincible = true;
    ship.invincibleTimer = CONFIG.INVINCIBILITY_TIME / 2; // Half time since shield absorbed
    return;
  }

  // Normal hit logic (existing code)
  lives--;
  updateLives();

  if (lives <= 0) {
    gameOver();
  } else {
    ship.invincible = true;
    ship.invincibleTimer = CONFIG.INVINCIBILITY_TIME;
  }
}
```

### 8. In `draw()` function - Draw power-ups and rockets
```javascript
// After drawAsteroids() (around line ~918)
// Draw power-ups
for (let powerup of powerups) {
  window.PowerupSystem.drawPowerup(ctx, powerup);
}

// Draw rockets
for (let rocket of rockets) {
  window.PowerupSystem.drawRocket(ctx, rocket);
}
```

### 9. Add `updatePowerupUI()` function
```javascript
function updatePowerupUI() {
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
```

### 10. Add `powerupDisplays` variable declaration
```javascript
// After line ~140 (with other UI variables)
let powerupDisplays = {};
```

## Testing

After integration:
1. Start the game
2. Wait 20-40 seconds for first power-up to spawn
3. Collect it and check:
   - UI displays at top-center
   - Shield: Adds shield icon, next hit explodes
   - Double/Triple Shot: Fires multiple bullets
   - Rocket: Auto-fires orange rockets
4. Stack power-ups (max 3 different types)
5. Check timers count down correctly

## Notes
- Power-ups spawn every ~30 seconds with ±10s variance
- Quality improves with score (better items at higher scores)
- Max 3 different active types (but shots stack infinitely)
- Shield duration: 30s
- Rocket duration: 20s
- Shield explosion radius: 150px

Good luck! 🚀
