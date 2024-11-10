const recipient = document.getElementById("recipient");

// Variabel til at holde styr på den sidste timeout
let typingTimeout;

recipient.addEventListener("input", () => {
    // Hvis der allerede er en timeout aktiv, så ryd den
    clearTimeout(typingTimeout);

    // Sæt en ny timeout med 0,3 sekunders forsinkelse
    typingTimeout = setTimeout(findRecipient, 300);
});

// async funktion med await
async function findRecipient() {
    // try catch blok
    try {
        console.log(recipient)
        console.log(recipient.value)
        // fetch data fra /res endpoint og await responsen
        const response = await fetch('/chat/recipient', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: recipient.value }),
        });

        // hvis responsen ikke er ok, kast en fejl
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // konverter responsen til tekst
        const data = await response.text();

        // håndter succes
        console.log(data);
    } catch (error) {
        // håndter fejl
        console.log(error);
        responseDom.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

