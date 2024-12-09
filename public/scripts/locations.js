async function initMap() {
  try {
    const response = await fetch('/api/maps-key');
    const data = await response.json();

    if (!data.apiKey) {
      console.error("API key missing!");
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&callback=loadMap&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  } catch (error) {
    console.error("Error loading API key:", error);
  }
}

function loadMap() {
  const mapDiv = document.getElementById('map');
  const listDiv = document.getElementById('location-results');

  if (!mapDiv) {
    console.error("Map container not found!");
    return;
  }

  const map = new google.maps.Map(mapDiv, {
    center: { lat: 55.6761, lng: 12.5683 }, // Copenhagen
    zoom: 12,
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        map.setCenter(userLocation);

        new google.maps.Marker({
          position: userLocation,
          map,
          title: "Your Location",
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          },
        });

        searchNearby(userLocation, map, listDiv);
      },
      (error) => {
        console.error("Geolocation error:", error.message);
      }
    );
  }
}

function searchNearby(location, map, listDiv) {
  const service = new google.maps.places.PlacesService(map);

  service.nearbySearch(
    {
      location: location,
      radius: 10000, // 10 km
      keyword: "Joe and the Juice",
    },
    (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        const sortedResults = results.sort((a, b) => {
          const distanceA = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(location),
            a.geometry.location
          );
          const distanceB = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(location),
            b.geometry.location
          );
          return distanceA - distanceB;
        });

        populateLocations(sortedResults, map, listDiv, location);
      } else {
        console.error("No results found:", status);
      }
    }
  );
}

function populateLocations(results, map, listDiv, userLocation) {
  listDiv.innerHTML = "";

  const now = new Date();
  const currentHour = now.getHours();

  results.forEach((place) => {
    const marker = new google.maps.Marker({
      position: place.geometry.location,
      map,
      title: place.vicinity,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <h3>${place.vicinity || "Address unknown"}</h3>
        <p>Rating: ${place.rating || "Not rated"}</p>
      `,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(userLocation),
      place.geometry.location
    );

    // Determine if the location is open
    const isOpen = currentHour >= 9 && currentHour <= 21;
    const openStatus = isOpen
      ? `<span style="color: green; font-weight: bold;">Open</span>`
      : `<span style="color: red; font-weight: bold;">Closed</span>`;

    const listItem = document.createElement("div");
    listItem.className = "location-item";
    listItem.innerHTML = `
      <div class="location-title"><strong>${place.vicinity || "Address unknown"}</strong></div>
      <div class="location-distance">${(distance / 1000).toFixed(2)} km away</div>
      <div>${openStatus}</div>
    `;
    listItem.addEventListener("click", () => {
      map.setCenter(place.geometry.location);
      map.setZoom(15);
      infoWindow.open(map, marker);
    });

    listDiv.appendChild(listItem);
  });
}

function filterLocations() {
  const searchValue = document.getElementById('search-box').value.toLowerCase();
  const allLocations = document.querySelectorAll('.location-item');

  allLocations.forEach((location) => {
    const locationName = location.querySelector('.location-title').textContent.toLowerCase();
    location.style.display = locationName.includes(searchValue) ? "block" : "none";
  });
}

initMap();