# Crack the Code - Multiplayer Game

A real-time multiplayer code-cracking game where players compete to guess each other's secret 4-digit codes.

## Features

- **Single Player**: Play against computer-generated codes
- **Real Multiplayer**: Play with friends using room codes
- **Real-time gameplay**: Instant updates when opponents make moves
- **Color-coded feedback**: Green (correct position), Yellow (wrong position), Red (not in code)
- **Mobile responsive**: Works on desktop and mobile devices

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and go to:
```
http://localhost:3000
```

### For Development
```bash
npm run dev
```

## How to Play Multiplayer

1. **Create a Room**: 
   - Click "Play with Friend" → "Create Room"
   - Set your 4-digit secret code
   - Share the room code with your friend

2. **Join a Room**:
   - Click "Play with Friend" → "Join Room" 
   - Enter the room code from your friend
   - Set your 4-digit secret code

3. **Gameplay**:
   - Take turns guessing your opponent's code
   - Use the color feedback to narrow down the possibilities
   - First to crack the opponent's code wins!

## Game Rules

- Codes are exactly 4 digits (0-9)
- Digits can repeat
- Maximum 7 attempts per player
- 🟩 Green = Correct digit in correct position
- 🟨 Yellow = Digit exists but wrong position  
- 🟥 Red = Digit doesn't exist in the code

Enjoy the game! 🎯