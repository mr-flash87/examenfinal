
console.log("admin.js chargé");


const formulaire = document.getElementById("form-projet");
const liste = document.getElementById("liste-projets");


// CHARGER LES PROJETS
async function chargerProjets() {
    
    try {
        const reponse = await fetch("/api/projets");


        if (!reponse.ok) {
            throw new Error("Impossible de charger les projets");
        }


        const projets = await reponse.json();


        liste.innerHTML = "";


        projets.forEach(projet => {
            const article = document.createElement("article");


            const titre = document.createElement("h3");
            titre.textContent = projet.titre;


            const description = document.createElement("p");
            description.textContent = projet.description;


            const technologies = document.createElement("p");
            technologies.textContent = projet.technologies || "";


            const boutonModifier = document.createElement("button");
            boutonModifier.textContent = "Modifier";
            boutonModifier.type = "button";


            boutonModifier.addEventListener("click", () => {
                modifierProjet(projet);
            });


            const boutonSupprimer = document.createElement("button");
            boutonSupprimer.textContent = "Supprimer";
            boutonSupprimer.type = "button";


            boutonSupprimer.addEventListener("click", () => {
                supprimerProjet(projet.id);
            });


            article.append(
                titre,
                description,
                technologies,
                boutonModifier,
                boutonSupprimer
            );


            liste.appendChild(article);
        });


    } catch (erreur) {
        console.error("Erreur :", erreur);
    }
}




// AJOUTER UN PROJET
formulaire.addEventListener("submit", async (event) => {


    event.preventDefault();


    console.log("Formulaire soumis !");


    const projet = {
        titre: document.getElementById("titre").value.trim(),
        description: document.getElementById("description").value.trim(),
        technologies: document.getElementById("technologies").value.trim(),
        lien: document.getElementById("lien").value.trim()
    };


    try {
        const reponse = await fetch("/api/projets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(projet)
        });


        const resultat = await reponse.json();


        alert(resultat.message);


        if (reponse.ok) {
            formulaire.reset();
            chargerProjets();
        }


    } catch (erreur) {
        console.error("Erreur lors de l'ajout :", erreur);
        alert("Impossible de contacter le serveur.");
    }
});




