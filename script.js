class CrackTheCodeGame {
    constructor() {
        this.currentScreen = 'main-menu';
        this.socket = null;
        this.computerGame = {
            secretCode: '',
            attempts: 0,
            maxAttempts: 7,
            gameOver: false
        };
        this.multiplayerGame = {
            roomCode: '',
            isHost: false,
            playerRole: '', // 'host' or 'guest'
            yourCode: '',
            yourAttempts: 0,
            opponentAttempts: 0,
            maxAttempts: 7,
            isYourTurn: false,
            gameOver: false,
            gameStarted: false,
            yourGuesses: [],
            opponentGuesses: []
        };
        
        this.initializeEventListeners();
        this.initializeSocket();
        this.showScreen('main-menu');
    }

    initializeEventListeners() {
        // Main menu
        document.getElementById('play-computer').addEventListener('click', () => this.startComputerGame());
        document.getElementById('play-friend').addEventListener('click', () => this.showScreen('multiplayer-menu'));
        
        // Computer game
        document.getElementById('back-to-menu').addEventListener('click', () => this.showScreen('main-menu'));
        document.getElementById('submit-guess').addEventListener('click', () => this.submitComputerGuess());
        document.getElementById('guess-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitComputerGuess();
        });
        document.getElementById('new-game').addEventListener('click', () => this.startComputerGame());
        
        // Multiplayer menu
        document.getElementById('back-to-main').addEventListener('click', () => this.showScreen('main-menu'));
        
        const createRoomBtn = document.getElementById('create-room');
        if (createRoomBtn) {
            console.log('Adding event listener to create room button');
            createRoomBtn.addEventListener('click', (e) => {
                console.log('Create room button clicked', e);
                e.preventDefault();
                this.createRoom();
            });
        } else {
            console.error('Create room button not found!');
        }
        
        document.getElementById('join-room').addEventListener('click', () => this.showScreen('join-room-screen'));
        
        // Create room
        document.getElementById('back-to-multiplayer').addEventListener('click', () => this.showScreen('multiplayer-menu'));
        document.getElementById('copy-room-code').addEventListener('click', () => this.copyRoomCode());
        
        const confirmHostBtn = document.getElementById('confirm-host-code');
        if (confirmHostBtn) {
            console.log('Adding event listener to confirm host code button');
            confirmHostBtn.addEventListener('click', (e) => {
                console.log('Confirm host code button clicked', e);
                e.preventDefault();
                this.confirmHostCode();
            });
        } else {
            console.error('Confirm host code button not found!');
        }
        
        // Join room
        document.getElementById('back-to-multiplayer-2').addEventListener('click', () => this.showScreen('multiplayer-menu'));
        document.getElementById('join-game').addEventListener('click', () => this.joinRoom());
        
        const confirmGuestBtn = document.getElementById('confirm-guest-code');
        if (confirmGuestBtn) {
            console.log('Adding event listener to confirm guest code button');
            confirmGuestBtn.addEventListener('click', (e) => {
                console.log('Confirm guest code button clicked', e);
                e.preventDefault();
                this.confirmGuestCode();
            });
        } else {
            console.error('Confirm guest code button not found!');
        }
        
        // Multiplayer game
        document.getElementById('leave-game').addEventListener('click', () => this.showScreen('main-menu'));
        document.getElementById('submit-multiplayer-guess').addEventListener('click', () => this.submitMultiplayerGuess());
        document.getElementById('multiplayer-guess-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitMultiplayerGuess();
        });
        document.getElementById('new-multiplayer-game').addEventListener('click', () => this.showScreen('multiplayer-menu'));
        
        // Input validation
        this.setupInputValidation();
    }

    setupInputValidation() {
        const inputs = ['guess-input', 'host-secret-code', 'guest-secret-code', 'multiplayer-guess-input'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                });
                
                // Add Enter key support for secret code inputs
                if (id === 'host-secret-code') {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            console.log('Enter pressed on host code input');
                            this.confirmHostCode();
                        }
                    });
                } else if (id === 'guest-secret-code') {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            console.log('Enter pressed on guest code input');
                            this.confirmGuestCode();
                        }
                    });
                }
            }
        });
        
        const roomCodeInput = document.getElementById('join-room-code');
        if (roomCodeInput) {
            roomCodeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^A-Z0-9]/g, '').slice(0, 6);
            });
            
            roomCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter pressed on room code input');
                    this.joinRoom();
                }
            });
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    }

    generateSecretCode() {
        return Array.from({length: 4}, () => Math.floor(Math.random() * 10)).join('');
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    startComputerGame() {
        this.computerGame = {
            secretCode: this.generateSecretCode(),
            attempts: 0,
            maxAttempts: 7,
            gameOver: false
        };
        
        document.getElementById('attempts-used').textContent = '0';
        document.getElementById('feedback-area').innerHTML = '';
        document.getElementById('game-result').classList.add('hidden');
        document.getElementById('new-game').classList.add('hidden');
        document.getElementById('guess-input').value = '';
        document.getElementById('guess-input').disabled = false;
        document.getElementById('submit-guess').disabled = false;
        
        this.showScreen('computer-game');
    }

    submitComputerGuess() {
        const input = document.getElementById('guess-input');
        const guess = input.value.trim();
        
        if (!this.isValidGuess(guess)) {
            alert('Please enter exactly 4 digits (0-9)');
            return;
        }
        
        if (this.computerGame.gameOver) return;
        
        this.computerGame.attempts++;
        const feedback = this.getFeedback(guess, this.computerGame.secretCode);
        this.displayComputerFeedback(guess, feedback, this.computerGame.attempts);
        
        document.getElementById('attempts-used').textContent = this.computerGame.attempts;
        input.value = '';
        
        if (this.isCorrectGuess(feedback)) {
            this.endComputerGame(true);
        } else if (this.computerGame.attempts >= this.computerGame.maxAttempts) {
            this.endComputerGame(false);
        }
    }

    isValidGuess(guess) {
        return /^\d{4}$/.test(guess);
    }

    getFeedback(guess, secretCode) {
        const feedback = [];
        const secretArray = secretCode.split('');
        const guessArray = guess.split('');
        const usedSecret = new Array(4).fill(false);
        const usedGuess = new Array(4).fill(false);
        
        // First pass: find correct positions
        for (let i = 0; i < 4; i++) {
            if (guessArray[i] === secretArray[i]) {
                feedback[i] = 'correct';
                usedSecret[i] = true;
                usedGuess[i] = true;
            }
        }
        
        // Second pass: find wrong positions
        for (let i = 0; i < 4; i++) {
            if (!usedGuess[i]) {
                let found = false;
                for (let j = 0; j < 4; j++) {
                    if (!usedSecret[j] && guessArray[i] === secretArray[j]) {
                        feedback[i] = 'wrong-position';
                        usedSecret[j] = true;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    feedback[i] = 'not-in-code';
                }
            }
        }
        
        return feedback;
    }

    isCorrectGuess(feedback) {
        return feedback.every(f => f === 'correct');
    }

    displayComputerFeedback(guess, feedback, attemptNumber) {
        const feedbackArea = document.getElementById('feedback-area');
        const row = document.createElement('div');
        row.className = 'guess-row';
        
        const guessNumber = document.createElement('div');
        guessNumber.className = 'guess-number';
        guessNumber.textContent = `#${attemptNumber}`;
        
        const digits = document.createElement('div');
        digits.className = 'guess-digits';
        
        for (let i = 0; i < 4; i++) {
            const digit = document.createElement('div');
            digit.className = `digit ${feedback[i]}`;
            digit.textContent = guess[i];
            digits.appendChild(digit);
        }
        
        row.appendChild(guessNumber);
        row.appendChild(digits);
        feedbackArea.appendChild(row);
        
        // Scroll to bottom
        feedbackArea.scrollTop = feedbackArea.scrollHeight;
    }

    endComputerGame(won) {
        this.computerGame.gameOver = true;
        document.getElementById('guess-input').disabled = true;
        document.getElementById('submit-guess').disabled = true;
        
        const resultDiv = document.getElementById('game-result');
        resultDiv.classList.remove('hidden', 'win', 'lose');
        
        if (won) {
            resultDiv.classList.add('win');
            resultDiv.textContent = `🎉 Congratulations! You cracked the code in ${this.computerGame.attempts} attempts!`;
        } else {
            resultDiv.classList.add('lose');
            resultDiv.textContent = `😞 Game Over! The secret code was ${this.computerGame.secretCode}`;
        }
        
        document.getElementById('new-game').classList.remove('hidden');
    }

    initializeSocket() {
        // Check if Socket.IO is available
        if (typeof io === 'undefined') {
            console.error('Socket.IO not loaded. Running in offline mode.');
            this.socket = null;
            return;
        }
        
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            alert('Unable to connect to server. Please make sure the server is running.');
        });
        
        this.socket.on('room-created', (data) => {
            console.log('Room created:', data.roomCode);
        });
        
        this.socket.on('room-joined', (data) => {
            console.log('Joined room:', data.roomCode);
        });
        
        this.socket.on('player-joined', () => {
            document.getElementById('waiting-for-player').classList.add('hidden');
            alert('Another player has joined! Both players need to set their secret codes.');
        });
        
        this.socket.on('room-error', (data) => {
            alert(data.message);
        });
        
        this.socket.on('game-start', (data) => {
            this.multiplayerGame.gameStarted = true;
            this.multiplayerGame.yourAttempts = data.hostAttempts;
            this.multiplayerGame.opponentAttempts = data.guestAttempts;
            this.multiplayerGame.isYourTurn = (data.currentTurn === this.multiplayerGame.playerRole);
            this.startMultiplayerGame();
        });
        
        this.socket.on('guess-result', (data) => {
            if (data.player === this.multiplayerGame.playerRole) {
                // Your guess
                this.displayMultiplayerFeedback('your-guesses', data.guess, data.feedback, data.attempt);
                this.multiplayerGame.yourAttempts = data.attempt;
                document.getElementById('your-attempts').textContent = data.attempt;
            } else {
                // Opponent's guess
                this.displayMultiplayerFeedback('opponent-guesses', data.guess, data.feedback, data.attempt);
                this.multiplayerGame.opponentAttempts = data.attempt;
                document.getElementById('opponent-attempts').textContent = data.attempt;
            }
        });
        
        this.socket.on('turn-change', (data) => {
            this.multiplayerGame.isYourTurn = (data.currentTurn === this.multiplayerGame.playerRole);
            this.multiplayerGame.yourAttempts = this.multiplayerGame.playerRole === 'host' ? data.hostAttempts : data.guestAttempts;
            this.multiplayerGame.opponentAttempts = this.multiplayerGame.playerRole === 'host' ? data.guestAttempts : data.hostAttempts;
            this.updateTurnIndicator();
        });
        
        this.socket.on('game-end', (data) => {
            this.multiplayerGame.gameOver = true;
            let message = '';
            
            if (data.winner === this.multiplayerGame.playerRole) {
                message = `🎉 You won! You cracked your opponent's code in ${this.multiplayerGame.yourAttempts} attempts!`;
            } else if (data.winner === 'draw') {
                message = `🤝 It's a draw! Both players used all attempts. Your code was ${this.multiplayerGame.yourCode}, opponent's was ${this.multiplayerGame.playerRole === 'host' ? data.guestCode : data.hostCode}.`;
            } else {
                message = `😞 Your opponent won! They cracked your code in ${this.multiplayerGame.opponentAttempts} attempts.`;
            }
            
            this.endMultiplayerGame(message);
        });
        
        this.socket.on('player-disconnected', () => {
            alert('Your opponent has disconnected. Returning to main menu.');
            this.showScreen('main-menu');
        });
        
        this.socket.on('not-your-turn', () => {
            alert("It's not your turn yet!");
        });
    }

    createRoom() {
        console.log('Creating room...');
        
        this.multiplayerGame.roomCode = this.generateRoomCode();
        this.multiplayerGame.isHost = true;
        this.multiplayerGame.playerRole = 'host';
        this.multiplayerGame.yourCode = '';
        this.multiplayerGame.yourAttempts = 0;
        this.multiplayerGame.opponentAttempts = 0;
        this.multiplayerGame.isYourTurn = false;
        this.multiplayerGame.gameOver = false;
        this.multiplayerGame.gameStarted = false;
        this.multiplayerGame.yourGuesses = [];
        this.multiplayerGame.opponentGuesses = [];
        
        document.getElementById('room-code').textContent = this.multiplayerGame.roomCode;
        document.getElementById('host-secret-code').value = '';
        document.getElementById('waiting-for-player').classList.remove('hidden');
        
        // Check if socket is available and connected
        if (this.socket && this.socket.connected) {
            console.log('Creating room with code:', this.multiplayerGame.roomCode);
            this.socket.emit('create-room', { roomCode: this.multiplayerGame.roomCode });
        } else {
            console.log('Running in offline mode - server not available');
            // Show a message that this is offline mode
            const waitingDiv = document.getElementById('waiting-for-player');
            waitingDiv.innerHTML = '<p>⚠️ Server not available. Running in demo mode.<br>Share this room code with a friend and have them open this page in another browser tab.</p>';
        }
        
        this.showScreen('create-room-screen');
    }

    copyRoomCode() {
        navigator.clipboard.writeText(this.multiplayerGame.roomCode).then(() => {
            const btn = document.getElementById('copy-room-code');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }

    confirmHostCode() {
        console.log('confirmHostCode called');
        
        const codeInput = document.getElementById('host-secret-code');
        console.log('Code input element:', codeInput);
        
        const code = codeInput ? codeInput.value.trim() : '';
        console.log('Code entered:', code);
        
        if (!this.isValidGuess(code)) {
            alert('Please enter exactly 4 digits (0-9)');
            return;
        }
        
        this.multiplayerGame.yourCode = code;
        console.log('Code set in game state:', this.multiplayerGame.yourCode);
        
        // Check if socket is available and connected
        if (this.socket && this.socket.connected) {
            console.log('Sending code to server');
            this.socket.emit('set-secret-code', {
                roomCode: this.multiplayerGame.roomCode,
                secretCode: code
            });
            alert('Secret code set! Waiting for opponent to set their code...');
        } else {
            console.log('No server connection - offline mode');
            alert('Secret code set! (Offline mode - for demo purposes only)');
            
            // In offline mode, simulate opponent joining after a delay
            setTimeout(() => {
                alert('Simulated opponent joined! Starting game...');
                this.multiplayerGame.gameStarted = true;
                this.multiplayerGame.isYourTurn = true;
                this.startMultiplayerGame();
            }, 2000);
        }
    }

    joinRoom() {
        const roomCode = document.getElementById('join-room-code').value.trim().toUpperCase();
        if (roomCode.length !== 6) {
            alert('Please enter a valid 6-character room code');
            return;
        }
        
        this.multiplayerGame.roomCode = roomCode;
        this.multiplayerGame.isHost = false;
        this.multiplayerGame.playerRole = 'guest';
        this.multiplayerGame.yourCode = '';
        this.multiplayerGame.yourAttempts = 0;
        this.multiplayerGame.opponentAttempts = 0;
        this.multiplayerGame.isYourTurn = false;
        this.multiplayerGame.gameOver = false;
        this.multiplayerGame.gameStarted = false;
        this.multiplayerGame.yourGuesses = [];
        this.multiplayerGame.opponentGuesses = [];
        
        // Join room on server
        this.socket.emit('join-room', { roomCode });
        
        document.getElementById('join-code-section').classList.remove('hidden');
    }

    confirmGuestCode() {
        console.log('confirmGuestCode called');
        
        const codeInput = document.getElementById('guest-secret-code');
        console.log('Code input element:', codeInput);
        
        const code = codeInput ? codeInput.value.trim() : '';
        console.log('Code entered:', code);
        
        if (!this.isValidGuess(code)) {
            alert('Please enter exactly 4 digits (0-9)');
            return;
        }
        
        this.multiplayerGame.yourCode = code;
        console.log('Code set in game state:', this.multiplayerGame.yourCode);
        
        // Check if socket is available and connected
        if (this.socket && this.socket.connected) {
            console.log('Sending code to server');
            this.socket.emit('set-secret-code', {
                roomCode: this.multiplayerGame.roomCode,
                secretCode: code
            });
            alert('Secret code set! Waiting for game to start...');
        } else {
            console.log('No server connection - offline mode');
            alert('Secret code set! (Offline mode - for demo purposes only)');
            
            // In offline mode, simulate game start
            setTimeout(() => {
                alert('Simulated game start!');
                this.multiplayerGame.gameStarted = true;
                this.multiplayerGame.isYourTurn = false; // Guest goes second
                this.startMultiplayerGame();
            }, 2000);
        }
    }

    startMultiplayerGame() {
        console.log('Starting multiplayer game');
        
        document.getElementById('your-attempts').textContent = '0';
        document.getElementById('opponent-attempts').textContent = '0';
        document.getElementById('your-guesses').innerHTML = '';
        document.getElementById('opponent-guesses').innerHTML = '';
        document.getElementById('multiplayer-result').classList.add('hidden');
        document.getElementById('new-multiplayer-game').classList.add('hidden');
        document.getElementById('multiplayer-guess-input').value = '';
        document.getElementById('multiplayer-guess-input').disabled = false;
        document.getElementById('submit-multiplayer-guess').disabled = false;
        
        this.updateTurnIndicator();
        this.showScreen('multiplayer-game');
        
        // In offline mode, generate opponent code if not set
        if (!this.socket || !this.socket.connected) {
            if (!this.multiplayerGame.opponentCode) {
                this.multiplayerGame.opponentCode = this.generateSecretCode();
                console.log('Generated opponent code for offline mode:', this.multiplayerGame.opponentCode);
            }
            
            // If it's opponent's turn, simulate their move
            if (!this.multiplayerGame.isYourTurn) {
                setTimeout(() => this.simulateOpponentMove(), 2000);
            }
        }
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('turn-status');
        const turnDiv = indicator.parentElement;
        
        if (this.multiplayerGame.isYourTurn) {
            indicator.textContent = 'Your Turn';
            turnDiv.classList.remove('opponent-turn');
        } else {
            indicator.textContent = "Opponent's Turn";
            turnDiv.classList.add('opponent-turn');
        }
        
        document.getElementById('multiplayer-guess-input').disabled = !this.multiplayerGame.isYourTurn;
        document.getElementById('submit-multiplayer-guess').disabled = !this.multiplayerGame.isYourTurn;
    }

    submitMultiplayerGuess() {
        const input = document.getElementById('multiplayer-guess-input');
        const guess = input.value.trim();
        
        console.log('Submitting multiplayer guess:', guess);
        
        if (!this.isValidGuess(guess)) {
            alert('Please enter exactly 4 digits (0-9)');
            return;
        }
        
        if (this.multiplayerGame.gameOver || !this.multiplayerGame.isYourTurn || !this.multiplayerGame.gameStarted) {
            if (!this.multiplayerGame.isYourTurn) {
                alert("It's not your turn!");
            }
            return;
        }
        
        // Check if we're in online or offline mode
        if (this.socket && this.socket.connected) {
            // Online mode - send to server
            console.log('Sending guess to server');
            this.socket.emit('submit-guess', {
                roomCode: this.multiplayerGame.roomCode,
                guess: guess
            });
        } else {
            // Offline mode - handle locally
            console.log('Handling guess locally (offline mode)');
            this.multiplayerGame.yourAttempts++;
            
            // Make sure we have an opponent code
            if (!this.multiplayerGame.opponentCode) {
                this.multiplayerGame.opponentCode = this.generateSecretCode();
            }
            
            const feedback = this.getFeedback(guess, this.multiplayerGame.opponentCode);
            this.displayMultiplayerFeedback('your-guesses', guess, feedback, this.multiplayerGame.yourAttempts);
            document.getElementById('your-attempts').textContent = this.multiplayerGame.yourAttempts;
            
            if (this.isCorrectGuess(feedback)) {
                this.endMultiplayerGame(`🎉 You won! You cracked your opponent's code in ${this.multiplayerGame.yourAttempts} attempts!`);
                return;
            } else if (this.multiplayerGame.yourAttempts >= this.multiplayerGame.maxAttempts) {
                if (this.multiplayerGame.opponentAttempts >= this.multiplayerGame.maxAttempts) {
                    this.endMultiplayerGame(`🤝 It's a draw! Both players used all attempts. Your code was ${this.multiplayerGame.yourCode}, opponent's was ${this.multiplayerGame.opponentCode}.`);
                    return;
                }
            }
            
            this.multiplayerGame.isYourTurn = false;
            this.updateTurnIndicator();
            
            // Simulate opponent's move after a delay
            setTimeout(() => this.simulateOpponentMove(), 1500);
        }
        
        input.value = '';
    }



    displayMultiplayerFeedback(containerId, guess, feedback, attemptNumber) {
        const container = document.getElementById(containerId);
        const row = document.createElement('div');
        row.className = 'guess-row';
        
        const guessNumber = document.createElement('div');
        guessNumber.className = 'guess-number';
        guessNumber.textContent = `#${attemptNumber}`;
        
        const digits = document.createElement('div');
        digits.className = 'guess-digits';
        
        for (let i = 0; i < 4; i++) {
            const digit = document.createElement('div');
            digit.className = `digit ${feedback[i]}`;
            digit.textContent = guess[i];
            digits.appendChild(digit);
        }
        
        row.appendChild(guessNumber);
        row.appendChild(digits);
        container.appendChild(row);
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    simulateOpponentMove() {
        if (this.multiplayerGame.gameOver || this.multiplayerGame.isYourTurn) return;
        
        console.log('Simulating opponent move');
        this.multiplayerGame.opponentAttempts++;
        
        // Generate a random guess for the opponent
        const guess = this.generateSecretCode();
        const feedback = this.getFeedback(guess, this.multiplayerGame.yourCode);
        
        this.displayMultiplayerFeedback('opponent-guesses', guess, feedback, this.multiplayerGame.opponentAttempts);
        document.getElementById('opponent-attempts').textContent = this.multiplayerGame.opponentAttempts;
        
        if (this.isCorrectGuess(feedback)) {
            this.endMultiplayerGame(`😞 Your opponent won! They cracked your code in ${this.multiplayerGame.opponentAttempts} attempts.`);
            return;
        } else if (this.multiplayerGame.opponentAttempts >= this.multiplayerGame.maxAttempts) {
            if (this.multiplayerGame.yourAttempts >= this.multiplayerGame.maxAttempts) {
                this.endMultiplayerGame(`🤝 It's a draw! Both players used all attempts. Your code was ${this.multiplayerGame.yourCode}, opponent's was ${this.multiplayerGame.opponentCode}.`);
                return;
            }
        }
        
        this.multiplayerGame.isYourTurn = true;
        this.updateTurnIndicator();
    }

    endMultiplayerGame(message) {
        this.multiplayerGame.gameOver = true;
        document.getElementById('multiplayer-guess-input').disabled = true;
        document.getElementById('submit-multiplayer-guess').disabled = true;
        
        const resultDiv = document.getElementById('multiplayer-result');
        resultDiv.classList.remove('hidden', 'win', 'lose');
        
        if (message.includes('You won')) {
            resultDiv.classList.add('win');
        } else if (message.includes('draw')) {
            // No specific class for draw
        } else {
            resultDiv.classList.add('lose');
        }
        
        resultDiv.textContent = message;
        document.getElementById('new-multiplayer-game').classList.remove('hidden');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    try {
        const game = new CrackTheCodeGame();
        console.log('Game initialized successfully');
        
        // Test if create room button exists
        const createRoomBtn = document.getElementById('create-room');
        console.log('Create room button found:', createRoomBtn);
        
        if (createRoomBtn) {
            console.log('Create room button event listeners:', createRoomBtn.onclick);
        }
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});