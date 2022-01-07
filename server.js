const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const createBoard = require('./create-board');
const handleGame = require('./handle-game');

const app = express();

app.use(express.static(`${__dirname}/client`));

const MAX_PLAYERS = 8;

const server = http.createServer(app);
const io = socketio(server);
const { clearTurns, getTurns, makeTurn } = createBoard();
const { generateWord, getWord, checkWin, addPlayer, removePlayer, addScore,
    getPlayersCount, getPlayers } = handleGame();

io.on('connection', (sock) => {
    if(getPlayersCount() >= MAX_PLAYERS) {
        sock.emit('game-full');
        return;
    }
    sock.emit('word', getWord());
    sock.emit('board', getTurns());
    sock.emit('players', getPlayers());

    sock.on('new-player', (id) => {
        addPlayer(id);
        io.emit('message', `New player with ID ${id} joined.`);
        io.emit('add-player', { id, points: 0 });
    });
    sock.on('player-leave', (id) => {
        removePlayer(id);
        io.emit('message', `Player with ID ${id} left.`);
        io.emit('remove-player', id);
    });
    sock.on('generate-word', (id) => {
        const word = generateWord();
        io.emit('new-word', word);
        io.emit('message', `Player with ID ${id} generated a new word.`);
    });
    sock.on('message', ({ text, id }) => {
        io.emit('message', `${id}: ${text}`);
        if(checkWin(text)) {
            const new_points = addScore(1, id);
            io.emit('message', `Player with ID ${id} found the word first.`);
            io.emit('update-player', {id, new_points});

            const word = generateWord();
            io.emit('new-word', word);

            io.emit('message', `New game started.`);
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

server.listen(8080, () => {
    console.log('server is ready');
});