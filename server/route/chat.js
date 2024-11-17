const socket = new WebSocket("wss://cbsjoe.live");  // WebSocket secure connection
const searchInput = document.getElementById("search");
const searchDropdown = document.getElementById("search-dropdown");
const chatList = document.getElementById("chat-list");
const sendMessageButton = document.getElementById("send-message");
const chatMessages = document.getElementById("chat-messages");

socket.addEventListener('message', function (event) {
    const message = JSON.parse(event.data);
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    // If sender is 'your_username', position the message to the right
    if (message.sender === 'your_username') { // Change 'your_username' with actual user name
        messageElement.classList.add("mine");
    } else {
        messageElement.classList.add("other");
    }

    messageElement.textContent = `[${message.sent_at}] ${message.sender}: ${message.message}`;
    chatMessages.appendChild(messageElement);
});

// Functionality for searching, sending, and receiving messages
// More functionality (e.g., searchChats, loadConversation, etc.) is similar to your previous implementation


chatRoutes.use(express.json());
chatRoutes.use(cookieParser());

// Main page
chatRoutes.get("/", checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/pages/chat.html"));
});

chatRoutes.post("/recipient", checkAuth, (req, res) => {
    const { username } = req.body;
    const query = `SELECT username FROM users WHERE username LIKE ? LIMIT 4`;

    db.all(query, [`%${username}%`], (err, users) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(users);
    });
});

// Henter samtalens tidligere beskeder
chatRoutes.get("/conversation/:recipient", checkAuth, (req, res) => {
    const recipientUsername = req.params.recipient; // Brugernavn på modtager
    const senderId = req.user.userId; // Bruger-ID fra token (autentificeret bruger)

    const query = `
        SELECT c.message, c.sent_at, u1.username AS sender, u2.username AS recipient
        FROM chat c
        JOIN users u1 ON c.sender_id = u1.id
        JOIN users u2 ON c.recipient_id = u2.id
        WHERE 
            (c.sender_id = ? AND u2.username = ?) OR 
            (c.recipient_id = ? AND u1.username = ?)
        ORDER BY c.sent_at ASC
    `;

    db.all(query, [senderId, recipientUsername, senderId, recipientUsername], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows); // Returner samtalen som JSON
    });
});

// Sender ny besked
chatRoutes.post("/send", checkAuth, (req, res) => {
    const { recipientUsername, message } = req.body; // Modtagerens brugernavn og besked
    const senderId = req.user.userId; // Afsenderens bruger-ID fra token

    const query = `INSERT INTO chat (sender_id, recipient_id, message) 
                   VALUES (?, (SELECT id FROM users WHERE username = ?), ?)`;

    db.run(query, [senderId, recipientUsername, message], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ chat_id: this.lastID, message: "Besked sendt!" }); // Bekræftelse
    });
});



module.exports = chatRoutes;
