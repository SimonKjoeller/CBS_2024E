const express = require("express");
const chatRoutes = express.Router();
const cookieParser = require("cookie-parser");
const db = require("../db");
const path = require("path")

chatRoutes.use(express.json());
chatRoutes.use(cookieParser());


// Main page
chatRoutes.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/pages/chat.html"));
});



chatRoutes.post("/recipient", (req, res) => {
    const { username } = req.body;
    console.log("test")
    const query = `SELECT * FROM users WHERE username = ?`
    console.log(username)
    console.log(query)

    db.get(query, [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user) {
            res
                .cookie("isLoggedIn", "true", { maxAge: 3600000, httpOnly: true })
                .status(200)
                .send({ message: "Du er blevet logget ind" });
        } else {
            res.status(401).send({ message: "Forkert brugernavn eller adgangskode" });
        }
    });
});


module.exports = chatRoutes;