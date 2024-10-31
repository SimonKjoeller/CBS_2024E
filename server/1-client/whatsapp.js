const twilio = require("twilio");

// Twilio API nøgler
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createText() {
  const message = await client.messages.create({
    from: 'whatsapp:+14155238886',
    contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
    contentVariables: '{"1":"12/1","2":"3pm"}',
    to: 'whatsapp:+4524631876',
  });

  console.log(message);
}

createText();
