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

// ✅ Question bank (shortened for brevity)
const QUESTIONS = [
  { text: "If I were a sound effect, I'd be ....", options: ["The frantic hoot of a Siyaya (taxi)", "Evil laugh!", "A mix of Kwaito & Amapiano basslines from a shebeen", "Ta-da!", "Dramatic gasp", "The hiss of a shaken carbonated drink"] },
  { text: "If I were a type of chair, I'd be ....", options: ["That sofa at Phala Phala", "A creaky antique that screams when you sit", "One of those folding chairs that attack your fingers", "The overstuffed armchair covered in snack crumbs", "The velvet fainting couch - I'm a little dramatic... a lot extra actually!"] }
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
    const q = QUESTIONS[this.currentQuestion];
    if (!q) {
      container.innerHTML = `<h2>All questions answered!</h2>`;
      return;
    }
    container.innerHTML = `
      <div class="quiz-card">
        <h3>${q.text}</h3>
        <ul>
          ${q.options.map(opt => `<li><button class="answerBtn">${opt}</button></li>`).join('')}
        </ul>
      </div>
    `;
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
  console.log("Creating room with name:", name, "max players:", count);
  game.hostGame(name, count);
});

document.getElementById("joinRoomBtn").addEventListener("click", () => {
  const name = document.getElementById("playerName").value.trim();
  const code = document.getElementById("roomCode").value.trim();
  console.log("Joining room:", code, "with name:", name);
  game.joinRoom(code, name);
});
