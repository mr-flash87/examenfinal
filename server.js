const express = require("express");
const path = require("path");
const db = require("./database/db");

const app = express();
app.use(express.json());
const PORT = 3000;

// Autoriser la lecture des données JSON
app.use(express.json());

// Afficher les fichiers du dossier public
app.use(express.static(path.join(__dirname, "public")));

// Route de test
app.get("/api/test", (req, res) => {
    res.json({
        message: "Mon serveur fonctionne correctement !"
    });
});

// Récupérer les informations du profil
app.get("/api/profil", (req, res) => {
    const profil = db.prepare(
        "SELECT * FROM profil ORDER BY id DESC LIMIT 1"
    ).get();
    res.json(profil);
});
// Enregistrer les message de contact
app.post("/api/message", (req, res) => {
    const { nom, email, sujet, message } = req.body;
    if (!nom || !email || !sujet || !message) {
        return res.status(400).json({
            message: "Tous les champs sont obligatoires."
        });
    }
    try {
        const resultat = db.prepare(`
            INSERT INTO contact (nom, email, sujet, message)
            VALUES (?, ?, ?, ?)
        `).run(nom, email, sujet, message);
        res.status(201).json({
            message: "Message enregistré avec succès !",
            id: resultat.lastInsertRowid
        });
    } catch (erreur) {
        console.error("Erreur lors de l'enregistrement du message :", erreur);
        res.status(500).json({
            message: "Erreur interne du serveur."
        });
    }
});
//Enregistrer un message de contact
app.post("/api/contact", (req, res) => {
    const { nom, email,sujet, message } = req.body;
    if (!nom || !email || !sujet || !message) {
        return res.status(400).json({
            message: "Tous les champs sont obligatoires."
        });
    }
    const resultat = db.prepare(`
        INSERT INTO contact (nom, email, sujet, message)
        VALUES (?, ?, ?, ?)
    `).run(nom, email, sujet|| "", message);
    res.status(201).json({
        message: "Message enregistré avec succès !",
        id: resultat.lastInsertRowid
    });
});
// Récupérer tous les projets
app.get("/api/projets", (req, res) => {
    const projets = db.prepare(
        "SELECT * FROM projets ORDER BY id DESC"
    ).all();
    res.json(projets);
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

// Ajouter ou modifier les informations du profil
app.post("/api/profil", (req, res) => {

    const { nom, titre, description, email } = req.body;

    const profilExistant = db.prepare(
        "SELECT id FROM profil LIMIT 1"
    ).get();

    if (profilExistant) {

        db.prepare(`
            UPDATE profil
            SET nom = ?, titre = ?, description = ?, email = ?
            WHERE id = ?
        `).run(nom, titre, description, email, profilExistant.id);

        return res.json({
            message: "Profil modifié avec succès !"
        });
    }

    db.prepare(`
        INSERT INTO profil (nom, titre, description, email)
        VALUES (?, ?, ?, ?)
    `).run(nom, titre, description, email);

    res.json({
        message: "Profil enregistré avec succès !"
    });
});

 // AJOUTER UN PROJET
app.post("/api/projets", (req, res) => {
    const { titre, description, technologies, lien } = req.body;

    if (!titre || !description) {
        return res.status(400).json({
            message: "Le titre et la description sont obligatoires."
        });
    }

    const resultat = db.prepare(`
        INSERT INTO projets (titre, description, technologies, lien)
        VALUES (?, ?, ?, ?)
    `).run(titre, description, technologies || "", lien || "");

    res.status(201).json({
        message: "Projet ajouté avec succès !",
        id: resultat.lastInsertRowid
    });
});


// MODIFIER UN PROJET
app.put("/api/projets/:id", (req, res) => {
    const { titre, description, technologies, lien } = req.body;
    const id = Number(req.params.id);

    const resultat = db.prepare(`
        UPDATE projets
        SET titre = ?, description = ?, technologies = ?, lien = ?
        WHERE id = ?
    `).run(titre, description, technologies || "", lien || "", id);

    if (resultat.changes === 0) {
        return res.status(404).json({
            message: "Projet introuvable."
        });
    }

    res.json({ message: "Projet modifié avec succès !" });
});


// SUPPRIMER UN PROJET
app.delete("/api/projets/:id", (req, res) => {
    const id = Number(req.params.id);

    const resultat = db.prepare(
        "DELETE FROM projets WHERE id = ?"
    ).run(id);

    if (resultat.changes === 0) {
        return res.status(404).json({
            message: "Projet introuvable."
        });
    }

    res.json({ message: "Projet supprimé avec succès !" });
});

