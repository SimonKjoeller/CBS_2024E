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
require('dotenv').config();

userRoutes.use(express.json());
userRoutes.use(cookieParser());


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
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    console.log(encryptedData)
    console.log(decrypted)
    return decrypted;
}

userRoutes.post("/login", (req, res) => {
    console.log('email_iv:', user.email_iv);

    const { email, password } = req.body;

    const query = `SELECT * FROM users WHERE verified = 1`;

    db.all(query, [], async (err, users) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Dekrypter e-mails og find match
        const user = users.find((user) => {
            const decryptedEmail = decrypt(user.email, user.email_iv);
            console.log(user.email)
            console.log(user.email_iv)
            console.log(decryptedEmail)
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



// Hashing konfiguration
const SALT_ROUNDS = 10;


userRoutes.post('/signup', upload.single('profilePicture'), async (req, res) => {
    try {
        const { email, username, password, phone, newsletter } = req.body;

        console.log(email, username, password, phone, newsletter);

        // Krypter email
        const { encryptedData, iv: ivHex } = encrypt(email);

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Generer engangskode
        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpExpiry = Date.now() + 5 * 60 * 1000;

        // Upload profilbillede til Cloudinary
        let imgUrl = null;
        if (req.file) {
            const tmpDir = './public/img'; // Midlertidig mappe
            const tmpFilePath = `${tmpDir}/${req.file.originalname}`;

            try {
                // Tjek og opret midlertidig mappe, hvis den ikke eksisterer
                await fsPromises.mkdir(tmpDir, { recursive: true });

                // Gem den midlertidige billedfil
                await fsPromises.writeFile(tmpFilePath, req.file.buffer);

                const uploadOptions = {
                    public_id: `profile_pictures/${req.file.originalname.split('.')[0]}`,
                    resource_type: 'auto',
                };

                // Upload til Cloudinary
                const result = await cloudinary.uploader.upload(tmpFilePath, uploadOptions);

                // Slet den midlertidige fil
                await fsPromises.unlink(tmpFilePath);

                // Gem billed-URL
                imgUrl = result.secure_url;
            } catch (uploadError) {
                console.error('Fejl ved upload til Cloudinary eller gemning af fil:', uploadError);
                return res.status(500).json({ error: 'Kunne ikke uploade profilbillede.' });
            }
        }

        // Gem bruger i databasen
        const query = `
            INSERT INTO users (email, email_iv, username, password, phone, otp, otp_expiration, verified, subscribed_newsletter, img_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        `;
        console.log(imgUrl)
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


module.exports = userRoutes;