// MODIFIER UN PROJET
async function modifierProjet(projet) {


    const titre = prompt("Nouveau titre :", projet.titre);


    if (titre === null || titre.trim() === "") return;


    const description = prompt("Nouvelle description :", projet.description);


    if (description === null || description.trim() === "") return;


    const technologies = prompt("Technologies :", projet.technologies || "");


    if (technologies === null) return;


    const lien = prompt("Lien :", projet.lien || "");


    if (lien === null) return;


    try {
        const reponse = await fetch(`/api/projets/${projet.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                titre,
                description,
                technologies,
                lien
            })
        });


        const resultat = await reponse.json();
        alert(resultat.message);


        if (reponse.ok) chargerProjets();


    } catch (erreur) {
        console.error(erreur);
    }
}




// SUPPRIMER UN PROJET
async function supprimerProjet(id) {


    if (!confirm("Voulez-vous vraiment supprimer ce projet ?")) {
        return;
    }


    try {
        const reponse = await fetch(`/api/projets/${id}`, {
            method: "DELETE"
        });


        const resultat = await reponse.json();
        alert(resultat.message);


        if (reponse.ok) chargerProjets();


    } catch (erreur) {
        console.error(erreur);
    }
}


// CHARGER LES MESSAGES REÇUS
async function chargerMessages() {
    console.log("Fonction chargerMessages exécutée !");

    const listeMessages = document.getElementById("liste-messages");

    try {
        const reponse = await fetch("/api/messages");

        if (!reponse.ok) {
            throw new Error("Impossible de récupérer les messages");
        }

        const messages = await reponse.json();

        listeMessages.innerHTML = "";

        if (messages.length === 0) {
            listeMessages.textContent = "Aucun message reçu.";
            return;
        }

        messages.forEach(message => {
            const article = document.createElement("article");
            const boutonSupprimer = document.createElement("button");
boutonSupprimer.textContent = "Supprimer";
boutonSupprimer.type = "button";

boutonSupprimer.addEventListener("click", async () => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) {
        return;
    }

    const reponse = await fetch(`/api/messages/${message.id}`, {
        method: "DELETE"
    });

    const resultat = await reponse.json();
    alert(resultat.message);

    if (reponse.ok) {
        chargerMessages();
    }
});
            article.className = "carte-message";

            const nom = document.createElement("h3");
            nom.textContent = message.nom;

            const email = document.createElement("p");
            email.className = "email-message";
            email.textContent = message.email;

            const sujet = document.createElement("p");
            sujet.textContent = message.sujet || "Sans sujet";

            const contenu = document.createElement("p");
            contenu.textContent = message.message;

            const date = document.createElement("small");
            date.textContent = message.date;

            article.append(nom, email, sujet, contenu, date, boutonSupprimer);
            listeMessages.appendChild(article);
        });

    } catch (erreur) {
        console.error("Erreur de chargement des messages :", erreur);
        listeMessages.textContent = "Erreur lors du chargement des messages.";
    }
}

async function chargerStatistiques() {
    try {
        const reponse = await fetch("/api/admin/statistiques");

        if (!reponse.ok) {
            throw new Error("Impossible de charger les statistiques.");
        }

        const statistiques = await reponse.json();

        document.getElementById("total-projets").textContent =
            statistiques.projets;

        document.getElementById("total-messages").textContent =
            statistiques.messages;

        document.getElementById("profil-configure").textContent =
            statistiques.profilConfigure ? "Oui" : "Non";

    } catch (erreur) {
        console.error("Erreur statistiques :", erreur);
    }
}

chargerStatistiques();

async function chargerProfilAdmin() {
    try {
        const reponse = await fetch("/api/profil");

        if (!reponse.ok) {
            throw new Error("Erreur de chargement du profil");
        }

        const profil = await reponse.json();

        if (profil) {
            document.getElementById("nom-profil").value = profil.nom || "";
            document.getElementById("titre-profil").value = profil.titre || "";
            document.getElementById("description-profil").value = profil.description || "";
            document.getElementById("email-profil").value = profil.email || "";
        }

    } catch (erreur) {
        console.error(erreur);
    }
}

document.getElementById("form-profil").addEventListener("submit", async (event) => {
    event.preventDefault();

    const profil = {
        nom: document.getElementById("nom-profil").value,
        titre: document.getElementById("titre-profil").value,
        description: document.getElementById("description-profil").value,
        email: document.getElementById("email-profil").value
    };

    try {
        const reponse = await fetch("/api/profil", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(profil)
        });

        const resultat = await reponse.json();

        document.getElementById("message-profil").textContent =
            resultat.message;

        if (reponse.ok) {
            chargerProfilAdmin();
            chargerStatistiques();
        }

    } catch (erreur) {
        console.error(erreur);
        document.getElementById("message-profil").textContent =
            "Erreur lors de l'enregistrement.";
    }
});

chargerProfilAdmin();


// AFFICHER LES PROJETS AU DÉMARRAGE
chargerProjets();
chargerMessages();

// =====================================
// GESTION DES COMPÉTENCES
// =====================================



// CHARGER ET AFFICHER LES COMPÉTENCES
async function chargerCompetencesAdmin() {
    const liste = document.getElementById("liste-competences-admin");

    try {
        const reponse = await fetch("/api/competences");

        if (!reponse.ok) {
            throw new Error("Impossible de charger les compétences.");
        }

        const competences = await reponse.json();

        liste.innerHTML = "";

        document.getElementById("total-competences").textContent =
            competences.length;

        if (competences.length === 0) {
            liste.textContent = "Aucune compétence enregistrée.";
            return;
        }

        competences.forEach(competence => {
            const article = document.createElement("article");
            article.className = "carte-message";

            const titre = document.createElement("h3");
            titre.textContent = competence.titre;

            const description = document.createElement("p");
            description.textContent = competence.description;

            const categorie = document.createElement("p");
            categorie.textContent =
                "Catégorie : " + (competence.categorie || "Non précisée");

            const boutonModifier = document.createElement("button");
            boutonModifier.textContent = "Modifier";
            boutonModifier.type = "button";

            boutonModifier.addEventListener("click", () => {
                modifierCompetence(competence);
            });

            const boutonSupprimer = document.createElement("button");
            boutonSupprimer.textContent = "Supprimer";
            boutonSupprimer.type = "button";

            boutonSupprimer.addEventListener("click", () => {
                supprimerCompetence(competence.id);
            });

            article.append(
                titre,
                description,
                categorie,
                boutonModifier,
                boutonSupprimer
            );

            liste.appendChild(article);
        });

    } catch (erreur) {
        console.error("Erreur compétences :", erreur);
        liste.textContent = "Erreur lors du chargement des compétences.";
    }
}

// AJOUTER UNE COMPÉTENCE
const formulaireCompetence = document.getElementById("form-competence");

formulaireCompetence.addEventListener("submit", async (event) => {
    event.preventDefault();

    const competence = {
        titre: document.getElementById("titre-competence").value.trim(),
        description: document.getElementById("description-competence").value.trim(),
        categorie: document.getElementById("categorie-competence").value.trim()
    };

    try {
        const reponse = await fetch("/api/competences", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(competence)
        });

        const resultat = await reponse.json();

        alert(resultat.message || "Opération terminée.");

        if (reponse.ok) {
            formulaireCompetence.reset();
            chargerCompetencesAdmin();
        }

    } catch (erreur) {
        console.error("Erreur lors de l'ajout :", erreur);
        alert("Impossible de contacter le serveur.");
    }
});


// CHARGER LES COMPÉTENCES AU DÉMARRAGE
chargerCompetencesAdmin();

// MODIFIER UNE COMPÉTENCE
async function modifierCompetence(competence) {
    const titre = prompt("Nouveau nom :", competence.titre);
    if (titre === null || titre.trim() === "") return;

    const description = prompt("Nouvelle description :", competence.description);
    if (description === null || description.trim() === "") return;

    const categorie = prompt("Nouvelle catégorie :", competence.categorie || "");
    if (categorie === null) return;

    try {
        const reponse = await fetch(`/api/competences/${competence.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                titre: titre.trim(),
                description: description.trim(),
                categorie: categorie.trim()
            })
        });

        const resultat = await reponse.json();
        alert(resultat.message || "Compétence modifiée.");

        if (reponse.ok) {
            chargerCompetencesAdmin();
        }
    } catch (erreur) {
        console.error(erreur);
        alert("Erreur lors de la modification.");
    }
}


// SUPPRIMER UNE COMPÉTENCE
async function supprimerCompetence(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette compétence ?")) {
        return;
    }

    try {
        const reponse = await fetch(`/api/competences/${id}`, {
            method: "DELETE"
        });

        const resultat = await reponse.json();
        alert(resultat.message || "Compétence supprimée.");

        if (reponse.ok) {
            chargerCompetencesAdmin();
        }
    } catch (erreur) {
        console.error(erreur);
        alert("Erreur lors de la suppression.");
    }
}

