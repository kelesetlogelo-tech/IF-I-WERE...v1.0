// --- Multiplayer Quiz Game Base ---
const gameServer = {
    rooms: {}
};

class Game {
    constructor() {
        this.roomCode = null;
        this.playerName = null;
        this.isHost = false;
        this.players = [];
    }

    generateRoomCode() {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let code = "";
        for (let i = 0; i < 4; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return code;
    }

    switchPhase(phaseId) {
        document.querySelectorAll(".game-phase").forEach(p => p.style.display = "none");
        document.getElementById(phaseId).style.display = "block";
    }

    hostGame(playerName, playerCount) {
        this.isHost = true;
        this.playerName = playerName;

        const code = this.generateRoomCode();
        this.roomCode = code;

        gameServer.rooms[code] = {
            host: playerName,
            maxPlayers: playerCount,
            players: [playerName]
        };

        this.players = gameServer.rooms[code].players;
        this.updateLobbyUI();
        this.switchPhase("lobby");
    }

    joinRoom(code, playerName) {
        if (!gameServer.rooms[code]) {
            alert("Room not found!");
            return;
        }

        const room = gameServer.rooms[code];
        if (room.players.length >= room.maxPlayers) {
            alert("Room is full!");
            return;
        }

        this.roomCode = code;
        this.playerName = playerName;
        this.players = room.players;

        room.players.push(playerName);
        this.updateLobbyUI();
        this.switchPhase("lobby");
    }

    updateLobbyUI() {
        const playerList = document.getElementById("player-list");
        const startButton = document.getElementById("start-game");

        playerList.innerHTML = "";

        this.players.forEach(p => {
            const li = document.createElement("li");
            li.textContent = p;
            playerList.appendChild(li);
        });

        document.getElementById("room-code").textContent = this.roomCode;

        if (this.isHost) {
            startButton.style.display = "inline-block";
        } else {
            startButton.style.display = "none";
        }
    }

    startGame() {
        // For now, just show one placeholder question
        document.getElementById("quiz-question").textContent =
            "If you were an animal, which would you be? 🐶🐱🦁";
        this.switchPhase("quiz-phase");
    }
}

const game = new Game();

document.addEventListener("DOMContentLoaded", () => {
    const hostBtn = document.getElementById("create-room");
    const joinBtn = document.getElementById("join-room");
    const startBtn = document.getElementById("start-game");

    hostBtn.addEventListener("click", () => {
        const playerName = document.getElementById("host-name").value || "Host";
        const playerCount = parseInt(document.getElementById("player-count").value, 10);
        game.hostGame(playerName, playerCount);
    });

    joinBtn.addEventListener("click", () => {
        const code = document.getElementById("join-code").value.toUpperCase();
        const playerName = document.getElementById("join-name").value || "Player";
        game.joinRoom(code, playerName);
    });

    startBtn.addEventListener("click", () => {
        if (game.isHost) {
            game.startGame();
        }
    });
});
