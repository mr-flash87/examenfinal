
const formulaire = document.getElementById("form-login");
const message = document.getElementById("message");
const bouton = formulaire.querySelector('button[type="submit"]');

formulaire.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    bouton.disabled = true;
    bouton.textContent = "Connexion en cours...";
    message.textContent = "";

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
            message.textContent = resultat.message || "Identifiants incorrects.";
            bouton.disabled = false;
            bouton.textContent = "Se connecter";
            return;
        }

        window.location.href = "/admin.html";

    } catch (erreur) {
        console.error("Erreur de connexion :", erreur);

        message.textContent = "Erreur de connexion au serveur.";

        bouton.disabled = false;
        bouton.textContent = "Se connecter";
    }
});
