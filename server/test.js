const nodemailer = require("nodemailer");

// Dette er eksempel på at sende en email med plain text og en HTML body 
// ved brug af Forward Email. Link: https://nodemailer.com/about/

// Gmail-konto oprettet til at teste med
// Email er copenhagenbusinessjoe@gmail.com
// App password er "mzks mywi hnpd jqjx"

// SMTP transport: https://nodemailer.com/smtp/

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "copenhagenbusinessjoe@gmail.com",
    pass: "mzksmywihnpdjqjx",
  },
});

// Verificer forbindelsen til Gmail SMTP serveren

transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

// Konfiguration af mails: https://nodemailer.com/message/

async function mailToUser(recipients, subjectMsg, textMsg, htmlMsg) {
  const sender = "JOE <copenhagenbusinessjoe@gmail.com>";
  console.log("test")
  console.log(recipients)
  try {
    const info = await transporter.sendMail({
      from: sender,
      to: recipients,
      subject: subjectMsg,
      text: textMsg,
      html: htmlMsg,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error(error);
  }
}

// Opgave 1: Send en mail til dig selv med Nodemailer via Gmail SMTP Server
// Lav variabler og kald funktionen mailToUser() med parametre
async function test() {
  try {
    console.log("hej");
    const recipients = "simon.kj.hansen@gmail.com"
    let subjectMsg = 'Betaling';
    let textMsg = "test";
    let htmlMsg = `Vi mangler betaling for børne porno premium. <a href="https://boernehusetjoanna-kk.aula.dk/?fbclid=IwY2xjawFiBbtleHRuA2FlbQIxMAABHd9WxHX5aeSEogMeTXj_uW3eaNfWI0-JRlkzJEdQyZKcplGET77Y07Dqjw_aem_05jZf63DG9u8rIz_fxpgxg"> Tryk her </a>`

    await mailToUser(recipients, subjectMsg, textMsg, htmlMsg);
  } catch (error) {
    console.error(error);
  }
}


test()