const express = require("express");
const userRoutes = express.Router();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const bcrypt = require("bcrypt");
const db = require("../db");
const nodemailer = require("nodemailer");
require('dotenv').config();

userRoutes.use(express.json());
userRoutes.use(cookieParser());

const secretKey = process.env.JWT_SECRET; // Bruger miljøvariabel til sikkerhed


userRoutes.post("/login", (req, res) => {
    const { email, password } = req.body;

    const query = `
        SELECT * FROM users WHERE email = ? AND verified = 1
    `;

    db.get(query, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                // Generer JWT token
                const token = jwt.sign({ user_id: user.user_id, username: user.username }, secretKey, { expiresIn: '1h' });
                res.cookie("authToken", token, { httpOnly: true, secure: true, sameSite: "None" })
                    .status(200)
                    .json({ message: "Du er logget ind!" });
            } else {
                res.status(401).json({ message: "Forkert adgangskode." });
            }
        } else {
            res.status(401).json({ message: "Bruger ikke fundet eller ikke verificeret." });
        }
    });
});


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Singup delen herunder

// Hashing konfiguration
const SALT_ROUNDS = 10;


userRoutes.post('/signup', (req, res) => {
    const { email, username, password, phone, newsletter } = req.body;

    console.log(email, username, password, phone, newsletter);

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Generer engangskode
    const otp = Math.floor(1000 + Math.random() * 9000); // Firecifret kode
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutters udløbstid

    // Gem i databasen
    const query = `
        INSERT INTO users (email, username, password, phone, otp, otp_expiration, verified, subscribed_newsletter)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `;

    db.run(query, [email, username, hashedPassword, phone, otp, otpExpiry, newsletter], (err) => {
        if (err) {
            console.error('Fejl ved oprettelse af bruger:', err);
            return res.status(500).json({ error: 'Kunne ikke oprette bruger.' });
        }

        // Send engangskode med Twilio
        client.messages
            .create({
                from: process.env.TWILIO_PHONE_NUMBER,
                to: `+${phone}`, // Hele telefonnummeret med landekode
                body: `Din engangskode er ${otp}. Den udløber om 5 minutter.`,
            })
            .then(() => {
                console.log('OTP sendt!');
                res.status(200).json({ message: 'Signup lykkedes. Verificer dit telefonnummer.' });
            })
            .catch((error) => {
                console.error('Fejl ved sending af OTP:', error);
                res.status(500).json({ error: 'Kunne ikke sende OTP.' });
            });
    });
});


// Nyhedsbrev (SMTP) og twilio verificering
// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "cbsjoec@gmail.com",
        pass: "ozyurwjboabzrqek",
    },
});



userRoutes.post('/verify', (req, res) => {
    const { email, otp } = req.body;

    console.log(email, otp);
    console.log(req.body);
    if (!email || !otp) {
        return res.status(400).json({ message: 'Email og OTP er påkrævet.' });
    }

    const query = `
        SELECT * FROM users WHERE email = ? AND otp = ? AND otp_expiration >= ?
    `;
    db.get(query, [email, otp, Date.now()], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ message: 'Ugyldig eller udløbet OTP.' });
        }

        // Marker brugeren som verificeret
        const updateQuery = `
            UPDATE users SET verified = 1, otp = NULL, otp_expiration = NULL WHERE email = ?
        `;
        db.run(updateQuery, [email], async (updateErr) => {
            if (updateErr) {
                return res.status(500).json({ error: updateErr.message });
            }

            // Tjek om brugeren har valgt at tilmelde sig nyhedsbrevet
            if (user.subscribed_newsletter === 1) {
                try {
                    // Send nyhedsbrev
                    const info = await transporter.sendMail({
                        from: "CBSJOE <cbsjoec@gmail.com>",
                        to: email,
                        subject: 'Velkommen til Joe & The Juice!',
                        html: `<div style="font-family: Arial, sans-serif; color: #333;">
                            <h1>Velkommen til Joe & The Juice</h1>
                            <p>Tak for at verificere din konto. Du er nu tilmeldt vores nyhedsbrev!</p>
                            <img src="/images/joeLogo.png" alt="Joe & The Juice logo" style="width: 150px; height: auto; margin-bottom: 20px;">
                            <footer style="font-size: 12px; color: #888;">
                                <p>Joe & The Juice</p>
                                <p>Adresse: Se web</p>
                            </footer>
                        </div>`,
                    });
                    console.log(`Nyhedsbrev sendt til ${email}:`, info.messageId);
                } catch (error) {
                    console.error(`Fejl ved afsendelse af nyhedsbrev til ${email}:`, error);
                }
            }

            // Send succes-respons
            res.status(200).json({ message: 'Bruger verificeret succesfuldt.' });
        });
    });
});

module.exports = userRoutes;