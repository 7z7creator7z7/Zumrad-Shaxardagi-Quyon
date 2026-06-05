const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// ================= GAME STATE =================
let multiplier = 1.00;
let isRunning = false;
let crashPoint = 0;
let interval = null;
let bets = {}; // user bets

// random crash generator
function generateCrash() {
    const r = Math.random();

    if (r < 0.45) return +(1 + Math.random() * 1.5).toFixed(2);
    if (r < 0.80) return +(2 + Math.random() * 3).toFixed(2);
    return +(5 + Math.random() * 20).toFixed(2);
}

// ================= GAME LOOP =================
function startGame() {
    multiplier = 1.00;
    isRunning = true;
    crashPoint = generateCrash();
    bets = {};

    io.emit("game:start");

    interval = setInterval(() => {
        multiplier += 0.01;

        io.emit("multiplier:update", {
            multiplier: multiplier.toFixed(2)
        });

        // crash
        if (multiplier >= crashPoint) {
            clearInterval(interval);
            isRunning = false;

            io.emit("game:crash", {
                crashPoint: crashPoint.toFixed(2)
            });

            setTimeout(startGame, 4000);
        }

    }, 100);
}

// ================= SOCKET =================
io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.emit("game:state", {
        multiplier,
        isRunning
    });

    // BET PLACE
    socket.on("bet:place", (data) => {
        if (isRunning === false) return;

        bets[socket.id] = {
            amount: data.amount,
            cashedOut: false
        };
    });

    // CASHOUT
    socket.on("bet:cashout", () => {
        const bet = bets[socket.id];
        if (!bet || bet.cashedOut) return;

        bet.cashedOut = true;

        const win = bet.amount * multiplier;

        socket.emit("bet:result", {
            win: win.toFixed(2)
        });
    });

    socket.on("disconnect", () => {
        delete bets[socket.id];
    });
});

// ================= START SERVER =================
server.listen(3000, () => {
    console.log("Crash server running on port 3000");
    startGame();
});
