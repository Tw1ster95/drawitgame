const handleGame = () => {
    const randomWords = ['food', 'water', 'minecraft', 'sun', 'car', 'laptop'];

    let players = Array();
    let word = '';
    let hiddenWord = '';

    const generateWord = () => {
        word = randomWords[Math.floor(Math.random() * randomWords.length)];
        hiddenWord = word;
        for(var i=0; i < word.length; i++)
            hiddenWord = replaceAt(hiddenWord, i, '_');
    }

    const replaceAt = (text, index, replacement) => {
        return text.substr(0, index) + replacement + text.substr(index + replacement.length);
    }

    generateWord();

    const getWord = () => word;

    const getHiddenWord = () => hiddenWord;

    const checkWin = (text) => {
        return text.toLowerCase() == word.toLowerCase() ? true : false;
    }

    const addPlayer = ({ id, name }) => {
        if(!players.find(p => p.id == id))
            players.push({ id: id, name: name, points: 0, drawer: false });
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

    const getPlayers = () => players;

    const getDrawer = () => {
        if(players.length > 0) {
            const index = players.findIndex(p => p.drawer == true);
            if(index > -1)
                return players[index];
        }
        return null;
    }

    const getNextDrawer = () => {
        if(players.length > 0) {
            let index = players.findIndex(p => p.drawer == true);
            if(index > -1) {
                players[index].drawer = false;
                index++;
                if(index >= players.length)
                    index = 0;
                players[index].drawer = true;
                return players[index];
            }
            else {
                players[0].drawer = true;
                return players[0];
            }
        }
        return null;
    }

    return {
        generateWord, getWord, getHiddenWord, checkWin, addPlayer, removePlayer, addScore,
        getPlayers, getDrawer, getNextDrawer
    }
}

module.exports = handleGame;