console.log("app.js chargé !");
async function chargerProfil() {

    try {
        const reponse = await fetch("/api/profil");

        const profil = await reponse.json();

        if (profil) {
            document.getElementById("nom").textContent = profil.nom;
            document.getElementById("titre").textContent = profil.titre;
            document.getElementById("description").textContent = profil.description;
            document.getElementById("email").textContent = profil.email;
        }

    } catch (erreur) {
        console.error("Erreur de chargement :", erreur);
    }

}
async function chargerProjets() {
    try {
        const reponse = await fetch("/api/projets");
        const projets = await reponse.json();


        const liste = document.getElementById("liste-projets");
        liste.innerHTML = "";


        if (projets.length === 0) {
            liste.textContent = "Aucun projet disponible.";
            return;
        }


        projets.forEach(projet => {
            const article = document.createElement("article");


            const titre = document.createElement("h3");
            titre.textContent = projet.titre;


            const description = document.createElement("p");
            description.textContent = projet.description;


            const technologies = document.createElement("p");
            technologies.textContent = projet.technologies || "";


            article.append(titre, description, technologies);
            liste.appendChild(article);
        });


    } catch (erreur) {
        console.error("Erreur de chargement des projets :", erreur);
    }
}


chargerProjets();
chargerProfil();

//Envoyer un message de contact
const formulaireContact = document.getElementById("form-contact");

formulaireContact.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("Envoi du message de contact...");

    const message = {
        nom: document.getElementById("nom-contact").value.trim(),
        email: document.getElementById("email-contact").value.trim(),
        sujet: document.getElementById("sujet-contact").value.trim(),
        message: document.getElementById("message-contact").value.trim()
    };
    try {
        const reponse = await fetch("/api/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(message)
        });

        const resultat = await reponse.json();

        if (reponse.ok) {
            alert(resultat.message);
            formulaireContact.reset();
        } else {
            alert("Erreur lors de l'envoi du message.");
        }
    } catch (erreur) {
        console.error("Erreur lors de l'envoi du message :", erreur);
        alert("Erreur lors de l'envoi du message.");
    }
});