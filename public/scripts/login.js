const emailInputDom = document.getElementById('emailInput');
const passwordInputDom = document.getElementById('passwordInput');

async function login() {
    try {
        // Fetch POST request for /login endpoint og vent på responsen
        const response = await fetch('/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInputDom.value, password: passwordInputDom.value }),
        });

        // Hvis responsen ikke er ok, så sender vi en fejl
        if (!response.ok) {
            throw new Error(`HTTP status code ${response.status}`);
        }

        // VEd sucess så redirecter vi til main siden
        if (response.ok) {
            const data = await response.json();
            if (data.message === "Du er logget ind!") {
                window.location.href = `https://cbsjoe.live/`; // Redirect efter login
            }
        }
    } catch (error) {
        console.log(error);
        alert('Wrong password. Try again!');
    }
}

// Lyt efter 'Enter'-tasten
emailInputDom.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        login();
    }
});

passwordInputDom.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // 
        login();
    }
});