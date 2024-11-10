const express = require("express");
const userRoutes = express.Router();
const cookieParser = require("cookie-parser");
const db = require("../db");
const path = require("path")

userRoutes.use(express.json());


userRoutes.use(cookieParser());

userRoutes.post("/login", (req, res) => {
    const { email, password } = req.body;

    const query = `SELECT * FROM users WHERE email = ? AND password = ?`
    console.log(email, password)

    db.get(query, [email, password], (err, customer) => {
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