document.getElementById("logOut").addEventListener("click", async () => {
    try {
        // Lav en anmodning til serveren for at slette cookien
        const response = await fetch('/users/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Sørger for at inkludere cookies
        });

        if (response.ok) {
            alert("Du er nu logget ud!");
            // Redirect brugeren til login-siden
            window.location.href = "/login";
        } else {
            throw new Error("Logud fejlede.");
        }
    } catch (error) {
        console.error("Fejl under logud:", error);
        alert("Noget gik galt. Prøv igen.");
    }
});