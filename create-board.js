const createBoard = () => {

    let turns = Array();

    const clearTurns = () => {
        turns = Array();
    }

    const getTurns = () => turns;

    const makeTurn = (x, y, to_x, to_y, color, size) => {
        turns.push({x, y, to_x, to_y, color, size});
    }

    clearTurns();

    return {
        clearTurns, getTurns, makeTurn
    }
}

module.exports = createBoard;