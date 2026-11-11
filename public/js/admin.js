
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




// AFFICHER LES PROJETS AU DÉMARRAGE
chargerProjets();
