document.addEventListener("DOMContentLoaded", () => {
  // ====== Config ======
  const SNAKE_HEAD_IMAGE_PATH = "Images/snake-head.png"; // high-res
  const FOOD_IMAGE_PATH = "Images/food.png";             // high-res
  const SNAKE_COLOR = "#d1d5db";

  const gameCanvas = document.getElementById("snakeCanvas");
  if (!gameCanvas) return;
  const ctx = gameCanvas.getContext("2d");

  // UI Elements
  const scoreElement = document.getElementById("gameScore");
  const personalHighScoreElement = document.getElementById("personalHighScore");
  const messageOverlay = document.getElementById("messageOverlay");
  const messageTitle = document.getElementById("messageTitle");
  const messageScore = document.getElementById("messageScore");
  const finalScoreElement = document.getElementById("finalScore");
  const messageButton = document.getElementById("messageButton");
  // Removed fullscreen button reference

  // Game state
  let tileSize = 20;
  let gridCount = 20; // dynamic
  let snake = [];
  let food = {};
  let direction = { x: 0, y: 0 };
  let score = 0;
  let personalHighScore = 0;
  let gameState = "IDLE"; // IDLE, PLAYING, GAME_OVER
  let lastRenderTime = 0;
  let gameSpeed = 7;
  let touchStartX = 0, touchStartY = 0;

  // Images
  const snakeHeadImg = new Image();
  const foodImg = new Image();
  snakeHeadImg.src = SNAKE_HEAD_IMAGE_PATH;
  foodImg.src = FOOD_IMAGE_PATH;

  // High-DPI scaling
  let dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  function applyHiDPIScale() {
    const cssW = gameCanvas.clientWidth;
    const cssH = gameCanvas.clientHeight;
    gameCanvas.width  = Math.floor(cssW * dpr);
    gameCanvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }

  // Highscores
  function loadHighScore() {
    personalHighScore = parseInt(localStorage.getItem("snakeHighScore")) || 0;
    personalHighScoreElement.textContent = personalHighScore;
  }

  function saveHighScore() {
    if (score > personalHighScore) {
      personalHighScore = score;
      localStorage.setItem("snakeHighScore", personalHighScore);
      personalHighScoreElement.textContent = personalHighScore;
    }
  }

function updateUI() {
  if (gameState === "PLAYING") {
    messageOverlay.classList.add("hidden");
  } else {
    if (gameState === "IDLE") {
      messageTitle.textContent = "SNAKE";
      messageScore.classList.add("hidden");
      messageButton.textContent = "Start Game";
    } else {
      messageTitle.textContent = "Game Over!";
      messageScore.classList.remove("hidden");
      finalScoreElement.textContent = score;
      messageButton.textContent = "Play Again";
    }
    messageOverlay.classList.remove("hidden");
  }
}


  // Canvas & grid sizing (optimized for mobile)
  function resizeCanvas() {
    const container = gameCanvas.parentElement;
    const isMobile = window.innerWidth < 768;

    // Better mobile sizing
    let size;
    if (isMobile) {
      size = Math.min(container.clientWidth * 0.95, window.innerHeight * 0.5);
    } else {
      size = Math.min(container.clientWidth, window.innerHeight * 0.7);
    }

    gameCanvas.style.width  = size + "px";
    gameCanvas.style.height = size + "px";

    gridCount = isMobile ? 18 : 25; // Slightly smaller grid for mobile
    tileSize = Math.floor(size / gridCount);
    gameCanvas.style.width  = (tileSize * gridCount) + "px";
    gameCanvas.style.height = (tileSize * gridCount) + "px";

    // Lower DPR on mobile for performance
    dpr = isMobile ? 1 : Math.max(1, Math.floor(window.devicePixelRatio || 1));
    applyHiDPIScale();
  }

  // Game logic
  function getRandomTile() {
    return {
      x: Math.floor(Math.random() * gridCount),
      y: Math.floor(Math.random() * gridCount)
    };
  }

  function generateFood() {
    do {
      food = getRandomTile();
    } while (snake.some(seg => seg.x === food.x && seg.y === food.y));
  }

  function updateSnake() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    if (head.x < 0 || head.x >= gridCount || head.y < 0 || head.y >= gridCount) return endGame();
    if (snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y)) return endGame();

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreElement.textContent = score;
      generateFood();
    } else {
      snake.pop();
    }
  }

  function drawGame() {
    ctx.clearRect(0, 0, gameCanvas.clientWidth, gameCanvas.clientHeight);

    // Enhanced grid with subtle gradient
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= gridCount; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileSize, 0);
      ctx.lineTo(x * tileSize, tileSize * gridCount);
      ctx.stroke();
    }
    for (let y = 0; y <= gridCount; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileSize);
      ctx.lineTo(tileSize * gridCount, y * tileSize);
      ctx.stroke();
    }

    // Draw snake body with gradient and rounded corners
    for (let i = 1; i < snake.length; i++) {
      const gradient = ctx.createLinearGradient(
        snake[i].x * tileSize,
        snake[i].y * tileSize,
        (snake[i].x + 1) * tileSize,
        (snake[i].y + 1) * tileSize
      );
      gradient.addColorStop(0, '#9ca3af');
      gradient.addColorStop(1, '#6b7280');
      ctx.fillStyle = gradient;

      // Rounded rectangles for snake segments
      const padding = 2;
      ctx.beginPath();
      ctx.roundRect(
        snake[i].x * tileSize + padding,
        snake[i].y * tileSize + padding,
        tileSize - padding * 2,
        tileSize - padding * 2,
        4
      );
      ctx.fill();
    }

    // Draw snake head
    if (snake.length) {
      ctx.save();
      ctx.shadowColor = 'rgba(233, 69, 96, 0.5)';
      ctx.shadowBlur = 10;
      ctx.drawImage(snakeHeadImg, snake[0].x * tileSize, snake[0].y * tileSize, tileSize, tileSize);
      ctx.restore();
    }

    // Draw food with glow effect
    ctx.save();
    ctx.shadowColor = 'rgba(233, 69, 96, 0.6)';
    ctx.shadowBlur = 15;
    ctx.drawImage(foodImg, food.x * tileSize, food.y * tileSize, tileSize, tileSize);
    ctx.restore();
  }

  function mainLoop(now) {
    if (gameState !== "PLAYING") return;
    requestAnimationFrame(mainLoop);
    const elapsed = (now - lastRenderTime) / 1000;
    if (elapsed < 1 / gameSpeed) return;
    lastRenderTime = now;
    updateSnake();
    drawGame();
  }

  // Controls
  function preventScrollWhenGaming(e) {
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
    if (keys.includes(e.key) && (gameState === "PLAYING" || document.activeElement === gameCanvas)) {
      e.preventDefault();
    }
  }

  function handleKey(e) {
    preventScrollWhenGaming(e);
    const isVertical = direction.y !== 0;
    if (e.key === "ArrowUp" && !isVertical) direction = { x: 0, y: -1 };
    if (e.key === "ArrowDown" && !isVertical) direction = { x: 0, y: 1 };
    if (e.key === "ArrowLeft" && direction.x === 0) direction = { x: -1, y: 0 };
    if (e.key === "ArrowRight" && direction.x === 0) direction = { x: 1, y: 0 };
    if (e.key === "Enter" && gameState !== "PLAYING") startGame();
  }

  function handleTouchStart(e) {
    e.preventDefault();
    const t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      if (gameState !== "PLAYING") startGame();
      return;
    }

    const isVertical = direction.y !== 0;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && direction.x === 0) direction = { x: 1, y: 0 };
      if (dx < 0 && direction.x === 0) direction = { x: -1, y: 0 };
    } else {
      if (dy > 0 && !isVertical) direction = { x: 0, y: 1 };
      if (dy < 0 && !isVertical) direction = { x: 0, y: -1 };
    }
  }

  // Removed fullscreen functionality


  // Game flow
  function startGame() {
    score = 0;
    scoreElement.textContent = score;
    const startPos = Math.floor(gridCount / 2);
    snake = [{ x: startPos, y: startPos }];
    direction = { x: 0, y: 0 };
    generateFood();
    gameState = "PLAYING";
    updateUI();
    lastRenderTime = 0;
    gameCanvas.focus();
    requestAnimationFrame(mainLoop);
  }

  function endGame() {
    gameState = "GAME_OVER";
    saveHighScore();
    updateUI();
  }

  // Init
  function init() {
    loadHighScore();
    resizeCanvas();
    updateUI();
    drawGame();

    window.addEventListener("resize", () => {
      resizeCanvas();
      drawGame();
    });
    window.addEventListener("keydown", handleKey, { passive: false });
    window.addEventListener("keydown", preventScrollWhenGaming, { passive: false });
    gameCanvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    gameCanvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    messageButton.addEventListener("click", startGame);
  }

  init();
});
