import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const transporter = nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.SENDER_EMAIL, //sender gmail address
      pass: process.env.SMTP_PASS, // App password from Gmail account
    },
  });
  
export default transporter;