const searchInput = document.getElementById("search");
const searchDropdown = document.getElementById("search-dropdown");
const chatList = document.getElementById("chat-list");
const sendMessageButton = document.getElementById("send-message");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("new-message");

let currentUserId;
let currentUsername;
let activeRecipientId = null; // Til at holde styr på den aktive modtager

function renderChatList(users) {
    const chatList = document.getElementById("chat-list");
    chatList.innerHTML = ""; // Tøm eksisterende liste

    users.forEach(user => {
        const li = document.createElement("li");
        li.className = "chat-user";

        li.innerHTML = `
            <img src="${user.img_url || '/img/no-pb.png'}" alt="${user.username}" class="user-avatar">
            <span>${user.username}</span>
        `;
        li.dataset.userId = user.user_id; // Gem user_id som data-attribut
        li.onclick = () => {
            activeRecipientId = user.user_id; // Opdater activeRecipientId
            highlightUser(user.username);
            joinRoom(user.user_id);
            loadConversation(activeRecipientId);
        };
        chatList.appendChild(li);
    });
}

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

async function loadConversation(recipientId) {
    try {
        const response = await fetch(`/chat/conversation/${recipientId}`);
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


function initializeSocket() {
    if (!currentUserId) {
        console.error("Socket cannot be initialized without a valid userId");
        return;
    }

    socket = io.connect('https://cbsjoe.live', {
        auth: {
            user_id: currentUserId, // Auth handshake
        },
    });

    socket.on("connect", () => {
        console.log(`Client connected with userId: ${currentUserId}`);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });

    socket.on("new_message", (data) => {

        const room = [data.senderId, data.recipientId].sort((a, b) => a - b).join("_");
        const activeRoom = [currentUserId, activeRecipientId].sort((a, b) => a - b).join("_");

        if (room === activeRoom) {
            displayMessage(data);
        } else {
            console.warn("Client: Message not displayed because it doesn't belong to the active room.");
        }
    });

}

function displayMessage(data) {
    const messageElement = document.createElement("div");

    // Tjek om beskeden er fra den aktuelle bruger
    if (data.senderId === currentUserId) {
        messageElement.classList.add("message", "mine");
    } else {
        messageElement.classList.add("message", "other");
    }

    messageElement.textContent = `[${new Date(data.sent_at).toLocaleString()}] ${data.sender}: ${data.message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll til bunden af chatten
}


async function sendMessage() {
    const activeUser = document.querySelector("#chat-list .active");

    if (!activeUser) {
        alert("Select a user from the list before sending a message.");
        return;
    }

    const recipient = activeUser.textContent;
    const recipientId = activeUser.dataset.userId;
    const message = messageInput.value.trim();

    if (!message) {
        alert("Message cannot be empty.");
        return;
    }

    const sent_at = new Date().toISOString();

    // Ryd beskedfeltet
    messageInput.value = "";

    // Socket.IO: Send beskeden i realtid
    socket.emit("new_message", {
        senderId: currentUserId,
        recipientId: recipientId,
        sender: currentUsername,
        recipient,
        message,
        sent_at,
    });

    // HTTP: Gem beskeden i databasen
    try {
        const response = await fetch("/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipientId: recipientId, message }),
        });

        if (!response.ok) {
            throw new Error(`Failed to save message: ${response.status}`);
        }

        console.log("Client: Message successfully saved in database.");
    } catch (error) {
        console.error("Client: Error saving message to database:", error);
    }
};


function joinRoom(recipientId) {
    const room = [currentUserId, recipientId].sort((a, b) => a - b).join("_");
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

                // Opdater activeRecipientId og join rummet med det samme
                activeRecipientId = result.user_id;
                joinRoom(activeRecipientId);

                // Indlæs samtalen og fremhæv brugeren
                loadConversation(activeRecipientId);
                highlightUser(result.username);
            };
            searchDropdown.appendChild(item);
        });

        renderChatList(results);

        searchDropdown.style.display = "none";
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

    chatList.addEventListener("click", (event) => {
        const listItem = event.target.closest("li");

        console.log(listItem.dataset.userId)
        if (listItem) {
            const recipientId = listItem.dataset.userId;

            activeRecipientId = recipientId; // Opdater den aktive modtager

            highlightUser(listItem.textContent);
            joinRoom(recipientId); // Brug recipientId til at oprette rummet
            loadConversation(recipientId); // Hent samtalen
        }
    });
}

// Hent brugeroplysninger og start processen
fetchCurrentUserInfo();

// Sender beskende ved klik
sendMessageButton.addEventListener("click", () => {
    sendMessage()
});

// Sender beskeden ved enter
messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});