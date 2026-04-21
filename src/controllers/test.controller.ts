import { sendEmail } from "../utils/sendEmail";

export const testEmail = async (req: any, res: any) => {
  await sendEmail(
    "yourpersonalemail@gmail.com",
    "Test Email 🚀",
    "Bhai email ka system kaam kar raha hai 🔥"
  );

  res.json({ message: "Email sent" });
};