const responseDom = document.getElementById("response");
const cookieDom = document.getElementById("cookie");
const locationDom = document.getElementById("location");
const latlongDom = document.getElementById("latlong");
const weatherDom = document.getElementById("weather");
const emailDom = document.getElementById("email");


// async funktion med await
async function getResponse() {
  // try catch blok
  try {
    // fetch data fra /res endpoint og await responsen
    const response = await fetch('/res');

    // hvis responsen ikke er ok, kast en fejl
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // konverter responsen til tekst
    const data = await response.text();

    // håndter succes
    console.log(data);
    responseDom.innerHTML = data;
  } catch (error) {
    // håndter fejl
    console.log(error);
    responseDom.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

// async funktion med await
async function setCookie() {
  // try catch blok
  try {
    // fetch data fra /res endpoint og await responsen
    const response = await fetch('/cookie');

    // hvis responsen ikke er ok, kast en fejl
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // konverter responsen til tekst
    const value = await response.text();

    // håndter succes
    console.log(value);
    cookieDom.innerHTML = value;
  } catch (error) {
    // håndter fejl
    console.log(error);
    cookieDom.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

// funktion til at hente placering
async function getLocation() {
  const dropdown = document.getElementById('locationDropdown');
  const selectedLocation = dropdown.options[dropdown.selectedIndex].text;
  locationDom.innerHTML = `Your location is ${selectedLocation}`;
  document.cookie = `location=${selectedLocation}; path=/;`;
  await getLatLong(selectedLocation);
}

// async funktion med await
async function getLatLong(locationName) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&addressdetails=1`;
  // try catch blok
  try {
    // fetch data fra /res endpoint og await responsen
    const response = await fetch(url);

    // hvis responsen ikke er ok, kast en fejl
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // konverter responsen til json
    const data = await response.json();

    // håndter succes
    if (data.length > 0) {
      console.log(data);
      latlongDom.innerHTML = `Latitude: ${data[0].lat}, Longitude: ${data[0].lon}`;
      await getWeather(data[0].lat, data[0].lon);
    } else {
      throw new Error('No results found');
    }
  } catch (error) {
    // håndter fejl
    console.log(error);
    latlongDom.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

// async funktion med await
async function getWeather(lat, long) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current_weather=true`;
  // try catch blok
  try {
    // fetch data fra /res endpoint og await responsen
    const response = await fetch(url);

    // hvis responsen ikke er ok, kast en fejl
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // konverter responsen til json
    const data = await response.json();

    // håndter succes
    console.log(data);
    weatherDom.innerHTML = `Temperature: ${data.current_weather.temperature}°`;
  } catch (error) {
    // håndter fejl
    console.log(error);
    weatherDom.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

// Opgave 2: Lav et fetch POST request til /email endpoint
// Hint: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#making_post_requests

// async funktion med await
async function sendEmail() {
  // try catch blok
  try {
    // fetch POST request for /email endpoint og await responsen
    const response = await fetch('/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: emailInputDom.value }),
    });

    // hvis responsen ikke er ok, kast en fejl
    if (!response.ok) {
      throw new Error(`HTTP statuskode ${response.status}`);
    }

    // håndter succes
    if (response.ok) {
      const data = await response.json();
      console.log(data);
      emailDom.innerHTML = data.message;
    }

  } catch (error) {
    // håndter fejl
    console.log(error);
    emailDom.innerHTML = `<p>Fejl: ${error.message}</p>`;
  }
}


// styling //
document.addEventListener("DOMContentLoaded", () => {
  const phrases = [
    "Fresh Juices for Every Mood",
    "Handcrafted Coffee, Always",
    "Vibes You’ll Remember",
    "Good Energy, Great Food",
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  const typingSpeed = 100;
  const delayBetweenPhrases = 2000;

  const dynamicText = document.querySelector(".dynamic-text");

  function type() {
    if (charIndex < phrases[phraseIndex].length) {
      dynamicText.textContent += phrases[phraseIndex].charAt(charIndex);
      charIndex++;
      setTimeout(type, typingSpeed);
    } else {
      setTimeout(deletePhrase, delayBetweenPhrases);
    }
  }

  function deletePhrase() {
    if (charIndex > 0) {
      dynamicText.textContent = phrases[phraseIndex].substring(0, charIndex - 1);
      charIndex--;
      setTimeout(deletePhrase, typingSpeed);
    } else {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setTimeout(type, typingSpeed);
    }
  }

  type();
});

async function sendEmail() {
  const emailInputDom = document.getElementById("emailInput");
  const emailDom = document.getElementById("email");

  try {
    const response = await fetch('/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: emailInputDom.value }),
    });

    const data = await response.json();

    // Vis besked til brugeren
    emailDom.innerHTML = `<p>${data.message}</p>`;
  } catch (error) {
    console.error("Fejl ved tilmelding:", error);
    emailDom.innerHTML = `<p>Der opstod en fejl: ${error.message}</p>`;
  }
}
