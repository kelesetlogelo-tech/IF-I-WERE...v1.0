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
  console.warn("Firebase not initialized");
}

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
    const gameEl = document.getElementById("game");
    if (!gameEl) return;
    if (phaseId === "lobby") {
      gameEl.innerHTML = `<h2>Lobby</h2><p>Room Code: ${this.roomCode}</p><ul id="playerList"></ul>`;
      if (this.isHost) {
        gameEl.innerHTML += `<button id="startGameBtn">Start Game</button>`;
        document.getElementById("startGameBtn").addEventListener("click", () => this.startGame());
      }
      this.listenForPlayers();
    } else if (phaseId === "quiz") {
      this.showQuestion();
    }
  }

  async hostGame(playerName, playerCount) {
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
    this.switchPhase("lobby");
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
    this.roomCode = roomCode;
    this.playerName = playerName || 'Player';
    await update(ref(db, `rooms/${roomCode}/players`), { [this.playerName]: true });
    this.switchPhase("lobby");
  }

  async startGame() {
    if (!db || !this.isHost) return;
    this.currentQuestion = 0;
    this.switchPhase("quiz");
  }

  showQuestion() {
    const container = document.getElementById("game");
    container.innerHTML = `<div class="quiz-card"><h3>Game starting soon...</h3></div>`;
  }

  listenForPlayers() {
    const playersRef = ref(db, `rooms/${this.roomCode}/players`);
    onValue(playersRef, (snapshot) => {
      const players = snapshot.val() || {};
      const listEl = document.getElementById("playerList");
      if (listEl) {
        listEl.innerHTML = "";
        Object.keys(players).forEach(p => {
          const li = document.createElement("li");
          li.textContent = p;
          listEl.appendChild(li);
        });
      }
    });
  }
}

const game = new Game();

document.getElementById("createRoomBtn").addEventListener("click", () => {
  const name = document.getElementById("playerName").value.trim();
  const count = parseInt(document.getElementById("numPlayers").value) || 4;
  game.hostGame(name, count);
});

document.getElementById("joinRoomBtn").addEventListener("click", () => {
  const name = document.getElementById("joinPlayerName").value.trim();
  const code = document.getElementById("roomCode").value.trim();
  game.joinRoom(code, name);
});
