const socket = io.connect('https://cbsjoe.live');
const searchInput = document.getElementById("search");
const searchDropdown = document.getElementById("search-dropdown");
const chatList = document.getElementById("chat-list");
const sendMessageButton = document.getElementById("send-message");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("new-message");

let currentUserId;
let currentUsername;

// Hent bruger-ID og -navn fra serveren
async function fetchCurrentUserInfo() {
    try {
        const response = await fetch("/chat/currentUser", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        currentUserId = data.userId; // Antag at serveren returnerer userId
        currentUsername = data.username;
    } catch (error) {
        console.error("Error fetching user info:", error);
    }
}

fetchCurrentUserInfo();

function joinRoom(recipientId) {
    const room = [currentUserId, recipientId].sort((a, b) => a - b).join("_");
    socket.emit("join_room", room);
    console.log(`Joined room: ${room}`);
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

    // Brug joinRoom-funktionen, når en samtale åbnes
    chatList.addEventListener("click", (event) => {
        const listItem = event.target.closest("li");

        if (listItem) {
            const recipientId = listItem.dataset.userId; // Antag at recipientId er gemt som data-attribut
            highlightUser(listItem.textContent);
            joinRoom(recipientId); // Kalder joinRoom med recipientId
            loadConversation(listItem.textContent); // Hent samtalen for den aktive bruger
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

    socket.on("new_message", (data) => {
        const room = [data.senderId, data.recipientId].sort((a, b) => a - b).join("_");
        const activeRoom = [currentUserId, activeRecipientId].sort((a, b) => a - b).join("_");

        console.log(`New message received for room: ${room}, Active room: ${activeRoom}`);

        if (room === activeRoom) {
            const messageElement = document.createElement("div");
            messageElement.classList.add(data.senderId === currentUserId ? "mine" : "other");
            messageElement.textContent = `[${new Date(data.sent_at).toLocaleString()}] ${data.sender}: ${data.message}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            console.warn(`Message not displayed because it doesn't belong to the active room.`);
        }
    });


}
