const jwt = require('jsonwebtoken');
require('dotenv').config();

const checkAuth = (req, res, next) => {
    const token = req.cookies.authToken; // Cookie skal hedde "authToken"

    if (!token) {
        console.log("Ingen token fundet i cookies. Redirecter til login.");
        return res.redirect('/login');  // Redirect til login, hvis token mangler
    }

    try {
        // Verificer token med hemmelig nøgle
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token verificeret:", decoded); // Log decoded payload
        req.user = decoded; // Gem brugerdata
        next(); // Gå videre til næste middleware
    } catch (error) {
        console.error("Fejl ved verificering af token:", error.message);
        console.error("Token værdi:", token); // Log token for at se, om det er manipuleret
        return res.redirect('/login');  // Redirect ved ugyldigt token
    }
};

module.exports = checkAuth;
