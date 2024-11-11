const express = require("express");
const userRoutes = express.Router();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const db = require("../db");

userRoutes.use(express.json());
userRoutes.use(cookieParser());

const secretKey = process.env.JWT_SECRET; // Bruger miljøvariabel til sikkerhed

userRoutes.post("/login", (req, res) => {
    const { email, password } = req.body;
    const query = `SELECT * FROM users WHERE email = ? AND password = ?`;

    db.get(query, [email, password], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user) {
            // Generer JWT token
            const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
            // Sæt token som cookie
            res.cookie("authToken", token, { httpOnly: true, secure: true, sameSite: "None" })
                .status(200)
                .json({ message: "Du er blevet logget ind" });
        } else {
            res.status(401).json({ message: "Forkert brugernavn eller adgangskode" });
        }
    });
});

module.exports = userRoutes;
