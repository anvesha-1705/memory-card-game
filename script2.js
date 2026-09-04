const phrases = [
      "bread milk sugar tomato carrot",
      "Hornbill festival is celebrated by Nagaland",
      "Bihu is celebrated three times a year",
      "Sikkim holds the majestic peak of Mt. Kanchenjunga",
      "Pehak is a famous dish of Arunachal Pradesh"
    ];

    const distractorWords = ["cat", "dance", "drama", "beautiful", "K2", "Manipur", "coffee", "butter", "five", "month","Assam","Thukpa","Momos","Chura","drink","Meghalaya"];

    let currentPhrase = "";
    let targetWords = [];
    let selectedWords = [];
    let countdown = 5;
    let timerInterval;
    let score = 0;
    
    let currentDifficulty = "medium";
    let memorizeTime = 5;
    let distractorCount = 4;

    const phraseDisplay = document.getElementById("phrase-display");
    const timerElement = document.getElementById("timer");
    const wordBank = document.getElementById("word-bank");
    const answerZone = document.getElementById("answer-zone");
    const submitBtn = document.getElementById("submit-btn");
    const resetBtn = document.getElementById("reset-btn");

    const modalOverlay = document.getElementById("modal-overlay");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const modalCloseBtn = document.getElementById("modal-close-btn");

    const startScreen = document.getElementById("start-screen");
    const gameScoreDisplay = document.getElementById("game-score");
    const startScoreDisplay = document.getElementById("start-score");
    const levelButtons = document.querySelectorAll(".level-btn");

    levelButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const level = e.target.getAttribute("data-level");
        setDifficulty(level);
        startScreen.classList.remove("active");
        startGame();
      });
    });

    function setDifficulty(level) {
      currentDifficulty = level;
      if (level === "easy") {
        memorizeTime = 7;
        distractorCount = 2;
      } else if (level === "medium") {
        memorizeTime = 5;
        distractorCount = 4;
      } else if (level === "hard") {
        memorizeTime = 3;
        distractorCount = 7;
      }
    }

    function showModal(title, message) {
      modalTitle.innerText = title;
      modalMessage.innerText = message;
      modalOverlay.classList.add("active");
    }

    modalCloseBtn.addEventListener("click", () => {
      modalOverlay.classList.remove("active");
      startGame();
    });

    function startGame() {
      // Reset state
      answerZone.innerHTML = "";
      wordBank.innerHTML = "";
      selectedWords = [];
      countdown = memorizeTime;
      submitBtn.disabled = true;

      // Select random phrase
      currentPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      targetWords = currentPhrase.split(" ");
      phraseDisplay.innerText = currentPhrase;
      timerElement.innerText = `Memorize: ${countdown}s`;

      // Start countdown timer
      timerInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          timerElement.innerText = `Memorize: ${countdown}s`;
        } else {
          clearInterval(timerInterval);
          timerElement.innerText = "Reconstruct the phrase!";
          phraseDisplay.innerText = "?"; // Hide the target phrase
          setupWordBank();
        }
      }, 1000);
    }

    function setupWordBank() {
      // Combine target words with distractor words based on difficulty
      const randomDistractors = distractorWords.sort(() => 0.5 - Math.random()).slice(0, distractorCount);
      const pool = [...targetWords, ...randomDistractors].sort(() => 0.5 - Math.random());

      pool.forEach((word) => {
        const btn = document.createElement("button");
        btn.className = "word-btn";
        btn.innerText = word;
        btn.onclick = () => moveToAnswer(btn, word);
        wordBank.appendChild(btn);
      });

      submitBtn.disabled = false;
    }

    function moveToAnswer(buttonElement, word) {
      selectedWords.push(word);
      answerZone.appendChild(buttonElement);
      
      // Clicking in the answer line moves it back to the word bank
      buttonElement.onclick = () => moveToBank(buttonElement, word);
    }

    function moveToBank(buttonElement, word) {
      const index = selectedWords.indexOf(word);
      if (index > -1) {
        selectedWords.splice(index, 1);
      }
      wordBank.appendChild(buttonElement);
      buttonElement.onclick = () => moveToAnswer(buttonElement, word);
    }

    submitBtn.addEventListener("click", () => {
      const userAnswer = selectedWords.join(" ");
      if (userAnswer === currentPhrase) {
        score += 10;
        gameScoreDisplay.innerText = score;
        startScoreDisplay.innerText = score;
        showModal("Success!", "Correct! You earned 10 points!");
      } else {
        showModal("Try Again", "Incorrect answer. Move to next level !");
      }
    });

    resetBtn.addEventListener("click", () => {
      // Move all words back to word bank
      const buttons = Array.from(answerZone.children);
      buttons.forEach(btn => {
        const word = btn.innerText;
        moveToBank(btn, word);
      });
    });