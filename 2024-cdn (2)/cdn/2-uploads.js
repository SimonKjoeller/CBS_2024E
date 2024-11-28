const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "", // cloud_name
  api_key: "", // api_key
  api_secret: "", // api_secret
  secure: true,
});

async function getUploads(folder, type) {
  try {
    const result = await cloudinary.api.resources({
      prefix: folder,
      type: "upload",
      resource_type: type,
    });
    console.log(result.resources);
  } catch (error) {
    console.error("Error fetching images from folder:", error);
  }
}

// Øvelse 2 - Hent alle uploads fra en mappe ud fra en filtype
// Type af uploads er sat til "auto" men er "image" eller "video"
// Kald funktionen getUploads() med folder og type som argumenter