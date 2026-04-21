import nodemailer from "nodemailer";

export const sendEmail = async (
  to: string,
  subject: string,
  text: string
) => {
  try {
    // Create a transporter object using your SMTP service (e.g., Gmail, your own SMTP server)
    const transporter = nodemailer.createTransport({
      service: "gmail", // Replace with your email service (e.g., 'gmail', 'smtp.mailtrap.io', etc.)
      auth: {
        user: process.env.EMAIL_FROM, // Your email address (sender)
        pass: process.env.EMAIL_PASSWORD, // Your email password or app password (ensure to use environment variables)
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM as string, // Sender address
      to, // Receiver address
      subject, // Subject line
      text, // Plain text body
    });

    console.log("✅ Email sent: " + info.response);
  } catch (err: any) {
    console.error("❌ Email error:", err.message || err);
  }
};