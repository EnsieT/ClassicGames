# Classic Games

A collection of 13 browser-based classic games built with vanilla HTML, CSS & JavaScript.  
No dependencies. No build step. Just open `index.html` or deploy to GitHub Pages.

## Games

### Single Player
| Game | Description |
|------|-------------|
| **Tetris** | Stack blocks, clear lines, SRS wall kicks, ghost piece, hold, high scores |
| **Snake** | Eat food, grow longer, avoid walls. Speeds up as you grow |
| **2048** | Slide & merge numbered tiles to reach 2048. Touch supported |
| **Breakout** | Paddle + ball + bricks. Multiple levels, mouse or keyboard |
| **Flappy Bird** | Tap to flap, dodge pipes. Click or spacebar |
| **Minesweeper** | Reveal & flag. Easy (9×9), Medium (16×16), Hard (16×30) |
| **Sudoku** | Generated puzzles at 3 difficulties. Keyboard + click input |
| **Wordle** | Guess the 5-letter word in 6 tries. Stats tracked |
| **Simon Says** | Memorise & repeat color/sound sequences. High scores |

### Two Player (same device)
| Game | Description |
|------|-------------|
| **Tic Tac Toe** | Classic mode + Move Variant (slide pieces after placing — no draws!) |
| **Connect Four** | Drop discs, connect 4 in a row. Session scoreboard |
| **Pong** | W/S vs ↑/↓. Configurable score limit, increasing ball speed |
| **Checkers** | Full rules: jumps, multi-jumps, king promotions |

## Features
- **Zero dependencies** — pure HTML / CSS / JS
- **GitHub Pages ready** — just push and deploy
- **Persistent scores** — high scores & stats saved in `localStorage`
- **Responsive design** — works on desktop & mobile
- **Neon dark theme** — consistent look across all games

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch** → `main` / `root`
4. Your game will be live at `https://<username>.github.io/<repo>/`

## Local Development

Just open `index.html` in any modern browser — no server needed.

```bash
# Or use a simple local server:
npx serve .
```

## License

MIT
