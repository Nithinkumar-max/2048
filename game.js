(function() {
    'use strict';

    class Game2048 {
        constructor(boardSize = 4) {
            this.boardSize = boardSize;
            this.board = [];
            this.score = 0;
            this.gameBoard = document.getElementById('game-board');
            this.scoreDisplay = document.getElementById('score');
            this.mergedThisTurn = new Set(); // Track merged tiles
            this.gameOverModal = document.getElementById('game-over-modal');
            this.finalScoreDisplay = document.getElementById('final-score');
            this.initializeBoard();
            this.setupEventListeners();
        }

        initializeBoard() {
            // Create 2D array for game board
            this.board = Array.from({ length: this.boardSize }, () => 
                Array(this.boardSize).fill(0)
            );

            // Clear previous board
            this.gameBoard.innerHTML = '';
            this.gameBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;

            // Create grid cells
            for (let i = 0; i < this.boardSize * this.boardSize; i++) {
                const cell = document.createElement('div');
                cell.classList.add('tile');
                this.gameBoard.appendChild(cell);
            }

            // Add first two tiles
            this.addRandomTile();
            this.addRandomTile();
            this.updateBoard();
        }

        addRandomTile() {
            const emptyCells = [];
            for (let r = 0; r < this.boardSize; r++) {
                for (let c = 0; c < this.boardSize; c++) {
                    if (this.board[r][c] === 0) {
                        emptyCells.push({ r, c });
                    }
                }
            }

            if (emptyCells.length > 0) {
                const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
            }
        }

        updateBoard() {
            const tiles = this.gameBoard.querySelectorAll('.tile');
            tiles.forEach((tile, index) => {
                const r = Math.floor(index / this.boardSize);
                const c = index % this.boardSize;
                const value = this.board[r][c];
                const wasMerged = this.mergedThisTurn.has(`${r},${c}`);

                // Update tile content and classes
                tile.textContent = value !== 0 ? value : '';
                tile.className = 'tile';
                if (value !== 0) {
                    tile.classList.add(`tile-${value}`);
                    if (wasMerged) {
                        tile.classList.add('tile-merged');
                        setTimeout(() => {
                            tile.classList.remove('tile-merged');
                        }, 300);
                    }
                }
            });

            this.scoreDisplay.textContent = this.score;
        }

        move(direction) {
            let moved = false;
            this.mergedThisTurn.clear(); // Reset merged tiles tracking

            const rotateBoard = () => {
                const newBoard = Array.from({ length: this.boardSize }, () => 
                    Array(this.boardSize).fill(0)
                );
                for (let r = 0; r < this.boardSize; r++) {
                    for (let c = 0; c < this.boardSize; c++) {
                        newBoard[r][c] = this.board[this.boardSize - 1 - c][r];
                    }
                }
                this.board = newBoard;
            };

            const slide = () => {
                for (let r = 0; r < this.boardSize; r++) {
                    let row = this.board[r].filter(val => val !== 0);
                    let originalLength = row.length;
                    
                    // Merge tiles with animation
                    for (let c = 0; c < row.length - 1; c++) {
                        if (row[c] === row[c + 1]) {
                            // Create merge animation
                            const mergeValue = row[c] * 2;
                            const tile = this.getTileElement(r, c);
                            if (tile) {
                                tile.classList.add('tile-merged');
                                setTimeout(() => {
                                    tile.classList.remove('tile-merged');
                                }, 300);
                            }
                            
                            row[c] = mergeValue;
                            this.score += mergeValue;
                            row.splice(c + 1, 1);
                            
                            // Track this merge
                            this.mergedThisTurn.add(`${r},${c}`);
                            moved = true;
                        }
                    }

                    // Pad with zeros
                    while (row.length < this.boardSize) {
                        row.push(0);
                    }

                    // Check if the row changed
                    if (originalLength !== row.length || !this.arraysEqual(this.board[r], row)) {
                        moved = true;
                    }
                    
                    this.board[r] = row;
                }
            };

            // Rotate board to simplify movement logic
            switch (direction) {
                case 'ArrowLeft':
                    slide();
                    break;
                case 'ArrowRight':
                    // Reverse rows
                    this.board = this.board.map(row => row.reverse());
                    slide();
                    this.board = this.board.map(row => row.reverse());
                    break;
                case 'ArrowUp':
                    for (let i = 0; i < 3; i++) rotateBoard();
                    slide();
                    rotateBoard();
                    break;
                case 'ArrowDown':
                    rotateBoard();
                    slide();
                    for (let i = 0; i < 3; i++) rotateBoard();
                    break;
            }

            if (moved) {
                this.addRandomTile();
                this.updateBoard();
                this.checkGameStatus();
            }
        }

        checkGameStatus() {
            // Check for 2048 win condition
            for (let r = 0; r < this.boardSize; r++) {
                for (let c = 0; c < this.boardSize; c++) {
                    if (this.board[r][c] === 2048) {
                        this.showGameOver('Congratulations! You won!');
                        return;
                    }
                }
            }

            // Check if board is full
            const hasEmptyCell = this.board.some(row => row.includes(0));
            if (!hasEmptyCell) {
                // Check if any moves are possible
                let movePossible = false;
                for (let r = 0; r < this.boardSize; r++) {
                    for (let c = 0; c < this.boardSize - 1; c++) {
                        if (this.board[r][c] === this.board[r][c + 1] ||
                            (r < this.boardSize - 1 && this.board[r][c] === this.board[r + 1][c])) {
                            movePossible = true;
                            break;
                        }
                    }
                    if (movePossible) break;
                }

                if (!movePossible) {
                    this.showGameOver('Game Over! No more moves possible.');
                }
            }
        }

        showGameOver(message) {
            this.finalScoreDisplay.textContent = this.score;
            const modalTitle = this.gameOverModal.querySelector('h2');
            modalTitle.textContent = message;
            this.gameOverModal.classList.add('show');
        }

        resetGame() {
            this.board = [];
            this.score = 0;
            this.mergedThisTurn.clear();
            this.gameOverModal.classList.remove('show');
            this.initializeBoard();
        }

        setupEventListeners() {
            document.addEventListener('keydown', (e) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    e.preventDefault();
                    this.move(e.key);
                }
            });

            // Add restart button listener
            const restartButton = document.getElementById('restart-button');
            restartButton.addEventListener('click', () => {
                this.resetGame();
            });
        }

        // Helper method to get tile element
        getTileElement(row, col) {
            const index = row * this.boardSize + col;
            return this.gameBoard.children[index];
        }

        // Helper method to compare arrays
        arraysEqual(arr1, arr2) {
            return arr1.length === arr2.length && 
                   arr1.every((value, index) => value === arr2[index]);
        }
    }

    // Initialize the game when the DOM is fully loaded
    function init() {
        try {
            window.game = new Game2048();
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }

    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
