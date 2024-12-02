async function initMap() {
  try {
      // Hent API-nøglen fra backend
      const response = await fetch('/api/maps-key');
      const data = await response.json();

      if (!data.apiKey) {
          console.error("API-nøgle mangler!");
          return;
      }

      // Dynamisk indlæsning af Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&callback=loadMap&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
  } catch (error) {
      console.error("Fejl ved indlæsning af API-nøgle:", error);
  }
}

function loadMap() {
  const mapDiv = document.getElementById('map');
  if (!mapDiv) {
      console.error("Kort-container ikke fundet!");
      return;
  }

  const map = new google.maps.Map(mapDiv, {
      center: { lat: 55.6761, lng: 12.5683 }, // Midlertidig standardlokation
      zoom: 12,
  });

  // Geolocation for brugeren
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          async (position) => {
              const userLocation = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
              };
              map.setCenter(userLocation);

              // Tilføj brugerens markør
              new google.maps.Marker({
                  position: userLocation,
                  map,
                  title: "Din placering",
                  icon: {
                      url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  },
              });

              // Søg efter Joe & The Juice-lokationer
              const service = new google.maps.places.PlacesService(map);
              service.nearbySearch(
                  {
                      location: userLocation,
                      radius: 5000, // Radius i meter
                      keyword: "Joe and the Juice", // Søgeord
                  },
                  (results, status) => {
                      if (status === google.maps.places.PlacesServiceStatus.OK) {
                          results.forEach((place) => {
                              // Opret en markør for hver lokation
                              const marker = new google.maps.Marker({
                                  position: place.geometry.location,
                                  map,
                                  title: place.name,
                              });

                              // Opret en InfoWindow til hver markør
                              const infoWindow = new google.maps.InfoWindow({
                                  content: `
                                      <div>
                                          <h3>${place.name}</h3>
                                          <p>${place.vicinity || 'Adresse ukendt'}</p>
                                          <p>Rating: ${place.rating || 'Ikke vurderet'}</p>
                                      </div>
                                  `,
                              });

                              // Åbn InfoWindow, når markøren klikkes
                              marker.addListener("click", () => {
                                  infoWindow.open(map, marker);
                              });
                          });
                      } else {
                          console.error("Ingen resultater fundet:", status);
                      }
                  }
              );
          },
          (error) => {
              console.error("Geolocation fejl:", error.message);
          }
      );
  } else {
      console.warn("Geolocation ikke understøttet af browseren.");
  }
}

// Initialiser kortet
initMap();
