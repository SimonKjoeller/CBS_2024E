// server/middlewares/checkAuth.js

const jwt = require('jsonwebtoken');
require('dotenv').config(); // For at få adgang til dine miljøvariabler (f.eks. secretKey)

const checkAuth = (req, res, next) => {
    const token = req.cookies.token;  // Tokenet er gemt i cookies

    if (!token) {
        return res.redirect('/login');  // Redirect brugeren til login-siden, hvis token ikke findes
    }

    try {
        // Verificer tokenet med din hemmelige nøgle
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Hvis token er validt, gem brugeren i req.user
        req.user = decoded;
        next();  // Fortsæt til den næste middleware/rute
    } catch (error) {
        // Hvis token ikke er gyldigt eller er udløbet
        return res.redirect('/login');  // Redirect til login-siden ved ugyldigt token
    }
};

module.exports = checkAuth;
