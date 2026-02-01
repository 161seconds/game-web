const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let gamePaused = false;
let score = 0;
let level = 1;
let highScore = parseInt(localStorage.getItem('spaceShooterHighScore')) || 0;
let soundEnabled = true;
let health = 100;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    width: 40,
    height: 40,
    speed: 6,
    dx: 0
};

// Arrays
let bullets = [];
let enemies = [];
let enemyBullets = [];
let explosions = [];

// Game config
const bulletSpeed = 8;
const enemySpeed = 2;
let enemySpawnRate = 90;
let frameCount = 0;

// Elements
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const highScoreEl = document.getElementById('highScore');
const healthFill = document.getElementById('healthFill');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const soundToggle = document.getElementById('soundToggle');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreEl = document.getElementById('finalScore');
const finalLevelEl = document.getElementById('finalLevel');
const newRecordText = document.getElementById('newRecordText');

highScoreEl.textContent = highScore;

// Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Load high score from user
window.addEventListener('DOMContentLoaded', function () {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const foundUser = users.find(u => u.username === user.username);

        if (foundUser && foundUser.highScores && foundUser.highScores.spaceShooter) {
            highScore = foundUser.highScores.spaceShooter;
            highScoreEl.textContent = highScore;
            localStorage.setItem('spaceShooterHighScore', highScore);
        }
    }
});

// Sound toggle
soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
});

// Sound effects
function playSound(frequency, duration, type = 'sine') {
    if (!soundEnabled) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Draw functions
function drawPlayer() {
    // Ship body
    ctx.fillStyle = '#470ce9';
    ctx.shadowColor = '#8c00ff';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x - 20, player.y + 40);
    ctx.lineTo(player.x + 20, player.y + 40);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#6b10a0';
    ctx.beginPath();
    ctx.arc(player.x, player.y + 15, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}

function drawBullets() {
    ctx.fillStyle = '#650891';
    ctx.shadowColor = '#8c00ff';
    ctx.shadowBlur = 15;

    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x - 2, bullet.y, 4, 15);
    });

    ctx.shadowBlur = 0;
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = '#55048b';
        ctx.shadowColor = '#8c00ff';
        ctx.shadowBlur = 15;

        // Enemy ship
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y + 30);
        ctx.lineTo(enemy.x - 15, enemy.y);
        ctx.lineTo(enemy.x + 15, enemy.y);
        ctx.closePath();
        ctx.fill();

        // Enemy core
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y + 10, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    });
}

function drawEnemyBullets() {
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;

    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x - 2, bullet.y, 4, 15);
    });

    ctx.shadowBlur = 0;
}

function drawExplosions() {
    explosions.forEach(explosion => {
        ctx.fillStyle = `rgba(0, 255, 0, ${explosion.alpha})`;
        ctx.shadowColor = '#3d0b8d';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = `rgba(255, 255, 0, ${explosion.alpha})`;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.shadowBlur = 0;
}

function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#470ce9';
    for (let i = 0; i < 100; i++) {
        const x = (frameCount + i * 50) % canvas.width;
        const y = (i * 17 + frameCount * 0.5) % canvas.height;
        const size = (i % 3) + 1;
        ctx.fillRect(x, y, size, size);
    }
}

// Game logic
function updatePlayer() {
    player.x += player.dx;

    // Boundaries
    if (player.x < 20) player.x = 20;
    if (player.x > canvas.width - 20) player.x = canvas.width - 20;
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= bulletSpeed;
        return bullet.y > 0;
    });
}

function updateEnemies() {
    // Spawn enemies
    if (frameCount % enemySpawnRate === 0) {
        enemies.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: -30,
            width: 30,
            height: 30,
            speed: enemySpeed + level * 0.3
        });
    }

    // Move enemies
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;

        // Random shooting
        if (Math.random() < 0.01 + level * 0.005) {
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y + 30,
                speed: 4 + level * 0.5
            });
        }

        return enemy.y < canvas.height + 30;
    });
}

function updateEnemyBullets() {
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += bullet.speed;
        return bullet.y < canvas.height;
    });
}

function updateExplosions() {
    explosions = explosions.filter(explosion => {
        explosion.radius += 2;
        explosion.alpha -= 0.02;
        return explosion.alpha > 0;
    });
}

