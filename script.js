const icons = ['🍎', '🔑', '🌸'];
let cardDeck = [...icons, ...icons];

let flippedCards = [];
let lockBoard = false;
let matchedPairsCount = 0; // Track matched pairs

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function initGame() {
  const board = document.getElementById('board');
  const modal = document.getElementById('successModal');
  
  board.innerHTML = '';
  flippedCards = [];
  lockBoard = false;
  matchedPairsCount = 0;
  
  // Hide success screen when game starts/restarts
  modal.style.display = 'none';

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

function flipCard(card) {
  if (lockBoard || flippedCards.includes(card) || card.textContent !== '?') return;

  card.textContent = card.getAttribute('data-icon');
  card.style.backgroundColor = "#FFFFFF";
  card.style.color = "#2E2E2E";

  flippedCards.push(card);

  if (flippedCards.length === 2) {
    checkMatch();
  }
}

function checkMatch() {
  lockBoard = true;
  const [card1, card2] = flippedCards;

  const isMatch = card1.getAttribute('data-icon') === card2.getAttribute('data-icon');

  if (isMatch) {
    flippedCards = [];
    lockBoard = false;
    matchedPairsCount++;

    // Check if all 3 pairs are matched!
    if (matchedPairsCount === icons.length) {
      setTimeout(() => {
        document.getElementById('successModal').style.display = 'flex';
      }, 500);
    }
  } else {
    setTimeout(() => {
      card1.textContent = '?';
      card1.style.backgroundColor = '#176B5B';
      card1.style.color = '#FFFFFF';

      card2.textContent = '?';
      card2.style.backgroundColor = '#176B5B';
      card2.style.color = '#FFFFFF';

      flippedCards = [];
      lockBoard = false;
    }, 1000);
  }
}

initGame();