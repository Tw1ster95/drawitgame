const handleGame = () => {
    const randomWords = ['food', 'water', 'minecraft', 'sun', 'car', 'laptop'];

    let players = Array();
    let word = '';

    const generateWord = () => {
        word = randomWords[Math.floor(Math.random() * randomWords.length)];
        return word;
    }

    generateWord();

    const getWord = () => word;

    const checkWin = (text) => {
        return text.toLowerCase() == word.toLowerCase() ? true : false;
    }

    const addPlayer = (id) => {
        players.push({ id, points: 0 });
    }

    const removePlayer = (id) => {
        const index = players.findIndex(p => p.id == id);
        if(index > -1)
            players.splice(index, 1);
    }

    const addScore = (pts, id) => {
        const index = players.findIndex(p => p.id == id);
        if(index > -1) {
            players[index].points += pts;
            return players[index].points;
        }
        return 0;
    }

    const getPlayersCount = () => players.length;

    const getPlayers = () => players;

    return {
        generateWord, getWord, checkWin, addPlayer, removePlayer, addScore,
        getPlayersCount, getPlayers
    }
}

module.exports = handleGame;