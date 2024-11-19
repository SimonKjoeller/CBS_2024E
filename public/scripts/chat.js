// Forbind til Socket.io over HTTPS
const socket = io.connect('https://cbsjoe.live'); // Sørg for, at URL bruger HTTPS

const searchInput = document.getElementById("search");
const searchDropdown = document.getElementById("search-dropdown");
const chatList = document.getElementById("chat-list");
const sendMessageButton = document.getElementById("send-message");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("new-message");

let currentUsername;

// Funktion til at hente det autentificerede brugernavn
async function fetchCurrentUsername() {
    try {
        const response = await fetch("/chat/currentUser", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error(`HTTP-fejl! Status: ${response.status}`);
        }

        const data = await response.json();
        currentUsername = data.username;
        console.log("Autentificeret brugernavn:", currentUsername);
    } catch (error) {
        console.error("Fejl ved hentning af brugernavn:", error);
    }
}

// Hent brugernavnet, når applikationen starter
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
                throw new Error(`HTTP-fejl! Status: ${response.status}`);
            }

            const data = await response.json();
            displaySearchResults(data);
        } catch (error) {
            console.error("Fejl ved søgning efter modtagere:", error);
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
        try {
            const response = await fetch(`/chat/conversation/${recipient}`);
            if (!response.ok) {
                throw new Error(`HTTP-fejl! Status: ${response.status}`);
            }

            const messages = await response.json();

            chatMessages.innerHTML = ""; // Ryd tidligere beskeder

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

            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll automatisk til bunden
        } catch (error) {
            console.error("Fejl ved indlæsning af samtale:", error);
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
            alert("Vælg en bruger fra listen, før du sender en besked.");
            return;
        }

        const recipient = activeUser.textContent;
        const message = messageInput.value.trim();

        if (message === "") {
            alert("Beskeden må ikke være tom.");
            return;
        }

        const sent_at = new Date().toISOString();

        // Gem besked og send via Socket.IO
        socket.emit("new_message", {
            sender: currentUsername,
            recipient,
            message,
            sent_at,
        });

        messageInput.value = ""; // Ryd inputfeltet
    });

    socket.on("new_message", (data) => {
        console.log("Modtaget ny besked:", data);

        const activeUser = document.querySelector("#chat-list .active");
        if (activeUser && (data.sender === activeUser.textContent || data.recipient === activeUser.textContent)) {
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");

            if (data.sender === currentUsername) {
                messageElement.classList.add("mine");
            } else {
                messageElement.classList.add("other");
            }

            messageElement.textContent = `[${new Date(data.sent_at).toLocaleString()}] ${data.sender}: ${data.message}`;
            chatMessages.appendChild(messageElement);

            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll til bunden
        }
    });
} else {
    console.error("En eller flere nødvendige elementer blev ikke fundet i DOM'en.");
}
