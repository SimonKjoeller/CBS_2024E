const searchInput = document.getElementById("search");
const searchDropdown = document.getElementById("search-dropdown");
const chatList = document.getElementById("chat-list");
const sendMessageButton = document.getElementById("send-message");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("new-message");

let currentUserId;
let currentUsername;
let activeRecipientId = null; // Til at holde styr på den aktive modtager
let socket;

async function fetchCurrentUserInfo() {
    try {
        const response = await fetch("/chat/currentUser", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        currentUserId = data.user_id;
        currentUsername = data.username;

        // Opret Socket.IO-forbindelsen, når brugeroplysninger er hentet
        initializeSocket();
    } catch (error) {
        console.error("Error fetching user info:", error);
    }
}

function initializeSocket() {
    console.log(currentUserId)
    socket = io.connect('https://cbsjoe.live', {
        auth: {
            user_id: currentUserId, // Send userId som en del af handshake auth
        },
    });

    socket.on("connect", () => {
        console.log(`Client connected with userId: ${currentUserId}`);
    });

    socket.on("new_message", (data) => {
        console.log("Client: New message received:", data);
        // Håndtering af beskeder her...
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
}

// Hent brugeroplysninger og start processen
fetchCurrentUserInfo();

function joinRoom(recipientId) {
    const room = [currentUserId, recipientId].sort((a, b) => a - b).join("_");
    console.log(`Client: Joining room ${room} with recipientId ${recipientId}`);
    socket.emit("join_room", room);
}

if (searchInput && searchDropdown && chatList && sendMessageButton && chatMessages && messageInput) {
    let typingTimeout;

    searchInput.addEventListener("input", () => {
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(searchChats, 300);
    });

    async function searchChats() {
        const query = searchInput.value.trim();
        if (query.length === 0) {
            searchDropdown.style.display = "none";
            return;
        }

        try {
            const response = await fetch("/chat/recipient", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: query }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            displaySearchResults(data);
        } catch (error) {
            console.error("Error searching recipients:", error);
        }
    }

    function displaySearchResults(results) {
        searchDropdown.innerHTML = "";
        if (results.length === 0) {
            searchDropdown.style.display = "none";
            return;
        }

        results.forEach(result => {
            const item = document.createElement("div");
            item.textContent = result.username;
            item.classList.add("dropdown-item");
            item.dataset.userId = result.user_id; // Sæt user_id som data-attribut
            item.onclick = () => {
                searchInput.value = result.username;
                searchDropdown.style.display = "none";
                addChatUser(result.username, result.user_id); // Tilføj user_id til chat-listen
                loadConversation(result.username);
                highlightUser(result.username);
            };
            searchDropdown.appendChild(item);
        });

        searchDropdown.style.display = "block";
    }

    function addChatUser(username, userId) {
        const existingUser = Array.from(chatList.children).find(li => li.textContent === username);
        if (!existingUser) {
            const listItem = document.createElement("li");
            listItem.textContent = username;
            listItem.dataset.userId = userId; // Sæt user_id som data-attribut
            chatList.appendChild(listItem);
        }
    }

    function highlightUser(username) {
        Array.from(chatList.children).forEach(user => {
            user.classList.toggle("active", user.textContent === username);
        });
    }

    async function loadConversation(recipient) {
        const room = [currentUsername, recipient].sort().join('_');
        socket.emit('join_room', room);

        try {
            const response = await fetch(`/chat/conversation/${recipient}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const messages = await response.json();
            chatMessages.innerHTML = "";

            messages.forEach(msg => {
                const messageElement = document.createElement("div");
                messageElement.classList.add("message");

                if (msg.sender === currentUsername) {
                    messageElement.classList.add("mine");
                } else {
                    messageElement.classList.add("other");
                }

                messageElement.textContent = `[${new Date(msg.sent_at).toLocaleString()}] ${msg.sender}: ${msg.message}`;
                chatMessages.appendChild(messageElement);
            });

            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            console.error("Error loading conversation:", error);
        }
    }

    chatList.addEventListener("click", (event) => {
        const listItem = event.target.closest("li");

        if (listItem) {
            const recipientId = listItem.dataset.userId;
            activeRecipientId = recipientId; // Opdater den aktive modtager
            console.log("Client: Updated activeRecipientId:", activeRecipientId);

            highlightUser(listItem.textContent);
            joinRoom(recipientId); // Brug recipientId til at oprette rummet
            loadConversation(listItem.textContent); // Hent samtalen
        }
    });

    sendMessageButton.addEventListener("click", async () => {
        const activeUser = document.querySelector("#chat-list .active");

        if (!activeUser) {
            alert("Select a user from the list before sending a message.");
            return;
        }

        const recipient = activeUser.textContent;
        const message = messageInput.value.trim();

        if (!message) {
            alert("Message cannot be empty.");
            return;
        }

        const sent_at = new Date().toISOString();

        // Socket.IO: Send beskeden i realtid
        socket.emit("new_message", { sender: currentUsername, recipient, message, sent_at });

        // HTTP: Gem beskeden i databasen
        try {
            const response = await fetch("/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipientUsername: recipient, message }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save message: ${response.status}`);
            }

            console.log("Message saved to database.");
        } catch (error) {
            console.error("Error saving message to database:", error);
        }

        // Clear input field
        messageInput.value = "";
    });
}
