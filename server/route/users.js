const express = require("express");
const userRoutes = express.Router();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const bcrypt = require("bcrypt");
const db = require("../db");
const nodemailer = require("nodemailer");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fsPromises = require("fs").promises;
const crypto = require('crypto');
const cors = require("cors");
require('dotenv').config();
const checkAuth = require("../checkAuth");

userRoutes.use(express.json());
userRoutes.use(cookieParser());
userRoutes.use(cors({
    origin: "https://cbsjoe.live",
    credentials: true,
}));


// Symmetrisk kryptering
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const iv = crypto.randomBytes(16); // Initialiseringsvektor

const secretKey = process.env.JWT_SECRET; // Bruger miljøvariabel til sikkerhed

// Funktion til at kryptere data
function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encryptedData: encrypted, iv: iv.toString('hex') };
}

// Funktion til at dekryptere data
function decrypt(encryptedData, iv) {
    if (!iv || typeof iv !== 'string' || iv.length !== 32) {
        throw new Error('Ugyldig IV: Skal være en 32-tegn lang hex-streng');
    }
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}


userRoutes.post("/login", (req, res) => {

    const { email, password } = req.body;

    const query = `SELECT * FROM users WHERE verified = 1`;

    db.all(query, [], async (err, users) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const user = users.find((user) => {

            // Valider `email_iv`
            if (!user.email_iv || typeof user.email_iv !== 'string' || user.email_iv.length !== 32) {
                console.error("Ugyldig `email_iv` for bruger:", user);
                return false; // Ekskluder denne bruger fra matchet
            }

            const decryptedEmail = decrypt(user.email, user.email_iv);
            return decryptedEmail === email;
        });

        if (!user) {
            return res.status(401).json({ message: "Bruger ikke fundet eller ikke verificeret." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            const token = jwt.sign({ user_id: user.user_id, username: user.username }, secretKey, { expiresIn: '1h' });
            res.cookie("authToken", token, { httpOnly: true, secure: true, sameSite: "None" })
                .status(200)
                .json({ message: "Du er logget ind!" });
        } else {
            res.status(401).json({ message: "Forkert adgangskode." });
        }
    });
});

userRoutes.post("/logout", (req, res) => {
    // Sæt cookien til at udløbe ved at sætte dens maxAge til 0
    res.cookie("authToken", "", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 0, // Fjern cookien
    });

    // Returner en succesmeddelelse
    res.status(200).json({ message: "Du er logget ud!" });
});




// Singup delen herunder
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Opsæt multer til at midlertidigt opbevare billedfiler inden de uploades til Cloudinary
// Link: https://www.npmjs.com/package/multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Konfigurer Cloudinary nøgler
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME, // cloud_name
    api_key: process.env.CLOUDINARY_API_KEY, // api_key
    api_secret: process.env.CLOUDINARY_API_SECRET, // api_secret
    secure: true,
});


userRoutes.post('/signup', upload.single('profilePicture'), async (req, res) => {
    try {
        const { email, username, password, phone, newsletter } = req.body;

        // Krypter email
        const { encryptedData, iv: ivHex } = encrypt(email);

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Generer engangskode
        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpExpiry = Date.now() + 5 * 60 * 1000;

        // Upload profilbillede til Cloudinary
        let imgUrl = null;
        if (req.file) { // Tjekker om der er en fil i requesten (uploadet via 'profilePicture')
            try {
                // Uploader filen direkte til Cloudinary som en buffer via upload_stream
                const result = await cloudinary.uploader.upload_stream(
                    {
                        public_id: `profile_pictures/${req.file.originalname.split('.')[0]}`, // Angiver et unikt ID baseret på filens navn (uden filtypen)
                        resource_type: 'auto', // Lader Cloudinary automatisk genkende filtypen (billede, video osv.)
                    },
                    (error, result) => {
                        if (error) throw error; // Hvis der opstår en fejl, smider vi en undtagelse
                        return result; // Returnerer resultatet af uploaden, som indeholder metadata fra Cloudinary
                    }
                ).end(req.file.buffer); // Sender filens buffer (indholdet) direkte til Cloudinary via stream

                // Gemmer URL'en til det uploadede billede fra Cloudinary
                imgUrl = result.secure_url; // Cloudinary returnerer en sikker URL, som vi gemmer til brug i applikationen
            } catch (uploadError) {
                // Logger fejlen, hvis noget går galt under upload til Cloudinary
                console.error('Fejl ved upload til Cloudinary:', uploadError);

                // Returnerer en fejlmeddelelse til klienten
                return res.status(500).json({ error: 'Kunne ikke uploade profilbillede.' });
            }
        }

        // Gem bruger i databasen
        const query = `
            INSERT INTO users (email, email_iv, username, password, phone, otp, otp_expiration, verified, subscribed_newsletter, img_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        `;

        db.run(query, [
            encryptedData,
            ivHex,
            username,
            hashedPassword,
            phone,
            otp,
            otpExpiry,
            newsletter || 0,
            imgUrl,
        ], (err) => {
            if (err) {
                console.error('Fejl ved oprettelse af bruger:', err);
                return res.status(500).json({ error: 'Kunne ikke oprette bruger.' });
            }

            // Send engangskode med Twilio
            client.messages.create({
                from: process.env.TWILIO_PHONE_NUMBER,
                to: `+${phone}`,
                body: `Din engangskode er ${otp}. Den udløber om 5 minutter.`,
            }).then(() => {
                console.log('OTP sendt!');
                res.status(200).json({ message: 'Signup lykkedes. Verificer dit telefonnummer.' });
            }).catch((twilioError) => {
                console.error('Fejl ved sending af OTP:', twilioError);
                res.status(500).json({ error: 'Kunne ikke sende OTP.' });
            });
        });
    } catch (error) {
        console.error('Fejl under signup:', error.message);
        res.status(500).json({ error: 'Signup fejlede.' });
    }
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

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email og OTP er påkrævet.' });
    }

    const query = `SELECT * FROM users WHERE otp = ? AND otp_expiration >= ?`;

    db.get(query, [otp, Date.now()], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!user) {
            return res.status(401).json({ message: 'Ugyldig eller udløbet OTP.' });
        }

        // Dekrypter e-mail for validering
        const decryptedEmail = decrypt(user.email, user.email_iv);
        if (decryptedEmail !== email) {
            return res.status(401).json({ message: 'E-mail matcher ikke.' });
        }

        const updateQuery = `UPDATE users SET verified = 1, otp = NULL, otp_expiration = NULL WHERE email = ?`;
        db.run(updateQuery, [user.email], async (updateErr) => {
            if (updateErr) {
                return res.status(500).json({ error: updateErr.message });
            }

            if (user.subscribed_newsletter === 1) {
                try {
                    const info = await transporter.sendMail({
                        from: "CBSJOE <cbsjoec@gmail.com>",
                        to: email,
                        subject: 'Velkommen til Joe & The Juice!',
                        html: `<div style="font-family: Arial, sans-serif; color: #333;">
                            <h1>Velkommen til Joe & The Juice</h1>
                            <p>Tak for at verificere din konto. Du er nu tilmeldt vores nyhedsbrev!</p>
                            <img src="https://seeklogo.com/images/J/joe-and-the-juice-logo-8D32BBD87A-seeklogo.com.png" alt="Joe & The Juice logo" style="width: 150px; height: auto; margin-bottom: 20px;">
                            <footer style="font-size: 12px; color: #888;">
                                <p>Joe & The Juice</p>
                                <p>Adresse: Se web</p>
                            </footer>
                        </div>`,
                    });
                    console.log(`Nyhedsbrev sendt til ${email}:`, info.messageId);
                } catch (error) {
                    console.error(`Fejl ved afsendelse af nyhedsbrev:`, error);
                }
            }

            res.status(200).json({ message: 'Bruger verificeret succesfuldt.' });
        });
    });
});

