require('dotenv').config();
const express = require("express");
const https = require("https");
const fs = require("fs");
const WebSocket = require("ws");  // Import WebSocket module
const path = require("path");
const cookieParser = require("cookie-parser");
const checkAuth = require('./checkAuth');
const nodemailer = require("nodemailer");
const userRoutes = require("./route/users");
const chatRoutes = require("./route/chat");
const app = express();

// Læs SSL-certifikaterne fra .env filen
const serverOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  ca: fs.readFileSync(process.env.SSL_CA_PATH), // Hvis nødvendigt
};

// Opret HTTPS server
const server = https.createServer(serverOptions, app);

// Setup WebSocket server
const wss = new WebSocket.Server({ server });  // Tilknyt WebSocket serveren til HTTPS serveren

wss.on("connection", (ws) => {
  console.log("A user connected");

  // Handling incoming messages
  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    // Broadcast message to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);  // Send message to all connected clients
      }
    });
  });

  ws.on("close", () => {
    console.log("A user disconnected");
  });
});

// Middleware setup
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "cbsjoec@gmail.com",
    pass: "ozyurwjboabzrqek",
  },
});

// Routes
app.use("/users", userRoutes);
app.use("/chat", chatRoutes);

// API routes
app.get("/", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/index.html"));
});

app.get("/locations", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/locations.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/login.html"));
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

// Start HTTPS server
server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
