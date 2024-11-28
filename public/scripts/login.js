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

        // Hvis responsen ikke er OK, kast en fejl
        if (!response.ok) {
            throw new Error(`HTTP status code ${response.status}`);
        }

        // Succes - redirect til hovedsiden
        if (response.ok) {
            const data = await response.json();
            window.location.href = `https://cbsjoe.live/shakes`; // Redirect efter login
            console.log(data);
        }
    } catch (error) {
        console.log(error);
    }
}