const jwt = require('jsonwebtoken');
require('dotenv').config();

const checkAuth = (req, res, next) => {
    const token = req.cookies.authToken; // Cookie skal hedde "authToken"

    if (!token) {
        return res.redirect('/login');  // Redirect til login, hvis token mangler
    }

    try {
        // Verificer token med hemmelig nøgle
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Gem brugerdata
        next(); // Gå videre til næste middleware
    } catch (error) {
        return res.redirect('/login');  // Redirect ved ugyldigt token
    }
};

module.exports = checkAuth;
