function toggleChat() {
  const chatPopup = document.getElementById("chat-popup");
  const chatMessages = document.getElementById("chat-messages");

  if (chatPopup.style.display === "block") {
      chatPopup.style.display = "none";
  } else {
      chatPopup.style.display = "block";

      if (chatMessages.children.length === 0) {
          // Send velkomstbesked kun én gang
          addMessage("Chatbot", "Velkommen til Joe & The Juice! Hvordan kan jeg hjælpe dig?");
      }
  }
}

function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();

  if (message) {
      addMessage("Du", message);

      // Simuler skrivende indikator
      showTypingIndicator();

      setTimeout(async () => {
          try {
              const response = await fetch("/chatbot", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ message }),
              });
              const data = await response.json();

              removeTypingIndicator();
              if (data && data.response) {
                  addMessage("Chatbot", data.response);
              } else {
                  addMessage("Chatbot", "Beklager, jeg kan ikke svare på det lige nu.");
              }
          } catch (error) {
              console.error("Fejl med API:", error);
              removeTypingIndicator();
              addMessage("Chatbot", "Der opstod en fejl, prøv igen senere!");
          }
      }, 1000);

      input.value = ""; // Tøm inputfeltet
  }
}

function addMessage(sender, message) {
  const messages = document.getElementById("chat-messages");
  const newMessage = document.createElement("div");
  const avatarUrl = sender === "Du" ? "/img/brugere.png" : "/img/chatbot.png";

  newMessage.className = sender === "Du" ? "user-message" : "chatbot-message";
  newMessage.innerHTML = `
      <div class="message-content">
          <div class="avatar"><img src="${avatarUrl}" alt="${sender}"></div>
          <div>
              <strong>${sender}:</strong>
              <p>${message}</p>
          </div>
      </div>
  `;

  messages.appendChild(newMessage);
  messages.scrollTop = messages.scrollHeight; // Scroll til bunden
}

function showTypingIndicator() {
  const messages = document.getElementById("chat-messages");
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "chatbot-message";
  typingIndicator.id = "typing-indicator";
  typingIndicator.innerHTML = `
      <div class="message-content">
          <div class="avatar"><img src="/img/chatbot.png" alt="Chatbot"></div>
          <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
          </div>
      </div>
  `;

  messages.appendChild(typingIndicator);
  messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) typingIndicator.remove();
}