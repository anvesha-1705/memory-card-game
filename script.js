let audioCtx = null;

// Initialize or resume AudioContext
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Global click/touch listener 
function unlockAudio() {
  getAudioContext();
}
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

// Generic synth tone generator 
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
  playTone(400, 0.1, 'sine', 1.5);
}

// Sweet two-note chime for matching pairs 
function playMatchSound() {
  playTone(523.25, 0.2, 'sine', 1.5);
  setTimeout(() => playTone(659.25, 0.3, 'sine', 1.5), 120);
}

// Adorable three-note victory fanfare (C5 -> E5 -> G5)
function playWinSound() {
  playTone(523.25, 0.2, 'triangle', 1.5);
  setTimeout(() => playTone(659.25, 0.2, 'triangle', 1.5), 150);
  setTimeout(() => playTone(783.99, 0.4, 'triangle', 1.5), 300);
}

function showStartScreen() {
  document.getElementById('gameScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'block';
}

// Game State Setup — pool of 10 possible icons
const iconPool = ['🏆', '🌸', '🍎', '👖', '☕', '🥐', '🔑', '🎈', '🍕', '🎧'];

// Difficulty → kitne pairs aur grid columns
const difficultySettings = {
  easy:   { pairs: 3, cols: 3 },
  medium: { pairs: 6, cols: 4 },
  hard:   { pairs: 8, cols: 4 }
};

let currentDifficulty = 'easy';
let icons = [];        // is game ke liye chuni gayi icons
let cardDeck = [];
let flippedCards = [];
let lockBoard = false;
let mat;
let flipCount = 0;
let patientId = 1;
let gameSessionId = null;
let gameStartTime = null;
let mistakes = 0;

// Fisher-Yates array shuffle
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

async function startGame(difficulty) {
  if (difficulty) {
    currentDifficulty = difficulty;
  }

  try {
    const response = await fetch('http://127.0.0.1:5000/api/game/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patient_id: patientId,
        game_type: 'memory_card',
        difficulty: currentDifficulty
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || 'Unable to start game');
      return;
    }

    gameSessionId = data.session_id;

    console.log('Game session started:', gameSessionId);

    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';

    initGame();

  } catch (error) {
    console.error('Error starting game:', error);
    alert('Could not connect to the game server.');
  }
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

  // Difficulty ke hisaab se random N icons uthao pool mein se
  const { pairs, cols } = difficultySettings[currentDifficulty];
  icons = shuffle([...iconPool]).slice(0, pairs);
  cardDeck = [...icons, ...icons];
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  board.innerHTML = '';
  flippedCards = [];
  lockBoard = false;
  matchedPairsCount = 0;
  flipCount = 0;
  mistakes = 0;
  gameStartTime = Date.now();

updateCounterDisplay();
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

async function completeGame() {
  const timeTaken = (Date.now() - gameStartTime) / 1000;

  const moves = flipCount / 2;

  const accuracy = moves > 0
    ? ((moves - mistakes) / moves) * 100
    : 0;

  const score = Math.max(
    0,
    Math.round(1000 - (mistakes * 100) - (timeTaken * 5))
  );

  const gameResults = {
    session_id: gameSessionId,
    moves: moves,
    time_taken: Number(timeTaken.toFixed(2)),
    mistakes: mistakes,
    score: score,
    accuracy: Number(accuracy.toFixed(2)),
    completed: 1
  };

  console.log("Game results:", gameResults);

  try {
    const response = await fetch('http://127.0.0.1:5000/api/game/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gameResults)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed to save game:", data);
      return;
    }

    console.log("Game saved successfully:", data);

  } catch (error) {
    console.error("Error saving game:", error);
  }
}

// Validate matching pairs
function checkMatch() {
  lockBoard = true;

  // Two cards have been attempted → count one move
  const moves = flipCount / 2;

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
        setTimeout(async () => {
        playWinSound();
        await completeGame();

        const modal = document.getElementById('successModal');
        if (modal) {
          modal.style.display = 'flex';
        }
      }, 500);
    }
  } else {
    mistakes++;

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