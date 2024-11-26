class MemoryGame {
    constructor() {
        this.levels = {
            1: { pairs: 8, time: 60, grid: '4x4' },
            2: { pairs: 12, time: 90, grid: '5x5' },
            3: { pairs: 15, time: 120, grid: '6x5' },
            4: { pairs: 18, time: 150, grid: '6x6' }
        };

        this.emojis = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍉', '🥝', '🍍', '🥑', '🥕', '🌽', '🥨', '🧀', '🍖', '🍗', '🥩', '🍔', '🌭'];
        
        this.currentLevel = 1;
        this.score = 0;
        this.moves = 0;
        this.timeLeft = 60;
        this.timer = null;
        this.bestScore = localStorage.getItem('bestScore') || 0;
        this.unlockedLevels = parseInt(localStorage.getItem('unlockedLevels')) || 1;
        
        this.flippedCards = [];
        this.matchedPairs = 0;

        this.initializeElements();
        this.attachEventListeners();
        this.updateUnlockedLevels();
        this.updateBestScore();
    }

    initializeElements() {
        // Screens
        this.screens = {
            welcome: document.getElementById('welcomeScreen'),
            game: document.getElementById('gameScreen'),
            levelComplete: document.getElementById('levelCompleteScreen'),
            gameOver: document.getElementById('gameOverScreen')
        };

        // Buttons
        this.levelButtons = document.querySelectorAll('.level-btn');
        this.nextLevelBtn = document.getElementById('nextLevelBtn');
        this.replayLevelBtn = document.getElementById('replayLevelBtn');
        this.levelHomeBtn = document.getElementById('levelHomeBtn');
        this.tryAgainButton = document.getElementById('tryAgainButton');
        this.restartButton = document.getElementById('restartButton');
        this.homeButton = document.getElementById('homeButton');

        // Game elements
        this.gameBoard = document.getElementById('gameBoard');
        this.currentLevelElement = document.getElementById('currentLevel');
        this.currentScoreElement = document.getElementById('currentScore');
        this.timeLeftElement = document.getElementById('timeLeft');
        this.movesElement = document.getElementById('moves');
        this.levelScoreElement = document.getElementById('levelScore');
        this.levelStarsElement = document.getElementById('levelStars');
        this.finalScoreElement = document.getElementById('finalScore');
        this.bestScoreElements = document.querySelectorAll('#bestScore, #finalBestScore');
    }

    navigateToGame() {
        window.location.href = "memory_home.html"; // Redirect to index.html
    }

    attachEventListeners() {
        this.levelButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                if (level <= this.unlockedLevels) {
                    this.startLevel(level);
                }
            });
        });

        this.nextLevelBtn.addEventListener('click', () => this.startLevel(this.currentLevel + 1));
        this.replayLevelBtn.addEventListener('click', () => this.startLevel(this.currentLevel));
        this.levelHomeBtn.addEventListener('click', () => this.showScreen('welcome'));
        this.tryAgainButton.addEventListener('click', () => this.startLevel(this.currentLevel));
        this.restartButton.addEventListener('click', () => this.startLevel(this.currentLevel));
        this.homeButton.addEventListener('click', () => this.showScreen('welcome'));
    }

    updateUnlockedLevels() {
        this.levelButtons.forEach(btn => {
            const level = parseInt(btn.dataset.level);
            if (level <= this.unlockedLevels) {
                btn.classList.remove('locked');
                btn.textContent = `Level ${level}`;
            }
        });
    }

    startLevel(level) {
        this.currentLevel = level;
        this.score = 0;
        this.moves = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        
        const levelConfig = this.levels[level];
        this.timeLeft = levelConfig.time;
        
        this.updateUI();
        this.createBoard();
        this.showScreen('game');
        this.startTimer();
    }

    createBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.className = `game-board level-${this.currentLevel}`;
        
        const levelConfig = this.levels[this.currentLevel];
        const cards = this.emojis.slice(0, levelConfig.pairs);
        const shuffledCards = [...cards, ...cards].sort(() => Math.random() - 0.5);

        shuffledCards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `
                <div class="card-front"></div>
                <div class="card-back">${card}</div>
            `;
            cardElement.dataset.index = index;
            cardElement.dataset.value = card;
            cardElement.addEventListener('click', () => this.flipCard(cardElement));
            this.gameBoard.appendChild(cardElement);
        });
    }

    flipCard(card) {
        if (this.flippedCards.length === 2 || 
            card.classList.contains('flipped') || 
            card.classList.contains('matched')) {
            return;
        }

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateUI();
            this.checkMatch();
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const match = card1.dataset.value === card2.dataset.value;

        if (match) {
            this.handleMatch(card1, card2);
        } else {
            this.handleMismatch(card1, card2);
        }
    }

    handleMatch(card1, card2) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        this.flippedCards = [];
        this.score += 10;
        this.matchedPairs++;
        this.updateUI();

        const levelConfig = this.levels[this.currentLevel];
        if (this.matchedPairs === levelConfig.pairs) {
            this.handleLevelComplete();
        }
    }

    handleMismatch(card1, card2) {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            this.flippedCards = [];
        }, 1000);
    }

    handleLevelComplete() {
        clearInterval(this.timer);
        
        if (this.currentLevel === this.unlockedLevels && this.currentLevel < 4) {
            this.unlockedLevels++;
            localStorage.setItem('unlockedLevels', this.unlockedLevels);
            this.updateUnlockedLevels();
        }

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
            this.updateBestScore();
        }

        const stars = this.calculateStars();
        this.levelScoreElement.textContent = this.score;
        this.levelStarsElement.textContent = '⭐'.repeat(stars);
        
        this.showScreen('levelComplete');
    }

    calculateStars() {
        const levelConfig = this.levels[this.currentLevel];
        const maxMoves = levelConfig.pairs * 2.5;
        if (this.moves <= levelConfig.pairs * 1.5) return 3;
        if (this.moves <= maxMoves) return 2;
        return 1;
    }

    handleGameOver() {
        clearInterval(this.timer);
        this.finalScoreElement.textContent = this.score;
        this.showScreen('gameOver');
    }

    startTimer() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateUI();
            
            if (this.timeLeft <= 0) {
                this.handleGameOver();
            }
        }, 1000);
    }

    showScreen(screenName) {
        Object.keys(this.screens).forEach(key => {
            this.screens[key].classList.toggle('hidden', key !== screenName);
        });
    }

    updateUI() {
        this.currentLevelElement.textContent = this.currentLevel;
        this.currentScoreElement.textContent = this.score;
        this.timeLeftElement.textContent = this.timeLeft;
        this.movesElement.textContent = this.moves;
    }

    updateBestScore() {
        this.bestScoreElements.forEach(element => {
            element.textContent = this.bestScore;
        });
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});