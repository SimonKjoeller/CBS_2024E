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

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on("new_message", (data) => {
    const { sender, recipient, message, sent_at } = data;

    // Find senderId og recipientId fra databasen
    const query = `
        SELECT u1.user_id AS senderId, u2.user_id AS recipientId
        FROM users u1, users u2
        WHERE u1.username = ? AND u2.username = ?
    `;

    db.get(query, [sender, recipient], (err, ids) => {
      if (err) {
        console.error("Database error:", err);
        return;
      }

      if (ids) {
        const room = [ids.senderId, ids.recipientId].sort((a, b) => a - b).join("_");
        const enrichedData = {
          ...data,
          senderId: ids.senderId,
          recipientId: ids.recipientId
        };

        // Send beskeden til rummet
        io.to(room).emit("new_message", enrichedData);

        // Gem beskeden i databasen
        const insertQuery = `
                INSERT INTO chat (sender_id, recipient_id, message, sent_at) 
                VALUES (?, ?, ?, ?)
            `;

        db.run(insertQuery, [ids.senderId, ids.recipientId, message, sent_at], function (err) {
          if (err) {
            console.error("Database error:", err);
          } else {
            console.log(`Message saved in DB with ID: ${this.lastID}`);
          }
        });
      }
    });
  });


  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});



//Laver et POST /order endpoint der opretter en ny ordre i databasen
app.post('/order', (req, res) => {
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity) {
    return res.status(400).json({ error: 'Product ID and quantity are required' });
  }

  const query = `
      INSERT INTO orders (product_id, quantity, total_price) 
      VALUES (?, ?, (SELECT price FROM products WHERE product_id = ?) * ?)
  `;

  db.run(query, [product_id, quantity, product_id, quantity], function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to create order' });
    }
    res.json({ message: 'Order created successfully', order_id: this.lastID });
  });
});