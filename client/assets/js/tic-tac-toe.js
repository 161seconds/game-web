// Game state
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'ai'; // 'ai' or 'player'
let soundEnabled = true;

// Stats
let stats = {
    xWins: parseInt(localStorage.getItem('tttXWins')) || 0,
    oWins: parseInt(localStorage.getItem('tttOWins')) || 0,
    draws: parseInt(localStorage.getItem('tttDraws')) || 0
};

// Elements
const gameBoard = document.getElementById('gameBoard');
const gameStatus = document.getElementById('gameStatus');
const xWinsEl = document.getElementById('xWins');
const oWinsEl = document.getElementById('oWins');
const drawsEl = document.getElementById('draws');
const newGameBtn = document.getElementById('newGameBtn');
const resetStatsBtn = document.getElementById('resetStatsBtn');
const soundToggle = document.getElementById('soundToggle');

// Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Update stats display
updateStatsDisplay();

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

// Mode selection
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameMode = btn.dataset.mode;
        resetGame();
    });
});

// Initialize board
function initBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        gameBoard.appendChild(cell);
    }
}

// Handle cell click
function handleCellClick(index) {
    if (board[index] !== '' || !gameActive) return;
    if (gameMode === 'ai' && currentPlayer === 'O') return;

    makeMove(index, currentPlayer);
    playSound(600, 0.1);

    if (!checkGameEnd() && gameMode === 'ai' && currentPlayer === 'O') {
        setTimeout(() => aiMove(), 500);
    }
}

// Make move
function makeMove(index, player) {
    board[index] = player;
    const cell = gameBoard.children[index];
    cell.textContent = player;
    cell.classList.add('taken', player.toLowerCase());
}

// AI move (Minimax algorithm)
function aiMove() {
    const bestMove = findBestMove();
    makeMove(bestMove, 'O');
    playSound(800, 0.1);
    checkGameEnd();
}

function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = '';

            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    const winner = checkWinner();

    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (board.every(cell => cell !== '')) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// Check winner
function checkWinner() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    return null;
}

function getWinningPattern() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return pattern;
        }
    }

    return null;
}

// Check game end
function checkGameEnd() {
    const winner = checkWinner();

    if (winner) {
        gameActive = false;
        gameStatus.textContent = `🎉 ${winner} THẮNG!`;

        // Highlight winning cells
        const winPattern = getWinningPattern();
        winPattern.forEach(index => {
            gameBoard.children[index].classList.add('winner');
        });

        // Update stats
        if (winner === 'X') {
            stats.xWins++;
            localStorage.setItem('tttXWins', stats.xWins);
        } else {
            stats.oWins++;
            localStorage.setItem('tttOWins', stats.oWins);
        }
        updateStatsDisplay();
        playSound(1000, 0.5);

        // Save to user
        saveToUser();
        return true;
    }

    if (board.every(cell => cell !== '')) {
        gameActive = false;
        gameStatus.textContent = '🤝 HÒA!';
        stats.draws++;
        localStorage.setItem('tttDraws', stats.draws);
        updateStatsDisplay();
        playSound(500, 0.3);
        return true;
    }

    // Switch player
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    gameStatus.textContent = `Lượt của ${currentPlayer}`;
    return false;
}

function updateStatsDisplay() {
    xWinsEl.textContent = stats.xWins;
    oWinsEl.textContent = stats.oWins;
    drawsEl.textContent = stats.draws;
}

function saveToUser() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) return;

    const user = JSON.parse(currentUser);
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === user.username);

    if (userIndex !== -1) {
        if (!users[userIndex].highScores) users[userIndex].highScores = {};
        users[userIndex].highScores.ticTacToe = stats.xWins;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    gameStatus.textContent = 'Lượt của X';
    initBoard();
}

// Event listeners
newGameBtn.addEventListener('click', resetGame);

resetStatsBtn.addEventListener('click', () => {
    if (confirm('Xóa toàn bộ thống kê?')) {
        stats = { xWins: 0, oWins: 0, draws: 0 };
        localStorage.removeItem('tttXWins');
        localStorage.removeItem('tttOWins');
        localStorage.removeItem('tttDraws');
        updateStatsDisplay();
        alert('Đã xóa thống kê!');
    }
});

// Initialize
initBoard();
