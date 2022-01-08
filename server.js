const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const createBoard = require('./create-board');
const handleGame = require('./handle-game');
const path = require('path');

const app = express();

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/client/index.html'));
});

app.use(express.static(`${__dirname}/client`));

const MAX_PLAYERS = 8;
const LETTER_REVEAL_ON = 35;
const MAX_TURN_TIME = 120;

let revealTimer = LETTER_REVEAL_ON, turnTimer = MAX_TURN_TIME;

const server = http.createServer(app);
const io = socketio(server);
const { clearTurns, getTurns, makeTurn } = createBoard();
const { generateWord, getWord, getHiddenWord, checkWin, addPlayer, removePlayer, addScore,
    getPlayers, getDrawer, getNextDrawer, revealLetter } = handleGame();

setInterval(
    async () => {
        revealTimer--;
        if(revealTimer <= 0) {
            revealLetter();
            io.emit('update-hidden', getHiddenWord());
            revealTimer = LETTER_REVEAL_ON;
        }
        turnTimer--;
        if(turnTimer >= 0)
            io.emit('turn-timer', turnTimer);
        else {
            io.emit('message', `No one found the word. Word was: ${getWord()}`);

            io.emit('new-drawer', getNextDrawer());
            clearTurns();
            io.emit('reset');
            await generateWord();
            io.emit('word', getWord(), getHiddenWord());

            io.emit('message', `New game started.`);
            turnTimer = MAX_TURN_TIME;
            revealTimer = LETTER_REVEAL_ON;
        }
    },
    1000
);

io.on('connection', (sock) => {
    sock.on('new-player', ({ id, name }) => {
        if(getPlayers().length >= MAX_PLAYERS)
            sock.emit('game-full');
        else {
            const new_player = addPlayer({ id, name });
            sock.emit('players', getPlayers());
            sock.emit('board', getTurns());
            if(new_player)
                io.emit('add-player', { id, name, points: 0, drawer: false});
            if(!getDrawer()) {
                io.emit('new-drawer', getNextDrawer());
                turnTimer = MAX_TURN_TIME;
                revealTimer = LETTER_REVEAL_ON;
            }
            sock.emit('word', getWord(), getHiddenWord());
            io.emit('message', `${name} joined.`);
        }
    });
    sock.on('player-leave', (id) => {
        removePlayer(id);
        io.emit('message', `Player with ID ${id} left.`);
        io.emit('remove-player', id);
    });
    sock.on('message', async ({ text, player }) => {
        io.emit('message', `${player.name}: ${text}`);
        if(!player.drawer && checkWin(text)) {
            player.points = addScore(1, player.id);
            io.emit('message', `${player.name} found the word first. Word was: ${getWord()}`);
            io.emit('update-player', player);

            io.emit('new-drawer', getNextDrawer());
            clearTurns();
            io.emit('reset');
            await generateWord();
            io.emit('word', getWord(), getHiddenWord());

            io.emit('message', `New game started.`);
            turnTimer = MAX_TURN_TIME;
            revealTimer = LETTER_REVEAL_ON;
        }
    });
    sock.on('turn', ({ old_x, old_y, x, y, color, size }) => {
        makeTurn(old_x, old_y, x, y, color, size);
        io.emit('turn', { old_x, old_y, x, y, color, size });
    });
    sock.on('reset', () => {
        clearTurns();
        io.emit('reset');
    });

});

server.on('error', (err) => {
    console.error(err);
});

server.listen(process.env.PORT || 8080, () => {
    console.log('server is ready');
});