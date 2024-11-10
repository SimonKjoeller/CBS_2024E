const express = require("express");
const userRoutes = express.Router();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const db = require("../db");
const path = require("path");
require('dotenv').config();

userRoutes.use(express.json());
userRoutes.use(cookieParser());

// Secret key for signing the JWT
const secretKey = process.env.SECRET_KEY;

userRoutes.post("/login", (req, res) => {
    const { email, password } = req.body;

    const query = `SELECT * FROM users WHERE email = ? AND password = ?`;
    console.log(email, password);

    db.get(query, [email, password], (err, customer) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (customer) {
            // Generate a JWT token
            const token = jwt.sign({ userId: customer.id }, secretKey, { expiresIn: '1h' });

            // Set the JWT token in a cookie
            res.cookie("authToken", token, { httpOnly: true, secure: true, sameSite: "None" })
                .status(200)
                .send({ message: "Du er blevet logget ind" });
        } else {
            res.status(401).send({ message: "Forkert brugernavn eller adgangskode" });
        }
    });
});

module.exports = userRoutes;
