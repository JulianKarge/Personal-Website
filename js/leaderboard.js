// ============================================
// FIREBASE CONFIGURATION
// ============================================
// NOTE: You need to replace this with your own Firebase config
// Go to: https://console.firebase.google.com/
// 1. Create a new project
// 2. Go to Project Settings > General > Your apps > Web app
// 3. Copy the firebaseConfig object
// 4. Go to Realtime Database > Create Database > Start in test mode
// 5. Replace the config below with your own

const firebaseConfig = {
  apiKey: "AIzaSyAzJp54OAsunqOGPpN6mxNGVqJ91lc-DRg",
  authDomain: "websitedb-9c8ee.firebaseapp.com",
  databaseURL: "https://websitedb-9c8ee-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "websitedb-9c8ee",
  storageBucket: "websitedb-9c8ee.firebasestorage.app",
  messagingSenderId: "151545331395",
  appId: "1:151545331395:web:fc7c03fac0965e29e92c76",
  measurementId: "G-TVR7K6FPDL"
};

// Initialize Firebase
let database = null;
let firebaseInitialized = false;

try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    firebaseInitialized = true;
    console.log('Firebase initialized successfully');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// ============================================
// CONFETTI ANIMATION
// ============================================
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
let confettiParticles = [];
let confettiAnimationId = null;

function resizeConfettiCanvas() {
  if (confettiCanvas) {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
}

window.addEventListener('resize', resizeConfettiCanvas);
resizeConfettiCanvas();

class ConfettiParticle {
  constructor() {
    this.x = Math.random() * confettiCanvas.width;
    this.y = -20;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = Math.random() * 3 + 2;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    this.size = Math.random() * 8 + 4;
    this.opacity = 1;

    // Website-themed colors (pink, purple, blue, gold)
    const colors = ['#e94560', '#667eea', '#764ba2', '#ffd700', '#ff6b9d', '#c471ed', '#12c2e9'];
    this.color = colors[Math.floor(Math.random() * colors.length)];

    // Different shapes
    this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.vy += 0.1; // Gravity

    // Fade out near bottom
    if (this.y > confettiCanvas.height - 100) {
      this.opacity -= 0.02;
    }
  }

  draw() {
    if (!confettiCtx) return;

    confettiCtx.save();
    confettiCtx.translate(this.x, this.y);
    confettiCtx.rotate((this.rotation * Math.PI) / 180);
    confettiCtx.globalAlpha = this.opacity;

    confettiCtx.fillStyle = this.color;

    if (this.shape === 'rect') {
      confettiCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else {
      confettiCtx.beginPath();
      confettiCtx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      confettiCtx.fill();
    }

    confettiCtx.restore();
  }

  isDead() {
    return this.opacity <= 0 || this.y > confettiCanvas.height + 20;
  }
}

function animateConfetti() {
  if (!confettiCtx || !confettiCanvas) return;

  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  // Update and draw particles
  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    confettiParticles[i].update();
    confettiParticles[i].draw();

    if (confettiParticles[i].isDead()) {
      confettiParticles.splice(i, 1);
    }
  }

  // Continue animation if particles remain
  if (confettiParticles.length > 0) {
    confettiAnimationId = requestAnimationFrame(animateConfetti);
  } else {
    // Hide canvas when done
    confettiCanvas.style.display = 'none';
  }
}

function launchConfetti(duration = 3000) {
  if (!confettiCanvas) return;

  confettiCanvas.style.display = 'block';

  // Create confetti particles over time
  const particlesPerFrame = 5;
  let elapsed = 0;
  const interval = setInterval(() => {
    for (let i = 0; i < particlesPerFrame; i++) {
      confettiParticles.push(new ConfettiParticle());
    }

    elapsed += 50;
    if (elapsed >= duration) {
      clearInterval(interval);
    }
  }, 50);

  // Start animation
  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
  }
  animateConfetti();
}

// ============================================
// LEADERBOARD FUNCTIONS
// ============================================

