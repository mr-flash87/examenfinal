
require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});
console.log("ADMIN_USER chargé :", !!process.env.ADMIN_USER);
console.log("ADMIN_PASSWORD chargé :", !!process.env.ADMIN_PASSWORD);
console.log("SESSION_SECRET chargé :", !!process.env.SESSION_SECRET);
const express = require("express");
const path = require("path");
const session = require("express-session");
const db = require("./database/db");

const app = express();
const PORT = 3000;

// Vérifier si l'administrateur est connecté
function requireAdmin(req, res, next) {
    if (req.session && req.session.admin === true) {
        return next();
    }

    return res.status(401).json({
        message: "Accès refusé. Connectez-vous comme administrateur."
    });
}

// ================================
// CONFIGURATION
// ================================

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 2
    }
}));

// ================================
// PROTECTION ADMINISTRATEUR
// ================================

function verifierAdmin(req, res, next) {
    if (req.session && req.session.admin === true) {
        return next();
    }

    if (req.path.startsWith("/api/")) {
        return res.status(401).json({
            message: "Accès non autorisé. Connectez-vous."
        });
    }

    return res.redirect("/login.html");
}

// ================================
// CONNEXION ADMINISTRATEUR
// ================================

app.post("/api/login", (req, res) => {
    console.log("Demande de connexion reçue !");
    const { username, password } = req.body;
    console.log("Utilisateur reçu :", username);
console.log("Utilisateur configuré :", process.env.ADMIN_USER);

    const utilisateurValide =
        username === process.env.ADMIN_USER;

    const motDePasseValide =
        password === process.env.ADMIN_PASSWORD;

    if (!utilisateurValide || !motDePasseValide) {
        return res.status(401).json({
            message: "Identifiants incorrects."
        });
    }

    req.session.admin = true;

console.log("Connexion administrateur réussie.");
console.log("Session :", req.session);

    req.session.save((erreur) => {
    if (erreur) {
        console.error("Erreur de sauvegarde de session :", erreur);

        return res.status(500).json({
            message: "Impossible de sauvegarder la session."
        });
    }

    res.json({
        message: "Connexion réussie !"
    });
});
});

// ================================
// DÉCONNEXION ADMINISTRATEUR
// ================================

app.post("/api/logout", verifierAdmin, (req, res) => {
    req.session.destroy((erreur) => {
        if (erreur) {
            return res.status(500).json({
                message: "Erreur lors de la déconnexion."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            message: "Déconnexion réussie."
        });
    });
});

// ================================
// PROTECTION DE LA PAGE ADMIN
// ================================

app.get("/admin.html", verifierAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Fichiers publics : CSS, JavaScript, images, etc.
app.use(express.static(path.join(__dirname, "public")));

// ================================
// ROUTE DE TEST
// ================================

app.get("/api/test", (req, res) => {
    res.json({
        message: "Mon serveur fonctionne correctement !"
    });
});

// ================================
// GESTION DU PROFIL
// ================================

// Récupérer le profil (public)
app.get("/api/profil", (req, res) => {
    try {
        const profil = db.prepare(
            "SELECT * FROM profil ORDER BY id DESC LIMIT 1"
        ).get();

        res.json(profil || null);

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Impossible de récupérer le profil."
        });
    }
});

// Ajouter ou modifier le profil (administrateur uniquement)
app.post("/api/profil", verifierAdmin, (req, res) => {
    try {
        const { nom, titre, description, email } = req.body;

        if (!nom || !titre) {
            return res.status(400).json({
                message: "Le nom et le titre sont obligatoires."
            });
        }

        const profilExistant = db.prepare(
            "SELECT id FROM profil LIMIT 1"
        ).get();

        if (profilExistant) {
            db.prepare(`
                UPDATE profil
                SET nom = ?, titre = ?, description = ?, email = ?
                WHERE id = ?
            `).run(
                nom,
                titre,
                description || "",
                email || "",
                profilExistant.id
            );

            return res.json({
                message: "Profil modifié avec succès !"
            });
        }

        db.prepare(`
            INSERT INTO profil (nom, titre, description, email)
            VALUES (?, ?, ?, ?)
        `).run(nom, titre, description || "", email || "");

        res.json({
            message: "Profil enregistré avec succès !"
        });

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur lors de l'enregistrement du profil."
        });
    }
});

// ================================
// GESTION DES PROJETS
// ================================

// Récupérer les projets (public)
app.get("/api/projets", (req, res) => {
    try {
        const projets = db.prepare(
            "SELECT * FROM projets ORDER BY id DESC"
        ).all();

        res.json(projets);

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Impossible de récupérer les projets."
        });
    }
});

// Ajouter un projet (administrateur uniquement)
app.post("/api/projets", verifierAdmin, (req, res) => {
    try {
        const { titre, description, technologies, lien } = req.body;

        if (!titre || !description) {
            return res.status(400).json({
                message: "Le titre et la description sont obligatoires."
            });
        }

        const resultat = db.prepare(`
            INSERT INTO projets (titre, description, technologies, lien)
            VALUES (?, ?, ?, ?)
        `).run(
            titre,
            description,
            technologies || "",
            lien || ""
        );

        res.status(201).json({
            message: "Projet ajouté avec succès !",
            id: resultat.lastInsertRowid
        });

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur lors de l'ajout du projet."
        });
    }
});

