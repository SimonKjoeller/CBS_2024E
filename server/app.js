require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const checkAuth = require('./checkAuth');
const nodemailer = require("nodemailer");
const userRoutes = require("./route/users");
const chatRoutes = require("./route/chat");
const WebSocket = require("ws");  // Import WebSocket
const https = require("https");
const fs = require("fs");
const app = express();

// Læs SSL certifikater til HTTPS fra .env filen
const serverOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  ca: fs.readFileSync(process.env.SSL_CA_PATH)  // Hvis nødvendigt
};

// Setup WebSocket server
const wss = new WebSocket.Server({ noServer: true });

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
app.use(cors());
app.use(express.static(path.join(__dirname, "../public")));
app.use(cookieParser());
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
app.get("/", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/index.html"));
});

app.get("/locations", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/locations.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/login.html"));
});

// WebSocket upgrade handling for HTTPS server
const server = https.createServer(serverOptions, app);

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Start the HTTPS server
server.listen(3000, () => {
  console.log("Server listening on port 3000");
});

app.use("/users", userRoutes);
app.use("/chat", chatRoutes);
