// Global AudioContext variable
let audioCtx = null;

// Initialize or resume AudioContext safely on the very first user interaction
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Global click/touch listener to unlock audio on strict browsers (like Brave/Safari)
function unlockAudio() {
  getAudioContext();
}
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

// Generic synth tone generator for smooth, instant sounds
function playTone(freq, duration, type = 'sine', gainVal = 0.5) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.log('Audio playback waiting for interaction:', e);
  }
}

// Soft wooden click tone for card flip
function playFlipSound() {
  playTone(400, 0.1, 'sine', 0.5);
}

// Sweet two-note chime for matching pairs (C5 -> E5)
function playMatchSound() {
  playTone(523.25, 0.2, 'sine', 0.45);
  setTimeout(() => playTone(659.25, 0.3, 'sine', 0.45), 120);
}

// Adorable three-note victory fanfare (C5 -> E5 -> G5)
function playWinSound() {
  playTone(523.25, 0.2, 'triangle', 0.5);
  setTimeout(() => playTone(659.25, 0.2, 'triangle', 0.5), 150);
  setTimeout(() => playTone(783.99, 0.4, 'triangle', 0.5), 300);
}

// Game State Setup
const icons = ['🍎', '🔑', '🌸'];
let cardDeck = [...icons, ...icons];
let flippedCards = [];
let lockBoard = false;
let matchedPairsCount = 0;
let flipCount = 0;

// Fisher-Yates array shuffle
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Update the move counter text on screen
function updateCounterDisplay() {
  const counterElement = document.getElementById('flip-count');
  if (counterElement) {
    counterElement.textContent = `| Moves: ${flipCount}`;
  }
}

// Initialize and reset game board state
function initGame() {
  const board = document.getElementById('board');
  const modal = document.getElementById('successModal');

  board.innerHTML = '';
  flippedCards = [];
  lockBoard = false;
  matchedPairsCount = 0;
  flipCount = 0;

  updateCounterDisplay();

  if (modal) {
    modal.style.display = 'none';
  }

  const shuffledDeck = shuffle([...cardDeck]);

  shuffledDeck.forEach((icon) => {
    const card = document.createElement('button');
    card.classList.add('memory-card');
    card.setAttribute('data-icon', icon);
    card.textContent = '?';

    card.addEventListener('click', () => flipCard(card));
    board.appendChild(card);
  });
}

// Handle card tap
function flipCard(card) {
  if (
    lockBoard ||
    flippedCards.includes(card) ||
    card.classList.contains('flipped') ||
    card.classList.contains('matched')
  ) {
    return;
  }

  playFlipSound();
  flipCount++;
  updateCounterDisplay();

  card.classList.add('flipped');
  card.textContent = card.getAttribute('data-icon');
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    checkMatch();
  }
}

// Validate matching pairs
function checkMatch() {
  lockBoard = true;
  const [card1, card2] = flippedCards;
  const isMatch = card1.getAttribute('data-icon') === card2.getAttribute('data-icon');

  if (isMatch) {
    playMatchSound();
    card1.classList.add('matched');
    card2.classList.add('matched');
    flippedCards = [];
    lockBoard = false;
    matchedPairsCount++;

    if (matchedPairsCount === icons.length) {
      setTimeout(() => {
        playWinSound();
        const modal = document.getElementById('successModal');
        if (modal) {
          modal.style.display = 'flex';
        }
      }, 500);
    }
  } else {
    setTimeout(() => {
      card1.classList.remove('flipped');
      card1.textContent = '?';
      card2.classList.remove('flipped');
      card2.textContent = '?';
      flippedCards = [];
      lockBoard = false;
    }, 1000);
  }
}

// Start game when script loads
initGame();