const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const generateOtp = () => {
  const otpLength = 6; // Length of the OTP
  let otp = '';
  for (let i = 0; i < otpLength; i++) {
    otp += Math.floor(Math.random() * 10); // Generate a random digit (0-9) and append to the OTP
  }
  return otp;
};

const sendOtpEmail = async (email, otp) => {
  if (!validateEmail(email)) {
    throw new Error('Invalid email address');
  }

  const mailOptions = {
    from: 'planbclo@gmail.com',
    to: email,
    subject: 'Your PLANBCLO OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

module.exports = { generateOtp, sendOtpEmail };
