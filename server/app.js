require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const checkAuth = require('./checkAuth');
const userRoutes = require("./route/users");
const chatRoutes = require("./route/chat");
const shakeRoutes = require("./route/shakes");
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



// Routes
app.get("/locations", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/locations.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/signup.html"));
});

app.get("/", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/index.html"));
});

app.get("/menu", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/shakes.html"));
});

chatRoutes.get("/chat", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/chat.html"));
});

app.get("/cookie", (req, res) => {
  res.cookie("taste", "chocolate");
  res.send("Cookie set");
});



app.use("/users", userRoutes);
app.use("/chat", chatRoutes);
app.use("/shakes", shakeRoutes);

// Google Maps API
app.get('/api/maps-key', (req, res) => {
  const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (mapsApiKey) {
    res.json({ apiKey: mapsApiKey });
  } else {
    res.status(500).json({ error: "API-nøgle ikke fundet i .env" });
  }
});


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

// Liste over porte, som vi ønsker at starte serverne på. Dette bruges til vores Load Balancer i NGINX
const ports = [
  process.env.PORT1 || 3001,
  process.env.PORT2 || 3002,
  process.env.PORT3 || 3003,
  process.env.PORT4 || 3004
];

// Start en server for hver port
ports.forEach(port => {
  const server = http.createServer(app);

  // Socket.IO setup
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      transports: ["websocket", "polling"]
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    // Hent bruger-ID fra klientens handshake auth
    const user_id = socket.handshake.auth.user_id;

    console.log(`Server: User ID from handshake: ${user_id}`);

    if (user_id) {
      // Hent ulæste beskeder
      const query = `
          SELECT * FROM chat
          WHERE recipient_id = ? AND delivered = 0
      `;
      db.all(query, [user_id], (err, messages) => {
        if (err) {
          console.error("Database error:", err);
          return;
        }

        // Send beskeder og marker dem som leveret
        messages.forEach((msg) => {
          socket.emit("new_message", msg);

          const updateQuery = "UPDATE chat SET delivered = 1 WHERE chat_id = ?";
          db.run(updateQuery, [msg.chat_id], (err) => {
            if (err) console.error("Error updating message:", err);
          });
        });
      });
    } else {
      console.warn("User ID is missing in handshake auth.");
    }

    socket.on("join_room", (room) => {
      console.log(`User joined room: ${room}`);
      socket.join(room);

      const [userId1, userId2] = room.split("_").map(Number);

      // Debug hvem der er i rummet
      const clients = Array.from(io.sockets.adapter.rooms.get(room) || []);
      console.log(`Clients in room (${room}):`, clients);

      // Marker beskeder som leveret for det pågældende rum
      const updateQuery = `
        UPDATE chat
        SET delivered = 1
        WHERE recipient_id = ? AND sender_id = ? AND delivered = 0
    `;
      db.run(updateQuery, [userId2, userId1], (err) => {
        if (err) {
          console.error("Error updating delivered status:", err);
        } else {
          console.log(`Marked messages as delivered for room: ${room}`);
        }
      });
    });

    socket.on("new_message", (data) => {
      const room = [data.senderId, data.recipientId].sort((a, b) => a - b).join("_");
      console.log(`Server: Sending message to room: ${room}`);
      io.to(room).emit("new_message", data);
    });


    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Start serveren på den angivne port
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

});
