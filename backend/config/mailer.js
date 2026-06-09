const nodemailer = require('nodemailer');

let testAccount = null;

const sendEmail = async ({ to, subject, text, html }) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  try {
    let transporter;

    // Use ethereal fake SMTP if no real credentials are provided
    if (!user || !pass) {
      if (!testAccount) {
        console.log('✉ [Mailer Status] Generating Ethereal test email account...');
        testAccount = await nodemailer.createTestAccount();
      }

      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port == 465,
        auth: {
          user,
          pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Slicely Pizza" <noreply@pizzadelivery.com>',
      to,
      subject,
      text,
      html,
    });

    console.log('✉ [Mailer Status] Email sent successfully:', info.messageId);
    
    // If using the test account, provide the preview URL so the user can see the email
    if (!user || !pass) {
      console.log('======================================================');
      console.log('🔗 [Ethereal URL] PREVIEW YOUR OTP EMAIL HERE:');
      console.log(nodemailer.getTestMessageUrl(info));
      console.log('======================================================');
    }

    return info;
  } catch (error) {
    console.error('❌ Mailer error encountered:', error);
    return { error: true, message: error.message };
  }
};

module.exports = { sendEmail };
