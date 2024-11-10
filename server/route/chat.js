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

// Endpoint to find recipient
chatRoutes.post("/recipient", checkAuth, (req, res) => {
    const { username } = req.body;
    console.log("Looking for recipient:", username);

    const query = `SELECT * FROM users WHERE username = ?`;

    db.get(query, [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user) {
            res.status(200).send({ message: "Recipient found", user: user });
        } else {
            res.status(404).send({ message: "Recipient not found" });
        }
    });
});

module.exports = chatRoutes;
