// Game state
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let gameStarted = false;
let startTime = null;
let timerInterval = null;
let currentDifficulty = 'easy';
let canFlip = true;
let soundEnabled = true;

// Card symbols
const easySymbols = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺'];
const mediumSymbols = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺', '🎹', '🎻', '🎬', '🎤'];
const hardSymbols = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺', '🎹', '🎻', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎙️', '🎗️'];

// Elements
const gameBoard = document.getElementById('gameBoard');
const timeEl = document.getElementById('time');
const movesEl = document.getElementById('moves');
const bestMovesEl = document.getElementById('bestMoves');
const startBtn = document.getElementById('startBtn');
const resetProgressBtn = document.getElementById('resetProgressBtn');
const soundToggle = document.getElementById('soundToggle');
const winModal = document.getElementById('winModal');
const finalTimeEl = document.getElementById('finalTime');
const finalMovesEl = document.getElementById('finalMoves');
const newRecordText = document.getElementById('newRecordText');

// Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Load best scores
loadBestScores();

// Sound toggle
soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
});

// Sound effects
function playSound(frequency, duration) {
    if (!soundEnabled) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Difficulty selection
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (gameStarted) {
            if (!confirm('Đang trong trận đấu! Bạn có chắc muốn đổi độ khó?')) {
                return;
            }
        }

        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.level;
        gameBoard.className = `game-board ${currentDifficulty}`;
        resetGame();
    });
});

// Initialize game
function initGame() {
    let symbols;
    switch (currentDifficulty) {
        case 'easy': symbols = easySymbols; break;
        case 'medium': symbols = mediumSymbols; break;
        case 'hard': symbols = hardSymbols; break;
    }

    // Create pairs
    cards = [...symbols, ...symbols]
        .map((symbol, index) => ({ id: index, symbol, matched: false }))
        .sort(() => Math.random() - 0.5);

    // Reset state
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    movesEl.textContent = moves;
    gameStarted = true;
    canFlip = true;

    // Timer
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);

    // Render cards
    renderCards();
}

function renderCards() {
    gameBoard.innerHTML = '';
    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.index = index;

        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        cardBack.textContent = '?';

        cardEl.appendChild(cardBack);
        cardEl.addEventListener('click', () => flipCard(index));
        gameBoard.appendChild(cardEl);
    });
}

function flipCard(index) {
    if (!canFlip || flippedCards.length === 2) return;

    const card = cards[index];
    const cardEl = gameBoard.children[index];

    if (card.matched || flippedCards.includes(index)) return;

    // Flip card
    cardEl.classList.add('flipped');
    cardEl.querySelector('.card-back').textContent = card.symbol;
    flippedCards.push(index);
    playSound(600, 0.1);

    if (flippedCards.length === 2) {
        moves++;
        movesEl.textContent = moves;
        canFlip = false;
        checkMatch();
    }
}

function checkMatch() {
    const [index1, index2] = flippedCards;
    const card1 = cards[index1];
    const card2 = cards[index2];

    if (card1.symbol === card2.symbol) {
        // Match!
        setTimeout(() => {
            card1.matched = true;
            card2.matched = true;
            gameBoard.children[index1].classList.add('matched');
            gameBoard.children[index2].classList.add('matched');
            matchedPairs++;
            playSound(800, 0.2);

            flippedCards = [];
            canFlip = true;

            // Check win
            if (matchedPairs === cards.length / 2) {
                setTimeout(() => winGame(), 500);
            }
        }, 500);
    } else {
        // No match
        setTimeout(() => {
            gameBoard.children[index1].classList.remove('flipped');
            gameBoard.children[index2].classList.remove('flipped');
            gameBoard.children[index1].querySelector('.card-back').textContent = '?';
            gameBoard.children[index2].querySelector('.card-back').textContent = '?';
            flippedCards = [];
            canFlip = true;
            playSound(300, 0.2);
        }, 1000);
    }
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function winGame() {
    gameStarted = false;
    clearInterval(timerInterval);

    const finalTime = timeEl.textContent;
    finalTimeEl.textContent = finalTime;
    finalMovesEl.textContent = moves;

    // Check for new record
    const bestKey = `memoryBest_${currentDifficulty}`;
    const currentBest = parseInt(localStorage.getItem(bestKey)) || Infinity;
    let isNewRecord = false;

    if (moves < currentBest) {
        localStorage.setItem(bestKey, moves);
        bestMovesEl.textContent = moves;
        isNewRecord = true;

        // Save to user
        saveToUser();
    }

    newRecordText.style.display = isNewRecord ? 'block' : 'none';
    winModal.style.display = 'flex';
    playSound(1000, 0.5);
}

function saveToUser() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) return;

    const user = JSON.parse(currentUser);
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === user.username);

    if (userIndex !== -1) {
        if (!users[userIndex].highScores) users[userIndex].highScores = {};
        users[userIndex].highScores.memoryCard = moves;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function loadBestScores() {
    const bestKey = `memoryBest_${currentDifficulty}`;
    const best = localStorage.getItem(bestKey);
    bestMovesEl.textContent = best || '-';
}

function resetGame() {
    gameStarted = false;
    clearInterval(timerInterval);
    timeEl.textContent = '0:00';
    movesEl.textContent = 0;
    gameBoard.innerHTML = '';
    loadBestScores();
}

function restartGame() {
    winModal.style.display = 'none';
    resetGame();
    initGame();
}

// Event listeners
startBtn.addEventListener('click', () => {
    if (gameStarted) {
        if (confirm('Game đang chạy! Bạn có chắc muốn bắt đầu lại?')) {
            resetGame();
            initGame();
        }
    } else {
        initGame();
    }
});

resetProgressBtn.addEventListener('click', () => {
    if (confirm('Xóa toàn bộ tiến độ và kỷ lục?')) {
        localStorage.removeItem('memoryBest_easy');
        localStorage.removeItem('memoryBest_medium');
        localStorage.removeItem('memoryBest_hard');
        loadBestScores();
        alert('Đã xóa tiến độ!');
    }
});

// Initial render
renderCards();
