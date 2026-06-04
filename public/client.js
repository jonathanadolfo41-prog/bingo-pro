const socket = io();

let card = null;
let drawnNumbers = [];
let marked = [];
let gameLocked = false;

// 🎫 recibir cartón
socket.on("card", (c) => {
    card = c;
    document.getElementById("cardId").innerText = c.id;

    setTimeout(renderCard, 100);
});

// 🎲 número actual
socket.on("currentNumber", (num) => {
    document.getElementById("current").innerText = num;
    drawnNumbers.push(num);
});

// 👥 jugadores
socket.on("players", (p) => {
    document.getElementById("players").innerText = p;
});

// 🏆 ganador
socket.on("winner", (data) => {
    if (socket.id === data.player) {
        document.getElementById("confetti").style.display = "block";
    }

    alert("🏆 GANADOR: Cartón #" + data.cardId);
});

// 🔄 reset
socket.on("reset", () => {
    drawnNumbers = [];
    marked = [];
    document.getElementById("current").innerText = "";
    document.getElementById("confetti").style.display = "none";
    renderCard();
});

// 🎫 render cartón
function renderCard() {
    if (!card || !card.data) return;

    let html = "<table>";

    for (let r = 0; r < 4; r++) {
        html += "<tr>";

        for (let c = 0; c < 4; c++) {
            let value = card.data[c][r];

            let isMarked = marked.includes(value);

            html += `<td onclick="mark(${value}, this)" class="${isMarked ? 'marked' : ''}">
                        ${value}
                     </td>`;
        }

        html += "</tr>";
    }

    html += "</table>";

    document.getElementById("card").innerHTML = html;
}

// ✔ marcar
function mark(num, el) {
    if (!drawnNumbers.includes(num)) {
        alert("❌ Este número aún no ha salido");
        return;
    }

    if (marked.includes(num)) {
        marked = marked.filter(n => n !== num);
        el.classList.remove("marked");
    } else {
        marked.push(num);
        el.classList.add("marked");
    }
}

// 🏆 bingo
function checkBingo() {
    if (!card) return;
    socket.emit("checkBingo", { card });
}