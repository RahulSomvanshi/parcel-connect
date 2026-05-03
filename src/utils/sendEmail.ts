import nodemailer from "nodemailer";

export const sendEmail = async (
  to: string,
  subject: string,
  text: string
) => {
  try {
    console.log("📧 Starting email send process...");
    console.log("📧 Email config check - EMAIL_FROM:", process.env.EMAIL_FROM ? "✅ Set" : "❌ Missing");
    console.log("📧 Email config check - EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "✅ Set" : "❌ Missing");
    console.log("📧 Sending to:", to);
    console.log("📧 Subject:", subject);
    console.log("📧 Message:", text);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true, // true for 465
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log("📧 Transporter created successfully");

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM as string, // Sender address
      to, // Receiver address
      subject, // Subject line
      text, // Plain text body
    });

    console.log("✅ Email sent successfully!");
    console.log("✅ Email response:", info.response);
    console.log("✅ Message ID:", info.messageId);
  } catch (err: any) {
    console.error("❌ Email error details:");
    console.error("❌ Error message:", err.message);
    console.error("❌ Error code:", err.code);
    console.error("❌ Error type:", err.name);
    if (err.command) {
      console.error("❌ SMTP command:", err.command);
    }
    if (err.response) {
      console.error("❌ SMTP response:", err.response);
    }
  }
};