userRoutes.post('/email', checkAuth, async (req, res) => {
    const token = req.cookies.authToken; // Hent authToken fra cookies

    if (!token) {
        return res.status(401).json({ message: "Du skal være logget ind for at tilmelde dig nyhedsbrevet." });
    }

    try {
        // Verificér token for at få bruger-ID
        const decoded = jwt.verify(token, secretKey);
        const userId = decoded.user_id;

        // Tjek brugerens nuværende status
        const query = `SELECT * FROM users WHERE user_id = ?`;
        db.get(query, [userId], async (err, user) => {
            if (err) {
                console.error("Fejl ved databaseforespørgsel:", err);
                return res.status(500).json({ error: "Kunne ikke hente bruger." });
            }

            if (!user) {
                return res.status(404).json({ message: "Bruger ikke fundet." });
            }

            // Dekrypter e-mailen
            const decryptedEmail = decrypt(user.email, user.email_iv);

            if (!decryptedEmail) {
                return res.status(500).json({ error: "Kunne ikke dekryptere brugerens e-mail." });
            }

            // Hvis brugeren allerede er tilmeldt
            if (user.subscribed_newsletter === 1) {
                return res.status(200).json({ message: "Du er allerede tilmeldt nyhedsbrevet." });
            }

            // Opdater status til tilmeldt
            const updateQuery = `UPDATE users SET subscribed_newsletter = 1 WHERE user_id = ?`;
            db.run(updateQuery, [userId], async (updateErr) => {
                if (updateErr) {
                    console.error("Fejl ved opdatering:", updateErr);
                    return res.status(500).json({ error: "Kunne ikke opdatere nyhedsbrevstilmelding." });
                }

                // Send e-mailen
                try {
                    const info = await transporter.sendMail({
                        from: "CBSJOE <cbsjoec@gmail.com>",
                        to: decryptedEmail, // Brug dekrypteret e-mail
                        subject: 'Velkommen til Joe & The Juice!',
                        html: `<div style="font-family: Arial, sans-serif; color: #333;">
                            <h1>Velkommen til Joe & The Juice</h1>
                            <p>Tak for at verificere din konto. Du er nu tilmeldt vores nyhedsbrev!</p>
                            <img src="https://seeklogo.com/images/J/joe-and-the-juice-logo-8D32BBD87A-seeklogo.com.png" alt="Joe & The Juice logo" style="width: 150px; height: auto; margin-bottom: 20px;">
                            <footer style="font-size: 12px; color: #888;">
                                <p>Joe & The Juice</p>
                                <p>Adresse: Se web</p>
                            </footer>
                        </div>`,
                    });

                    console.log(`Nyhedsbrev sendt til ${decryptedEmail}:`, info.messageId);
                    return res.status(200).json({ message: "Du er nu tilmeldt nyhedsbrevet!" });
                } catch (mailError) {
                    console.error("Fejl ved afsendelse af nyhedsbrev:", mailError);
                    return res.status(500).json({ error: "Kunne ikke sende e-mail." });
                }
            });
        });
    } catch (error) {
        console.error("Fejl:", error);
        res.status(401).json({ message: "Ugyldig eller udløbet token." });
    }
});



module.exports = userRoutes;
