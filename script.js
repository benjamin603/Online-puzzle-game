document.addEventListener('DOMContentLoaded', () => {
    const puzzleContainer = document.getElementById('puzzle-container');
    const timerElement = document.getElementById('timer');
    const muteButton = document.getElementById('mute-button');
    const moveSound = document.getElementById('move-sound');
    const victorySound = document.getElementById('victory-sound');
    const difficultyButtons = document.querySelectorAll('.difficulty-buttons button');
    const startButton = document.getElementById('start-button');

    const image = new Image();
    const imageFolder = 'images/';
    const imageFiles = ['image1.jpg']; // 图片文件名列表

    // 从图片列表中随机选择一张图片
    const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
    image.src = imageFolder + randomImage;

    let isMuted = false;
    let startTime = null;
    let timerInterval = null;
    let puzzlePieces = [];
    let numPieces = 9; // Default to 3x3 (Easy)
    let pieceWidth = 600 / Math.sqrt(numPieces);
    let pieceHeight = 600 / Math.sqrt(numPieces);
    let isImageLoaded = false; // Flag to indicate if the image has been loaded
    let gameStarted = false;

    // Function to set difficulty
    function setDifficulty(difficulty) {
        if (!gameStarted) {
            startButton.style.display = 'block';
        }

        switch (difficulty) {
            case 'easy':
                numPieces = 9; // 3x3
                break;
            case 'medium':
                numPieces = 25; // 5x5
                break;
            case 'hard':
                numPieces = 100; // 10x10
                break;
        }
        pieceWidth = 600 / Math.sqrt(numPieces);
        pieceHeight = 600 / Math.sqrt(numPieces);

        // Only recreate and shuffle pieces if the image has been loaded
        if (isImageLoaded) {
            resetGame();
        }
    }

    // Set difficulty buttons event listeners
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const difficulty = button.dataset.difficulty;
            setDifficulty(difficulty);
        });
    });

    // Initialize the game when the image is loaded
    image.onload = () => {
        isImageLoaded = true;
        // Set default difficulty to easy (3x3)
        setDifficulty('easy');
        resetGame();
    };

    function resetGame() {
        // Clear existing pieces
        puzzleContainer.innerHTML = '';
        puzzlePieces = [];

        // Reset timer
        clearInterval(timerInterval);
        timerElement.textContent = '时间: 00:00';
        startTime = null;

        // Recreate pieces with new difficulty
        createPuzzlePieces();
        shufflePuzzlePieces();
        // startTimer(); // Don't start the timer here
    }

    // Create puzzle pieces
    function createPuzzlePieces() {
        for (let i = 0; i < numPieces; i++) {
            const piece = document.createElement('div');
            piece.classList.add('puzzle-piece');
            piece.style.width = `${pieceWidth}px`;
            piece.style.height = `${pieceHeight}px`;

            const x = (i % Math.sqrt(numPieces)) * pieceWidth;
            const y = Math.floor(i / Math.sqrt(numPieces)) * pieceHeight;

            piece.style.backgroundPosition = `-${x}px -${y}px`;
            piece.style.backgroundImage = `url(${image.src})`;

            piece.setAttribute('data-correct-x', x);
            piece.setAttribute('data-correct-y', y);

            // 重新添加 makePieceDraggable(piece);
            makePieceDraggable(piece);

            puzzleContainer.appendChild(piece);
            puzzlePieces.push(piece);
        }
    }

    // Shuffle puzzle pieces
    function shufflePuzzlePieces() {
        for (let i = puzzlePieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [puzzlePieces[i], puzzlePieces[j]] = [puzzlePieces[j], puzzlePieces[i]];
        }

        puzzlePieces.forEach((piece, index) => {
            const x = (index % Math.sqrt(numPieces)) * pieceWidth;
            const y = Math.floor(index / Math.sqrt(numPieces)) * pieceHeight;
            piece.style.left = `${x}px`;
            piece.style.top = `${y}px`;

            // Store the current position using data attributes
            piece.setAttribute('data-current-x', x);
            piece.setAttribute('data-current-y', y);

            // Check if the initial position is correct
            const correctX = parseFloat(piece.getAttribute('data-correct-x'));
            const correctY = parseFloat(piece.getAttribute('data-correct-y'));

            if (Math.abs(x - correctX) < 1 && Math.abs(y - correctY) < 1) {
                piece.classList.add('correct');
            }
        });
    }

    // Make puzzle pieces draggable
    function makePieceDraggable(piece) {
        let isDragging = false;
        let offsetX, offsetY;
        let startX, startY; // Use startX and startY to store the initial position
        let targetPiece = null;

        piece.addEventListener('mousedown', (e) => {
            if (!gameStarted) return; // Prevent dragging before the game starts

            isDragging = true;
            offsetX = e.clientX - piece.getBoundingClientRect().left;
            offsetY = e.clientY - piece.getBoundingClientRect().top;
            piece.style.zIndex = 20; // Bring to front

            // Store the initial position at the start of the drag
            startX = parseFloat(piece.style.left);
            startY = parseFloat(piece.style.top);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            // 获取拼图容器的边界
            const containerRect = puzzleContainer.getBoundingClientRect();

            // 计算拼图块的边界
            const pieceRect = piece.getBoundingClientRect();

            // 计算鼠标位置，限制在容器内
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;

            // 限制 x 坐标
            if (x < containerRect.left) {
                x = containerRect.left;
            } else if (x + pieceRect.width > containerRect.right) {
                x = containerRect.right - pieceRect.width;
            }

            // 限制 y 坐标
            if (y < containerRect.top) {
                y = containerRect.top;
            } else if (y + pieceRect.height > containerRect.bottom) {
                y = containerRect.bottom - pieceRect.height;
            }

            // Update the position of the dragged piece
            piece.style.left = `${x - containerRect.left}px`;
            piece.style.top = `${y - containerRect.top}px`;

            // Check for overlap with other pieces
            targetPiece = null; // Reset targetPiece
            for (let i = 0; i < puzzlePieces.length; i++) {
                if (puzzlePieces[i] !== piece && isOverlapping(piece, puzzlePieces[i])) {
                    targetPiece = puzzlePieces[i];
                    break;
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            piece.style.zIndex = 10; // Reset z-index

            // Find the piece with the largest overlap area
            let maxOverlapArea = 0;
            let targetPiece = null;

            for (let i = 0; i < puzzlePieces.length; i++) {
                if (puzzlePieces[i] !== piece) {
                    const overlapArea = getOverlapArea(piece, puzzlePieces[i]);
                    if (overlapArea > maxOverlapArea) {
                        maxOverlapArea = overlapArea;
                        targetPiece = puzzlePieces[i];
                    }
                }
            }

            // Swap positions if overlapping with another piece and the overlap area is greater than a threshold (e.g., 50% of the piece area)
            if (targetPiece && maxOverlapArea > (pieceWidth * pieceHeight * 0.5)) {
                // Use the data attributes to swap positions
                const targetX = parseFloat(targetPiece.getAttribute('data-current-x'));
                const targetY = parseFloat(targetPiece.getAttribute('data-current-y'));

                targetPiece.style.left = `${startX}px`;
                targetPiece.style.top = `${startY}px`;
                piece.style.left = `${targetX}px`;
                piece.style.top = `${targetY}px`;

                // Update data attributes after swapping
                piece.setAttribute('data-current-x', targetX);
                piece.setAttribute('data-current-y', targetY);
                targetPiece.setAttribute('data-current-x', startX);
                targetPiece.setAttribute('data-current-y', startY);

                // Play move sound if not muted
                if (!isMuted) {
                    moveSound.play();
                }

                // Check the position of both pieces after swapping
                checkPiecePosition(piece);
                checkPiecePosition(targetPiece);

                // Reset targetPiece
                targetPiece = null;
            } else {
                // If no significant overlap, return to original position
                piece.style.left = `${startX}px`;
                piece.style.top = `${startY}px`;

                // Check the position of the piece
                checkPiecePosition(piece);
            }
        });
    }

    // Function to calculate the overlap area of two elements
    function getOverlapArea(element1, element2) {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();

        const overlapX = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
        const overlapY = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));

        return overlapX * overlapY;
    }

    // Function to check if two elements are overlapping
    function isOverlapping(element1, element2) {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();

        return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom
        );
    }

    // Check if a piece is in the correct position
    function checkPiecePosition(piece) {
        const correctX = parseFloat(piece.getAttribute('data-correct-x'));
        const correctY = parseFloat(piece.getAttribute('data-correct-y'));
        const currentX = parseFloat(piece.getAttribute('data-current-x'));
        const currentY = parseFloat(piece.getAttribute('data-current-y'));
        const tolerance = 10; // Adjust as needed

        if (
            Math.abs(currentX - correctX) < tolerance &&
            Math.abs(currentY - correctY) < tolerance
        ) {
            // Snap to the correct position
            piece.style.left = `${correctX}px`;
            piece.style.top = `${correctY}px`;

            // Update data-current-x and data-current-y
            piece.setAttribute('data-current-x', correctX);
            piece.setAttribute('data-current-y', correctY);

            // Add 'correct' class to apply styles
            piece.classList.add('correct');

            checkCompletion();
        }
    }

    // Check if the puzzle is completed
    function checkCompletion() {
        // Check if all pieces have the 'correct' class
        const isCompleted = puzzlePieces.every(piece => piece.classList.contains('correct'));

        if (isCompleted) {
            // Delay the victory sequence by 1 second
            setTimeout(() => {
                if (!isMuted) {
                    victorySound.play();
                }
                clearInterval(timerInterval);

                const mask = document.getElementById('mask');
                const fireworksContainer = document.getElementById('fireworks-container');

                // 使用 confetti() 函数创建烟花效果
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });

                // Display the "congrats-text" element
                const congratsText = document.createElement('div');
                congratsText.textContent = "太棒了!";
                congratsText.classList.add('congrats-text');
                fireworksContainer.appendChild(congratsText);
                congratsText.style.display = "block";

                // Create a div to display the time taken
                const timeTakenText = document.createElement('div');
                timeTakenText.textContent = `用时: ${timerElement.textContent.replace('时间: ', '')}`;
                timeTakenText.classList.add('time-taken-text');
                fireworksContainer.appendChild(timeTakenText);

                // Create and display the "confirm-button" element
                const confirmButton = document.createElement('button');
                confirmButton.textContent = '确定';
                confirmButton.classList.add('confirm-button');
                fireworksContainer.appendChild(confirmButton);
                confirmButton.style.display = 'block';

                // Show the mask
                mask.style.display = 'block';

                // Add event listener to the confirm button
                confirmButton.addEventListener('click', () => {
                    // Hide the fireworks container, text, and button
                    fireworksContainer.style.display = 'none';
                    congratsText.style.display = 'none';
                    confirmButton.style.display = 'none';
                    timeTakenText.style.display = 'none';

                    // Hide the mask
                    mask.style.display = 'none';
                });
            }, 1000); // 1000 milliseconds = 1 second
        }
    }

    // Start the timer
    function startTimer() {
        if (startTime === null) {
            startTime = Date.now();
        }
        timerInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const minutes = Math.floor(elapsedTime / 60000);
            const seconds = Math.floor((elapsedTime % 60000) / 1000);
            timerElement.textContent = `时间: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // Toggle mute
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        muteButton.textContent = isMuted ? '取消静音' : '静音';
    });

    startButton.addEventListener('click', () => {
        gameStarted = true;
        startTimer();
        startButton.style.display = 'none'; // Hide the button
    });
}); 