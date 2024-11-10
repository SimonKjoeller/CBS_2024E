const express = require("express");
const userRoutes = express.Router();
const cookieParser = require("cookie-parser");
const db = require("../db");

userRoutes.use(express.json());


userRoutes.use(cookieParser());

userRoutes.get("/chat/recipient", (req, res) => {
    const { username } = req.body;
    console.log("test")
    const query = `SELECT * FROM users WHERE username = ?`
    console.log(username)

    db.get(query, [username, email, password], (err, customer) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (customer) {
            res
                .cookie("isLoggedIn", "true", { maxAge: 3600000, httpOnly: true })
                .status(200)
                .send({ message: "Du er blevet logget ind" });
        } else {
            res.status(401).send({ message: "Forkert brugernavn eller adgangskode" });
        }
    });
});


module.exports = userRoutes;