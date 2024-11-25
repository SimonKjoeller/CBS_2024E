require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const checkAuth = require('./checkAuth');
const nodemailer = require("nodemailer");
const userRoutes = require("./route/users");
const chatRoutes = require("./route/chat");
const socketIo = require("socket.io");
const http = require("http");
const app = express();
const db = require("./db");

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

app.get("/cookie", (req, res) => {
  res.cookie("taste", "chocolate");
  res.send("Cookie set");
});

app.post("/email", async (req, res) => {
  try {
    let { email } = req.body;
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

// HTTP server setup
const server = http.createServer(app).listen(3000, () => {
  console.log("HTTP Server listening on port 3000");
});

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

// Når en klient forbinder
io.on("connection", (socket) => {
  console.log("A user connected");

  // Hent bruger-ID (f.eks. fra token eller session)
  const userId = socket.handshake.auth.userId;

  // Find beskeder, der ikke er blevet leveret endnu
  const query = `
      SELECT * FROM chat
      WHERE recipient_id = ? AND delivered = 0
  `;

  console.log(userId)

  db.all(query, [userId], (err, messages) => {
    if (err) {
      console.error("Database error:", err);
      return;
    }

    // Send alle ventende beskeder til klienten
    messages.forEach((msg) => {
      socket.emit("new_message", msg);

      // Marker beskeden som leveret
      const updateQuery = "UPDATE chat SET delivered = 1 WHERE chat_id = ?";
      db.run(updateQuery, [msg.chat_id], (err) => {
        if (err) console.error("Error updating message:", err);
      });
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
