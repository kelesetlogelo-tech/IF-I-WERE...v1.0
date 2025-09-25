import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ✅ Firebase configuration
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
  console.warn("Firebase not initialized");
}

// ✅ Question bank (short sample)
const QUESTIONS = [
  { text: "If I were a sound effect, I'd be ....", options: ["The frantic hoot of a Siyaya (taxi)", "Evil laugh!", "Ta-da!"] },
  { text: "If I were a breakfast cereal, I'd be ....", options: ["Jungle Oats", "Weetbix", "Rice Krispies"] }
];

class Game {
  constructor() {
    this.roomCode = null;
    this.playerName = null;
    this.isHost = false;
    this.currentQuestion = 0;
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
    console.log("DEBUG: hostGame called", playerName, playerCount);
    if (!db) return;
    this.isHost = true;
    this.playerName = playerName || 'Host';
    this.roomCode = this.generateRoomCode();
    const roomRef = ref(db, `rooms/${this.roomCode}`);
    await set(roomRef, {
      host: this.playerName,
      maxPlayers: playerCount || 4,
      players: { [this.playerName]: true },
      started: false
    });
    this.listenForPlayers();
    this.switchPhase('lobby');
  }

  async joinRoom(code, playerName) {
    if (!db) return;
    const roomCode = (code || '').toUpperCase();
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
    this.switchPhase('lobby');
  }

  async startGame() {
    if (!db || !this.isHost) return;
    this.currentQuestion = 0;
    this.showQuestion();
    this.switchPhase('quiz-phase');
  }

  showQuestion() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    const q = QUESTIONS[this.currentQuestion];
    if (!q) return;

    container.innerHTML = `
      <div class="quiz-card">
        <h3>${q.text}</h3>
        <ul>
          ${q.options.map(opt => `<li><button class="pill-btn answer-btn">${opt}</button></li>`).join('')}
        </ul>
      </div>
    `;
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

      // Show start button if all players joined and host
      if (this.isHost && Object.keys(players).length >= 2) {
        document.getElementById('start-game').style.display = 'inline-block';
      }
    });
  }
}

const game = new Game();

// Event listeners
document.getElementById("create-room").addEventListener("click", async () => {
  const name = document.getElementById("host-name").value.trim() || "Host";
  const playerCount = parseInt(document.getElementById("player-count").value) || 4;
  await game.hostGame(name, playerCount);
});

document.getElementById("join-room").addEventListener("click", async () => {
  const name = document.getElementById("join-name").value.trim() || "Player";
  const code = document.getElementById("join-code").value.trim();
  await game.joinRoom(code, name);
});

document.getElementById("start-game").addEventListener("click", async () => {
  await game.startGame();
});
