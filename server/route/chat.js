const express = require("express");
const chatRoutes = express.Router();
const cookieParser = require("cookie-parser");
const db = require("../db");
const path = require("path");
const checkAuth = require("../checkAuth");
require('dotenv').config();

chatRoutes.use(express.json());
chatRoutes.use(cookieParser());

// Main page
chatRoutes.get("/", checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/pages/chat.html"));
});

chatRoutes.post("/recipient", checkAuth, (req, res) => {
    const { username } = req.body;
    const query = `SELECT username FROM users WHERE username LIKE ? LIMIT 4`;

    db.all(query, [`%${username}%`], (err, users) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(users);
    });
});

// Henter samtalens tidligere beskeder
chatRoutes.get("/conversation/:recipient", checkAuth, (req, res) => {
    const recipientUsername = req.params.recipient; // Brugernavn på modtager
    const senderId = req.user.userId; // Bruger-ID fra token (autentificeret bruger)

    const query = `
        SELECT c.message, c.sent_at, u1.username AS sender, u2.username AS recipient
        FROM chat c
        JOIN users u1 ON c.sender_id = u1.id
        JOIN users u2 ON c.recipient_id = u2.id
        WHERE 
            (c.sender_id = ? AND u2.username = ?) OR 
            (c.recipient_id = ? AND u1.username = ?)
        ORDER BY c.sent_at ASC
    `;

    db.all(query, [senderId, recipientUsername, senderId, recipientUsername], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows); // Returner samtalen som JSON
    });
});

// Sender ny besked
chatRoutes.post("/send", checkAuth, (req, res) => {
    const { recipientUsername, message } = req.body;
    const senderId = req.user.userId;

    const query = `
      INSERT INTO chat (sender_id, recipient_id, message, sent_at) 
      VALUES (
        ?, 
        (SELECT id FROM users WHERE username = ?), 
        ?, datetime('now')
      )`;

    db.run(query, [senderId, recipientUsername, message], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ chat_id: this.lastID, message: "Message sent successfully!" });
    });
});

chatRoutes.get("/currentUser", checkAuth, (req, res) => {
    const userId = req.user.userId;

    const query = `SELECT username FROM users WHERE user_id = ? LIMIT 1`;

    db.get(query, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Kunne ikke hente brugernavn" });
        }

        if (!row) {
            return res.status(404).json({ error: "Bruger ikke fundet" });
        }

        res.status(200).json({ username: row.username });
    });
});

module.exports = chatRoutes;