function checkCollisions() {
    // Bullets vs Enemies
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (
                bullet.x > enemy.x - 15 &&
                bullet.x < enemy.x + 15 &&
                bullet.y > enemy.y &&
                bullet.y < enemy.y + 30
            ) {
                bullets.splice(bIndex, 1);
                enemies.splice(eIndex, 1);

                // Add explosion
                explosions.push({
                    x: enemy.x,
                    y: enemy.y,
                    radius: 5,
                    alpha: 1
                });

                score += 10 * level;
                scoreEl.textContent = score;
                playSound(800, 0.2);

                // Level up
                if (score > 0 && score % 200 === 0) {
                    level++;
                    levelEl.textContent = level;
                    enemySpawnRate = Math.max(30, enemySpawnRate - 10);
                    playSound(1200, 0.5);
                }
            }
        });
    });

    // Enemy bullets vs Player
    enemyBullets.forEach((bullet, index) => {
        if (
            bullet.x > player.x - 20 &&
            bullet.x < player.x + 20 &&
            bullet.y > player.y &&
            bullet.y < player.y + 40
        ) {
            enemyBullets.splice(index, 1);
            takeDamage(10);
        }
    });

    // Enemies vs Player
    enemies.forEach((enemy, index) => {
        if (
            enemy.x > player.x - 30 &&
            enemy.x < player.x + 30 &&
            enemy.y + 30 > player.y &&
            enemy.y < player.y + 40
        ) {
            enemies.splice(index, 1);
            takeDamage(20);
        }
    });
}

function takeDamage(amount) {
    health -= amount;
    healthFill.style.width = Math.max(0, health) + '%';
    playSound(300, 0.3, 'sawtooth');

    if (health <= 0) {
        gameOver();
    }
}

function gameLoop() {
    if (!gameRunning || gamePaused) return;

    frameCount++;

    // Update
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateEnemyBullets();
    updateExplosions();
    checkCollisions();

    // Draw
    drawBackground();
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawEnemyBullets();
    drawExplosions();

    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameRunning = true;
    gamePaused = false;
    score = 0;
    level = 1;
    health = 100;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    explosions = [];
    frameCount = 0;
    enemySpawnRate = 90;

    scoreEl.textContent = score;
    levelEl.textContent = level;
    healthFill.style.width = '100%';

    player.x = canvas.width / 2;
    player.y = canvas.height - 80;

    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    gameOverModal.style.display = 'none';

    gameLoop();
}

function togglePause() {
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? 'RESUME' : 'PAUSE';

    if (!gamePaused) {
        gameLoop();
    }
}

function gameOver() {
    gameRunning = false;
    playSound(200, 1, 'sawtooth');

    // Update high score
    let isNewRecord = false;
    if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('spaceShooterHighScore', highScore);
        isNewRecord = true;

        // Save to user
        const currentUser = sessionStorage.getItem('currentUser');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.username === user.username);

            if (userIndex !== -1) {
                if (!users[userIndex].highScores) users[userIndex].highScores = {};
                users[userIndex].highScores.spaceShooter = highScore;
                localStorage.setItem('users', JSON.stringify(users));
            }
        }
    }

    // Show modal
    finalScoreEl.textContent = score;
    finalLevelEl.textContent = level;
    newRecordText.style.display = isNewRecord ? 'block' : 'none';
    gameOverModal.style.display = 'flex';

    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
}

function restartGame() {
    startGame();
}

// Controls
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.code === 'Space') {
        e.preventDefault();
        if (gameRunning && !gamePaused) {
            bullets.push({
                x: player.x,
                y: player.y
            });
            playSound(600, 0.1);
        } else if (!gameRunning) {
            startGame();
        }
    }

    if (e.code === 'KeyP' && gameRunning) {
        togglePause();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Move player
setInterval(() => {
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.dx = -player.speed;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.dx = player.speed;
    } else {
        player.dx = 0;
    }
}, 1000 / 60);

// Event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

resetBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn reset high score?')) {
        highScore = 0;
        localStorage.removeItem('spaceShooterHighScore');
        highScoreEl.textContent = highScore;
        alert('High score đã được reset!');
    }
});

// Initial draw
drawBackground();
drawPlayer();