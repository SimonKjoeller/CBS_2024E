const twilio = require("twilio");
require('dotenv').config();


// Twilio API nøgler
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createText() {
  r
  const message = await client.messages.create({
    from: "+1 985 297 5619",
    to: modtager,
    body: "Din engangsadgangskode til cbsjoe er",
  });

  console.log(message);
}

createText(modtager);
