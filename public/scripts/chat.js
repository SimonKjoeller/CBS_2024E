document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search");
    console.log(searchInput); // Skal vise elementet eller `null`

    const searchDropdown = document.getElementById("search-dropdown");
    const chatList = document.getElementById("chat-list");
    const sendMessageButton = document.getElementById("send-message");
    const chatMessages = document.getElementById("chat-messages");

    // Check if elements exist before adding event listeners
    if (searchInput && searchDropdown && chatList && sendMessageButton && chatMessages) {
        let typingTimeout;

        searchInput.addEventListener("input", () => {
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(searchChats, 300);
        });

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
            console.log(`Indlæser samtale med: ${recipient}`);
            try {
                const response = await fetch(`/chat/conversation/${recipient}`);
                if (!response.ok) {
                    throw new Error(`HTTP-fejl! Status: ${response.status}`);
                }
                const messages = await response.json();

                chatMessages.innerHTML = ""; // Ryd tidligere beskeder

                messages.forEach(msg => {
                    const messageElement = document.createElement("div");
                    messageElement.textContent = `[${msg.sent_at}] ${msg.sender}: ${msg.message}`;
                    chatMessages.appendChild(messageElement);
                });
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
            const messageInput = document.getElementById("new-message");
            const message = messageInput.value.trim();

            if (message === "") {
                alert("Beskeden må ikke være tom.");
                return;
            }

            sendMessage(recipient, message);
            messageInput.value = "";
        });

        async function sendMessage(recipient, message) {
            try {
                const response = await fetch("/chat/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ recipientUsername: recipient, message }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP-fejl! Status: ${response.status}`);
                }

                await loadConversation(recipient);
            } catch (error) {
                console.error("Fejl ved afsendelse af besked:", error);
            }
        }
    } else {
        console.error("En eller flere nødvendige elementer blev ikke fundet i DOM'en.");
    }
});
