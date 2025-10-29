import nodemailer from 'nodemailer';
import { OTP } from '../models/otp.js';

// Function to generate OTP
function generateOTP() {
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

// Function to send OTP via email
export async function sendOTPEmail(email) {



  const otpRecord = await OTP.findOne({
    email: email,
    isValid: true,
  })




  let otp
  if (otpRecord) {
    if (otpRecord.count > 5) {
      throw new Error("You have reached the maximum OTP limit. Please try again later.");
    }

    otp = otpRecord.otp
    otpRecord.count += 1;
    await otpRecord.save();
  }


  if (!otp) {
    otp = generateOTP();

    const newOTP = new OTP({
      email: email,
      otp: otp,
    });

    await newOTP.save();
  }


  // Configure your SMT P transporter
  const transporter = nodemailer.createTransport({
    // host: process.env.MAIL_HOST,
    // port: 587,
    // secure: false,
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_USER_PASS,
    },
  });

  // Email options
  const mailOptions = {
    from: process.env.FROM_MAIL,
    to: email,
    subject: "Your OTP for Nesto Rooms",
    html: `
   <!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        
        body {
            background-color: #f7f9fc;
            margin: 0;
            padding: 20px 0;
        }
        
        .email-container {
            font-family: 'Inter', Arial, sans-serif;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        }
        
        .header {
            background-color: #4f46e5;
            padding: 24px;
            text-align: center;
        }
        
        .logo {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .title {
            color: #ffffff;
            font-size: 20px;
            font-weight: 500;
            margin: 0;
        }
        
        .content {
            padding: 32px;
        }
        
        .greeting {
            font-size: 16px;
            margin-bottom: 24px;
            line-height: 1.5;
            color: #4a5568;
        }
        
        .otp-container {
            margin: 24px 0;
            text-align: center;
        }
        
        .otp-code {
            font-size: 32px;
            font-weight: 600;
            letter-spacing: 2px;
            color: #4f46e5;
            padding: 16px 24px;
            border-radius: 8px;
            background-color: #f5f7ff;
            display: inline-block;
            margin: 12px 0;
        }
        
        .message {
            font-size: 15px;
            line-height: 1.6;
            color: #4a5568;
            margin-bottom: 24px;
        }
        
        .note {
            font-size: 14px;
            color: #718096;
            padding: 16px;
            background-color: #f8fafc;
            border-radius: 8px;
            margin-top: 24px;
        }
        
        .footer {
            padding: 24px;
            text-align: center;
            background-color: #f8fafc;
            font-size: 13px;
            color: #718096;
            border-top: 1px solid #e2e8f0;
        }
        
        .company-name {
            font-weight: 600;
            color: #4a5568;
        }
        
        .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 24px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">Nesto</div>
            <h1 class="title">Your Verification Code</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello,<br>
                We received a request to sign up for a Nesto account. Please use the following verification code:
            </div>
            
            <div class="otp-container">
                <div class="otp-code">${otp}</div>
            </div>
            
            <div class="message">
                This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.
            </div>
            
            <div class="note">
                For your security, never share this code with anyone. Nesto will never ask you for your verification code.
            </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
            <p>© 2023 <span class="company-name">Nesto</span>. All rights reserved.</p>
            <p>123 Business Ave, Suite 100, San Francisco, CA 94107</p>
        </div>
    </div>
</body>
</html>

    `
  };

  // Send email
  try {


    await transporter.sendMail(mailOptions);

    // console.log(`OTP sent to ${email}`);

    return {
      otp,
      email: email,
    };

  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error
  }
}