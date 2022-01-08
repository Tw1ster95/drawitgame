(() => {
    sessionStorage.removeItem("id");
    const storedName = sessionStorage.getItem("name");
    if(storedName)
        document.querySelector('input[name="username"]').value = storedName;

    document.querySelector('#join-form').addEventListener('submit', (e) => {
        e.preventDefault();

        let name = e.target.querySelector('input[name="username"]').value;
        if(name.length > 1) {
            sessionStorage.setItem("id", Math.floor(Math.random() * 10000));
            sessionStorage.setItem("name", name);
            location.href = location.origin + '/game.html';
        }
    });
})();