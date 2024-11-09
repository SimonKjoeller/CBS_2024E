const express = require("express");
const cors = require("cors");
const path = require("path");

const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const userRoutes = require("./route/users");
const app = express();

const checkAuth = (req, res, next) => {

  console.log(req.cookies.isLoggedIn)
  console.log(req.cookies)
  if (req.cookies.isLoggedIn === "true") {
    next(); // Brugeren er logget ind, fortsæt til næste middleware/rute
  } else {
    // Redirecter til /login
    res.redirect('/login');
  }
};

// Anvend checkAuth middleware på beskyttede ruter
app.get("/protected", checkAuth, (req, res) => {
  res.send("This is a protected route. You are logged in!");
});



app.use(cors());
//app.use("/static", express.static("public"));
app.use(express.static(path.join(__dirname, "../public")));
app.use((req, res, next) => {
  console.log("----- HTTP Request -----");
  console.log(`Method: ${req.method}`); // HTTP Method
  console.log(`URL: ${req.originalUrl}`); // Requested URL
  console.log("Headers:", req.headers); // Request Headers
  console.log(`IP: ${req.ip}`); // IP Address
  console.log("------------------------");
  next();
});
app.use(cookieParser());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "cbsjoec@gmail.com",
    pass: "ozyurwjboabzrqek",
  },
});



app.get("/", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/index.html"));
});

app.get("/locations", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/locations.html"));
});

app.get("/res", (req, res) => {
  res.send("Response message from server");
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/login.html"));
});

app.get("/cookie", (req, res) => {
  res.cookie("taste", "chocolate");
  res.send("Cookie set");
});

app.get("/culture", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/culture.html"));
});





// Opgave 2: Lav et POST /email asynkront endpoint der sender en email til modtageren

// Tag imod modtagerens emailadresse i req.body og lav try catch for at sende email
// Brug console.log(req.body) for at se indholdet af req.body og få fat i emailadressen
// Link til dokumentation: https://expressjs.com/en/api.html#req.body

// Send svar tilbage til klienten om at emailen er sendt med res.json og et message objekt
// Link til dokumentation: https://expressjs.com/en/api.html#res.json
app.post("/email", async (req, res) => {

  try {
    let { email } = req.body
    console.log(email)

    const info = await transporter.sendMail({
      from: "CBSJOE <cbsjoec@gmail.com>",
      to: email,
      subject: 'Joe & The Juice',
      text: "Joe & The Juice",
      html: `<div style="font-family: Arial, sans-serif; color: #333;">
    <h1>Joe & The Juice</h1>
    
    <p>Tak fordi du er en del af vores fællesskab!</p>
    <img src="https://seeklogo.com/images/J/joe-and-the-juice-logo-8D32BBD87A-seeklogo.com.png" alt="Joe & The Juice logo" style="width: 150px; height: auto; margin-bottom: 20px;">
    <footer style="font-size: 12px; color: #888;">
      <p>Joe & The Juice</p>
      <p>Adresse: Se web</p>
      <p>Afmeld nyhedsbrevet <a href="https://joeandthejuice.com/unsubscribe">her</a></p>
    </footer>
  </div>`,
    });
    console.log(email)
    res.json({ message: email });
  } catch (error) {
    console.log("lol")
  }

});


app.use("/users", userRoutes);


app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
