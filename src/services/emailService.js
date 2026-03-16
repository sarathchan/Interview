const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password'
  }
});

async function sendSalaryCreditedEmail({ email, month, netSalary }) {
  const from = process.env.EMAIL_FROM || 'hr@example.com';

  const mailOptions = {
    from,
    to: email,
    subject: `Salary credited for ${month}`,
    text: `Dear employee,\n\nYour salary for ${month} has been credited.\nNet amount: ${netSalary.toFixed(
      2
    )}.\n\nRegards,\nHR Team`
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  sendSalaryCreditedEmail
};



