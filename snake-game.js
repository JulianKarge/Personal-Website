document.addEventListener("DOMContentLoaded", () => {
  const SNAKE_HEAD_IMAGE_PATH = "Images/snake-head-placeholder.png";
  const FOOD_IMAGE_PATH = "Images/food-placeholder.png";
  const SNAKE_COLOR = "#d1d5db";

  const gameCanvas = document.getElementById("snakeCanvas");
  if (!gameCanvas) return;
  const ctx = gameCanvas.getContext("2d");

  // UI Elements
  const scoreElement = document.getElementById("gameScore");
  const personalHighScoreElement = document.getElementById("personalHighScore");
  const originalCanvasParent = document.getElementById("canvas-wrapper");
  const messageOverlay = document.getElementById("messageOverlay");
  const messageTitle = document.getElementById("messageTitle");
  const messageScore = document.getElementById("messageScore");
  const finalScoreElement = document.getElementById("finalScore");
  const messageButton = document.getElementById("messageButton");
  const expandBtn = document.getElementById("expand-game-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const modalBackdrop = document.getElementById("game-modal-backdrop");
  const modalCanvasWrapper = document.getElementById("modal-canvas-wrapper");
  const modalScoreElement = document.getElementById("modal-score");
  const modalPersonalHsElement = document.getElementById("modal-personal-hs");

  const TILE_SIZE_NORMAL = 25, TILE_SIZE_MODAL = 40;
  let tileSize = TILE_SIZE_NORMAL;
  let isModalOpen = false;
  let snake, food, score, direction, personalHighScore;
  let touchStartX = 0, touchStartY = 0;
  let gameState = 'IDLE'; // 'IDLE', 'PLAYING', 'GAME_OVER'

  const snakeHeadImg = new Image(), foodImg = new Image();
  snakeHeadImg.src = SNAKE_HEAD_IMAGE_PATH;
  foodImg.src = FOOD_IMAGE_PATH;

  function loadPersonalHighScore() {
    personalHighScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    personalHighScoreElement.textContent = personalHighScore;
    modalPersonalHsElement.textContent = personalHighScore;
  }

  function savePersonalHighScore() {
    if (score > personalHighScore) {
      personalHighScore = score;
      localStorage.setItem('snakeHighScore', personalHighScore);
      personalHighScoreElement.textContent = personalHighScore;
      modalPersonalHsElement.textContent = personalHighScore;
    }
  }

  function updateUI() {
    if (gameState === 'PLAYING') {
      messageOverlay.classList.add('hidden');
    } else {
      if (gameState === 'IDLE') {
        messageTitle.textContent = "SNAKE";
        messageTitle.classList.remove('mb-2');
        messageTitle.classList.add('mb-8');
        messageScore.classList.add('hidden');
        messageButton.textContent = "Start";
      } else if (gameState === 'GAME_OVER') {
        finalScoreElement.textContent = score;
        messageTitle.textContent = "Game Over";
        messageTitle.classList.remove('mb-8');
        messageTitle.classList.add('mb-2');
        messageScore.classList.remove('hidden');
        messageButton.textContent = "Play Again";
      }
      messageOverlay.classList.remove('hidden');
    }
  }

  function openModal() {
    isModalOpen = true;
    tileSize = TILE_SIZE_MODAL;
    modalBackdrop.classList.remove('hidden');
    modalCanvasWrapper.appendChild(messageOverlay);
    modalCanvasWrapper.appendChild(gameCanvas);
    modalPersonalHsElement.textContent = personalHighScoreElement.textContent;
    updateUI();
    resizeCanvas();
    draw();
  }

  function closeModal() {
    isModalOpen = false;
    tileSize = TILE_SIZE_NORMAL;
    modalBackdrop.classList.add('hidden');
    originalCanvasParent.appendChild(messageOverlay);
    originalCanvasParent.appendChild(gameCanvas);
    updateUI();
    resizeCanvas();
    draw();
  }

  // DEFINITIVE SIZING FIX
  function resizeCanvas() {
    let size;
    if (isModalOpen) {
      // For the modal, create a perfect square that fits
      const container = modalCanvasWrapper;
      size = Math.min(container.clientWidth, container.clientHeight);
    } else {
      // For the default mobile/desktop view, just fill the container width
      const container = originalCanvasParent;
      size = container.clientWidth;
    }
    gameCanvas.width = size;
    gameCanvas.height = size;
  }

  function generateFood() {
    food = getRandomTile();
    while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
      food = getRandomTile();
    }
  }
  
  function getRandomTile() {
    const gridSize = Math.floor(gameCanvas.width / tileSize);
    return { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
  }

  function draw() {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    const gridSize = Math.floor(gameCanvas.width / tileSize);
    ctx.strokeStyle = "rgba(75, 85, 99, 0.2)";
    for (let i = 0; i <= gridSize; i++) {
        const pos = i * tileSize;
        ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, gameCanvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(gameCanvas.width, pos); ctx.stroke();
    }
    if (gameState === 'PLAYING' && snake) {
      ctx.fillStyle = SNAKE_COLOR;
      for (let i = 1; i < snake.length; i++) {
        ctx.fillRect(snake[i].x * tileSize, snake[i].y * tileSize, tileSize, tileSize);
      }
      if (snake.length > 0) ctx.drawImage(snakeHeadImg, snake[0].x * tileSize, snake[0].y * tileSize, tileSize, tileSize);
      if(food) ctx.drawImage(foodImg, food.x * tileSize, food.y * tileSize, tileSize, tileSize);
    }
  }
  
  function update() {
    if (gameState !== 'PLAYING') return;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const gridSize = Math.floor(gameCanvas.width / tileSize);
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) { endGame(); return; }
    for (let i = 1; i < snake.length; i++) { if (head.x === snake[i].x && head.y === snake[i].y) { endGame(); return; }}
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreElement.textContent = score;
      modalScoreElement.textContent = score;
      generateFood();
    } else {
      snake.pop();
    }
  }

  function gameLoop() {
    if (gameState !== 'PLAYING') return;
    update();
    draw();
    setTimeout(gameLoop, 120);
  }
  
  function startGame() {
    gameState = 'PLAYING';
    score = 0;
    scoreElement.textContent = score;
    modalScoreElement.textContent = score;
    const gridSize = Math.floor(gameCanvas.width / tileSize);
    const startPos = Math.floor(gridSize / 2);
    snake = [{ x: startPos, y: startPos }];
    direction = { x: 0, y: 0 };
    generateFood();
    updateUI();
    gameLoop();
  }
  
  function endGame() {
    gameState = 'GAME_OVER';
    savePersonalHighScore();
    updateUI();
  }

  function handleKeyDown(e) {
    const relevantKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape"];
    if (relevantKeys.includes(e.key)) e.preventDefault();
    if (isModalOpen && e.key === 'Escape') { closeModal(); return; }
    if (gameState !== 'PLAYING' && e.key === 'Enter') { startGame(); return; }
    if(gameState !== 'PLAYING') return;
    const isMovingVertically = direction.y !== 0;
    switch (e.key) {
      case "ArrowUp": if (!isMovingVertically) direction = { x: 0, y: -1 }; break;
      case "ArrowDown": if (!isMovingVertically) direction = { x: 0, y: 1 }; break;
      case "ArrowLeft": if (direction.x === 0) direction = { x: -1, y: 0 }; break;
      case "ArrowRight": if (direction.x === 0) direction = { x: 1, y: 0 }; break;
    }
  }

  function handleTouchStart(e) {
      e.preventDefault();
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
  }

  function handleTouchEnd(e) {
      e.preventDefault();
      if (gameState !== 'PLAYING') {
          if(Math.abs(e.changedTouches[0].screenX - touchStartX) < 20 && Math.abs(e.changedTouches[0].screenY - touchStartY) < 20) {
              startGame();
          }
          return;
      };
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      const isMovingVertically = direction.y !== 0;
      if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0 && direction.x === 0) direction = { x: 1, y: 0 };
          else if (dx < 0 && direction.x === 0) direction = { x: -1, y: 0 };
      } else {
          if (dy > 0 && !isMovingVertically) direction = { x: 0, y: 1 };
          else if (dy < 0 && !isMovingVertically) direction = { x: 0, y: -1 };
      }
  }

  function init() {
    messageButton.addEventListener("click", startGame);
    expandBtn.addEventListener("click", openModal);
    closeModalBtn.addEventListener("click", closeModal);
    document.addEventListener("keydown", handleKeyDown);
    gameCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('resize', () => { resizeCanvas(); draw(); });
    
    loadPersonalHighScore();
    updateUI();
    resizeCanvas();
    draw();
  }

  init();
});