// Modifier un projet (administrateur uniquement)
app.put("/api/projets/:id", verifierAdmin, (req, res) => {
    try {
        const { titre, description, technologies, lien } = req.body;
        const id = Number(req.params.id);

        if (!titre || !description || !Number.isInteger(id)) {
            return res.status(400).json({
                message: "Données invalides."
            });
        }

        const resultat = db.prepare(`
            UPDATE projets
            SET titre = ?, description = ?, technologies = ?, lien = ?
            WHERE id = ?
        `).run(
            titre,
            description,
            technologies || "",
            lien || "",
            id
        );

        if (resultat.changes === 0) {
            return res.status(404).json({
                message: "Projet introuvable."
            });
        }

        res.json({
            message: "Projet modifié avec succès !"
        });

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur lors de la modification du projet."
        });
    }
});

// Supprimer un projet (administrateur uniquement)
app.delete("/api/projets/:id", verifierAdmin, (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Identifiant invalide."
            });
        }

        const resultat = db.prepare(
            "DELETE FROM projets WHERE id = ?"
        ).run(id);

        if (resultat.changes === 0) {
            return res.status(404).json({
                message: "Projet introuvable."
            });
        }

        res.json({
            message: "Projet supprimé avec succès !"
        });

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur lors de la suppression du projet."
        });
    }
});

// ================================
// GESTION DES MESSAGES
// ================================

// Enregistrer un message de contact (public)
function enregistrerMessage(req, res) {
    try {
        const { nom, email, sujet, message } = req.body;

        if (!nom || !email || !message) {
            return res.status(400).json({
                message: "Le nom, l'email et le message sont obligatoires."
            });
        }

        const resultat = db.prepare(`
            INSERT INTO messages (nom, email, sujet, message)
            VALUES (?, ?, ?, ?)
        `).run(nom, email, sujet || "", message);

        res.status(201).json({
            message: "Message enregistré avec succès !",
            id: resultat.lastInsertRowid
        });

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur lors de l'enregistrement du message."
        });
    }
}

// Compatibilité avec les deux URL de contact
app.post("/api/contact", enregistrerMessage);
app.post("/api/message", enregistrerMessage);

// Récupérer les messages (administrateur uniquement)
app.get("/api/messages", verifierAdmin, (req, res) => {
    try {
        const messages = db.prepare(
            "SELECT * FROM messages ORDER BY id DESC"
        ).all();

        res.json(messages);

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Impossible de récupérer les messages."
        });
    }
});

// Supprimer un message (administrateur uniquement)
app.delete("/api/messages/:id", verifierAdmin, (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Identifiant invalide."
            });
        }

        const resultat = db.prepare(
            "DELETE FROM messages WHERE id = ?"
        ).run(id);

        if (resultat.changes === 0) {
            return res.status(404).json({
                message: "Message introuvable."
            });
        }

        res.json({
            message: "Message supprimé avec succès !"
        });

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Impossible de supprimer le message."
        });
    }
});

 // STATISTIQUES DU TABLEAU DE BORD
app.get("/api/admin/statistiques", verifierAdmin, (req, res) => {
    try {
        const nombreProjets = db.prepare(
            "SELECT COUNT(*) AS total FROM projets"
        ).get();

        const nombreMessages = db.prepare(
            "SELECT COUNT(*) AS total FROM messages"
        ).get();

        const profil = db.prepare(
            "SELECT COUNT(*) AS total FROM profil"
        ).get();

        res.json({
            projets: nombreProjets.total,
            messages: nombreMessages.total,
            profilConfigure: profil.total > 0
        });

    } catch (erreur) {
        console.error("Erreur statistiques :", erreur);

        res.status(500).json({
            message: "Impossible de charger les statistiques."
        });
    }
});


// ======================================
// GESTION DES COMPETENCES
// ======================================

// Récupérer toutes les compétences
app.get("/api/competences", (req, res) => {
    try {
        const competences = db.prepare(
            "SELECT * FROM competences ORDER BY id ASC"
        ).all();

        res.json(competences);

    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({
            message: "Impossible de récupérer les compétences."
        });
    }
});

// Ajouter une compétence
app.post("/api/competences", requireAdmin, (req, res) => {
    try {
        const { titre, description, categorie } = req.body;

        if (!titre || !description) {
            return res.status(400).json({
                message: "Le titre et la description sont obligatoires."
            });
        }

        const resultat = db.prepare(`
            INSERT INTO competences (titre, description, categorie)
            VALUES (?, ?, ?)
        `).run(titre, description, categorie || "");

        res.status(201).json({
            message: "Compétence ajoutée avec succès !",
            id: resultat.lastInsertRowid
        });

    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({
            message: "Erreur lors de l'ajout."
        });
    }
});

// Modifier une compétence
app.put("/api/competences/:id", requireAdmin, (req, res) => {
    try {
        const { titre, description, categorie } = req.body;
        const id = Number(req.params.id);

        const resultat = db.prepare(`
            UPDATE competences
            SET titre = ?, description = ?, categorie = ?
            WHERE id = ?
        `).run(titre, description, categorie || "", id);

        if (resultat.changes === 0) {
            return res.status(404).json({
                message: "Compétence introuvable."
            });
        }

        res.json({
            message: "Compétence modifiée avec succès !"
        });

    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({
            message: "Erreur lors de la modification."
        });
    }
});

// Supprimer une compétence
app.delete("/api/competences/:id", requireAdmin, (req, res) => {
    try {
        const id = Number(req.params.id);

        const resultat = db.prepare(
            "DELETE FROM competences WHERE id = ?"
        ).run(id);

        if (resultat.changes === 0) {
            return res.status(404).json({
                message: "Compétence introuvable."
            });
        }

        res.json({
            message: "Compétence supprimée avec succès !"
        });

    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({
            message: "Erreur lors de la suppression."
        });
    }
});

// ================================
// DÉMARRAGE DU SERVEUR
// ================================

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
