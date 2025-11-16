
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;


const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_WIDTH = 40;
const BRICK_HEIGHT = 15;
const BRICK_GAP_X = 30;
const BRICK_GAP_Y = 15;
const BRICK_OFFSET_TOP = 80;
const BRICK_OFFSET_LEFT = 50;

// Brick colors for each row (brown, red, pink, green, yellow)
const BRICK_COLORS = [
    'rgb(153, 51, 0)',
    'rgb(255, 0, 0)',
    'rgb(255, 153, 204)',
    'rgb(0, 255, 0)',
    'rgb(255, 255, 153)'
];

// Paddle settings
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const PADDLE_SPEED = 6;
const PADDLE_OFFSET_BOTTOM = 50;

// Ball settings
const BALL_SIZE = 10;
const BALL_INITIAL_SPEED = 4;
const BALL_SPEED_INCREMENT = 0.2;

// Score display settings
const SCORE_FONT = 'bold 16px Helvetica, Verdana, sans-serif';
const SCORE_COLOR = 'white';
const SCORE_LEFT_X = 20;
const SCORE_RIGHT_X = CANVAS_WIDTH - 100;
const SCORE_Y = 20;

// Game states
const STATE_START = 'start';
const STATE_PLAYING = 'playing';
const STATE_GAME_OVER = 'gameOver';
const STATE_WIN = 'win';

// Global variables
let canvas;
let ctx;
let gameState = STATE_START;
let currentScore = 0;
let bestScore = 0;
let leftPressed = false;
let rightPressed = false;
let spacePressed = false;
let paddle;
let ball;
let bricks = [];
let sounds = {};

// Draw a rectangle with 3D shading effect
function draw3DRect(x, y, width, height, baseColor) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, width, height);

    // Lighter edge on top and left for 3D effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();

    // Darker edge on bottom and right for 3D effect
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.stroke();
}

// Load the best score from localStorage
function loadBestScore() {
    const stored = localStorage.getItem('breakoutBestScore');
    bestScore = stored ? parseInt(stored, 10) : 0;
}

// Save the best score to localStorage
function saveBestScore() {
    localStorage.setItem('breakoutBestScore', bestScore.toString());
}

// Play a sound effect
function playSound(soundId) {
    if (sounds[soundId]) {
        sounds[soundId].currentTime = 0;
        sounds[soundId].play().catch(() => {});
    }
}

// Paddle class - the player-controlled paddle at the bottom
class Paddle {
    constructor() {
        this.width = PADDLE_WIDTH;
        this.height = PADDLE_HEIGHT;
        this.x = (CANVAS_WIDTH - this.width) / 2;
        this.y = CANVAS_HEIGHT - PADDLE_OFFSET_BOTTOM;
        this.color = 'rgb(200, 200, 200)';
    }

    draw() {
        draw3DRect(this.x, this.y, this.width, this.height, this.color);
    }

    update() {
        if (leftPressed && this.x > 0) {
            this.x -= PADDLE_SPEED;
        }
        if (rightPressed && this.x < CANVAS_WIDTH - this.width) {
            this.x += PADDLE_SPEED;
        }
    }

    getTop() {
        return this.y;
    }

    getBottom() {
        return this.y + this.height;
    }

    getLeft() {
        return this.x;
    }

    getRight() {
        return this.x + this.width;
    }
}

// Ball class - the bouncing ball that destroys bricks
class Ball {
    constructor() {
        this.size = BALL_SIZE;
        this.x = (CANVAS_WIDTH - this.size) / 2;
        this.y = paddle.getTop() - this.size;
        this.speed = BALL_INITIAL_SPEED;
        this.color = 'rgb(220, 220, 220)';
        this.hasHitBrick = false;

        // Start moving randomly up-left or up-right at 45 degrees
        const angle = Math.random() < 0.5 ? -135 : -45;
        const radians = angle * Math.PI / 180;
        this.dx = Math.cos(radians) * this.speed;
        this.dy = Math.sin(radians) * this.speed;
    }

    draw() {
        draw3DRect(this.x, this.y, this.size, this.size, this.color);
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        // Bounce off left wall
        if (this.x <= 0) {
            this.x = 0;
            this.dx = Math.abs(this.dx);
            playSound('wall');
        }

        // Bounce off right wall
        if (this.x + this.size >= CANVAS_WIDTH) {
            this.x = CANVAS_WIDTH - this.size;
            this.dx = -Math.abs(this.dx);
            playSound('wall');
        }

        // Bounce off top wall
        if (this.y <= 0) {
            this.y = 0;
            this.dy = Math.abs(this.dy);
            playSound('wall');
        }

        // Ball fell - game over
        if (this.y > CANVAS_HEIGHT) {
            gameState = STATE_GAME_OVER;
            playSound('gameOver');
            if (currentScore > bestScore) {
                bestScore = currentScore;
                saveBestScore();
            }
        }
    }

    checkPaddleCollision() {
        if (this.dy > 0 &&
            this.y + this.size >= paddle.getTop() &&
            this.y + this.size <= paddle.getBottom() &&
            this.x + this.size >= paddle.getLeft() &&
            this.x <= paddle.getRight()) {

            this.dy = -Math.abs(this.dy);
            this.y = paddle.getTop() - this.size;
            playSound('paddle');
        }
    }

    // Check if the ball hit a corner of a brick
    isCornerCollision(brick) {
        const ballCenterX = this.x + this.size / 2;
        const ballCenterY = this.y + this.size / 2;

        const corners = [
            { x: brick.x, y: brick.y },
            { x: brick.x + brick.width, y: brick.y },
            { x: brick.x, y: brick.y + brick.height },
            { x: brick.x + brick.width, y: brick.y + brick.height }
        ];

        for (let corner of corners) {
            const dx = ballCenterX - corner.x;
            const dy = ballCenterY - corner.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.size / 2) {
                return true;
            }
        }

