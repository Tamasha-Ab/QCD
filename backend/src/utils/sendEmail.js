// utils/sendEmail.js
import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  try {
    // Check if we should send real emails (controlled by SEND_REAL_EMAILS env var)
    const shouldSendRealEmails = process.env.SEND_REAL_EMAILS === 'true' || process.env.NODE_ENV === 'production';

    if (!shouldSendRealEmails) {
      console.log('📧 EMAIL SIMULATION (Development Mode):');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Content:', options.html || options.text);
      console.log('Note: Email simulation - no real email sent');
      console.log('Tip: Set SEND_REAL_EMAILS=true in .env to send real emails in development');
      return { messageId: 'dev-simulation-' + Date.now() };
    }

    // Check if email credentials are configured for real email sending
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_app_password_here') {
      throw new Error('Email credentials not configured. Please check EMAIL_USER and EMAIL_PASS environment variables.');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify the transporter configuration
    await transporter.verify();

    const mailOptions = {
      from: `"Quality Control Dashboard" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);

    // More specific error handling
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      throw new Error('Email authentication failed. Please check your email credentials.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to email service. Please check your internet connection.');
    } else if (error.message && error.message.includes('credentials not configured')) {
      throw error;
    } else {
      throw new Error('Failed to send email. Please try again later.');
    }
  }
};

export default sendEmail;
