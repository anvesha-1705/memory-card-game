# 🧠 Memory Card Match Challenge

A simple, clean browser-based memory matching game — flip cards, find the matching pairs, and beat your best move count. Built with plain HTML, CSS, and JavaScript (no frameworks, no build tools).

## ✨ Features

- **Start screen** with instructions before jumping into the game
- **Three difficulty levels**
  - Easy — 3 pairs (6 cards)
  - Medium — 6 pairs (12 cards)
  - Hard — 8 pairs (16 cards)
- **Random icon selection** — each game picks a random set of emojis from a pool of 10, so the board isn't the same every time
- **Move counter** to track how efficiently you clear the board
- **Sound effects** for flipping, matching, and winning (generated with the Web Audio API — no audio files needed)
- **Win modal** with a "Play Again" option
- Fully responsive, mobile-friendly layout

## 🕹️ How to Play

1. Choose a difficulty level on the start screen
2. Tap any card to flip it face-up
3. Tap a second card to try and find its match
4. Matched pairs stay revealed; unmatched pairs flip back after a short delay
5. Match all pairs to win — try to do it in as few moves as possible!

## 🛠️ Tech Stack

- **HTML5** 
- **CSS3** 
- **Vanilla JavaScript** 

No external libraries or frameworks are used.

## 📂 Project Structure

```
memory-card-game/
├── index.html      # Page structure — start screen, game screen, win modal
├── style.css        # All styling — header, cards, difficulty buttons, modal
├── script.js         # Game logic — shuffling, difficulty handling, match checking, sounds
└── README.md
```

## 🚀 Running Locally

Since this is a static site with no dependencies, you can run it in a couple of ways:

**Option 1 — Just open it**
Double-click `index.html` to open it directly in your browser.

**Option 2 — Local server (recommended)**
```bash
# Using Python
python3 -m http.server 8000

# Then open
http://localhost:8000
```
