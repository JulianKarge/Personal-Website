// ============================================
// POWER-UP SYSTEM FOR ASTEROID GAME
// ============================================
// This module handles all power-up related functionality:
// - Shield (30s duration, explodes on hit)
// - Double Shot (permanent, stackable)
// - Triple Shot (permanent, stackable)
// - Rocket (20s duration, auto-fires every 1s)

(function() {
  'use strict';

  // Power-up types with their properties
  const POWERUP_TYPES = {
    SHIELD: {
      type: 'shield',
      color: '#3b82f6',      // Blue
      icon: '🛡️',
      glowColor: 'rgba(59, 130, 246, 0.8)',
      duration: 30000,       // 30 seconds
      name: 'Schild'
    },
    DOUBLE_SHOT: {
      type: 'doubleShot',
      color: '#10b981',      // Green
      icon: '↑↑',
      glowColor: 'rgba(16, 185, 129, 0.8)',
      duration: null,        // Permanent
      name: 'Doppelschuss'
    },
    TRIPLE_SHOT: {
      type: 'tripleShot',
      color: '#ec4899',      // Pink
      icon: '✨',
      glowColor: 'rgba(236, 72, 153, 0.8)',
      duration: null,        // Permanent
      name: 'Dreifachschuss'
    },
    ROCKET: {
      type: 'rocket',
      color: '#f59e0b',      // Orange
      icon: '🚀',
      glowColor: 'rgba(245, 158, 11, 0.8)',
      duration: 20000,       // 20 seconds
      name: 'Rakete'
    }
  };

  // Spawn probability based on score (quality-based progression)
  function getPowerupType(score) {
    const rand = Math.random() * 100;

    if (score < 500) {
      // Tier 1: Shield and Rocket more common
      if (rand < 50) return POWERUP_TYPES.SHIELD;
      if (rand < 85) return POWERUP_TYPES.ROCKET;
      return POWERUP_TYPES.DOUBLE_SHOT;
    } else if (score < 1500) {
      // Tier 2: Double Shot becomes common
      if (rand < 30) return POWERUP_TYPES.SHIELD;
      if (rand < 50) return POWERUP_TYPES.ROCKET;
      if (rand < 85) return POWERUP_TYPES.DOUBLE_SHOT;
      return POWERUP_TYPES.TRIPLE_SHOT;
    } else {
      // Tier 3: Triple Shot appears more
      if (rand < 20) return POWERUP_TYPES.SHIELD;
      if (rand < 35) return POWERUP_TYPES.ROCKET;
      if (rand < 65) return POWERUP_TYPES.DOUBLE_SHOT;
      return POWERUP_TYPES.TRIPLE_SHOT;
    }
  }

  // Create a new power-up
  function createPowerup(canvasWidth, score) {
    const type = getPowerupType(score);
    return {
      x: Math.random() * (canvasWidth - 40) + 20,
      y: -30,
      size: 20,
      speed: 2,
      type: type.type,
      color: type.color,
      icon: type.icon,
      glowColor: type.glowColor,
      duration: type.duration,
      name: type.name,
      rotation: 0,
      rotationSpeed: 0.05
    };
  }

  // Draw a power-up on canvas
  function drawPowerup(ctx, powerup) {
    ctx.save();
    ctx.translate(powerup.x, powerup.y);
    ctx.rotate(powerup.rotation);

    // Outer glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = powerup.glowColor;

    // Background circle
    ctx.fillStyle = powerup.color;
    ctx.beginPath();
    ctx.arc(0, 0, powerup.size, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Icon
    ctx.fillStyle = 'white';
    ctx.font = `bold ${powerup.size * 1.3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(powerup.icon, 0, 0);

    ctx.restore();
  }

  // Update power-up position
  function updatePowerup(powerup) {
    powerup.y += powerup.speed;
    powerup.rotation += powerup.rotationSpeed;
  }

  // Check if power-up is off screen
  function isPowerupOffScreen(powerup, canvasHeight) {
    return powerup.y > canvasHeight + 30;
  }

  // Get count of active power-ups (max 3 different types)
  function getActivePowerupCount(activePowerups) {
    let count = 0;
    if (activePowerups.shield && activePowerups.shield.active) count++;
    if (activePowerups.doubleShot > 0) count++;
    if (activePowerups.tripleShot > 0) count++;
    if (activePowerups.rocket && activePowerups.rocket.active) count++;
    return count;
  }

  // Check if can collect power-up (max 3 active)
  function canCollectPowerup(activePowerups, powerupType) {
    const currentCount = getActivePowerupCount(activePowerups);

    // If already have 3 different types, can't collect new type
    if (currentCount >= 3) {
      // But can still stack shots if already active
      if (powerupType === 'doubleShot' && activePowerups.doubleShot > 0) return true;
      if (powerupType === 'tripleShot' && activePowerups.tripleShot > 0) return true;
      return false;
    }
    return true;
  }

  // Activate a power-up
  function activatePowerup(activePowerups, powerup, currentTime) {
    const type = powerup.type;

    if (!canCollectPowerup(activePowerups, type)) {
      return false; // Can't collect
    }

    switch (type) {
      case 'shield':
        if (!activePowerups.shield || !activePowerups.shield.active) {
          activePowerups.shield = {
            active: true,
            expiresAt: currentTime + powerup.duration
          };
          return true;
        }
        return false;

      case 'doubleShot':
        activePowerups.doubleShot++;
        return true;

      case 'tripleShot':
        activePowerups.tripleShot++;
        return true;

      case 'rocket':
        if (!activePowerups.rocket || !activePowerups.rocket.active) {
          activePowerups.rocket = {
            active: true,
            expiresAt: currentTime + powerup.duration
          };
          return true;
        }
        return false;
    }
    return false;
  }

  // Update power-up expirations
  function updatePowerupExpirations(activePowerups, currentTime) {
    // Check shield expiration
    if (activePowerups.shield && activePowerups.shield.active) {
      if (currentTime >= activePowerups.shield.expiresAt) {
        activePowerups.shield = null;
      }
    }

    // Check rocket expiration
    if (activePowerups.rocket && activePowerups.rocket.active) {
      if (currentTime >= activePowerups.rocket.expiresAt) {
        activePowerups.rocket = null;
      }
    }
  }

  // Calculate total shot count (for UI and firing)
  function getTotalShotCount(activePowerups) {
    let totalDouble = activePowerups.doubleShot || 0;
    let totalTriple = activePowerups.tripleShot || 0;

    // Each double shot = 2 bullets, each triple = 3 bullets
    return 1 + (totalDouble * 2) + (totalTriple * 3);
  }

  // Create bullets based on active shots
  function createShotPattern(ship, activePowerups, bulletSpeed, bulletSize, bulletColor) {
    const bullets = [];
    const spreadAngle = Math.PI / 8; // 22.5 degrees spread for triple shot

    let doubleCount = activePowerups.doubleShot || 0;
    let tripleCount = activePowerups.tripleShot || 0;

    // Determine bullet color (green if double shot active)
    const isDouble = doubleCount > 0;
    const finalColor = isDouble ? '#10b981' : bulletColor; // Green for double

    // Fire center shot if no double shot active
    if (doubleCount === 0) {
      bullets.push({
        x: ship.x,
        y: ship.y - 15,
        vx: 0,
        vy: -bulletSpeed,
        size: bulletSize,
        color: finalColor
      });
    }

    // Fire double shots side-by-side
    const sideOffset = 8; // Pixels apart
    for (let i = 0; i < doubleCount; i++) {
      // Left shot
      bullets.push({
        x: ship.x - sideOffset,
        y: ship.y - 15,
        vx: 0,
        vy: -bulletSpeed,
        size: bulletSize,
        color: finalColor
      });

      // Right shot
      bullets.push({
        x: ship.x + sideOffset,
        y: ship.y - 15,
        vx: 0,
        vy: -bulletSpeed,
        size: bulletSize,
        color: finalColor
      });
    }

    // Add triple shot patterns
    for (let i = 0; i < tripleCount; i++) {
      // Left shot (negative vx = left)
      bullets.push({
        x: ship.x - 5,
        y: ship.y - 10,
        vx: -bulletSpeed * Math.sin(spreadAngle),
        vy: -bulletSpeed * Math.cos(spreadAngle),
        size: bulletSize,
        color: finalColor
      });

      // Right shot (positive vx = right)
      bullets.push({
        x: ship.x + 5,
        y: ship.y - 10,
        vx: bulletSpeed * Math.sin(spreadAngle),
        vy: -bulletSpeed * Math.cos(spreadAngle),
        size: bulletSize,
        color: finalColor
      });

      // Center shot (if doubleCount is 0, we need at least 1 center)
      if (doubleCount === 0) {
        bullets.push({
          x: ship.x,
          y: ship.y - 15,
          vx: 0,
          vy: -bulletSpeed,
          size: bulletSize,
          color: finalColor
        });
      }
    }

    return bullets;
  }

  // Create rocket projectile
  function createRocket(ship, bulletSpeed, bulletSize) {
    return {
      x: ship.x,
      y: ship.y - 20,
      vx: 0,
      vy: -bulletSpeed * 1.5, // Rockets are faster
      size: bulletSize * 1.5,
      color: '#f59e0b',
      isRocket: true,
      damage: 2,
      trail: [] // For visual effect
    };
  }

  // Draw rocket with trail
  function drawRocket(ctx, rocket) {
    // Draw trail
    for (let i = 0; i < rocket.trail.length; i++) {
      const t = rocket.trail[i];
      const opacity = (i / rocket.trail.length) * 0.5;
      ctx.fillStyle = `rgba(245, 158, 11, ${opacity})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, rocket.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw rocket
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = rocket.color;
    ctx.fillStyle = rocket.color;
    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, rocket.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Update rocket trail
  function updateRocketTrail(rocket) {
    rocket.trail.unshift({ x: rocket.x, y: rocket.y });
    if (rocket.trail.length > 5) {
      rocket.trail.pop();
    }
  }

  // Explode shield (destroy nearby asteroids)
  function explodeShield(ship, asteroids, explosionRadius, createExplosion, addScore, particleConfig) {
    const destroyed = [];

    for (let i = asteroids.length - 1; i >= 0; i--) {
      const asteroid = asteroids[i];
      const dx = ship.x - asteroid.x;
      const dy = ship.y - asteroid.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= explosionRadius) {
        // Create explosion effect
        createExplosion(asteroid.x, asteroid.y, asteroid.size * 2);

        // Add score based on asteroid type
        if (asteroid.type === 'armored') {
          addScore(400);
        } else if (asteroid.type === 'normal') {
          if (asteroid.size > 50) addScore(20);
          else if (asteroid.size > 35) addScore(50);
          else addScore(100);
        }

        destroyed.push(i);
      }
    }

    // Remove destroyed asteroids
    for (let i of destroyed) {
      asteroids.splice(i, 1);
    }

    // Create large explosion at ship
    createExplosion(ship.x, ship.y, explosionRadius);

    return destroyed.length;
  }

  // Export API
  window.PowerupSystem = {
    POWERUP_TYPES,
    createPowerup,
    drawPowerup,
    updatePowerup,
    isPowerupOffScreen,
    canCollectPowerup,
    activatePowerup,
    updatePowerupExpirations,
    getTotalShotCount,
    createShotPattern,
    createRocket,
    drawRocket,
    updateRocketTrail,
    explodeShield,
    getActivePowerupCount
  };

})();
