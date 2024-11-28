const emailInput = document.getElementById('emailInput');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const phoneInput = document.getElementById('phoneInput');
const otpInput = document.getElementById('otpInput');
const signupBox = document.getElementById('signupBox');
const otpBox = document.getElementById('otpBox');
const countryButton = document.getElementById('countryButton');
const countryDropdown = document.getElementById('countryDropdown');

countryButton.addEventListener('click', () => {
    countryDropdown.classList.toggle('show');
});

document.querySelectorAll('.country-option').forEach((option) => {
    option.addEventListener('click', (e) => {
        const selectedText = e.target.textContent.trim();
        countryButton.querySelector('span').textContent = selectedText;

        // Luk dropdown
        countryDropdown.classList.remove('show');
    });
});

function validatePhoneNumberByCountry(countryCode, phoneNumber) {
    // Rens nummeret
    const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Definer gyldige længder for hvert land
    const validLengths = {
        45: 8,  // Danmark
        1: 10,  // USA
        46: 10, // Sverige
        47: 8,  // Norge
        49: 10, // Tyskland
    };

    // Tjek om længden passer til det valgte land
    return cleanedNumber.length === validLengths[countryCode];
}

async function signup() {
    try {
        // Hent landekode fra dropdown
        const countryCode = parseInt(document.getElementById('countryInput').value, 10);
        const phoneNumber = phoneInput.value;

        // Validér telefonnummeret
        if (!validatePhoneNumberByCountry(countryCode, phoneNumber)) {
            alert('Telefonnummeret er ikke gyldigt for det valgte land!');
            return; // Stop signup-processen
        }

        // Send data til serveren
        const response = await fetch('/users/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailInput.value,
                username: usernameInput.value,
                password: passwordInput.value,
                phone: `${countryCode}${phoneNumber}`, // Kombinér landekode og nummer
            }),
        });

        if (!response.ok) throw new Error('Signup failed');

        const data = await response.json();
        console.log(data.message);

        // Vis OTP-box og skjul signup-box
        signupBox.style.display = 'none';
        otpBox.style.display = 'block';
    } catch (error) {
        console.error(error.message);
    }
}


async function verify() {
    const email = document.getElementById('emailInput').value; // Hent email fra inputfeltet
    const otp = document.getElementById('otpInput').value; // Hent OTP fra inputfeltet

    try {
        const response = await fetch('/users/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp }),
        });

        if (!response.ok) throw new Error('Verification failed');

        const data = await response.json();
        console.log(data.message);

        alert('Verification successful! Redirecting to login.');
        window.location.href = '/login';
    } catch (error) {
        console.error(error.message);
    }
}
