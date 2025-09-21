/*
  script.js (module)
  Firebase-enabled quiz with sliding question cards.
  - Paste your Firebase config into the firebaseConfig object below.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase, ref, set, get, onValue, update
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8O6Fh10MNQrdW6cBZnUibVFRB2q5cD1Q",
  authDomain: "if-i-were-c624c.firebaseapp.com",
  databaseURL: "https://if-i-were-c624c-default-rtdb.firebaseio.com",
  projectId: "if-i-were-c624c",
  storageBucket: "if-i-were-c624c.firebasestorage.app",
  messagingSenderId: "21442086633",
  appId: "1:21442086633:web:e49f99337b3caaeaecd278",
};

let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (err) {
  console.warn('Firebase not initialized - paste your firebaseConfig in script.js');
}

// Question bank (10 sets)
const QUESTIONS = [
  {
    text: "If I were a sound effect, I'd be ....",
    options: [
      "The frantic hoot of a Siyaya (taxi)",
      "Evil laugh!",
      "A mix of Kwaito & Amapiano basslines from a shebeen",
      "Ta-da!",
      "Dramatic gasp",
      "The hiss of a shaken carbonated drink"
    ]
  },
  {
    text: "If I were a weather-forecast, I'd be ....",
    options: [
      "Partly dramatic with a chance of chaos",
      "Sudden tornado of opinions",
      "100% chill",
      "Heatwave in Limpopo",
      "The calm before the storm: I'm a quiet observer until I have had too much coffee!",
      "Severe weather alert for a sudden unexplainable urge to reorganize my entire livingspace"
    ]
  },
  {
    text: "If I were a bedtime excuse, I'd be ....",
    options: [
      "I need to find the remote",
      'I need to search for "Pillow"',
      "Trying to find my way out of this rabbit hole of YouTube videos",
      "I need water",
      "There's something in my closet",
      "Just one more episode",
      "There's a spider in my room"
    ]
  },
  {
    text: "If I were a breakfast cereal, I'd be ....",
    options: [
      "Jungle Oats",
      "Weetbix",
      "The weird healthy one that keeps piling up in the pantry",
      "Rice Krispies",
      "Bokomo Cornflakes",
      "MorVite"
    ]
  },
  {
    text: "If I were a villain in a movie, I'd be ....",
    options: [
      "Thanos",
      "Grinch",
      "Scarlet Overkill",
      "A mosquito in your room at night",
      "Darth Vader",
      "Doctor Doom",
      "Emperor Palpatine"
    ]
  },
  {
    text: "If I were a kitchen appliance, I'd be ....",
    options: [
      "A blender on high speed with no lid",
      "A toaster that only pops when no one’s looking",
      "A microwave that screams when it’s done",
      "A fridge that judges your snack choices"
    ]
  },
  {
    text: "If I were a dance move, I'd be ....",
    options: [
      "The sprinkler: I'm a little awkward, a little stiff and probably hitting the person next to me!",
      "The moonwalk: I'm trying to move forward, but somehow end up where I started...",
      "The “I thought no one was watching” move",
      "The knee-pop followed by a regretful sit-down",
      "The Macarena: I know I can do it, but I'm not quite sure why",
      'That "running to the bathroom" shuffle: the desperate high-speed march with clenched-up posture and wild eyes'
    ]
  },
  {
    text: "If I were a text message, I'd be ....",
    options: [
      "A typo-ridden voice-to-text disaster",
      "A three-hour late "LOL"",
      "A group chat gif spammer",
      "A mysterious "K." with no context"
    ]
  },
  {
    text: "If I were a warning label, I'd be ....",
    options: [
      "Caution: May spontaneously break into song",
      "Warning: Contains high levels of optimism and creative ideas, but only after caffeine",
      "Contents may cause uncontrollable giggles",
      "Warning: Do not operate on an empty stomach",
      "Warning: Will talk your ear off about random facts",
      "May contain traces of impulsive decisions",
      "Caution: Do not interrupt during a new K-Pop music video release",
      "Warning: Do not approach before first cup of coffee"
    ]
  },
  {
    text: "If I were a type of chair, I'd be ....",
    options: [
      "That sofa at Phala Phala",
      "A creaky antique that screams when you sit",
      "One of those folding chairs that attack your fingers",
      "The overstuffed armchair covered in snack crumbs",
      "The velvet fainting couch - I'm a little dramatic... a lot extra actually!"
    ]
  }
];

class Game {
  constructor() {
    this.roomCode = null;
    this.playerName = null;
    this.isHost = false;
    this.currentQuestion = 0;
    this.answers = {}; // keyed by question index (1-based)
  }

  generateRoomCode() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return Array.from({length:4}, () => letters.charAt(Math.floor(Math.random()*letters.length))).join('');
  }

  switchPhase(phaseId) {
    document.querySelectorAll('.game-phase').forEach(s => s.style.display = 'none');
    document.getElementById(phaseId).style.display = 'block';
  }

  async hostGame(playerName, playerCount) {
    if (!db) { alert('Firebase not configured. Paste your firebaseConfig in script.js.'); return; }
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
    this.listenForStatus();
    this.listenForPhase();
    this.switchPhase('lobby');
  }

  async joinRoom(code, playerName) {
    if (!db) { alert('Firebase not configured. Paste your firebaseConfig in script.js.'); return; }
    const roomCode = (code || '').toUpperCase();
    if (!roomCode) { alert('Enter a room code'); return; }

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
    await update(ref(db, `rooms/${roomCode}/status`), { [this.playerName]: 'in-progress' });

    this.listenForPlayers();
    this.listenForStatus();
    this.listenForPhase();
    this.switchPhase('lobby');
  }

  listenForPlayers() {
    const playerListEl = document.getElementById('player-list');
    const playersRef = ref(db, `rooms/${this.roomCode}/players`);
    onValue(playersRef, (snapshot) => {
      const players = snapshot.val() || {};
      playerListEl.innerHTML = '';
      Object.keys(players).forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        playerListEl.appendChild(li);
      });
      document.getElementById('room-code').textContent = this.roomCode;
    });
  }

  listenForStatus() {
    const finishedList = document.getElementById('finished-list');
    const statusRef = ref(db, `rooms/${this.roomCode}/status`);
    onValue(statusRef, (snapshot) => {
      const status = snapshot.val() || {};
      finishedList.innerHTML = '';
      Object.entries(status).forEach(([player, state]) => {
        if (state === 'finished') {
          const li = document.createElement('li');
          li.textContent = player;
          finishedList.appendChild(li);
        }
      });

      // If host, check if all players finished to show NEXT PHASE
      if (this.isHost) {
        # fetch current players list too
        get(ref(db, `rooms/${this.roomCode}/players`)).then(snap => {
          const players = snap.exists() ? Object.keys(snap.val()) : [];
          const finished = Object.entries(status).filter(([p,s]) => s === 'finished').map(x=>x[0]);
          const allFinished = players.length > 0 && finished.length === players.length;
          const nextBtnExists = document.getElementById('next-phase');
          if (allFinished) {
            if (!nextBtnExists) {
              const btn = document.createElement('button');
              btn.id = 'next-phase';
              btn.className = 'btn btn-primary';
              btn.textContent = 'NEXT PHASE';
              btn.style.marginTop = '12px';
              btn.onclick = () => update(ref(db, `rooms/${this.roomCode}`), { phase: 'guessing' });
              document.getElementById('host-controls').appendChild(btn);
            } else {
              nextBtnExists.style.display = 'inline-block';
            }
          }
        });
      }
    });
  }

  listenForPhase() {
    const phaseRef = ref(db, `rooms/${this.roomCode}/phase`);
    onValue(phaseRef, (snapshot) => {
      const phase = snapshot.val();
      if (phase === 'quiz') {
        // nothing here for now; quiz is started by host setting game and phase
      } else if (phase === 'guessing') {
        this.switchPhase('guessing-phase');
      }
    });
  }

  async startGame() {
    if (!db) { alert('Firebase not configured. Paste your firebaseConfig in script.js.'); return; }
    if (!this.isHost) return;
    // set phase to quiz and initialize status for all players to in-progress
    const playersSnap = await get(ref(db, `rooms/${this.roomCode}/players`));
    const players = playersSnap.exists() ? Object.keys(playersSnap.val()) : [];
    const statusInit = {};
    players.forEach(p => statusInit[p] = 'in-progress');
    await update(ref(db, `rooms/${this.roomCode}`), { phase: 'quiz', status: statusInit, answers: {} });
    // host and all clients listening will detect phase change and show quiz UI
    // for host we will also call showQuestion to load first question if host is playing too
    this.currentQuestion = 0;
    this.answers = {};
    this.showQuestion();
    this.switchPhase('quiz-phase');
  }

  showQuestion() {
    // If no db (not configured) allow local demo flow too
    const card = document.getElementById('quiz-card');
    const qEl = document.getElementById('quiz-question');
    const optsEl = document.getElementById('quiz-options');
    const progEl = document.getElementById('quiz-progress');

    if (this.currentQuestion >= QUESTIONS.length) {
      // finished all questions
      # save answers and mark finished
      update(ref(db, `rooms/${this.roomCode}/answers/${this.playerName}`), this.answers).catch(()=>{});
      update(ref(db, `rooms/${this.roomCode}/status`), { [this.playerName]: 'finished' }).catch(()=>{});
      card.style.display = 'none';
      document.getElementById('quiz-waiting').style.display = 'block';
      return;
    }

    const q = QUESTIONS[this.currentQuestion];
    qEl.textContent = q.text;
    optsEl.innerHTML = '';
    progEl.textContent = `Question ${this.currentQuestion + 1} of ${QUESTIONS.length}`;

    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = opt;
      btn.onclick = () => this.submitAnswer(opt);
      optsEl.appendChild(btn);
    });
  }

  submitAnswer(answer) {
    // record locally, attempt to write to DB
    const qIndex = this.currentQuestion + 1;
    this.answers[qIndex] = answer;
    update(ref(db, `rooms/${this.roomCode}/answers/${this.playerName}`), { [qIndex]: answer }).catch(()=>{});

    # animate slide out then advance
    const card = document.getElementById('quiz-card');
    card.classList.add('slide-out');
    setTimeout(() => {
      card.classList.remove('slide-out');
      this.currentQuestion++;
      this.showQuestion();
    }, 450);
  }
}

const game = new Game();

document.addEventListener('DOMContentLoaded', () => {
  const hostBtn = document.getElementById('create-room');
  const joinBtn = document.getElementById('join-room');
  const startBtn = document.getElementById('start-game');

  hostBtn.addEventListener('click', async () => {
    const name = document.getElementById('host-name').value || 'Host';
    const playerCount = parseInt(document.getElementById('player-count').value, 10) || 4;
    await game.hostGame(name, playerCount);
  });

  joinBtn.addEventListener('click', async () => {
    const code = document.getElementById('join-code').value;
    const name = document.getElementById('join-name').value || 'Player';
    await game.joinRoom(code, name);
  });

  startBtn.addEventListener('click', async () => {
    if (game.isHost) await game.startGame();
  });
});
