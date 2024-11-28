const responseDom = document.getElementById("response");
const cookieDom = document.getElementById("cookie");
const locationDom = document.getElementById("location");
const latlongDom = document.getElementById("latlong");
const weatherDom = document.getElementById("weather");
const emailDom = document.getElementById("email");
const emailInputDom = document.getElementById('emailInput');
const usernameInputDom = document.getElementById('usernameInput');
const passwordInputDom = document.getElementById('passwordInput');
const loginDom = document.getElementById('login');
const responseTimeDom = document.getElementById('responseTimeValue');

if (window.location.pathname === "/") {
  // displayProducts(); 
}

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

async function fetchProducts() {
  try {
    const response = await fetch('/products');
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    productList = await response.json(); 
    return productList;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

async function displayProducts() {
  await fetchProducts();  
  const productContainer = document.getElementById("product-list");

  productContainer.innerHTML = ""; 

  productList.forEach((product, index) => {
    const productItem = document.createElement("div");
    productItem.classList.add("product-item");

    const img = document.createElement("img");
    img.src = product.imgsrc;  
    img.alt = product.productName;

    const productName = document.createElement("h3");
    productName.innerText = product.productName;

    productItem.appendChild(img);
    productItem.appendChild(productName);
    productContainer.appendChild(productItem);
  });
}


// async funktion med await
async function login() {
  // try catch blok
  try {
    // fetch POST request for /email endpoint og await responsen
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: usernameInputDom.value, password: passwordInputDom.value }),
    });

    // hvis responsen ikke er ok, kast en fejl
    if (!response.ok) {
      throw new Error(`HTTP statuskode ${response.status}`);
    }

    // håndter succes
    if (response.ok) {
      const data = await response.json();
      console.log(data);
      location.href = "/protected";
    }

} catch (error) {
    // håndter fejl
    console.log(error);
    loginDom.innerHTML = `<p>Fejl: ${error.message}</p>`;
  }
}


document.addEventListener('DOMContentLoaded', function () {
  // Send a GET request using the fetch API
  fetch('/', {
      method: 'GET',
      headers: {
          'Cache-Control': 'no-cache',
      },
  })
      .then((response) => {
          // Get the value of the X-Response-Time header
          const responseTimeHeader = response.headers.get('X-Response-Time');

          // Display the header value in the paragraph
          responseTimeDom.innerHTML = `X-Response-Time: ${responseTimeHeader}`;
      })
      .catch((error) => {

          console.error('Error:', error);
      });
});


function createUploadElement(uuid, imageUrl, caption) {
  const obj = document.createElement('div')
  const img = document.createElement('img')
  const path = `${imageUrl}`
  obj.id = `${uuid}`
  obj.className = 'post'
  img.src = path
  img.className = 'img'
  
  const captionElement = document.createElement('p')
  captionElement.innerText = '#' + caption

  const uploadContainer = document.getElementById('uploads')
  uploadContainer.appendChild(obj)
  document.getElementById(`${uuid}`).appendChild(img)
  document.getElementById(`${uuid}`).appendChild(captionElement)
}

async function getUploads() {
  const response = await fetch('http://localhost:4000/api/uploads', {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json'
      },
  });
  
  if (response.status !== 200) {
      throw new Error('returned status code ' + response.status);
  }

  const jsonBody = await response.json()
  return jsonBody.uploads
}

async function main() {
  const uploads = await getUploads()
  uploads.forEach(upload => {
      createUploadElement(upload.datetime, upload.url, upload.caption)
  });
}

document.addEventListener("DOMContentLoaded", (event) => {
  main()
});