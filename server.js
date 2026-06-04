const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let numbers = Array.from({ length: 75 }, (_, i) => i + 1);
let drawn = [];
let players = {};
let gameLocked = false;

let usedCards = new Set();
let cardCounter = 1;

// 🎫 CARTÓN 4x4 ÚNICO
function generateCard() {
    let card;
    let key;

    do {
        card = [];
        let ranges = [[1,18],[19,36],[37,54],[55,75]];

        for (let i = 0; i < 4; i++) {
            let nums = [];
            for (let n = ranges[i][0]; n <= ranges[i][1]; n++) nums.push(n);

            nums = nums.sort(() => Math.random() - 0.5).slice(0, 4);
            card.push(nums);
        }

        key = JSON.stringify(card);

    } while (usedCards.has(key));

    usedCards.add(key);

    return {
        id: cardCounter++,
        data: card
    };
}

// 🏆 VERIFICAR BINGO
function checkBingo(card, drawn) {
    let flat = card.flat();
    let marked = flat.map(n => drawn.includes(n));

    // filas
    for (let i = 0; i < 4; i++) {
        if (marked.slice(i * 4, i * 4 + 4).every(Boolean)) return true;
    }

    // columnas
    for (let c = 0; c < 4; c++) {
        let col = [];
        for (let r = 0; r < 4; r++) {
            col.push(marked[r * 4 + c]);
        }
        if (col.every(Boolean)) return true;
    }

    return false;
}

io.on("connection", (socket) => {

    players[socket.id] = true;
    io.emit("players", Object.keys(players).length);

    let cardObj = generateCard();

    socket.emit("card", cardObj);
    socket.emit("numbers", drawn);
    socket.emit("gameLocked", gameLocked);

    // 🎲 sacar número
    socket.on("draw", () => {
        if (gameLocked) return;
        if (numbers.length === 0) return;

        let index = Math.floor(Math.random() * numbers.length);
        let num = numbers.splice(index, 1)[0];

        drawn.push(num);

        io.emit("currentNumber", num);
    });

    // 🏆 declarar bingo
    socket.on("checkBingo", (data) => {
        if (gameLocked) return;

        if (checkBingo(data.card.data, drawn)) {

            gameLocked = true;

            io.emit("winner", {
                player: socket.id,
                cardId: data.card.id
            });

            io.emit("gameLocked", true);
        }
    });

    // 🔄 reiniciar juego
    socket.on("reset", () => {
        numbers = Array.from({ length: 75 }, (_, i) => i + 1);
        drawn = [];
        gameLocked = false;
        usedCards.clear();
        cardCounter = 1;

        io.emit("reset");
        io.emit("gameLocked", false);
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("players", Object.keys(players).length);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Servidor listo");
});
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});