// Fetch top 3 scores from Firebase
async function fetchLeaderboard() {
  if (!firebaseInitialized || !database) {
    return [];
  }

  try {
    const snapshot = await database.ref('leaderboard')
      .orderByChild('score')
      .limitToLast(3)
      .once('value');

    const scores = [];
    snapshot.forEach((childSnapshot) => {
      scores.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    // Sort in descending order (highest first)
    return scores.reverse();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Check if a score qualifies for top 3
async function isTopScore(score) {
  if (!firebaseInitialized || !database) {
    console.log('Firebase not initialized - leaderboard disabled');
    return false;
  }

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 3000)
    );

    const fetchPromise = fetchLeaderboard();
    const leaderboard = await Promise.race([fetchPromise, timeoutPromise]);

    // If less than 3 scores, automatically qualify
    if (leaderboard.length < 3) {
      return true;
    }

    // Check if score is higher than the lowest top 3 score
    const lowestTopScore = leaderboard[leaderboard.length - 1].score;
    return score > lowestTopScore;
  } catch (error) {
    console.error('Error checking top score:', error);
    return false;
  }
}

// Submit a new score to Firebase
async function submitScore(name, icon, score) {
  if (!firebaseInitialized || !database) {
    console.error('Firebase not initialized');
    return false;
  }

  try {
    const newScoreRef = database.ref('leaderboard').push();
    await newScoreRef.set({
      name: name.trim(),
      icon: icon,
      score: score,
      timestamp: Date.now()
    });

    // Clean up - keep only top 3
    await cleanupLeaderboard();

    return true;
  } catch (error) {
    console.error('Error submitting score:', error);
    return false;
  }
}

// Remove scores outside top 3
async function cleanupLeaderboard() {
  if (!firebaseInitialized || !database) {
    return;
  }

  try {
    const snapshot = await database.ref('leaderboard')
      .orderByChild('score')
      .once('value');

    const allScores = [];
    snapshot.forEach((childSnapshot) => {
      allScores.push({
        id: childSnapshot.key,
        score: childSnapshot.val().score
      });
    });

    // Sort descending
    allScores.sort((a, b) => b.score - a.score);

    // Remove scores beyond top 3
    for (let i = 3; i < allScores.length; i++) {
      await database.ref(`leaderboard/${allScores[i].id}`).remove();
    }
  } catch (error) {
    console.error('Error cleaning up leaderboard:', error);
  }
}

// Display leaderboard in a container
async function displayLeaderboard(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!firebaseInitialized) {
    // Show example entry when Firebase not configured
    container.innerHTML = `
      <div class="leaderboard-item">
        <div class="leaderboard-rank rank-1">#1</div>
        <div class="leaderboard-icon">🚀</div>
        <div class="leaderboard-info">
          <div class="leaderboard-name">Beispiel</div>
          <div class="leaderboard-score">--- pts</div>
        </div>
      </div>
      <div style="text-align: center; color: #888; font-size: 0.85rem; margin-top: 1rem;">
        Firebase nicht konfiguriert
      </div>
    `;
    return;
  }

  container.innerHTML = '<div class="leaderboard-loading">Lädt...</div>';

  try {
    const leaderboard = await fetchLeaderboard();

    if (leaderboard.length === 0) {
      container.innerHTML = '<div class="leaderboard-loading">Noch keine Einträge. Sei der Erste!</div>';
      return;
    }

    let html = '';
    leaderboard.forEach((entry, index) => {
      const rank = index + 1;
      html += `
        <div class="leaderboard-item">
          <div class="leaderboard-rank rank-${rank}">#${rank}</div>
          <div class="leaderboard-icon">${entry.icon}</div>
          <div class="leaderboard-info">
            <div class="leaderboard-name">${escapeHtml(entry.name)}</div>
            <div class="leaderboard-score">${entry.score} pts</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('Error displaying leaderboard:', error);
    container.innerHTML = '<div class="leaderboard-error">Error loading leaderboard</div>';
  }
}

// Helper to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export functions for use in asteroid-game.js
window.LeaderboardAPI = {
  isTopScore,
  submitScore,
  displayLeaderboard,
  launchConfetti
};
