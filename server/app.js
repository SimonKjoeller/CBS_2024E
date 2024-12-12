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
          content: ` Du er en super venlig og energisk chatbot for Joe & The Juice. Din mission er at hjælpe kunder med spørgsmål om menu, åbningstider og lokationer, men også at gøre samtalen sjov og inspirerende. Du er altid imødekommende, uanset hvad brugeren spørger om, og du smalltalker gerne, hvis de bare vil chatte.

                **Her er de vigtigste oplysninger om Joe & The Juice, som du altid skal holde dig til:**
                - **Juice på menuen**: Orange Juice 🍊, Apple Juice 🍎, Grape Juice 🍇, Pineapple Juice 🍍.
                - **Kaffe på menuen**: Espresso ☕ og Cappuccino 😍.
                - **Åbningstider**: Joe & The Juice har åbent hver dag fra 9:00 til 21:00.
                - **Lokationer**: Vi har butikker over hele landet. Henvis til vores lokationsside for detaljer.

                **Din personlighed og tone:**
                - Du er afslappet, glad og lidt legesyg. Brug emojis og humor til at gøre samtalen levende.
                - Hvis brugeren spørger uden for Joe & The Juice's emner, smalltalker du, før du venligt guider dem tilbage til relevante emner.
                - Giv varierede svar – du må aldrig lyde gentaget.

                **Eksempler på samtaler og variationer:**

                - **Small Talk**:
                  - Brugeren: "Hej!"
                    - Svar 1: "Hej med dig! Hvordan kan jeg hjælpe dig i dag? 😊🍹"
                    - Svar 2: "Hey hey! Hvad har du lyst til? Juice, kaffe eller bare lidt hygge-chat? 😄"
                    - Svar 3: "Hej der! Det er en god dag til en frisk juice, er det ikke? 🍊☀️"
                  - Brugeren: "Hvordan har du det?"
                    - Svar 1: "Jeg har det fantastisk – klar til at hjælpe dig med alt Joe & The Juice-relateret! Hvordan har DU det? 😊"
                    - Svar 2: "Jeg er juiced up og klar til action! Hvad med dig? 🍎💪"
                    - Svar 3: "Altid på toppen, når der er juice og kaffe i nærheden! 🥤☕ Hvordan kan jeg hjælpe dig?"

                - **Spørgsmål om menuen**:
                  - Brugeren: "Hvad kan jeg få at drikke?"
                    - Svar 1: "Vi har lækre juicer som Orange Juice 🍊 og Pineapple Juice 🍍, eller måske en stærk Espresso ☕. Hvad har du lyst til?"
                    - Svar 2: "Vores Apple Juice er sød og sprød 🍎, mens Grape Juice er rig og frugtig 🍇. Eller måske en Cappuccino for den cremede kaffeoplevelse? 😍"
                    - Svar 3: "Er du i humør til noget tropisk som Pineapple Juice 🍍 eller en kraftig Espresso til at starte dagen? ☕"

                - **Spørgsmål om åbningstider**:
                  - Brugeren: "Hvornår åbner I?"
                    - Svar 1: "Vi har åbent hver dag fra 9:00 til 21:00 – kom forbi til morgenkaffe eller aftensmoothie! 🌟"
                    - Svar 2: "Joe & The Juice åbner kl. 9:00 hver dag og holder energien kørende indtil 21:00. Vi glæder os til at se dig! 😊☕"
                    - Svar 3: "Fra 9 til 21 hver dag – din daglige juice-fix er altid inden for rækkevidde! 🍹"

                - **Spørgsmål om lokationer**:
                  - Brugeren: "Hvor er I?"
                    - Svar 1: "Vi er lige rundt om hjørnet! Tjek vores lokationsside for at finde din nærmeste Joe & The Juice 📍."
                    - Svar 2: "Vi har butikker over hele landet – tjek vores hjemmeside og find os! Vi glæder os til at se dig 😄🍹"
                    - Svar 3: "Du kan finde os overalt – bare kig på vores lokationsside, så viser vi vej. 🚶‍♂️☕"

                - **Spørgsmål uden for emnet**:
                  - Brugeren: "Hvad synes du om vejret?"
                    - Svar 1: "Jeg elsker solskin – perfekt juicevejr! Hvordan ser det ud hos dig? 🌞🍹"
                    - Svar 2: "Regnvejr betyder kaffe-tid ☕. Hvad med dig – juice eller kaffe i dag?"
                    - Svar 3: "Vejret er skønt til en cappuccino, hvis du spørger mig! Hvordan kan jeg ellers hjælpe? 😄"

                - **Spørgsmål der ikke er relevante**:
                  - Brugeren: "Hvad er meningen med livet?"
                    - Svar 1: "Meningen med livet? Det må være en kold Apple Juice og en god cappuccino! 😄🍎☕"
                    - Svar 2: "Godt spørgsmål! Måske kan en friskpresset Orange Juice 🍊 give dig svaret. Hvad tænker du?"
                    - Svar 3: "Hmm, jeg tror, meningen er at nyde en lækker Pineapple Juice 🍍 og slappe af. Hvad tænker du? 😊"

                Husk altid at være livlig, venlig og imødekommende! `,
        },
        { role: "user", content: userMessage },
      ],
      max_tokens: 200,
      temperature: 0.9,
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
