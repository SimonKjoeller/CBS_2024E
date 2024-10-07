const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const app = express();

app.use(cors());
app.use("/static", express.static("public"));
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
    user: "copenhagenbusinessjoe@gmail.com",
    pass: "mzksmywihnpdjqjx",
  },
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/locations", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "locations.html"));
});

app.get("/res", (req, res) => {
  res.send("Response message from server");
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/cookie", (req, res) => {
  res.cookie("taste", "chocolate");
  res.send("Cookie set");
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
      from: sender,
      to: email,
      subject: subjectMsg,
      text: textMsg,
      html: htmlMsg,
    });
    console.log(email)
    res.json({ message: email });
  } catch (error) {
    console.log("lol")
  }

});
//const sender = "JOE <copenhagenbusinessjoe@gmail.com>";
const sender = "CBSJOE <cbsjoec@gmail.com>";

const subjectMsg = 'Betaling';
const textMsg = "test";
const htmlMsg = `test`
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
