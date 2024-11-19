// Forbind til Socket.io over HTTPS
const socket = io.connect('https://cbsjoe.live'); // Sørg for, at URL bruger HTTPS

const searchInput = document.getElementById("search");
const searchDropdown = document.getElementById("search-dropdown");
const chatList = document.getElementById("chat-list");
const sendMessageButton = document.getElementById("send-message");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("new-message");

// Check if elements exist before adding event listeners
if (searchInput && searchDropdown && chatList && sendMessageButton && chatMessages && messageInput) {
    let typingTimeout;

    // Lytter på input og opdaterer søgning efter en timeout
    searchInput.addEventListener("input", () => {
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(searchChats, 300);
    });

    // Funktion til at søge efter brugere
    async function searchChats() {
        const query = searchInput.value;
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
            displaySearchResults(data.slice(0, 4));
        } catch (error) {
            console.error("Fejl ved søgning efter modtagere:", error);
        }
    }

    // Funktion til at vise søgeresultater
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

    // Funktion til at tilføje chat-brugere til listen
    function addChatUser(username) {
        const existingUser = Array.from(chatList.children).find(li => li.textContent === username);
        if (!existingUser) {
            const listItem = document.createElement("li");
            listItem.textContent = username;
            chatList.appendChild(listItem);
        }
    }

    // Funktion til at fremhæve den aktive bruger
    function highlightUser(username) {
        Array.from(chatList.children).forEach(user => {
            user.classList.toggle("active", user.textContent === username);
        });
    }

    // Funktion til at indlæse en samtale med en bruger
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

                // Tjek om afsenderen er dig eller modtageren
                if (msg.sender === 'your_username') {  // Erstat 'your_username' med den rigtige betingelse for din bruger
                    messageElement.classList.add("mine");
                } else {
                    messageElement.classList.add("other");
                }

                messageElement.textContent = `[${msg.sent_at}] ${msg.sender}: ${msg.message}`;
                chatMessages.appendChild(messageElement);
            });

            // Scroll automatisk til bunden af chatten
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            console.error("Fejl ved indlæsning af samtale:", error);
        }
    }

    // Lytter efter klik på en bruger for at vise deres samtale
    chatList.addEventListener("click", (event) => {
        const listItem = event.target.closest("li");

        if (listItem) {
            const recipient = listItem.textContent;
            highlightUser(recipient);
            loadConversation(recipient);
        }
    });

    // Sender en besked til en valgt bruger
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

        // Send beskeden til serveren via Socket.IO
        socket.emit("new_message", {
            sender: "your_username", // Erstat med din brugeridentitet
            recipient,
            message,
            sent_at: new Date().toISOString(),
        });

        // Ryd inputfeltet
        messageInput.value = "";
    });

    // Lyt efter beskeder fra serveren via Socket.IO
    socket.on("new_message", (data) => {
        console.log("Modtaget ny besked:", data);

        // Hvis beskeden er fra eller til den aktive bruger, tilføj den til chatten
        const activeUser = document.querySelector("#chat-list .active");
        if (activeUser && (data.sender === activeUser.textContent || data.recipient === activeUser.textContent)) {
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");

            if (data.sender === 'your_username') {
                messageElement.classList.add("mine");
            } else {
                messageElement.classList.add("other");
            }

            messageElement.textContent = `[${data.sent_at}] ${data.sender}: ${data.message}`;
            chatMessages.appendChild(messageElement);

            // Scroll til bunden af chatten
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });

} else {
    console.error("En eller flere nødvendige elementer blev ikke fundet i DOM'en.");
}
