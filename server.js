
/* =========================================
   1. CONFIGURATION ET IMPORTATIONS
========================================= */

require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const express = require("express");
const path = require("path");
const session = require("express-session");
const db = require("./database/db");

const app = express();
const PORT = process.env.PORT || 3000;

// Vérification des variables d'environnement
if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET manquant dans le fichier .env");
}

if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
    throw new Error("Identifiants administrateur manquants dans le fichier .env");
}

// Configuration HTTPS en production
const production = process.env.NODE_ENV === "production";

if (production) {
    app.set("trust proxy", 1);
}


/* =========================================
   2. MIDDLEWARES
========================================= */

app.use(express.json({ limit: "100kb" }));

app.use(session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: production,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 2
    }
}));


// Vérifier si l'administrateur est connecté
function requireAdmin(req, res, next) {
    if (req.session && req.session.admin === true) {
        return next();
    }

    return res.status(401).json({
        message: "Accès refusé. Connectez-vous comme administrateur."
    });
}


// Protection des pages et API administrateur
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


/* =========================================
   3. CONNEXION ADMINISTRATEUR
========================================= */

app.post("/api/login", (req, res) => {
    const { username, password } = req.body || {};

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        !username.trim() ||
        !password
    ) {
        return res.status(400).json({
            message: "Veuillez remplir tous les champs."
        });
    }

    const utilisateurValide =
        username.trim() === process.env.ADMIN_USER;

    const motDePasseValide =
        password === process.env.ADMIN_PASSWORD;

    if (!utilisateurValide || !motDePasseValide) {
        return res.status(401).json({
            message: "Identifiants incorrects."
        });
    }

    // Renouveler la session après connexion
    req.session.regenerate((erreur) => {
        if (erreur) {
            console.error("Erreur de création de session :", erreur);

            return res.status(500).json({
                message: "Impossible de créer la session."
            });
        }

        req.session.admin = true;

        req.session.save((erreurSauvegarde) => {
            if (erreurSauvegarde) {
                console.error("Erreur de sauvegarde de session :", erreurSauvegarde);

                return res.status(500).json({
                    message: "Impossible de sauvegarder la session."
                });
            }

            console.log("Connexion administrateur réussie.");

            res.json({
                message: "Connexion réussie !"
            });
        });
    });
});


/* =========================================
   4. DÉCONNEXION ADMINISTRATEUR
========================================= */

app.post("/api/logout", verifierAdmin, (req, res) => {
    req.session.destroy((erreur) => {
        if (erreur) {
            return res.status(500).json({
                message: "Erreur lors de la déconnexion."
            });
        }

        res.clearCookie("connect.sid", {
            path: "/",
            httpOnly: true,
            secure: production,
            sameSite: "lax"
        });

        res.json({
            message: "Déconnexion réussie."
        });
    });
});


/* =========================================
   5. PROTECTION DE LA PAGE ADMIN
========================================= */

app.get("/admin.html", verifierAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});


/* =========================================
   6. FICHIERS PUBLICS
========================================= */

app.use(express.static(path.join(__dirname, "public")));


/* =========================================
   7. ROUTE DE TEST
========================================= */

app.get("/api/test", (req, res) => {
    res.json({
        message: "Mon serveur fonctionne correctement !"
    });
});


/* =========================================
   8. GESTION DU PROFIL
========================================= */

// Récupérer le profil
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


// Ajouter ou modifier le profil
app.post("/api/profil", verifierAdmin, (req, res) => {
    try {
        const { nom, titre, description, email } = req.body || {};

        if (
            typeof nom !== "string" ||
            typeof titre !== "string" ||
            !nom.trim() ||
            !titre.trim()
        ) {
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
                nom.trim(),
                titre.trim(),
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
        `).run(
            nom.trim(),
            titre.trim(),
            description || "",
            email || ""
        );

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


/* =========================================
   9. GESTION DES PROJETS
========================================= */

// Récupérer les projets
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


// Ajouter un projet
app.post("/api/projets", verifierAdmin, (req, res) => {
    try {
        const { titre, description, technologies, lien } = req.body || {};

        if (
            typeof titre !== "string" ||
            typeof description !== "string" ||
            !titre.trim() ||
            !description.trim()
        ) {
            return res.status(400).json({
                message: "Le titre et la description sont obligatoires."
            });
        }

        const resultat = db.prepare(`
            INSERT INTO projets (titre, description, technologies, lien)
            VALUES (?, ?, ?, ?)
        `).run(
            titre.trim(),
            description.trim(),
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


// Modifier un projet
app.put("/api/projets/:id", verifierAdmin, (req, res) => {
    try {
        const { titre, description, technologies, lien } = req.body || {};
        const id = Number(req.params.id);

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
            typeof titre !== "string" ||
            typeof description !== "string" ||
            !titre.trim() ||
            !description.trim()
        ) {
            return res.status(400).json({
                message: "Données invalides."
            });
        }

        const resultat = db.prepare(`
            UPDATE projets
            SET titre = ?, description = ?, technologies = ?, lien = ?
            WHERE id = ?
        `).run(
            titre.trim(),
            description.trim(),
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


// Supprimer un projet
app.delete("/api/projets/:id", verifierAdmin, (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
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


/* =========================================
   10. GESTION DES MESSAGES
========================================= */

// Enregistrer un message de contact
function enregistrerMessage(req, res) {
    try {
        const { nom, email, sujet, message } = req.body || {};

        if (
            typeof nom !== "string" ||
            typeof email !== "string" ||
            typeof message !== "string" ||
            !nom.trim() ||
            !email.trim() ||
            !message.trim()
        ) {
            return res.status(400).json({
                message: "Le nom, l'email et le message sont obligatoires."
            });
        }

        const resultat = db.prepare(`
            INSERT INTO messages (nom, email, sujet, message)
            VALUES (?, ?, ?, ?)
        `).run(
            nom.trim(),
            email.trim(),
            sujet || "",
            message.trim()
        );

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


// Récupérer les messages
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


// Supprimer un message
app.delete("/api/messages/:id", verifierAdmin, (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
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


/* =========================================
   11. STATISTIQUES DU TABLEAU DE BORD
========================================= */

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


/* =========================================
   12. GESTION DES COMPÉTENCES
========================================= */

// Récupérer les compétences
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
        const { titre, description, categorie } = req.body || {};

        if (
            typeof titre !== "string" ||
            typeof description !== "string" ||
            !titre.trim() ||
            !description.trim()
        ) {
            return res.status(400).json({
                message: "Le titre et la description sont obligatoires."
            });
        }

        const resultat = db.prepare(`
            INSERT INTO competences (titre, description, categorie)
            VALUES (?, ?, ?)
        `).run(
            titre.trim(),
            description.trim(),
            categorie || ""
        );

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
        const { titre, description, categorie } = req.body || {};
        const id = Number(req.params.id);

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
            typeof titre !== "string" ||
            typeof description !== "string" ||
            !titre.trim() ||
            !description.trim()
        ) {
            return res.status(400).json({
                message: "Données invalides."
            });
        }

        const resultat = db.prepare(`
            UPDATE competences
            SET titre = ?, description = ?, categorie = ?
            WHERE id = ?
        `).run(
            titre.trim(),
            description.trim(),
            categorie || "",
            id
        );

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

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide."
            });
        }

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


/* =========================================
   13. DÉMARRAGE DU SERVEUR
========================================= */

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
