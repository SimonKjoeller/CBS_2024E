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
const db = require("./db");

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

// Add a new route for shakes.html with `checkAuth` middleware
app.get("/shakes", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/shakes.html"));
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
const io = socketIo(server, {
  cors: {
    origin: "https://cbsjoe.live", // Tillad forespørgsler fra dit domæne
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"], // Sørg for at tillade både WebSocket og polling
});


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on('new_message', (data) => {
    const { sender, recipient, message, sent_at } = data;

    const room = [sender, recipient].sort().join('_');
    io.to(room).emit('new_message', data);

    const query = `INSERT INTO chat (sender_id, recipient_id, message, sent_at) 
                   VALUES ((SELECT id FROM users WHERE username = ?), 
                           (SELECT id FROM users WHERE username = ?), ?, ?)`;

    db.run(query, [sender, recipient, message, sent_at], function (err) {
      if (err) {
        console.error('Database error:', err);
        return;
      }
      console.log('Message saved in DB with ID:', this.lastID);
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
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

  const user_id = req.user?.userId; // Extract userId from token
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
