/* ================================================================
   TETRIS  –  Vanilla JS  (GitHub-Pages-ready)
   ================================================================ */

(() => {
  "use strict";

  /* ── Constants ──────────────────────────────────────── */
  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 30;                       // px per cell
  const PREVIEW_BLOCK = 24;
  const EMPTY = 0;
  const HIGH_SCORE_KEY = "tetris_high_scores";
  const MAX_HIGH_SCORES = 5;

  const COLORS = [
    null,       // 0 = empty
    "#00f0f0",  // I  – cyan
    "#f0f000",  // O  – yellow
    "#a000f0",  // T  – purple
    "#00f000",  // S  – green
    "#f00000",  // Z  – red
    "#0000f0",  // J  – blue
    "#f0a000",  // L  – orange
  ];

  // Ghost / shadow alpha
  const GHOST_ALPHA = 0.25;

  /* ── Tetromino shapes (rotation states) ────────────── */
  // Each piece is defined as 4 rotation states, each an array of [row, col] offsets
  const PIECES = {
    I: [
      [[0,0],[0,1],[0,2],[0,3]],
      [[0,0],[1,0],[2,0],[3,0]],
      [[0,0],[0,1],[0,2],[0,3]],
      [[0,0],[1,0],[2,0],[3,0]],
    ],
    O: [
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,0],[0,1],[1,0],[1,1]],
    ],
    T: [
      [[0,1],[1,0],[1,1],[1,2]],
      [[0,0],[1,0],[1,1],[2,0]],
      [[0,0],[0,1],[0,2],[1,1]],
      [[0,1],[1,0],[1,1],[2,1]],
    ],
    S: [
      [[0,1],[0,2],[1,0],[1,1]],
      [[0,0],[1,0],[1,1],[2,1]],
      [[0,1],[0,2],[1,0],[1,1]],
      [[0,0],[1,0],[1,1],[2,1]],
    ],
    Z: [
      [[0,0],[0,1],[1,1],[1,2]],
      [[0,1],[1,0],[1,1],[2,0]],
      [[0,0],[0,1],[1,1],[1,2]],
      [[0,1],[1,0],[1,1],[2,0]],
    ],
    J: [
      [[0,0],[1,0],[1,1],[1,2]],
      [[0,0],[0,1],[1,0],[2,0]],
      [[0,0],[0,1],[0,2],[1,2]],
      [[0,0],[1,0],[2,0],[2,-1]],
    ],
    L: [
      [[0,2],[1,0],[1,1],[1,2]],
      [[0,0],[1,0],[2,0],[2,1]],
      [[0,0],[0,1],[0,2],[1,0]],
      [[0,0],[0,1],[1,1],[2,1]],
    ],
  };

  const PIECE_NAMES = Object.keys(PIECES);
  const PIECE_IDS   = {};    // map name → color index (1-7)
  PIECE_NAMES.forEach((n, i) => (PIECE_IDS[n] = i + 1));

  /* ── Wall-kick data (SRS) ──────────────────────────── */
  const WALL_KICK_JLSTZ = [
    [[ 0, 0],[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],   // 0→1
    [[ 0, 0],[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],   // 1→2
    [[ 0, 0],[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],   // 2→3
    [[ 0, 0],[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],   // 3→0
  ];
  const WALL_KICK_I = [
    [[ 0, 0],[-2, 0],[ 1, 0],[-2,-1],[ 1, 2]],
    [[ 0, 0],[ 2, 0],[-1, 0],[ 2, 1],[-1,-2]],
    [[ 0, 0],[-1, 0],[ 2, 0],[-1, 2],[ 2,-1]],
    [[ 0, 0],[ 1, 0],[-2, 0],[ 1,-2],[-2, 1]],
  ];

  /* ── DOM refs ──────────────────────────────────────── */
  const boardCanvas  = document.getElementById("board");
  const boardCtx     = boardCanvas.getContext("2d");
  const nextCanvas   = document.getElementById("next-canvas");
  const nextCtx      = nextCanvas.getContext("2d");
  const holdCanvas   = document.getElementById("hold-canvas");
  const holdCtx      = holdCanvas.getContext("2d");
  const scoreEl      = document.getElementById("score");
  const levelEl      = document.getElementById("level");
  const linesEl      = document.getElementById("lines");
  const highScoreList= document.getElementById("high-score-list");
  const overlay      = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg   = document.getElementById("overlay-message");
  const gameOverForm = document.getElementById("game-over-form");
  const playerNameIn = document.getElementById("player-name");
  const saveScoreBtn = document.getElementById("save-score-btn");

  /* ── Game state ────────────────────────────────────── */
  let board;        // 2-D array [row][col]
  let score, level, totalLines;
  let currentPiece, currentRotation, currentRow, currentCol;
  let nextPieceName, holdPieceName, canHold;
  let bag = [];     // 7-bag randomiser
  let dropInterval, dropTimer;
  let gameRunning = false;
  let paused = false;
  let animFrameId = null;
  let lastTime = 0;
  let lockDelay = 0;
  const LOCK_DELAY_MAX = 500;   // ms before piece auto-locks

  /* ── Utility helpers ───────────────────────────────── */
  function randomBag() {
    const a = [...PIECE_NAMES];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function nextFromBag() {
    if (bag.length === 0) bag = randomBag();
    return bag.pop();
  }

  function getDropInterval() {
    // Speeds up as level increases (NES-style curve)
    return Math.max(50, 800 - (level - 1) * 70);
  }

  /* ── Board helpers ─────────────────────────────────── */
  function createBoard() {
    return Array.from({ length: ROWS }, () => new Array(COLS).fill(EMPTY));
  }

  function isValid(name, rotation, row, col) {
    const cells = PIECES[name][rotation];
    for (const [r, c] of cells) {
      const nr = row + r;
      const nc = col + c;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
      if (board[nr][nc] !== EMPTY) return false;
    }
    return true;
  }

  function lockPiece() {
    const cells = PIECES[currentPiece][currentRotation];
    const colorId = PIECE_IDS[currentPiece];
    for (const [r, c] of cells) {
      const nr = currentRow + r;
      const nc = currentCol + c;
      if (nr < 0) { gameOver(); return; }
      board[nr][nc] = colorId;
    }
    clearLines();
    spawnPiece();
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(c => c !== EMPTY)) {
        board.splice(r, 1);
        board.unshift(new Array(COLS).fill(EMPTY));
        cleared++;
        r++; // re-check this row
      }
    }
    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800];
      score += (points[cleared] || 800) * level;
      totalLines += cleared;
      level = Math.floor(totalLines / 10) + 1;
      dropInterval = getDropInterval();
      updateHUD();
    }
  }

  function ghostRow() {
    let gr = currentRow;
    while (isValid(currentPiece, currentRotation, gr + 1, currentCol)) gr++;
    return gr;
  }

  /* ── Piece spawning ────────────────────────────────── */
  function spawnPiece() {
    currentPiece = nextPieceName;
    nextPieceName = nextFromBag();
    currentRotation = 0;
    currentRow = 0;
    currentCol = Math.floor((COLS - 3) / 2);
    canHold = true;
    lockDelay = 0;

    if (!isValid(currentPiece, currentRotation, currentRow, currentCol)) {
      gameOver();
    }
    drawNextPreview();
  }

  /* ── Hold ───────────────────────────────────────────── */
  function holdPiece() {
    if (!canHold) return;
    canHold = false;
    if (holdPieceName === null) {
      holdPieceName = currentPiece;
      spawnPiece();
    } else {
      const tmp = holdPieceName;
      holdPieceName = currentPiece;
      currentPiece = tmp;
      currentRotation = 0;
      currentRow = 0;
      currentCol = Math.floor((COLS - 3) / 2);
      lockDelay = 0;
    }
    drawHoldPreview();
  }

  /* ── Movement / rotation ───────────────────────────── */
  function move(dr, dc) {
    if (isValid(currentPiece, currentRotation, currentRow + dr, currentCol + dc)) {
      currentRow += dr;
      currentCol += dc;
      if (dr === 0) lockDelay = 0;   // reset lock delay on horizontal move
      return true;
    }
    return false;
  }

  function rotate(dir) {
    const newRot = (currentRotation + dir + 4) % 4;
    const kicks = currentPiece === "I" ? WALL_KICK_I : WALL_KICK_JLSTZ;
    const kickIndex = currentRotation; // simplistic: use from-state index
    for (const [dr, dc] of kicks[kickIndex]) {
      if (isValid(currentPiece, newRot, currentRow + dr, currentCol + dc)) {
        currentRow += dr;
        currentCol += dc;
        currentRotation = newRot;
        lockDelay = 0;
        return;
      }
    }
  }

  function hardDrop() {
    let rows = 0;
    while (isValid(currentPiece, currentRotation, currentRow + 1, currentCol)) {
      currentRow++;
      rows++;
    }
    score += rows * 2;
    updateHUD();
    lockPiece();
  }

  /* ── Drawing ───────────────────────────────────────── */
  function drawBlock(ctx, x, y, colorIdx, size, alpha = 1) {
    const color = COLORS[colorIdx];
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    // highlight
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
    ctx.fillRect(x * size + 1, y * size + 1, 4, size - 2);
    ctx.globalAlpha = 1;
  }

  function drawBoard() {
    boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    // Grid lines
    boardCtx.strokeStyle = "#222";
    boardCtx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      boardCtx.beginPath();
      boardCtx.moveTo(0, r * BLOCK);
      boardCtx.lineTo(COLS * BLOCK, r * BLOCK);
      boardCtx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      boardCtx.beginPath();
      boardCtx.moveTo(c * BLOCK, 0);
      boardCtx.lineTo(c * BLOCK, ROWS * BLOCK);
      boardCtx.stroke();
    }
    // Locked cells
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (board[r][c] !== EMPTY)
          drawBlock(boardCtx, c, r, board[r][c], BLOCK);

    if (!gameRunning) return;

    // Ghost piece
    const gr = ghostRow();
    const colorId = PIECE_IDS[currentPiece];
    for (const [r, c] of PIECES[currentPiece][currentRotation])
      drawBlock(boardCtx, currentCol + c, gr + r, colorId, BLOCK, GHOST_ALPHA);

    // Current piece
    for (const [r, c] of PIECES[currentPiece][currentRotation])
      drawBlock(boardCtx, currentCol + c, currentRow + r, colorId, BLOCK);
  }

  function drawPreview(ctx, canvas, pieceName) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!pieceName) return;
    const cells = PIECES[pieceName][0];
    const colorId = PIECE_IDS[pieceName];
    // Center the piece in the preview canvas
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const [r, c] of cells) {
      minR = Math.min(minR, r); maxR = Math.max(maxR, r);
      minC = Math.min(minC, c); maxC = Math.max(maxC, c);
    }
    const pw = (maxC - minC + 1) * PREVIEW_BLOCK;
    const ph = (maxR - minR + 1) * PREVIEW_BLOCK;
    const ox = Math.floor((canvas.width - pw) / 2) / PREVIEW_BLOCK - minC;
    const oy = Math.floor((canvas.height - ph) / 2) / PREVIEW_BLOCK - minR;
    for (const [r, c] of cells)
      drawBlock(ctx, c + ox, r + oy, colorId, PREVIEW_BLOCK);
  }

  function drawNextPreview() { drawPreview(nextCtx, nextCanvas, nextPieceName); }
  function drawHoldPreview() { drawPreview(holdCtx, holdCanvas, holdPieceName); }

  function updateHUD() {
    scoreEl.textContent = score.toLocaleString();
    levelEl.textContent = level;
    linesEl.textContent = totalLines;
  }

  /* ── High Scores ───────────────────────────────────── */
  function loadHighScores() {
    try {
      return JSON.parse(localStorage.getItem(HIGH_SCORE_KEY)) || [];
    } catch { return []; }
  }

  function saveHighScores(scores) {
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
  }

  function renderHighScores() {
    const scores = loadHighScores();
    highScoreList.innerHTML = "";
    if (scores.length === 0) {
      highScoreList.innerHTML = "<li style='color:#555'>No scores yet</li>";
      return;
    }
    for (const entry of scores) {
      const li = document.createElement("li");
      li.textContent = `${entry.name} — ${entry.score.toLocaleString()}`;
      highScoreList.appendChild(li);
    }
  }

  function isHighScore(val) {
    const scores = loadHighScores();
    return scores.length < MAX_HIGH_SCORES || val > (scores[scores.length - 1]?.score ?? 0);
  }

  function addHighScore(name, val) {
    const scores = loadHighScores();
    scores.push({ name: name || "AAA", score: val, date: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score);
    if (scores.length > MAX_HIGH_SCORES) scores.length = MAX_HIGH_SCORES;
    saveHighScores(scores);
    renderHighScores();
  }

  /* ── Game lifecycle ────────────────────────────────── */
  function startGame() {
    board = createBoard();
    score = 0; level = 1; totalLines = 0;
    holdPieceName = null;
    bag = [];
    nextPieceName = nextFromBag();
    dropInterval = getDropInterval();
    dropTimer = 0;
    paused = false;
    gameRunning = true;

    spawnPiece();
    drawHoldPreview();
    updateHUD();
    overlay.classList.add("hidden");
    gameOverForm.classList.add("hidden");

    lastTime = performance.now();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animFrameId);
    drawBoard();

    overlayTitle.textContent = "GAME OVER";
    if (isHighScore(score)) {
      overlayMsg.textContent = `Score: ${score.toLocaleString()} — New High Score!`;
      gameOverForm.classList.remove("hidden");
      playerNameIn.value = "";
      playerNameIn.focus();
    } else {
      overlayMsg.textContent = `Score: ${score.toLocaleString()} — Click or press ENTER to Retry`;
      gameOverForm.classList.add("hidden");
    }
    overlay.classList.remove("hidden");
  }

  function togglePause() {
    if (!gameRunning) return;
    paused = !paused;
    if (paused) {
      overlayTitle.textContent = "PAUSED";
      overlayMsg.textContent = "Press P to Resume";
      gameOverForm.classList.add("hidden");
      overlay.classList.remove("hidden");
    } else {
      overlay.classList.add("hidden");
      lastTime = performance.now();
      animFrameId = requestAnimationFrame(gameLoop);
    }
  }

  /* ── Game loop ─────────────────────────────────────── */
  function gameLoop(timestamp) {
    if (paused || !gameRunning) return;

    const dt = timestamp - lastTime;
    lastTime = timestamp;
    dropTimer += dt;

    // Check if piece is resting on surface
    const onSurface = !isValid(currentPiece, currentRotation, currentRow + 1, currentCol);
    if (onSurface) {
      lockDelay += dt;
      if (lockDelay >= LOCK_DELAY_MAX) {
        lockPiece();
        dropTimer = 0;
      }
    }

    // Normal gravity
    if (dropTimer >= dropInterval) {
      dropTimer = 0;
      if (!onSurface) move(1, 0);
    }

    drawBoard();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  /* ── Input handling ────────────────────────────────── */
  document.addEventListener("keydown", (e) => {
    // --- Overlay / menu ---
    if (!gameRunning && !paused) {
      if (e.key === "Enter") {
        // If the form is visible and score qualifies, save first
        if (!gameOverForm.classList.contains("hidden")) {
          submitScore();
          return;
        }
        startGame();
      }
      return;
    }

    if (e.key === "p" || e.key === "P") { togglePause(); return; }
    if (paused) return;

    switch (e.key) {
      case "ArrowLeft":  move(0, -1); break;
      case "ArrowRight": move(0,  1); break;
      case "ArrowDown":
        if (move(1, 0)) { score += 1; updateHUD(); }
        break;
      case "ArrowUp":    rotate(1); break;
      case " ":          hardDrop(); break;
      case "c": case "C": holdPiece(); break;
    }
    e.preventDefault();
  });

  /* Save-score button & Enter in input */
  function submitScore() {
    const name = playerNameIn.value.trim() || "AAA";
    addHighScore(name, score);
    gameOverForm.classList.add("hidden");
    overlayMsg.textContent = "Click or press ENTER to Play Again";
  }

  saveScoreBtn.addEventListener("click", submitScore);
  playerNameIn.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.stopPropagation(); submitScore(); }
  });

  /* Click overlay to start/restart game (mobile support) */
  overlay.addEventListener("click", () => {
    if (!gameRunning && !paused) {
      if (!gameOverForm.classList.contains("hidden")) {
        // Don't start game if form is visible - let user save score first
        return;
      }
      startGame();
    }
  });

  /* ── Mobile touch controls ─────────────────────────── */
  (function initMobileControls() {
    const mc = document.getElementById("mobile-controls");
    if (!mc) return;

    // Prevent scrolling on board canvas touch
    boardCanvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
    boardCanvas.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

    let repeatTimer = null;
    function clearRepeat() {
      if (repeatTimer) { clearInterval(repeatTimer); repeatTimer = null; }
    }

    mc.querySelectorAll(".mc-btn").forEach(btn => {
      const action = btn.dataset.action;
      const repeatable = action === "left" || action === "right" || action === "down";

      function doAction() {
        if (!gameRunning || paused) return;
        switch (action) {
          case "left":   move(0, -1); break;
          case "right":  move(0,  1); break;
          case "down":   if (move(1, 0)) { score += 1; updateHUD(); } break;
          case "rotate": rotate(1); break;
          case "drop":   hardDrop(); break;
          case "hold":   holdPiece(); break;
          case "pause":  togglePause(); break;
        }
      }

      btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        // Start game if not running
        if (!gameRunning && !paused) {
          if (!gameOverForm.classList.contains("hidden")) return;
          startGame();
          return;
        }
        if (action === "pause") { togglePause(); return; }
        if (paused) return;
        doAction();
        if (repeatable) {
          clearRepeat();
          repeatTimer = setInterval(doAction, 85);
        }
      });

      btn.addEventListener("touchend", (e) => { e.preventDefault(); clearRepeat(); });
      btn.addEventListener("touchcancel", clearRepeat);

      // Click fallback for desktop testing
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!gameRunning && !paused) {
          if (!gameOverForm.classList.contains("hidden")) return;
          startGame();
          return;
        }
        if (action === "pause") { togglePause(); return; }
        if (paused) return;
        doAction();
      });
    });
  })();

  /* ── Reset button ───────────────────────────────────── */
  document.getElementById("reset-btn").addEventListener("click",()=>startGame());

  /* ── Init ──────────────────────────────────────────── */
  renderHighScores();
  drawBoard();   // draw empty board behind overlay
})();
