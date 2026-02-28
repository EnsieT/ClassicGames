/* ================================================================
   TIC TAC TOE  –  Classic + Move Variant
   ================================================================ */
(() => {
  "use strict";

  /* ── Constants ──────────────────────────────────────── */
  const X = "X";
  const O = "O";
  const EMPTY = "";
  const WIN_LINES = [
    [0,1,2],[3,4,5],[6,7,8],   // rows
    [0,3,6],[1,4,7],[2,5,8],   // cols
    [0,4,8],[2,4,6],           // diags
  ];
  const MAX_PIECES = 3; // pieces per player in Move variant

  /* ── DOM refs ──────────────────────────────────────── */
  const modeSelect     = document.getElementById("mode-select");
  const gameArea       = document.getElementById("game-area");
  const boardEl        = document.getElementById("board");
  const modeBadge      = document.getElementById("mode-badge");
  const phaseBadge     = document.getElementById("phase-badge");
  const turnIndicator  = document.getElementById("turn-indicator");
  const resultOverlay  = document.getElementById("result-overlay");
  const resultText     = document.getElementById("result-text");
  const playAgainBtn   = document.getElementById("play-again-btn");
  const changeModeBtn  = document.getElementById("change-mode-btn");
  const resetScoresBtn = document.getElementById("reset-scores-btn");
  const scoreXEl       = document.getElementById("score-x");
  const scoreOEl       = document.getElementById("score-o");
  const scoreDrawEl    = document.getElementById("score-draw");

  /* ── State ─────────────────────────────────────────── */
  let mode = "classic";       // "classic" | "move"
  let cells = [];             // DOM cell elements
  let grid  = [];             // 9-element flat array: "", "X", or "O"
  let turn  = X;
  let gameOver = false;
  let scores = { X: 0, O: 0, draw: 0 };

  // Move-variant state
  let phase = "placing";      // "placing" | "moving"
  let placedCount = { X: 0, O: 0 };
  let selectedIndex = -1;     // which piece is selected for moving

  /* ── Adjacency map (king moves on 3×3 grid) ────────── */
  function getAdjacent(idx) {
    const r = Math.floor(idx / 3), c = idx % 3;
    const adj = [];
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) adj.push(nr * 3 + nc);
      }
    return adj;
  }

  /* ── Helpers ───────────────────────────────────────── */
  function checkWin(g, player) {
    for (const line of WIN_LINES)
      if (line.every(i => g[i] === player)) return line;
    return null;
  }

  function isBoardFull(g) {
    return g.every(c => c !== EMPTY);
  }

  function switchTurn() {
    turn = turn === X ? O : X;
    updateTurnDisplay();
  }

  function updateTurnDisplay() {
    turnIndicator.textContent = `${turn}'s turn`;
    turnIndicator.style.color = turn === X ? "#00e5ff" : "#f06292";
  }

  function updateScoreboard() {
    scoreXEl.textContent = scores.X;
    scoreOEl.textContent = scores.O;
    scoreDrawEl.textContent = scores.draw;
  }

  function showResult(msg) {
    resultText.textContent = msg;
    resultOverlay.classList.remove("hidden");
    gameOver = true;
  }

  /* ── Board rendering ───────────────────────────────── */
  function buildBoard() {
    boardEl.innerHTML = "";
    cells = [];
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.index = i;
      cell.addEventListener("click", () => onCellClick(i));
      boardEl.appendChild(cell);
      cells.push(cell);
    }
  }

  function renderBoard() {
    for (let i = 0; i < 9; i++) {
      const cell = cells[i];
      cell.textContent = grid[i];
      cell.className = "cell";

      if (grid[i] === X) cell.classList.add("x", "taken");
      else if (grid[i] === O) cell.classList.add("o", "taken");
    }
  }

  /* ── Highlight helpers for Move mode ───────────────── */
  function clearHighlights() {
    cells.forEach(c => {
      c.classList.remove("selectable", "selected", "move-target", "disabled");
    });
  }

  function highlightSelectablePieces() {
    clearHighlights();
    for (let i = 0; i < 9; i++) {
      if (grid[i] === turn) cells[i].classList.add("selectable");
      else if (grid[i] !== EMPTY) cells[i].classList.add("disabled");
    }
  }

  function highlightMoveTargets(fromIdx) {
    clearHighlights();
    cells[fromIdx].classList.add("selected");
    // Allow move to any empty cell (not just adjacent) for more strategic play
    for (let i = 0; i < 9; i++) {
      if (grid[i] === EMPTY) cells[i].classList.add("move-target");
    }
    // Disable opponent pieces
    for (let i = 0; i < 9; i++) {
      if (grid[i] !== EMPTY && i !== fromIdx) cells[i].classList.add("disabled");
    }
  }

  /* ── Win / draw check after any change ─────────────── */
  function evalBoard() {
    const winLine = checkWin(grid, turn);
    if (winLine) {
      renderBoard();
      winLine.forEach(i => {
        cells[i].classList.add("win-cell");
      });
      scores[turn]++;
      updateScoreboard();
      showResult(`${turn} Wins!`);
      return true;
    }
    // Draw only possible in classic (move variant keeps going)
    if (mode === "classic" && isBoardFull(grid)) {
      renderBoard();
      scores.draw++;
      updateScoreboard();
      showResult("It's a Draw!");
      return true;
    }
    return false;
  }

  /* ── Cell click handler ────────────────────────────── */
  function onCellClick(idx) {
    if (gameOver) return;

    if (mode === "classic") {
      classicClick(idx);
    } else {
      moveClick(idx);
    }
  }

  /* ── Classic mode ──────────────────────────────────── */
  function classicClick(idx) {
    if (grid[idx] !== EMPTY) return;
    grid[idx] = turn;
    renderBoard();
    if (!evalBoard()) switchTurn();
  }

  /* ── Move mode ─────────────────────────────────────── */
  function moveClick(idx) {
    if (phase === "placing") {
      movePlacingClick(idx);
    } else {
      moveMovingClick(idx);
    }
  }

  function movePlacingClick(idx) {
    if (grid[idx] !== EMPTY) return;
    grid[idx] = turn;
    placedCount[turn]++;
    renderBoard();

    if (evalBoard()) return;

    switchTurn();

    // Check if both players have placed all pieces
    if (placedCount[X] >= MAX_PIECES && placedCount[O] >= MAX_PIECES) {
      phase = "moving";
      phaseBadge.textContent = "MOVING";
      highlightSelectablePieces();
    }
  }

  function moveMovingClick(idx) {
    if (selectedIndex === -1) {
      // Select own piece
      if (grid[idx] !== turn) return;
      selectedIndex = idx;
      highlightMoveTargets(idx);
    } else {
      // Clicking the same piece — deselect
      if (idx === selectedIndex) {
        selectedIndex = -1;
        highlightSelectablePieces();
        return;
      }
      // Clicking another own piece — switch selection
      if (grid[idx] === turn) {
        selectedIndex = idx;
        highlightMoveTargets(idx);
        return;
      }
      // Must be an empty cell to move to
      if (grid[idx] !== EMPTY) return;

      // Perform the move
      grid[idx] = turn;
      grid[selectedIndex] = EMPTY;
      selectedIndex = -1;
      renderBoard();

      if (evalBoard()) return;

      switchTurn();
      highlightSelectablePieces();
    }
  }

  /* ── Game init / reset ─────────────────────────────── */
  function initGame() {
    grid = Array(9).fill(EMPTY);
    turn = X;
    gameOver = false;
    phase = "placing";
    placedCount = { X: 0, O: 0 };
    selectedIndex = -1;
    resultOverlay.classList.add("hidden");

    modeBadge.textContent = mode === "classic" ? "CLASSIC" : "MOVE VARIANT";

    if (mode === "move") {
      phaseBadge.textContent = "PLACING";
      phaseBadge.classList.remove("hidden");
    } else {
      phaseBadge.classList.add("hidden");
    }

    buildBoard();
    renderBoard();
    updateTurnDisplay();
    updateScoreboard();
  }

  /* ── Mode selection ────────────────────────────────── */
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      modeSelect.classList.add("hidden");
      gameArea.classList.remove("hidden");
      initGame();
    });
  });

  /* ── Buttons ───────────────────────────────────────── */
  playAgainBtn.addEventListener("click", () => initGame());

  changeModeBtn.addEventListener("click", () => {
    gameArea.classList.add("hidden");
    modeSelect.classList.remove("hidden");
    scores = { X: 0, O: 0, draw: 0 };
  });

  resetScoresBtn.addEventListener("click", () => {
    scores = { X: 0, O: 0, draw: 0 };
    updateScoreboard();
  });
})();
