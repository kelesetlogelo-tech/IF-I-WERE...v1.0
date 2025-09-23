/*
Full guessing-phase implementation using Firebase Realtime Database.
Replace firebaseConfig with your project's config if needed.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// --- Firebase config: replace if necessary ---
const firebaseConfig = {
  apiKey: "AIzaSyA8O6Fh10MNQrdW6cBZnUibVFRB2q5cD1Q",
  authDomain: "if-i-were-c624c.firebaseapp.com",
  databaseURL: "https://if-i-were-c624c-default-rtdb.firebaseio.com",
  projectId: "if-i-were-c624c",
  storageBucket: "if-i-were-c624c.appspot.com",
  messagingSenderId: "21442086633",
  appId: "1:21442086633:web:e49f9933737b3caaeaecd278"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Full question bank (10)
const QUESTIONS = [
  { text: "If I were a sound effect, I'd be ....", options: ["The frantic hoot of a Siyaya (taxi)","Evil laugh!","A mix of Kwaito & Amapiano basslines from a shebeen","Ta-da!","Dramatic gasp","The hiss of a shaken carbonated drink"] },
  { text: "If I were a weather-forecast, I'd be ....", options: ["Partly dramatic with a chance of chaos","Sudden tornado of opinions","100% chill","Heatwave in Limpopo","The calm before the storm: I'm a quiet observer until I have had too much coffee!","Severe weather alert for a sudden unexplainable urge to reorganize my entire livingspace"] },
  { text: "If I were a bedtime excuse, I'd be ....", options: ["I need to find the remote","I need to search for \"Pillow\"","Trying to find my way out of this rabbit hole of YouTube videos","I need water","There's something in my closet","Just one more episode","There's a spider in my room"] },
  { text: "If I were a breakfast cereal, I'd be ....", options: ["Jungle Oats","Weetbix","The weird healthy one that keeps piling up in the pantry","Rice Krispies","Bokomo Cornflakes","MorVite"] },
  { text: "If I were a villain in a movie, I'd be ....", options: ["Thanos","Grinch","Scarlet Overkill","A mosquito in your room at night","Darth Vader","Doctor Doom","Emperor Palpatine"] },
  { text: "If I were a kitchen appliance, I'd be ....", options: ["A blender on high speed with no lid","A toaster that only pops when no one’s looking","A microwave that screams when it’s done","A fridge that judges your snack choices"] },
  { text: "If I were a dance move, I'd be ....", options: ["The sprinkler: I'm a little awkward, a little stiff and probably hitting the person next to me!","The moonwalk: I'm trying to move forward, but somehow end up where I started...","The “I thought no one was watching” move","The knee-pop followed by a regretful sit-down","The Macarena: I know I can do it, but I'm not quite sure why","That "running to the bathroom" shuffle: the desperate high-speed march with clenched-up posture and wild eyes"] },
  { text: "If I were a text message, I'd be ....", options: ["A typo-ridden voice-to-text disaster","A three-hour late \"LOL\"","A group chat gif spammer","A mysterious \"K.\" with no context"] },
  { text: "If I were a warning label, I'd be ....", options: ["Caution: May spontaneously break into song","Warning: Contains high levels of optimism and creative ideas, but only after caffeine","Contents may cause uncontrollable giggles","Warning: Do not operate on an empty stomach","Warning: Will talk your ear off about random facts","May contain traces of impulsive decisions","Caution: Do not interrupt during a new K-Pop music video release","Warning: Do not approach before first cup of coffee"] },
  { text: "If I were a type of chair, I'd be ....", options: ["That sofa at Phala Phala","A creaky antique that screams when you sit","One of those folding chairs that attack your fingers","The overstuffed armchair covered in snack crumbs","The velvet fainting couch - I'm a little dramatic... a lot extra actually!"] }
];

// Utility: shuffle array in place
function shuffleArray(a) {
  for (let i = a.length -1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class Game {
  constructor() {
    this.roomCode = null;
    this.playerName = null;
    this.isHost = false;
    this.currentGuessIndex = 0;
    this.guessQueue = [];
  }

  generateRoomCode() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return Array.from({length:4}, ()=> letters.charAt(Math.floor(Math.random()*letters.length))).join('');
  }

  switchPhase(phaseId) {
    document.querySelectorAll('.game-phase').forEach(s=> s.style.display='none');
    const el = document.getElementById(phaseId);
    if (el) el.style.display = 'block';
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
      phase: 'lobby',
      answers: {},
      status: {}
    });
    this.listenForPlayers();
    this.listenForPhase();
    this.switchPhase('lobby');
    this.renderHostControls();
  }

  async joinRoom(code, playerName) {
    const roomCode = (code||'').toUpperCase();
    if (!roomCode) return alert('Enter a room code');
    const roomSnap = await get(ref(db, `rooms/${roomCode}`));
    if (!roomSnap.exists()) return alert('Room not found!');
    const room = roomSnap.val();
    const players = room.players ? Object.keys(room.players) : [];
    if (players.length >= (room.maxPlayers || 4)) return alert('Room is full!');
    this.roomCode = roomCode;
    this.playerName = playerName || 'Player';
    await update(ref(db, `rooms/${roomCode}/players`), { [this.playerName]: true });
    await update(ref(db, `rooms/${roomCode}/status`), { [this.playerName]: 'in-progress' });
    this.listenForPlayers();
    this.listenForPhase();
    this.switchPhase('lobby');
  }

  renderHostControls() {
    const hostControls = document.getElementById('host-controls');
    hostControls.innerHTML = '';
    const startBtn = document.createElement('button');
    startBtn.id = 'start-game';
    startBtn.textContent = 'Start Game';
    startBtn.onclick = () => this.startGame();
    startBtn.style.display = 'none';
    hostControls.appendChild(startBtn);

    const nextPhaseBtn = document.createElement('button');
    nextPhaseBtn.id = 'next-phase';
    nextPhaseBtn.textContent = 'NEXT PHASE';
    nextPhaseBtn.style.display = 'none';
    nextPhaseBtn.onclick = () => this.prepareGuessQueueAndStart();
    hostControls.appendChild(nextPhaseBtn);
  }

  async listenForPlayers() {
    const playerListEl = document.getElementById('player-list');
    const playersRef = ref(db, `rooms/${this.roomCode}/players`);
    onValue(playersRef, (snap) => {
      const players = snap.val() || {};
      playerListEl.innerHTML = '';
      Object.keys(players).forEach(p => {
        const li = document.createElement('li'); li.textContent = p; playerListEl.appendChild(li);
      });
      const roomCodeEl = document.getElementById('room-code'); if (roomCodeEl) roomCodeEl.textContent = this.roomCode;
      if (this.isHost) {
        get(ref(db, `rooms/${this.roomCode}/maxPlayers`)).then(snap=> {
          const max = snap.exists() ? snap.val() : 4;
          const count = Object.keys(players).length;
          const startBtn = document.getElementById('start-game');
          const nextBtn = document.getElementById('next-phase');
          if (startBtn) startBtn.style.display = (count >= max) ? 'inline-block' : 'none';
          // show next-phase only when everyone finished (status finished)
          get(ref(db, `rooms/${this.roomCode}/status`)).then(snap2=> {
            const status = snap2.exists() ? snap2.val() : {};
            const finishedCount = Object.values(status).filter(s => s === 'finished').length;
            if (nextBtn) nextBtn.style.display = (finishedCount > 0 && finishedCount === count) ? 'inline-block' : 'none';
          });
        });
      }
    });
  }

  listenForPhase() {
    const phaseRef = ref(db, `rooms/${this.roomCode}/phase`);
    onValue(phaseRef, (snap) => {
      const phase = snap.val();
      if (!phase) return;
      if (phase === 'lobby') { this.switchPhase('lobby'); }
      else if (phase === 'quiz') { this.currentQuestion = 0; this.switchPhase('quiz-phase'); }
      else if (phase === 'guessing') { this.switchPhase('guessing-phase'); this.setupGuessListeners(); }
      else if (phase === 'results') { this.switchPhase('results-phase'); this.showScores(); }
    });
  }

  async startGame() {
    if (!this.isHost) return;
    const playersSnap = await get(ref(db, `rooms/${this.roomCode}/players`));
    const players = playersSnap.exists() ? Object.keys(playersSnap.val()) : [];
    if (players.length < 2) return alert('Need at least 2 players.');
    await update(ref(db, `rooms/${this.roomCode}`), { phase: 'quiz', status: {} });
    this.switchPhase('quiz-phase');
  }

  async prepareGuessQueueAndStart() {
    if (!this.isHost) return;
    const roomSnap = await get(ref(db, `rooms/${this.roomCode}`));
    if (!roomSnap.exists()) return;
    const room = roomSnap.val();
    const players = room.players ? Object.keys(room.players) : [];
    const queue = [];
    // collect answers: answers[player][qIndex] expected
    const answersSnap = await get(ref(db, `rooms/${this.roomCode}/answers`));
    const answers = answersSnap.exists() ? answersSnap.val() : {};
    for (let q=0; q<QUESTIONS.length; q++) {
      const qIndex = q+1;
      Object.keys(answers).forEach(player => {
        const playerAnswers = answers[player] || {};
        const ans = playerAnswers[qIndex];
        if (ans !== undefined) queue.push({ qIndex, questionText: QUESTIONS[q].text, answerText: ans, author: player });
      });
    }
    if (queue.length === 0) { alert('No answers found to guess.'); return; }
    shuffleArray(queue);
    const scoresInit = {}; players.forEach(p=> scoresInit[p]=0);
    await update(ref(db, `rooms/${this.roomCode}`), { guessQueue: queue, currentGuess: 0, scores: scoresInit, phase: 'guessing' });
  }

  setupGuessListeners() {
    const queueRef = ref(db, `rooms/${this.roomCode}/guessQueue`);
    onValue(queueRef, (snap) => {
      const q = snap.val() || [];
      this.guessQueue = Array.isArray(q) ? q : Object.values(q);
    });
    onValue(ref(db, `rooms/${this.roomCode}/currentGuess`), (snap) => {
      const idx = snap.exists() ? snap.val() : 0;
      this.currentGuessIndex = idx;
      this.renderCurrentGuess();
    });
    onValue(ref(db, `rooms/${this.roomCode}/scores`), (snap) => { this.showScores(); });
  }

  renderCurrentGuess() {
    const idx = this.currentGuessIndex;
    if (!this.guessQueue || idx >= this.guessQueue.length) {
      if (this.isHost) update(ref(db, `rooms/${this.roomCode}`), { phase: 'results' });
      return;
    }
    const item = this.guessQueue[idx];
    document.getElementById('guess-question-text').textContent = item.questionText;
    document.getElementById('guess-answer').textContent = item.answerText;
    // render player buttons
    get(ref(db, `rooms/${this.roomCode}/players`)).then(snap=>{
      const players = snap.exists() ? Object.keys(snap.val()) : [];
      const container = document.getElementById('guess-buttons');
      container.innerHTML = '';
      players.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'player-pill';
        btn.textContent = p;
        btn.onclick = () => this.submitGuess(p);
        container.appendChild(btn);
      });
    });
    // host control
    const hostControls = document.getElementById('host-guess-controls'); hostControls.innerHTML='';
    if (this.isHost) {
      const nextBtn = document.createElement('button'); nextBtn.textContent = 'Advance Answer (compute scores)';
      nextBtn.onclick = () => this.computeScoresForCurrentAndAdvance();
      hostControls.appendChild(nextBtn);
    }
    // show guess status count
    get(ref(db, `rooms/${this.roomCode}/guesses/${idx}`)).then(snap=>{
      const g = snap.exists()? snap.val() : {};
      document.getElementById('guess-status').textContent = `${Object.keys(g).length || 0} players have guessed`;
    });
  }

  async submitGuess(guessedPlayer) {
    if (!this.playerName) return alert('Set your name before guessing');
    const idx = this.currentGuessIndex;
    await update(ref(db, `rooms/${this.roomCode}/guesses/${idx}`), { [this.playerName]: guessedPlayer });
    document.getElementById('guess-status').textContent = 'You submitted your guess.';
  }

  async computeScoresForCurrentAndAdvance() {
    const idx = this.currentGuessIndex;
    const queueSnap = await get(ref(db, `rooms/${this.roomCode}/guessQueue/${idx}`));
    if (!queueSnap.exists()) return;
    const item = queueSnap.val();
    const author = item.author;
    const guessesSnap = await get(ref(db, `rooms/${this.roomCode}/guesses/${idx}`));
    const guesses = guessesSnap.exists() ? guessesSnap.val() : {};
    const scoresSnap = await get(ref(db, `rooms/${this.roomCode}/scores`));
    const scores = scoresSnap.exists() ? scoresSnap.val() : {};
    Object.entries(guesses).forEach(([guesser, guessedPlayer])=>{
      if (!scores[guesser]) scores[guesser]=0;
      if (guessedPlayer === author) scores[guesser] += 1;
    });
    await update(ref(db, `rooms/${this.roomCode}`), { scores: scores, currentGuess: idx+1 });
  }

  async showScores() {
    const scoresSnap = await get(ref(db, `rooms/${this.roomCode}/scores`));
    const scores = scoresSnap.exists() ? scoresSnap.val() : {};
    const list = document.getElementById('scores-list'); if (!list) return;
    list.innerHTML = '';
    Object.entries(scores).sort((a,b)=> b[1]-a[1]).forEach(([player,score])=>{
      const li = document.createElement('li'); li.textContent = `${player}: ${score} pt${score===1?'':'s'}`; list.appendChild(li);
    });
  }
}

window.game = new Game();

document.getElementById('create-room').onclick = ()=> {
  const name = document.getElementById('player-name').value.trim() || 'Host';
  const count = parseInt(document.getElementById('player-count').value, 10) || 4;
  window.game.hostGame(name, count);
};

document.getElementById('join-room').onclick = ()=> {
  const code = document.getElementById('room-code-input').value.trim();
  const name = document.getElementById('player-name').value.trim() || 'Player';
  window.game.joinRoom(code, name);
};

window.prepareGuessQueueAndStart = () => { window.game.prepareGuessQueueAndStart(); }
