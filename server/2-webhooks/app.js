const twilio = require("twilio");
const app = require("express")();
const bodyParser = require("body-parser");
require('dotenv').config();

// Twilio API nøgler
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Twilio client til afsendelse af velkomstbesked
const client = require("twilio")(accountSid, authToken);

// Twilio responses til webhook for opkald og beskeder
const VoiceResponse = require("twilio").twiml.VoiceResponse;
const MessagingResponse = require("twilio").twiml.MessagingResponse;

app.use(bodyParser.urlencoded({ extended: false }));

// Endpoint for at sende velkomstbesked
app.get("/welcome/dk/:phone", async (req, res) => {
  const phoneNumber = req.params.phone;
  try {
    const message = await client.messages.create({
      body: "Velkommen til JOE. I dag er der tilbud på Juicen.",
      from: "+1 985 297 5619",
      to: "+45" + phoneNumber,
    });
    console.log(message);
    res.status(200).send("Besked sendt til telefonnummeret +45 " + phoneNumber);
  } catch (error) {
    console.error("Fejl i håndtering af SMS: ", error);
    res.status(500).send("Der skete en fejl i håndteringen af SMS");
  }
});

// Endpoint for at lave opkald
app.get("/call/dk/:phone", async (req, res) => {
  const phoneNumber = req.params.phone;
  try {
    call = await client.calls.create({
      from: "+xxxx",
      to: "+45" + phoneNumber,
      twiml:
        "<Response><Say>Hello this is Joe and The Juice calling. Today we have a special offer on juice for you.</Say></Response>",
    });
    console.log(call);
    res.status(200).send("Opkald foretaget til telefonnummeret +45 " + phoneNumber);
  } catch (error) {
    console.error("Fejl i håndtering af opkaldet: ", error);
    res.status(500).send("Der skete en fejl i håndteringen af opkaldet");
  }
});

// Endpoint for webhook til opkald
app.post("/voice", twilio.webhook({ validate: false }), (req, res) => {
  const twiml = new VoiceResponse();

  console.log(req.body);

  twiml.say(
    `Thanks for calling! Your phone number is ${req.body.From}. I got your call because of Twilio´s webhook. Goodbye from JOE and The Juice!`
  );

  res.type("text/xml").send(twiml.toString());
});

// Endpoint for webhook til SMS beskeder
app.post("/sms", twilio.webhook({ validate: false }), (req, res) => {
  const twiml = new MessagingResponse();

  console.log(req.body);
  console.log("From: ", req.body.From);
  console.log("Country: ", req.body.FromCountry);
  console.log("Message: ", req.body.Body);

  if (req.body.Body.toLowerCase() === "hej") {
    twiml.message("Hej og goddag");
  } else if (req.body.Body.toLowerCase() === "farvel") {
    twiml.message("Farvel og god dag");
  } else {
    twiml.message(`Det her er en SMS webhook. Vil du have en ven svar "hej" tilbage og "farvel" når I har snakket.`);
  }

  res.type("text/xml").send(twiml.toString());
});

// Endpoint for webhook til WhatsApp beskeder
app.post("/whatsapp", twilio.webhook({ validate: false }), (req, res) => {
  const twiml = new MessagingResponse();

  console.log(req.body);
  console.log("From: ", req.body.From);
  console.log("Message: ", req.body.Body);

  if (req.body.Body.toLowerCase() === "køb") {
    twiml.message("Kom og køb juice hos JOE");
  } else if (req.body.Body.toLowerCase() === "slut") {
    twiml.message("Farvel og tak for dit køb");
  } else {
    twiml.message(`Det her er en WhatsApp webhook. Svar "køb" for at købe hos JOE and The Juice.`);
  }

  res.type("text/xml").send(twiml.toString());
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});