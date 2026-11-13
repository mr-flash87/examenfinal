
console.log("app.js chargé !");

// CHARGER LE PROFIL
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
        console.error("Erreur de chargement du profil :", erreur);
    }
}

// CHARGER LES PROJETS
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

// CHARGER LES COMPETENCES DEPUIS SQLITE
async function chargerCompetences() {
    try {
        const reponse = await fetch("/api/competences");

        if (!reponse.ok) {
            throw new Error("Erreur de récupération des compétences.");
        }

        const competences = await reponse.json();
        const liste = document.getElementById("liste-competences");

        if (!liste) {
            console.error("Conteneur des compétences introuvable.");
            return;
        }

        liste.innerHTML = "";

        if (competences.length === 0) {
            liste.textContent = "Aucune compétence disponible pour le moment.";
            return;
        }

        competences.forEach((competence, index) => {
            const carte = document.createElement("article");
            carte.className = "skill-card";

            const numero = document.createElement("div");
            numero.className = "skill-icon";
            numero.textContent = String(index + 1).padStart(2, "0");

            const titre = document.createElement("h3");
            titre.textContent = competence.titre;

            const description = document.createElement("p");
            description.textContent = competence.description;

            const categorie = document.createElement("span");
            categorie.className = "skill-tag";
            categorie.textContent = competence.categorie || "Compétence";

            carte.append(numero, titre, description, categorie);
            liste.appendChild(carte);
        });

    } catch (erreur) {
        console.error("Erreur de chargement des compétences :", erreur);
    }
}

// ENVOYER UN MESSAGE DE CONTACT
const formulaireContact = document.getElementById("form-contact");

if (formulaireContact) {
    formulaireContact.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = {
            nom: document.getElementById("nom-contact").value.trim(),
            email: document.getElementById("email-contact").value.trim(),
            sujet: document.getElementById("sujet-contact").value.trim(),
            message: document.getElementById("message-contact").value.trim()
        };

        try {
            const reponse = await fetch("/api/message", {
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
                alert(resultat.message || "Erreur lors de l'envoi.");
            }

        } catch (erreur) {
            console.error("Erreur lors de l'envoi du message :", erreur);
            alert("Erreur lors de l'envoi du message.");
        }
    });
}

// LANCER LES FONCTIONS
chargerProfil();
chargerProjets();
chargerCompetences();
