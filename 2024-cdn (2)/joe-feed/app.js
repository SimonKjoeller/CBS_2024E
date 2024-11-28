const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const responseTime = require("response-time");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fsPromises = require("fs").promises;
const sqlite3 = require("sqlite3").verbose();
const app = express();

// Middleware
app.use(cors());
app.use("/static", express.static("public"));
app.use(cookieParser());
app.use(express.json());
app.use(responseTime());

// Opsæt multer til at midlertidigt opbevare billedfiler inden de uploades til Cloudinary
// Link: https://www.npmjs.com/package/multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// SQLite3 er en database, der gemmer data i en fil
// Link: https://www.npmjs.com/package/sqlite3
const db = new sqlite3.Database("./db.sqlite");

// Link: https://www.sqlitetutorial.net/sqlite-nodejs/
// Link: https://www.sqlitetutorial.net/sqlite-nodejs/connect/
// Link: https://www.sqlitetutorial.net/sqlite-nodejs/query/
// Link: https://www.sqlitetutorial.net/sqlite-nodejs/insert/
// Link: https://www.sqlitetutorial.net/sqlite-nodejs/update/
// Link: https://www.sqlitetutorial.net/sqlite-nodejs/delete/

// Opretter SQLite tabel som indeholder primærnøgle id, url, tidspunkt og caption
// Hvis filen db.sqlite ikke eksisterer, oprettes den
// Hvis tabellen images ikke eksisterer, oprettes den
// Hvis tabellen images eksisterer, sker der intet
// Installer extension SQLite Viewer i Visual Studio Code for at åbne .sqlite filer
db.serialize(() => {
    db.run(
      "CREATE TABLE if not exists uploads (id integer primary key, url text not null, datetime integer, caption text)"
    );
  });

// Funktion til at køre en SQLite "run" query
const runQuery = (query, params) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

// Funktion til at køre en SQLite "all" query
const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
      if (error) {
        reject(error);
      } else {
        resolve(rows);
      }
    });
  });
};

// Konfigurer med dine Cloudinary nøgler
// Link: https://cloudinary.com/documentation/node_integration
// Link: https://www.npmjs.com/package/cloudinary
// Find nøgler her: https://console.cloudinary.com/console/
cloudinary.config({
  cloud_name: "", // cloud_name
  api_key: "", // api_key
  api_secret: "", // api_secret
  secure: true,
});

// Route til at håndtere index side
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route til at håndtere upload af billeder
app.post("/api/upload", upload.single("image"), async (req, res, next) => {
  try {
    // Tilgå image buffer
    const imageBuffer = req.file.buffer;
    const caption = req.body.caption;
    const tmpFilePath = "./public/img/" + req.file.originalname;

    // Lav en midlertidig billedfil med image buffer
    await fsPromises.writeFile(tmpFilePath, imageBuffer);

    // Definere hvilken mappe på Cloudinary der skal uploades til
    const uploadOptions = {
      public_id: "cdn-example/" + req.file.originalname.split(".")[0],
      resource_type: "auto",
    };

    try {
      // Uploader billedfilen til Cloudinary i mappen
      const result = await cloudinary.uploader.upload(
        tmpFilePath,
        uploadOptions
      );
      // Sletter den midlertidige billedfil
      await fsPromises.unlink(tmpFilePath);
      // Tilføjer en række i databasen med url, tidspunkt og caption
      await runQuery(
        "INSERT INTO uploads (url, datetime, caption) VALUES (?, ?, ?)",
        [result.secure_url, Date.now(), caption]
      );
      console.log(result);
      // Returnerer URL for billedet på Cloudinary
      res.status(200).json({ uploadUrl: result.secure_url });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "File upload to Cloudinary failed." });
    }
  } catch (error) {
    console.error(`Error `, error.message);
    return res.status(500).json(error);
  }
});

// Route for at returnere uploads fra databasen i JSON
app.get("/api/uploads", async (req, res) => {
  try {
    const uploads = await allQuery("SELECT * FROM uploads");
    res.json({ uploads });
  } catch (error) {
    console.error(`Error: `, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Lyt på port 4000
app.listen(4000, () => {
  console.log("Server listening on port 4000");
});
