import nodemailer from 'nodemailer'; // Adjust the path to your OTP model file
// not in use abhishek

// Function to send OTP via email
export const sendEmail = async(subject,template,email) => {
  // Configure your SMTP transporter
  const transporter = nodemailer.createTransport({
    service: process.env.MAIL_HOST,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_USER_PASS,
    },
  });

  // Email options
  const mailOptions = {
    from: process.env.FROM_MAIL,
    to: email,
    subject: subject,
    html : template
  };

  try {
    await transporter.sendMail(mailOptions);
    return true
  } catch (error) {
    console.error("Error sending email", error);
    return false
  }
};


