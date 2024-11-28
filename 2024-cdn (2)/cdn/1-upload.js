const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "", // cloud_name
  api_key: "", // api_key
  api_secret: "", // api_secret
  secure: true,
});

async function upload(file) {
  const uploadOptions = {
    public_id: "cdn-example/" + file.split(".")[0],
    resource_type: "auto",
  };
  try {
    const result = await cloudinary.uploader.upload(file, uploadOptions);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

// Øvelse 1 - Upload et billede og en video til Cloudinary
// Lav ´npm install´ for at installere dependencies
// Log in en bruger på Cloudinary og find cloud_name, api_key og api_secret
// Kald funktionen upload() med filnavne "cbs.jpeg" og "cbs.mp4" som argument
// Kig i console.log for at finde URL for uploadede filer