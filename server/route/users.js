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
//const secretKey = process.env.JWT_SECRET;
const secretKey = a5f6e8d4b9c8d05f9c36fd457bc1c9ab8f2e1e4f0d02bfb93e7b2b459a6a09b5;

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
