import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8O6Fh10MNQrdW6cBZnUibVFRB2q5cD1Q",
  authDomain: "if-i-were-c624c.firebaseapp.com",
  databaseURL: "https://if-i-were-c624c-default-rtdb.firebaseio.com",
  projectId: "if-i-were-c624c",
  storageBucket: "if-i-were-c624c.appspot.com",
  messagingSenderId: "21442086633",
  appId: "1:21442086633:web:e49f99337b3caaeaecd278"
};

let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (err) {
  console.warn("Firebase not initialized - check your firebaseConfig");
}

class Game {
  constructor() {
    this.roomCode = null;
    this.playerName = null;
    this.isHost = false;
  }

  generateRoomCode() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return Array.from({ length: 4 }, () =>
      letters.charAt(Math.floor(Math.random() * letters.length))
    ).join('');
  }

  switchPhase(phaseId) {
    document.querySelectorAll('.game-phase').forEach(s => s.style.display = 'none');
    const phaseEl = document.getElementById(phaseId);
    if (phaseEl) phaseEl.style.display = 'block';
  }

  async hostGame(playerName, playerCount) {
    if (!db) {
      alert('Firebase not configured.');
      return;
    }
    this.isHost = true;
    this.playerName = playerName || 'Host';
    this.roomCode = this.generateRoomCode();
    console.log("Creating room with code:", this.roomCode);
    const roomRef = ref(db, `rooms/${this.roomCode}`);
    await set(roomRef, {
      host: this.playerName,
      maxPlayers: playerCount || 4,
      players: { [this.playerName]: true },
      phase: 'lobby'
    });
    this.listenForPlayers();
    this.switchPhase('lobby');
    document.getElementById('start-game').style.display = 'inline-block';
  }

  async joinRoom(code, playerName) {
    if (!db) {
      alert('Firebase not configured.');
      return;
    }
    const roomCode = (code || '').toUpperCase();
    if (!roomCode) {
      alert('Enter a room code');
      return;
    }
    const roomRef = ref(db, `rooms/${roomCode}`);
    const snap = await get(roomRef);
    if (!snap.exists()) {
      alert('Room not found!');
      return;
    }
    this.roomCode = roomCode;
    this.playerName = playerName || 'Player';
    await update(ref(db, `rooms/${roomCode}/players`), { [this.playerName]: true });
    this.listenForPlayers();
    this.switchPhase('lobby');
  }

  async startGame() {
    if (!db || !this.isHost) return;
    await update(ref(db, `rooms/${this.roomCode}`), { phase: 'quiz' });
    this.switchPhase('quiz-phase');
  }

  listenForPlayers() {
    const playerListEl = document.getElementById('player-list');
    const playersRef = ref(db, `rooms/${this.roomCode}/players`);
    onValue(playersRef, (snapshot) => {
      const players = snapshot.val() || {};
      if (playerListEl) {
        playerListEl.innerHTML = '';
        Object.keys(players).forEach(p => {
          const li = document.createElement('li');
          li.textContent = p;
          playerListEl.appendChild(li);
        });
      }
      const roomCodeEl = document.getElementById('room-code');
      if (roomCodeEl) roomCodeEl.textContent = this.roomCode;
    });
  }
}

window.game = new Game();
