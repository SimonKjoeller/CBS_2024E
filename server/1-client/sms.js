const twilio = require("twilio");
require('dotenv').config();


// Twilio API nøgler
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createText() {
  const message = await client.messages.create({
    from: "+1 985 297 5619",
    to: modtager,
    body: "Hej, det er din rige onkel, Alfredo, der skriver til dig. \nJeg har vundet i lotto, så jeg vil gerne give dig 1.000.000 kr. \nDu skal blot klikke på dette link https://www.youtube.com/watch?v=4v8ek9TEeOU.",
  });

  console.log(message);
}

createText(modtager);
