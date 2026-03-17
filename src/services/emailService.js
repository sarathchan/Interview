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

  const amount = netSalary.toFixed(2);
  const text = `Dear Employee,

Your salary for ${month} has been credited successfully.

Net Amount: Rs. ${amount}

If you have any queries, please reach out to the HR department.

Regards,
HR Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salary Credited</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 32px 40px;">
              <h2 style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 22px; font-weight: 600;">Salary Credited – ${month}</h2>
              <p style="margin: 0 0 16px 0; color: #333; font-size: 16px; line-height: 1.6;">Dear Employee,</p>
              <p style="margin: 0 0 24px 0; color: #333; font-size: 16px; line-height: 1.6;">Your salary for <strong>${month}</strong> has been credited successfully.</p>
              <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Net Amount</p>
                <p style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Rs. ${amount}</p>
              </div>
              <p style="margin: 0 0 24px 0; color: #666; font-size: 14px; line-height: 1.6;">If you have any queries, please reach out to the HR department.</p>
              <p style="margin: 0; color: #333; font-size: 14px;">Regards,<br><strong>HR Team</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const mailOptions = {
    from,
    to: email,
    subject: `Salary credited for ${month}`,
    text,
    html
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  sendSalaryCreditedEmail
};



