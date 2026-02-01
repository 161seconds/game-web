// Game state
let size = 3;
let tiles = [];
let emptyIndex = 0;
let moves = 0;
let startTime = null;
let timerInterval = null;
let soundEnabled = true;

// Elements
const puzzleBoard = document.getElementById('puzzleBoard');
const movesEl = document.getElementById('moves');
const timeEl = document.getElementById('time');
const bestMovesEl = document.getElementById('bestMoves');
const shuffleBtn = document.getElementById('shuffleBtn');
const solveBtn = document.getElementById('solveBtn');
const resetBtn = document.getElementById('resetBtn');
const soundToggle = document.getElementById('soundToggle');
const winModal = document.getElementById('winModal');
const finalMovesEl = document.getElementById('finalMoves');
const finalTimeEl = document.getElementById('finalTime');
const newRecordText = document.getElementById('newRecordText');

// Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Load best score
loadBestScore();

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
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        size = parseInt(btn.dataset.size);
        puzzleBoard.className = `puzzle-board size-${size}`;
        initPuzzle();
        loadBestScore();
    });
});

// Initialize puzzle
function initPuzzle() {
    const totalTiles = size * size;
    tiles = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1);
    tiles.push(0); // 0 represents empty
    emptyIndex = totalTiles - 1;
    moves = 0;
    movesEl.textContent = moves;

    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timeEl.textContent = '0:00';

    renderPuzzle();
}

// Render puzzle
function renderPuzzle() {
    puzzleBoard.innerHTML = '';
    tiles.forEach((tile, index) => {
        const tileEl = document.createElement('div');
        tileEl.className = tile === 0 ? 'tile empty' : 'tile';
        tileEl.textContent = tile === 0 ? '' : tile;
        tileEl.dataset.index = index;

        if (tile !== 0 && tile === index + 1) {
            tileEl.classList.add('correct');
        }

        tileEl.addEventListener('click', () => moveTile(index));
        puzzleBoard.appendChild(tileEl);
    });
}

// Move tile
function moveTile(index) {
    if (!canMove(index)) return;

    // Start timer on first move
    if (moves === 0) {
        startTimer();
    }

    // Swap tiles
    [tiles[index], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[index]];
    emptyIndex = index;
    moves++;
    movesEl.textContent = moves;

    playSound(600, 0.1);
    renderPuzzle();

    // Check win
    if (isSolved()) {
        setTimeout(() => winGame(), 300);
    }
}

// Check if tile can move
function canMove(index) {
    const row = Math.floor(index / size);
    const col = index % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    return (
        (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
        (col === emptyCol && Math.abs(row - emptyRow) === 1)
    );
}

// Check if solved
function isSolved() {
    for (let i = 0; i < tiles.length - 1; i++) {
        if (tiles[i] !== i + 1) return false;
    }
    return tiles[tiles.length - 1] === 0;
}

// Shuffle puzzle
function shuffle() {
    winModal.style.display = 'none';

    // Do random moves
    const shuffleMoves = size * size * 10;
    for (let i = 0; i < shuffleMoves; i++) {
        const movableIndices = getMovableIndices();
        const randomIndex = movableIndices[Math.floor(Math.random() * movableIndices.length)];
        [tiles[randomIndex], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[randomIndex]];
        emptyIndex = randomIndex;
    }

    moves = 0;
    movesEl.textContent = moves;

    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timeEl.textContent = '0:00';

    renderPuzzle();
    playSound(800, 0.2);
}

function getMovableIndices() {
    const indices = [];
    for (let i = 0; i < tiles.length; i++) {
        if (canMove(i)) indices.push(i);
    }
    return indices;
}

// Give hint
function giveHint() {
    const movableIndices = getMovableIndices();
    if (movableIndices.length === 0) return;

    // Highlight movable tiles
    movableIndices.forEach(index => {
        const tile = puzzleBoard.children[index];
        tile.style.boxShadow = '0 0 30px rgba(0, 255, 0, 1)';
        setTimeout(() => {
            tile.style.boxShadow = '';
        }, 1000);
    });

    playSound(1000, 0.3);
}

// Timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Win game
function winGame() {
    clearInterval(timerInterval);
    playSound(1200, 0.5);

    finalMovesEl.textContent = moves;
    finalTimeEl.textContent = timeEl.textContent;

    // Check for new record
    const bestKey = `puzzleBest_${size}x${size}`;
    const currentBest = parseInt(localStorage.getItem(bestKey)) || Infinity;
    let isNewRecord = false;

    if (moves < currentBest) {
        localStorage.setItem(bestKey, moves);
        bestMovesEl.textContent = moves;
        isNewRecord = true;
        saveToUser();
    }

    newRecordText.style.display = isNewRecord ? 'block' : 'none';
    winModal.style.display = 'flex';
}

function saveToUser() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) return;

    const user = JSON.parse(currentUser);
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === user.username);

    if (userIndex !== -1) {
        if (!users[userIndex].highScores) users[userIndex].highScores = {};
        users[userIndex].highScores.puzzle = moves;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function loadBestScore() {
    const bestKey = `puzzleBest_${size}x${size}`;
    const best = localStorage.getItem(bestKey);
    bestMovesEl.textContent = best || '-';
}

// Event listeners
shuffleBtn.addEventListener('click', shuffle);
solveBtn.addEventListener('click', giveHint);
resetBtn.addEventListener('click', () => {
    if (confirm('Xóa kỷ lục của độ khó này?')) {
        const bestKey = `puzzleBest_${size}x${size}`;
        localStorage.removeItem(bestKey);
        loadBestScore();
        alert('Đã xóa kỷ lục!');
    }
});

// Initialize
initPuzzle();