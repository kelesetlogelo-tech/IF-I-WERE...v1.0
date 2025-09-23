import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ✅ Firebase configuration (replace with your own if needed)
const firebaseConfig = {
  apiKey: "AIzaSyA8O6Fh10MNQrdW6cBZnUibVFRB2q5cD1Q",
  authDomain: "if-i-were-c624c.firebaseapp.com",
  databaseURL: "https://if-i-were-c624c-default-rtdb.firebaseio.com",
  projectId: "if-i-were-c624c",
  storageBucket: "if-i-were-c624c.appspot.com",
  messagingSenderId: "21442086633",
  appId: "1:21442086633:web:e49f99337b3caaeaecd278"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✅ Question bank (short sample for testing)
const QUESTIONS = [
  { text: "If I were a sound effect, I'd be ....", options: ["Taxi hoot", "Evil laugh", "Kwaito & Amapiano bass", "Ta-da!", "Dramatic gasp", "Soda hiss"] },
  { text: "If I were a weather-forecast, I'd be ....", options: ["Dramatic chaos", "Tornado of opinions", "100% chill", "Heatwave", "Quiet before coffee", "Stormy reorg"] }
];

class Game {
  constructor() {
    this.roomCode = null;
    this.playerName = null;
    this.isHost = false;
    this.currentQuestion = 0;
    this.answers = {};
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
    this.isHost = true;
    this.playerName = playerName || 'Host';
    this.roomCode = this.generateRoomCode();
    const roomRef = ref(db, `rooms/${this.roomCode}`);
    await set(roomRef, {
      host: this.playerName,
      maxPlayers: playerCount || 4,
      players: { [this.playerName]: true },
      started: false,
      answers: {},
      status: {},
      phase: 'lobby'
    });
    this.listenForPlayers();
    this.listenForPhase();
    this.switchPhase('lobby');
  }

  async joinRoom(code, playerName) {
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
    const room = snap.val();
    const players = room.players ? Object.keys(room.players) : [];
    if (players.length >= (room.maxPlayers || 4)) {
      alert('Room is full!');
      return;
    }
    this.roomCode = roomCode;
    this.playerName = playerName || 'Player';
    await update(ref(db, `rooms/${roomCode}/players`), { [this.playerName]: true });
    this.listenForPlayers();
    this.listenForPhase();
    this.switchPhase('lobby');
  }

  async startGame() {
    if (!this.isHost) return;
    const playersSnap = await get(ref(db, `rooms/${this.roomCode}/players`));
    const players = playersSnap.exists() ? Object.keys(playersSnap.val()) : [];
    if (players.length < 2) {
      alert('Need at least 2 players to start.');
      return;
    }
    await update(ref(db, `rooms/${this.roomCode}`), {
      phase: 'quiz',
      answers: {}
    });
    this.currentQuestion = 0;
    this.showQuestion();
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
      // show Start button only when all expected players joined
      const startBtn = document.getElementById('start-game');
      if (this.isHost) {
        get(ref(db, `rooms/${this.roomCode}`)).then(snap => {
          const room = snap.val();
          if (Object.keys(players).length >= room.maxPlayers) {
            startBtn.style.display = 'inline-block';
          } else {
            startBtn.style.display = 'none';
          }
        });
      }
      const roomCodeEl = document.getElementById('room-code');
      if (roomCodeEl) roomCodeEl.textContent = this.roomCode;
    });
  }

  listenForPhase() {
    const phaseRef = ref(db, `rooms/${this.roomCode}/phase`);
    onValue(phaseRef, (snapshot) => {
      const phase = snapshot.val();
      if (phase === 'quiz' && !this.isHost) {
        this.currentQuestion = 0;
        this.showQuestion();
        this.switchPhase('quiz-phase');
      }
    });
  }

  showQuestion() {
    if (this.currentQuestion >= QUESTIONS.length) {
      alert("All questions answered! (Guessing phase TBD)");
      return;
    }
    const q = QUESTIONS[this.currentQuestion];
    document.getElementById('question-text').textContent = q.text;
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.onclick = () => this.submitAnswer(opt);
      container.appendChild(btn);
    });
  }

  async submitAnswer(answer) {
    await update(ref(db, `rooms/${this.roomCode}/answers/${this.playerName}`), {
      [this.currentQuestion]: answer
    });
    this.currentQuestion++;
    this.showQuestion();
  }
}

const game = new Game();

// DOM Listeners
document.getElementById('create-room').onclick = () => {
  const name = document.getElementById('player-name').value.trim();
  const count = parseInt(document.getElementById('player-count').value, 10) || 4;
  game.hostGame(name, count);
};

document.getElementById('join-room').onclick = () => {
  const code = document.getElementById('room-code-input').value.trim();
  const name = document.getElementById('player-name').value.trim();
  game.joinRoom(code, name);
};

document.getElementById('start-game').onclick = () => game.startGame();
