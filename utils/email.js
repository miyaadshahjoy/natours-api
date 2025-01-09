const nodemailer = require('nodemailer');

const sendEmail = async function (options) {
  // TODO: We have to create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // TODO: We have to define some mail options
  const mailOptions = {
    from: 'Miyaad Joy <miyaadjoy@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
