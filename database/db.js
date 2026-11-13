
const Database = require("better-sqlite3");
const path = require("path");

// Connexion à la base de données
const db = new Database(
    path.join(__dirname, "portfolio.db")
);

// Création des tables
db.exec(`

    CREATE TABLE IF NOT EXISTS profil (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        titre TEXT NOT NULL,
        description TEXT,
        email TEXT
    );

    CREATE TABLE IF NOT EXISTS projets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        description TEXT NOT NULL,
        technologies TEXT,
        lien TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        email TEXT NOT NULL,
        sujet TEXT,
        message TEXT NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        description TEXT NOT NULL,
        categorie TEXT
    );

`);

console.log("Base de données connectée !");
console.log("Les quatre tables ont été créées ou vérifiées !");

module.exports = db;
