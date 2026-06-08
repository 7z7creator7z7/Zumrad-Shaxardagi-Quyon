const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

let gameState = 'waiting'; 
let history = []; 

function generateCrashPoint() {
    const rand = Math.random() * 100;
    if (rand < 10) return 1.00; 
    if (rand < 65) return parseFloat((Math.random() * 0.7 + 1.01).toFixed(2)); 
    if (rand < 90) return parseFloat((Math.random() * 0.73 + 1.72).toFixed(2)); 
    if (rand < 94) return parseFloat((Math.random() * 2.54 + 2.46).toFixed(2)); 
    if (rand < 97) return parseFloat((Math.random() * 2.99 + 5.01).toFixed(2)); 
    if (rand < 99) return parseFloat((Math.random() * 6.99 + 8.01).toFixed(2)); 
    if (rand < 99.9) return parseFloat((Math.random() * 85 + 15).toFixed(2)); 
    return parseFloat((Math.random() * 3099.99 + 100.01).toFixed(2)); 
}

// O'yin sikli
setInterval(() => {
    if (gameState === 'waiting') {
        gameState = 'running';
        let target = generateCrashPoint();
        let multiplier = 1.00;

        let interval = setInterval(() => {
            multiplier += 0.05; // O'sish tezligi
            io.emit('multiplier', multiplier.toFixed(2));

            if (multiplier >= target) {
                clearInterval(interval);
                gameState = 'waiting';
                io.emit('crash', target.toFixed(2));
                
                // Historyga qo'shish
                history.unshift(target.toFixed(2));
                if(history.length > 5) history.pop();
                io.emit('history', history);
                
                // 15 soniya kutiladi
                setTimeout(() => { gameState = 'waiting'; }, 15000);
            }
        }, 200); 
    }
}, 16000);

const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Server is running!"));
http.listen(PORT, () => console.log(`Server ${PORT}-portda ishlamoqda`));
