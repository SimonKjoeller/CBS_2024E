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
        //const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const decoded = jwt.verify(token, a5f6e8d4b9c8d05f9c36fd457bc1c9ab8f2e1e4f0d02bfb93e7b2b459a6a09b5);
        // Hvis token er validt, gem brugeren i req.user
        req.user = decoded;
        next();  // Fortsæt til den næste middleware/rute
    } catch (error) {
        // Hvis token ikke er gyldigt eller er udløbet
        return res.redirect('/login');  // Redirect til login-siden ved ugyldigt token
    }
};

module.exports = checkAuth;
