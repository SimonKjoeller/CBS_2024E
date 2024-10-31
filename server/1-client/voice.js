const twilio = require("twilio");

// Twilio API nøgler
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createCall() {
  const call = await client.calls.create({
    from: "+1 985 297 5619",
    to: "+4542770812",
    twiml:
      "<Response><Say>Hello I'm your rich uncle Alfredo. I want to give you 1.000.000 kroner. Please just give me your CPR number.</Say></Response>",
  });

  console.log(call);
}

createCall();
