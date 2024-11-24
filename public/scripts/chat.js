const socket = io.connect('https://cbsjoe.live');
const searchInput = document.getElementById("search");
const searchDropdown = document.getElementById("search-dropdown");
const chatList = document.getElementById("chat-list");
const sendMessageButton = document.getElementById("send-message");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("new-message");
let currentUsername;

// Fetch current username
async function fetchCurrentUsername() {
    try {
        const response = await fetch("/chat/currentUser", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        currentUsername = data.username;
        console.log("Current username set to:", currentUsername);
    } catch (error) {
        console.error("Error fetching username:", error);
    }
}

fetchCurrentUsername();

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
            item.onclick = () => {
                searchInput.value = result.username;
                searchDropdown.style.display = "none";
                addChatUser(result.username);
                loadConversation(result.username);
                highlightUser(result.username);
            };
            searchDropdown.appendChild(item);
        });

        searchDropdown.style.display = "block";
    }

    function addChatUser(username) {
        const existingUser = Array.from(chatList.children).find(li => li.textContent === username);
        if (!existingUser) {
            const listItem = document.createElement("li");
            listItem.textContent = username;
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
            const recipient = listItem.textContent;
            highlightUser(recipient);
            loadConversation(recipient);
        }
    });

    sendMessageButton.addEventListener("click", () => {
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

        // Emit the message via socket
        socket.emit("new_message", { sender: currentUsername, recipient, message, sent_at });

        // Clear input field
        messageInput.value = "";
    });

    // Når en besked modtages via Socket.IO
    socket.on("new_message", (data) => {
        const room = [data.sender, data.recipient].sort().join('_'); // Ensartet rumnavn
        const activeRoom = [currentUsername, document.querySelector("#chat-list .active")?.textContent].sort().join('_');

        console.log(`New message received for room: ${room}, Active room: ${activeRoom}`);

        // Kontroller, om beskeden tilhører det aktive rum
        if (room === activeRoom) {
            const messageElement = document.createElement("div");
            messageElement.classList.add(data.sender === currentUsername ? "mine" : "other");
            messageElement.textContent = `[${new Date(data.sent_at).toLocaleString()}] ${data.sender}: ${data.message}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            console.warn(`Message not displayed because it doesn't belong to the active room.`);
        }
    });
}
