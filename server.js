const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Store game rooms
const gameRooms = new Map();

class GameRoom {
    constructor(roomCode, hostSocketId) {
        this.roomCode = roomCode;
        this.hostSocketId = hostSocketId;
        this.guestSocketId = null;
        this.hostCode = null;
        this.guestCode = null;
        this.hostAttempts = 0;
        this.guestAttempts = 0;
        this.maxAttempts = 5;
        this.currentTurn = 'host'; // 'host' or 'guest'
        this.gameStarted = false;
        this.gameEnded = false;
        this.hostGuesses = [];
        this.guestGuesses = [];
    }

    addGuest(guestSocketId) {
        this.guestSocketId = guestSocketId;
    }

    setHostCode(code) {
        this.hostCode = code;
        this.checkGameReady();
    }

    setGuestCode(code) {
        this.guestCode = code;
        this.checkGameReady();
    }

    checkGameReady() {
        if (this.hostCode && this.guestCode && this.guestSocketId) {
            this.gameStarted = true;
            return true;
        }
        return false;
    }

    switchTurn() {
        this.currentTurn = this.currentTurn === 'host' ? 'guest' : 'host';
    }

    isHost(socketId) {
        return socketId === this.hostSocketId;
    }

    isGuest(socketId) {
        return socketId === this.guestSocketId;
    }

    getOpponentSocketId(socketId) {
        return this.isHost(socketId) ? this.guestSocketId : this.hostSocketId;
    }

    getPlayerRole(socketId) {
        return this.isHost(socketId) ? 'host' : 'guest';
    }

    getOpponentCode(socketId) {
        return this.isHost(socketId) ? this.guestCode : this.hostCode;
    }

    addGuess(socketId, guess, feedback) {
        if (this.isHost(socketId)) {
            this.hostAttempts++;
            this.hostGuesses.push({ guess, feedback, attempt: this.hostAttempts });
        } else {
            this.guestAttempts++;
            this.guestGuesses.push({ guess, feedback, attempt: this.guestAttempts });
        }
    }

    getPlayerAttempts(socketId) {
        return this.isHost(socketId) ? this.hostAttempts : this.guestAttempts;
    }

    getOpponentAttempts(socketId) {
        return this.isHost(socketId) ? this.guestAttempts : this.hostAttempts;
    }
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-room', (data) => {
        const roomCode = data.roomCode;
        const room = new GameRoom(roomCode, socket.id);
        gameRooms.set(roomCode, room);
        
        socket.join(roomCode);
        socket.emit('room-created', { roomCode });
        console.log(`Room ${roomCode} created by ${socket.id}`);
    });

    socket.on('join-room', (data) => {
        const roomCode = data.roomCode;
        const room = gameRooms.get(roomCode);
        
        if (!room) {
            socket.emit('room-error', { message: 'Room not found' });
            return;
        }
        
        if (room.guestSocketId) {
            socket.emit('room-error', { message: 'Room is full' });
            return;
        }
        
        room.addGuest(socket.id);
        socket.join(roomCode);
        
        // Notify both players
        socket.emit('room-joined', { roomCode });
        socket.to(roomCode).emit('player-joined');
        
        console.log(`${socket.id} joined room ${roomCode}`);
    });

    socket.on('set-secret-code', (data) => {
        const { roomCode, secretCode } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room) {
            socket.emit('room-error', { message: 'Room not found' });
            return;
        }
        
        if (room.isHost(socket.id)) {
            room.setHostCode(secretCode);
        } else if (room.isGuest(socket.id)) {
            room.setGuestCode(secretCode);
        }
        
        // Check if game can start
        if (room.checkGameReady()) {
            io.to(roomCode).emit('game-start', {
                currentTurn: room.currentTurn,
                hostAttempts: room.hostAttempts,
                guestAttempts: room.guestAttempts
            });
        }
    });

    socket.on('submit-guess', (data) => {
        const { roomCode, guess } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room || !room.gameStarted || room.gameEnded) {
            return;
        }
        
        const playerRole = room.getPlayerRole(socket.id);
        if (room.currentTurn !== playerRole) {
            socket.emit('not-your-turn');
            return;
        }
        
        // Calculate feedback
        const opponentCode = room.getOpponentCode(socket.id);
        const feedback = calculateFeedback(guess, opponentCode);
        
        // Add guess to room
        room.addGuess(socket.id, guess, feedback);
        
        // Check if game is won
        const isWin = feedback.every(f => f === 'correct');
        const playerAttempts = room.getPlayerAttempts(socket.id);
        const opponentAttempts = room.getOpponentAttempts(socket.id);
        
        // Send guess result to both players
        const guessData = {
            guess,
            feedback,
            attempt: playerAttempts,
            player: playerRole
        };
        
        io.to(roomCode).emit('guess-result', guessData);
        
        if (isWin) {
            room.gameEnded = true;
            io.to(roomCode).emit('game-end', {
                winner: playerRole,
                hostAttempts: room.hostAttempts,
                guestAttempts: room.guestAttempts,
                hostCode: room.hostCode,
                guestCode: room.guestCode
            });
        } else if (playerAttempts >= room.maxAttempts) {
            if (opponentAttempts >= room.maxAttempts) {
                // Both players exhausted attempts - draw
                room.gameEnded = true;
                io.to(roomCode).emit('game-end', {
                    winner: 'draw',
                    hostAttempts: room.hostAttempts,
                    guestAttempts: room.guestAttempts,
                    hostCode: room.hostCode,
                    guestCode: room.guestCode
                });
            } else {
                // Current player exhausted attempts, switch turn
                room.switchTurn();
                io.to(roomCode).emit('turn-change', {
                    currentTurn: room.currentTurn,
                    hostAttempts: room.hostAttempts,
                    guestAttempts: room.guestAttempts
                });
            }
        } else {
            // Switch turn
            room.switchTurn();
            io.to(roomCode).emit('turn-change', {
                currentTurn: room.currentTurn,
                hostAttempts: room.hostAttempts,
                guestAttempts: room.guestAttempts
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Find and clean up rooms where this socket was a participant
        for (const [roomCode, room] of gameRooms.entries()) {
            if (room.hostSocketId === socket.id || room.guestSocketId === socket.id) {
                // Notify the other player
                socket.to(roomCode).emit('player-disconnected');
                gameRooms.delete(roomCode);
                break;
            }
        }
    });
});

function calculateFeedback(guess, secretCode) {
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});