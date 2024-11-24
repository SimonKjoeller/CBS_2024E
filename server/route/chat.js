const express = require("express");
const chatRoutes = express.Router();
const cookieParser = require("cookie-parser");
const db = require("../db");
const path = require("path");
const checkAuth = require("../checkAuth");

chatRoutes.use(express.json());
chatRoutes.use(cookieParser());

chatRoutes.get("/", checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/pages/chat.html"));
});

chatRoutes.post("/recipient", checkAuth, (req, res) => {
    const { username } = req.body;

    const query = "SELECT user_id, username FROM users WHERE username LIKE ? LIMIT 4";
    db.all(query, [`%${username}%`], (err, users) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(users); // Returnerer både user_id og username
    });
});


chatRoutes.get("/conversation/:recipient", checkAuth, (req, res) => {
    const recipientUsername = req.params.recipient;
    const senderId = req.user.user_id;

    const query = `
      SELECT c.message, c.sent_at, u1.username AS sender, u2.username AS recipient
      FROM chat c
      JOIN users u1 ON c.sender_id = u1.user_id
      JOIN users u2 ON c.recipient_id = u2.user_id
      WHERE 
          (c.sender_id = ? AND u2.username = ?) OR 
          (c.recipient_id = ? AND u1.username = ?)
      ORDER BY c.sent_at ASC`;

    db.all(query, [senderId, recipientUsername, senderId, recipientUsername], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

chatRoutes.post("/send", checkAuth, (req, res) => {
    const { recipientUsername, message } = req.body;
    const senderId = req.user.user_id;

    const query = `
      INSERT INTO chat (sender_id, recipient_id, message, sent_at) 
      VALUES (?, (SELECT user_id FROM users WHERE username = ?), ?, datetime('now'))`;

    db.run(query, [senderId, recipientUsername, message], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ chat_id: this.lastID, message: "Message sent successfully!" });
    });
});

chatRoutes.get("/currentUser", checkAuth, (req, res) => {
    const user_id = req.user.user_id;
    console.log(req.user);

    const query = "SELECT username FROM users WHERE user_id = ? LIMIT 1";
    db.get(query, [user_id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Error fetching username" });
        }
        if (!row) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ username: row.username });
    });
});

module.exports = chatRoutes;
