const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "SendGrid",
    // host: process.env.EMAIL_HOST,
    // port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.SENDGRID_USERNAME, // process.env.EMAIL_USERNAME,
      pass: process.env.SENDGRID_PASSWORD, // process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: "The Barbers Website <asem1111sy@gmail.com>",
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
};
module.exports = sendEmail;
