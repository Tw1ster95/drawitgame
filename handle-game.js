const axios = require("axios").default;

const handleGame = () => {
    let players = Array();
    let word = '';
    let hiddenWord = '';

    const generateWord = async () => {
        await axios.request({
            method: 'GET',
            url: 'https://words-generator.p.rapidapi.com/',
            params: {table: 'pictionary', lang: 'en', limit: '1', random: ''},
            headers: {
                'x-rapidapi-host': 'words-generator.p.rapidapi.com',
                'x-rapidapi-key': '4582ef51eamshe76c9a077ecd001p1a4788jsnf00a902bfe2d'
            }
        })
        .then(function (response) {
            if(response.data.status == 'ok') {
                word = response.data.data[0];
                hiddenWord = word;
                for(var i=0; i < word.length; i++)
                    if(hiddenWord[i] !== ' ')
                        hiddenWord = replaceAt(hiddenWord, i, '_');
            }
            else if (response.data.status == 'fail'){
                console.error(response.data.message);
            }
        })
        .catch(function (error) {
            console.error(error);
        });
    }

    const replaceAt = (text, index, replacement) => {
        return text.substr(0, index) + replacement + text.substr(index + replacement.length);
    }

    const revealLetter = () => {
        if(hiddenWord.includes('_')) {
            let letter = 0;
            do {
                letter = Math.floor(Math.random() * word.length);
            }
            while(hiddenWord[letter] !== '_');

            hiddenWord = replaceAt(hiddenWord, letter, word[letter]);
        }
    }

    generateWord();

    const getWord = () => word;

    const getHiddenWord = () => hiddenWord;

    const checkWin = (text) => {
        return text.toLowerCase() == word.toLowerCase() ? true : false;
    }

    const addPlayer = ({ id, name, sockid }) => {
        if(!players.find(p => p.id == id)) {
            players.push({ id: id, name: name, sockid, points: 0, drawer: false });
            return true;
        }
        return false;
    }
    
    const getPlayerFromSock = (sockid) => {
        const index = players.findIndex(p => p.sockid == sockid);
        return (index > -1) ? players[index] : null;
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
        getPlayers, getDrawer, getNextDrawer, revealLetter, getPlayerFromSock
    }
}

module.exports = handleGame;