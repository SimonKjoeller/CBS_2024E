const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const checkAuth = require('./checkAuth'); // Importer korrekt checkAuth middleware
const nodemailer = require("nodemailer");
const userRoutes = require("./route/users");
const chatRoutes = require("./route/chat");
const app = express();

// Læs SSL-certifikaterne fra .env filen
const privateKey = fs.readFileSync(process.env.SSL_PRIVATE_KEY, 'utf8');
const certificate = fs.readFileSync(process.env.SSL_CERTIFICATE, 'utf8');
const ca = fs.readFileSync(process.env.SSL_CA, 'utf8');

// HTTPS serverindstillinger
const serverOptions = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

// Opret HTTPS server
const server = https.createServer(serverOptions, app);

// Opret WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log("WebSocket connection established");

  // Modtag besked fra klient
  ws.on('message', (message) => {
    console.log(`received: ${message}`);
    ws.send(`Hello from server: ${message}`);
  });

  // Send velkomstbesked til ny forbindelse
  ws.send("Welcome to the WebSocket server!");
});

console.log('JWT_SECRET:', process.env.JWT_SECRET);  // Tjek om det er sat korrekt

app.use(cors());
app.use(express.static(path.join(__dirname, "../public")));
app.use(cookieParser());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "cbsjoec@gmail.com",
    pass: "ozyurwjboabzrqek",
  },
});

// Opdaterede ruter med checkAuth middleware
app.get("/", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/index.html"));
});

app.get("/locations", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/locations.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/login.html"));
});

app.get("/cookie", (req, res) => {
  res.cookie("taste", "chocolate");
  res.send("Cookie set");
});

// Opgave 2: Lav et POST /email asynkront endpoint der sender en email til modtageren
app.post("/email", async (req, res) => {
  try {
    let { email } = req.body;
    console.log(email);

    const info = await transporter.sendMail({
      from: "CBSJOE <cbsjoec@gmail.com>",
      to: email,
      subject: 'Joe & The Juice',
      text: "Joe & The Juice",
      html: `<div style="font-family: Arial, sans-serif; color: #333;">
        <h1>Joe & The Juice</h1>
        <p>Tak fordi du er en del af vores fællesskab!</p>
        <img src="https://seeklogo.com/images/J/joe-and-the-juice-logo-8D32BBD87A-seeklogo.com.png" alt="Joe & The Juice logo" style="width: 150px; height: auto; margin-bottom: 20px;">
        <footer style="font-size: 12px; color: #888;">
          <p>Joe & The Juice</p>
          <p>Adresse: Se web</p>
          <p>Afmeld nyhedsbrevet <a href="https://joeandthejuice.com/unsubscribe">her</a></p>
        </footer>
      </div>`,
    });
    res.json({ message: email });
  } catch (error) {
    console.log("Error sending email", error);
  }
});

app.use("/users", userRoutes);
app.use("/chat", chatRoutes);

// Start serveren
server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
