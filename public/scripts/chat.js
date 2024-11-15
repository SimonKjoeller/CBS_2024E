const searchInput = document.getElementById("search");
const searchDropdown = document.getElementById("search-dropdown");
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
        visSøgeresultater(data.slice(0, 4)); // Begræns til 4 resultater
    } catch (error) {
        console.error("Fejl ved søgning efter modtagere:", error);
    }
}

function visSøgeresultater(resultater) {
    searchDropdown.innerHTML = "";
    if (resultater.length === 0) {
        searchDropdown.style.display = "none";
        return;
    }

    resultater.forEach(resultat => {
        const item = document.createElement("div");
        item.textContent = resultat.username;
        item.classList.add("dropdown-item");
        item.onclick = () => {
            searchInput.value = resultat.username;
            searchDropdown.style.display = "none";
        };
        searchDropdown.appendChild(item);
    });

    searchDropdown.style.display = "block";
}