        return false;
    }

    checkBrickCollisions() {
        for (let i = bricks.length - 1; i >= 0; i--) {
            const brick = bricks[i];

            if (!brick.destroyed &&
                this.x + this.size >= brick.x &&
                this.x <= brick.x + brick.width &&
                this.y + this.size >= brick.y &&
                this.y <= brick.y + brick.height) {

                brick.destroyed = true;
                currentScore++;
                playSound('brick');

                // If this is a corner hit and not the first brick, increase speed slightly
                const isCorner = this.isCornerCollision(brick);
                if (isCorner && this.hasHitBrick) {
                    const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
                    const newSpeed = currentSpeed + BALL_SPEED_INCREMENT;
                    const angle = Math.atan2(this.dy, this.dx);
                    this.dx = Math.cos(angle) * newSpeed;
                    this.dy = Math.sin(angle) * newSpeed;
                }

                this.hasHitBrick = true;

                // Figure out which side of the brick was hit and bounce accordingly
                const ballCenterX = this.x + this.size / 2;
                const ballCenterY = this.y + this.size / 2;
                const brickCenterX = brick.x + brick.width / 2;
                const brickCenterY = brick.y + brick.height / 2;

                const dx = ballCenterX - brickCenterX;
                const dy = ballCenterY - brickCenterY;

                if (Math.abs(dx / brick.width) > Math.abs(dy / brick.height)) {
                    this.dx = -this.dx;
                } else {
                    this.dy = -this.dy;
                }

                bricks.splice(i, 1);

                // Check if player won by destroying all bricks
                if (bricks.length === 0) {
                    gameState = STATE_WIN;
                    playSound('win');
                    if (currentScore > bestScore) {
                        bestScore = currentScore;
                        saveBestScore();
                    }
                }

                break;
            }
        }
    }
}

// Brick class - a single destructible brick
class Brick {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = BRICK_WIDTH;
        this.height = BRICK_HEIGHT;
        this.color = color;
        this.destroyed = false;
    }

    draw() {
        if (!this.destroyed) {
            draw3DRect(this.x, this.y, this.width, this.height, this.color);
        }
    }
}

// Create all the bricks in a grid
function initBricks() {
    bricks = [];

    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            const x = BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_GAP_X);
            const y = BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_GAP_Y);
            const color = BRICK_COLORS[row];

            bricks.push(new Brick(x, y, color));
        }
    }
}

// Initialize or reset the game
function initGame() {
    currentScore = 0;
    paddle = new Paddle();
    initBricks();
    ball = new Ball();
}

// Set up sound effects
function initSounds() {
    sounds.brick = document.getElementById('brickSound');
    sounds.paddle = document.getElementById('paddleSound');
    sounds.wall = document.getElementById('wallSound');
    sounds.start = document.getElementById('startSound');
    sounds.gameOver = document.getElementById('gameOverSound');
    sounds.win = document.getElementById('winSound');
}

// Draw the start screen with title and instructions
function drawStartScreen() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Helvetica, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const breakoutY = CANVAS_HEIGHT / 2 - 14;
    ctx.fillText('BREAKOUT', CANVAS_WIDTH / 2, breakoutY);

    ctx.fillStyle = 'white';
    ctx.font = 'bold italic 18px Helvetica, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Press SPACE to begin', CANVAS_WIDTH / 2, breakoutY + 36 + 10);
}

// Draw current and best scores
function drawScore() {
    ctx.font = SCORE_FONT;
    ctx.fillStyle = SCORE_COLOR;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${currentScore}`, SCORE_LEFT_X, SCORE_Y);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`Best: ${bestScore}`, SCORE_RIGHT_X, SCORE_Y);
}

// Draw the game during play
function drawPlaying() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    paddle.draw();
    ball.draw();

    for (let brick of bricks) {
        brick.draw();
    }

    drawScore();
}

// Draw the game over screen
function drawGameOver() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'yellow';
    ctx.font = 'bold 40px Helvetica, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Helvetica, Verdana, sans-serif';
    ctx.fillText(`Final Score: ${currentScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

// Draw the win screen
function drawWin() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'yellow';
    ctx.font = 'bold 40px Helvetica, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Helvetica, Verdana, sans-serif';
    ctx.fillText(`Final Score: ${currentScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

// Update game logic each frame
function update() {
    if (gameState === STATE_PLAYING) {
        paddle.update();
        ball.update();
        ball.checkPaddleCollision();
        ball.checkBrickCollisions();
    }
}

// Render the current game state
function render() {
    switch (gameState) {
        case STATE_START:
            drawStartScreen();
            break;
        case STATE_PLAYING:
            drawPlaying();
            break;
        case STATE_GAME_OVER:
            drawGameOver();
            break;
        case STATE_WIN:
            drawWin();
            break;
    }
}

// Main game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Handle key presses
function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if (e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();

        if (gameState === STATE_START) {
            gameState = STATE_PLAYING;
            initGame();
            playSound('start');
        }

        spacePressed = true;
    }
}

// Handle key releases
function handleKeyUp(e) {
    if (e.key === 'ArrowLeft') {
        leftPressed = false;
    } else if (e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === ' ' || e.key === 'Spacebar') {
        spacePressed = false;
    }
}

// Initialize everything when the page loads
window.addEventListener('load', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    loadBestScore();
    initSounds();

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    gameLoop();
});
