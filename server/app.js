require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const checkAuth = require('./checkAuth'); // Importer korrekt checkAuth middleware
const nodemailer = require("nodemailer");
const userRoutes = require("./route/users");
const chatRoutes = require("./route/chat");
const socketIo = require("socket.io"); // Importer socket.io
const http = require("http"); // Brug HTTP i stedet for HTTPS
const app = express();

// Middleware setup
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

// Start HTTP-server
const server = http.createServer(app).listen(3000, () => {
  console.log("HTTP Server listening on port 3000");
});

// Initialize Socket.IO server
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('new_message', (data) => {
    const { sender, recipient, message, sent_at } = data;

    // Gem beskeden i databasen
    const query = `INSERT INTO chat (sender_id, recipient_id, message, sent_at) 
                     VALUES ((SELECT id FROM users WHERE username = ?), 
                             (SELECT id FROM users WHERE username = ?), ?, ?)`;

    db.run(query, [sender, recipient, message, sent_at], function (err) {
      if (err) {
        console.error('Database error:', err);
        return;
      }
      console.log('Besked gemt i databasen med ID:', this.lastID);

      // Send beskeden til modtageren via Socket.IO
      io.emit('new_message', data);
    });

  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


