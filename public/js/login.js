
const formulaire = document.getElementById("form-login");
const message = document.getElementById("message");

formulaire.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const reponse = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const resultat = await reponse.json();

        if (!reponse.ok) {
            message.textContent = resultat.message;
            return;
        }

        window.location.href = "/admin.html";

    } catch (erreur) {
        console.error(erreur);
        message.textContent = "Erreur de connexion au serveur.";
    }
});
