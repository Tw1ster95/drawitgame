const sendText = (text) => {
    const parent = document.querySelector('#chat-log');
    const el = document.createElement('li');
    el.innerHTML = text;

    parent.appendChild(el);
    parent.scrollTop = parent.scrollHeight;
};

const onChatSubmitted = (sock, player) => (e) => {
    e.preventDefault();

    const input = document.querySelector('#message');
    const text = input.value;
    input.value = '';

    let doc = new DOMParser().parseFromString(text, 'text/html');

    sock.emit('message', { text: (doc.body.textContent || ""), player });
};

const getMouseCoordinates = (element, e) => {
    const { top, left, bottom, right } = element.getBoundingClientRect();
    const { clientX, clientY } = e;
    const isOutside = (clientX < left
        || clientY < top
        || clientX > (right - 3)
        || clientY > (bottom - 3));

    return {
        x: clientX - left,
        y: clientY - top,
        isOutside
    }
}

const getBoard = (canvas) => {
    const ctx = canvas.getContext('2d');

    const drawLine = (x, y, to_x, to_y, color, size) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.moveTo(x, y);
        ctx.lineTo(to_x, to_y);
        ctx.stroke();
        ctx.closePath();
    }

    const renderBoard = (turns) => {
        turns.forEach(({x, y, to_x, to_y, color, size}) => {
            drawLine(x, y, to_x, to_y, color, size);
        })
    }

    const clearCanvas = () => {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 800, 600);
    }

    return { drawLine, clearCanvas, renderBoard }
}

(() => {
    let player = {
        id: sessionStorage.getItem("id"),
        name: sessionStorage.getItem("name"),
        drawer: false,
        drawing: false,
        old_x: 0,
        old_y: 0,
        color: 'black',
        size: 5
    }

    if(!player.id || !player.name) {
        location.href = location.origin;
        return;
    }

    const canvas = document.querySelector('canvas');
    const { drawLine, clearCanvas, renderBoard } = getBoard(canvas);
    clearCanvas();
    const sock = io();

    sock.emit('new-player', player);

    const onMouseDown = (e) => {
        if(player.drawer) {
            const { x, y, isOutside } = getMouseCoordinates(canvas, e);
            if(!isOutside) {
                player.old_x = x;
                player.old_y = y;
                player.drawing = true;
            }
        }
    }

    const onMouseUp = (e) => {
        if(player.drawing) {
            player.old_x = 0;
            player.old_y = 0;
            player.drawing = false;
        }
    }

    const Draw = (e) => {
        if(player.drawer && player.drawing) {
            const { x, y, isOutside } = getMouseCoordinates(canvas, e);
            if(!isOutside) {
                sock.emit('turn', { old_x: player.old_x, old_y:player.old_y, x, y, color: player.color, size: player.size });
                player.old_x = x;
                player.old_y = y;
            }
            else {
                player.old_x = 0;
                player.old_y = 0;
                player.drawing = false;
            }
        }
    }

    sock.on('game-full', () => {
        alert('Game Room is full');
        location.href = location.origin;
    });
    sock.on('board', (turns) => {
        clearCanvas();
        renderBoard(turns);
    });
    sock.on('word', (word, hiddenWord) => {
        document.querySelector('#word').innerHTML = (player.drawer ? `Word to draw is ${word}` : hiddenWord);
    });
    sock.on('players', (players) => {
        if(players) {
            const playersWrapper = document.querySelector('#players-wrapper');
            let div;
            players.forEach(p => {
                if(p.id == player.id && p.drawer)
                    player.drawer = true;
                div = document.createElement('div');
                div.classList.add('player-info');
                div.setAttribute('data-id', p.id);
                div.setAttribute('data-drawer', p.drawer ? '1' : '0');
                div.innerHTML = `${p.name}: ${p.points}`;
                playersWrapper.append(div);
            })
        }
    });
    sock.on('add-player', ({id, name, points, drawer}) => {
        const playersWrapper = document.querySelector('#players-wrapper');
        let div = document.createElement('div');
        div.classList.add('player-info');
        div.setAttribute('data-id', id);
        div.setAttribute('data-drawer', drawer ? '1' : '0');
        div.innerHTML = `${name}: ${points}`;
        playersWrapper.append(div);
    });
    sock.on('update-player', ({id, name, points}) => {
        const playerElement = document.querySelector(`[data-id='${id}']`);
        playerElement.innerHTML = `${name}: ${points}`;
    });
    sock.on('remove-player', (id) => {
        const playerElement = document.querySelector(`[data-id='${id}']`);
        playerElement.remove();
    });
    sock.on('message', sendText);
    sock.on('turn', ({ old_x, old_y, x, y, color, size }) => {
        drawLine(old_x, old_y, x, y, color, size);
    });
    sock.on('reset', () => {
        clearCanvas();
    });
    sock.on('new-drawer', (drawer) => {
        if(drawer) {
            player.drawer = (drawer.id == player.id);
            let drawerElement = document.querySelector('.player-info[data-drawer="1"]');
            if(drawerElement)
                drawerElement.setAttribute('data-drawer', '0');
            drawerElement = document.querySelector(`.player-info[data-id="${drawer.id}"]`);
            if(drawerElement)
                drawerElement.setAttribute('data-drawer', '1');
        }
    });

    document.querySelector('#chat-form').addEventListener('submit', onChatSubmitted(sock, player));

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', Draw);
    canvas.addEventListener('mouseup', onMouseUp);

    const colors = ['black','white','red','green','blue','cyan','yellow','brown','orange'];
    const sizes = [3, 5, 10, 15, 20];
    
    const setColor = (e) => {
        player.color = e.target.style.backgroundColor;
    }
    const setSize = (e) => {
        player.size = e.target.getAttribute('data-size');
    }
    const colorSelector = document.querySelector('.color-selector');
    const sizeSelector = document.querySelector('.size-selector');
    let div;
    colors.forEach(c => {
        div = document.createElement('div');
        div.classList.add('color');
        div.style.backgroundColor = c;
        colorSelector.append(div);
        div.addEventListener('click', setColor);
    });
    sizes.forEach(s => {
        div = document.createElement('div');
        div.classList.add('size');
        div.style = '--i:' + s;
        div.setAttribute('data-size', s);
        sizeSelector.append(div);
        div.addEventListener('click', setSize);
    });

    document.querySelector('#clear-canvas').addEventListener('click', (e) => {
        sock.emit('reset');
    });

    // Player Closes window
    window.addEventListener("beforeunload", (e) => {
        sock.emit('player-leave', player.id);
    });
})();