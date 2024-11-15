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


module.exports = chatRoutes;
