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


// Endpoint to fetch all products
app.get('/products', (req, res) => {
  const query = `SELECT * FROM products`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch products' });
    } else {
      res.json(rows); // Send products as JSON
    }
  });
});


// Endpoint to place an order
app.post('/order', checkAuth, (req, res) => {
  console.log('Incoming Order Request:', req.body);

  console.log("est")

  const user_id = req.user?.user_id; // Extract userId from token
  const { items } = req.body; // Get the order items from the request body

  // Validate input
  if (!user_id) {
    console.error('User ID is missing or invalid');
    return res.status(400).json({ error: 'User ID is missing or invalid' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    console.error('Invalid or empty order items');
    return res.status(400).json({ error: 'Invalid or empty order items' });
  }

  // Start database transaction
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ error: 'Database transaction error' });
    }

    // Insert a new order into the orders table
    const insertOrderQuery = `INSERT INTO orders (user_id) VALUES (?)`;
    db.run(insertOrderQuery, [user_id], function (err) {
      if (err) {
        console.error('Error creating order:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to create order' });
      }

      const order_id = this.lastID; // Get the auto-generated order ID
      console.log('New Order ID:', order_id);

      // Insert the order items into the order_items table
      const insertOrderItemsQuery = `
              INSERT INTO order_items (order_id, product_id, quantity)
              VALUES ${items.map(() => '(?, ?, ?)').join(', ')}
          `;
      const orderItemsParams = items.flatMap(item => [order_id, item.product_id, item.quantity]);

      db.run(insertOrderItemsQuery, orderItemsParams, function (err) {
        if (err) {
          console.error('Error adding order items:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to add order items' });
        }

        // Commit the transaction
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err);
            return res.status(500).json({ error: 'Failed to commit transaction' });
          }

          // Successfully inserted order and order items
          console.log('Order successfully committed to database');
          return res.status(201).json({ message: 'Order created successfully', order_id });
        });
      });
    });
  });
});