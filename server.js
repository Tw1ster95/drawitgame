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

const server = http.createServer(app);
const io = socketio(server);
const { clearTurns, getTurns, makeTurn } = createBoard();
const { generateWord, getWord, getHiddenWord, checkWin, addPlayer, removePlayer, addScore,
    getPlayers, getDrawer, getNextDrawer } = handleGame();

io.on('connection', (sock) => {
    sock.on('new-player', ({ id, name }) => {
        if(getPlayers().length >= MAX_PLAYERS)
            sock.emit('game-full');
        else {
            addPlayer({ id, name });
            sock.emit('board', getTurns());
            if(!getDrawer()) {
                generateWord();
                io.emit('new-drawer', getNextDrawer());
            }
            sock.emit('players', getPlayers());
            io.emit('message', `${name} joined.`);
            sock.emit('word', getWord(), getHiddenWord());
        }
    });
    sock.on('player-leave', (id) => {
        removePlayer(id);
        io.emit('message', `Player with ID ${id} left.`);
        io.emit('remove-player', id);
    });
    sock.on('message', ({ text, player }) => {
        io.emit('message', `${player.name}: ${text}`);
        if(!player.drawer && checkWin(text)) {
            player.points = addScore(1, player.id);
            io.emit('message', `${player.name} found the word first.`);
            io.emit('update-player', player);

            io.emit('new-drawer', getNextDrawer());
            clearTurns();
            io.emit('reset');
            generateWord();
            io.emit('word', getWord(), getHiddenWord());

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

server.listen(process.env.PORT || 8080, () => {
    console.log('server is ready');
});