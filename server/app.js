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
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // API-nøglen fra .env
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

app.post("/chatbot", async (req, res) => {
  const userMessage = req.body.message;

  try {
      const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
              {
                  role: "system",
                  content: `
                      Du er en chatbot for Joe & The Juice. Du skal hjælpe kunder med følgende spørgsmål:
                      - Vores menu (smoothies, sandwiches, juice, shakes).
                      - Åbningstider for Joe & The Juice.
                      - Placering af Joe & The Juice-butikker.
                      - Spørgsmål om allergener i vores produkter.

                      Regler for dine svar:
                      1. Hvis et spørgsmål ikke er relevant for Joe & The Juice, skal du svare: 
                         "Jeg er kun i stand til at besvare spørgsmål relateret til Joe & The Juice, vores menu, åbningstider og placeringer."
                      2. Du skal altid være kortfattet og præcis.
                      3. Tilføj gerne en venlig tone og emojis, der matcher Joe & The Juice's stil.
                      4. Ignorer irrelevante forespørgsler som personlige spørgsmål eller ting, der ikke handler om Joe & The Juice.

                      Eksempelspørgsmål og -svar:
                      - Spørgsmål: "Hvad er jeres menu?"
                        Svar: "Vores menu indeholder lækre smoothies, sandwiches og shakes. Vil du høre mere om en specifik ret?"
                      - Spørgsmål: "Hvad er jeres åbningstider?"
                        Svar: "Vi har åbent hver dag fra kl. 8:00 til 20:00."
                      - Spørgsmål: "Hvor kan jeg finde jer?"
                        Svar: "Du kan finde os i byer over hele landet! Tjek vores hjemmeside for placeringer nær dig."
                  `,
              },
              { role: "user", content: userMessage },
          ],
          max_tokens: 150,
          temperature: 0.7,
      });

      const botReply = completion.choices[0].message.content.trim();
      res.json({ response: botReply });
  } catch (error) {
      console.error("Fejl med OpenAI API:", error.message);
      res.status(500).json({ response: "Der opstod en fejl. Jeg kan desværre ikke svare lige nu!" });
  }
});

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

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on("new_message", (data) => {
    console.log("Server received message:", data);

    const query = `
        SELECT u1.user_id AS senderId, u2.user_id AS recipientId
        FROM users u1, users u2
        WHERE u1.username = ? AND u2.username = ?
    `;

    db.get(query, [data.sender, data.recipient], (err, ids) => {
      if (err) {
        console.error("Database query error:", err);
        return;
      }

      if (ids) {
        const room = [ids.senderId, ids.recipientId].sort().join("_");
        console.log(`Server sending message to room: ${room}`);
        io.to(room).emit("new_message", { ...data, senderId: ids.senderId, recipientId: ids.recipientId });

        // Save message in database
        const insertQuery = `
          INSERT INTO chat (sender_id, recipient_id, message, sent_at) 
          VALUES (?, ?, ?, ?)
        `;
        db.run(insertQuery, [ids.senderId, ids.recipientId, data.message, data.sent_at], (err) => {
          if (err) {
            console.error("Database save error:", err);
          } else {
            console.log("Message saved to database.");
          }
        });
      } else {
        console.warn("No IDs found for sender and recipient.");
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
