const sendText = (text) => {
    const parent = document.querySelector('#chat-log');
    const el = document.createElement('li');
    el.innerHTML = text;

    parent.appendChild(el);
    parent.scrollTop = parent.scrollHeight;
};

const onChatSubmitted = (sock, id) => (e) => {
    e.preventDefault();

    const input = document.querySelector('#message');
    const text = input.value;
    input.value = '';

    let doc = new DOMParser().parseFromString(text, 'text/html');

    sock.emit('message', { text: (doc.body.textContent || ""), id });
};

const getMouseCoordinates = (element, e) => {
    const { top, left } = element.getBoundingClientRect();
    const { clientX, clientY } = e;

    return {
        x: clientX - left,
        y: clientY - top
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
    const canvas = document.querySelector('canvas');
    const { drawLine, clearCanvas, renderBoard } = getBoard(canvas);
    clearCanvas();
    const sock = io();

    sock.on('game-full', () => {
        alert('Game Room is full')
    });

    let playerID = Math.floor(Math.random() * 10000);
    sock.emit('new-player', playerID);

    let isDrawing = false;
    let old_x = 0, old_y = 0;
    let color = 'black';
    let size = 5;

    const onMouseDown = (e) => {
        const { x, y } = getMouseCoordinates(canvas, e);
        old_x = x;
        old_y = y;
        isDrawing = true;
    }

    const onMouseUp = (e) => {
        if(isDrawing) {
            old_x = 0;
            old_y = 0;
            isDrawing = false;
        }
    }

    const onLeave = () => {
        sock.emit('player-leave', playerID);
    }

    const Draw = (e) => {
        if(isDrawing) {
            const { x, y } = getMouseCoordinates(canvas, e);
            sock.emit('turn', { old_x, old_y, x, y, color, size });
            old_x = x;
            old_y = y;
        }
    }

    const setColor = (e) => {
        color = e.target.style.backgroundColor;
    }
    const setSize = (e) => {
        size = e.target.getAttribute('data-size');
        console.log(size);
    }

    const resetBoard = (e) => {
        sock.emit('reset');
    }

    sock.on('board', (turns) => {
        clearCanvas();
        renderBoard(turns);
    });
    sock.on('word', (word) => {
        document.querySelector('#word').innerHTML = word;
    });
    sock.on('players', (players) => {
        if(players) {
            const playersWrapper = document.querySelector('#players-wrapper');
            let div;
            players.forEach(p => {
                div = document.createElement('div');
                div.classList.add('player-info');
                div.setAttribute('data-id', p.id);
                div.innerHTML = `${p.id}: ${p.points}`;
                playersWrapper.append(div);
            })
        }
    });
    sock.on('add-player', ({id, points}) => {
        const playersWrapper = document.querySelector('#players-wrapper');
        let div = document.createElement('div');
        div.classList.add('player-info');
        div.setAttribute('data-id', id);
        div.innerHTML = `${id}: ${points}`;
        playersWrapper.append(div);
    });
    sock.on('update-player', ({id, new_points}) => {
        const playerElement = document.querySelector(`[data-id='${id}']`);
        playerElement.innerHTML = `${id}: ${new_points}`;
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
    })
    sock.on('new-word', (word) => {
        document.querySelector('#word').innerHTML = word;
        sock.emit('reset');
    })

    document.querySelector('#chat-form').addEventListener('submit', onChatSubmitted(sock, playerID));

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', Draw);
    canvas.addEventListener('mouseup', onMouseUp);

    const colors = ['black','white','red','green','blue','cyan','yellow','brown','orange'];
    const sizes = [3, 5, 10, 15, 20];
    
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

    document.querySelector('#clear-canvas').addEventListener('click', resetBoard);

    document.querySelector('#generate-word').addEventListener('click', () => {
        sock.emit('generate-word', playerID);
    });

    // Player Closes window
    window.addEventListener("beforeunload", onLeave);
})();