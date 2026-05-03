import axios from "axios";

export const sendSMS = async (phone: string, otp: string) => {
  try {
    console.log("📱 Starting SMS send process...");
    console.log("📱 SMS config check - MSG91_AUTH_KEY:", process.env.MSG91_AUTH_KEY ? "✅ Set" : "❌ Missing");
    console.log("📱 SMS config check - MSG91_FLOW_ID:", process.env.MSG91_FLOW_ID ? "✅ Set" : "❌ Missing");
    console.log("📱 Sending to phone:", phone);
    console.log("📱 OTP:", otp);

    const smsData = {
      flow_id: process.env.MSG91_FLOW_ID,
      sender: "MSGIND",
      mobiles: `91${phone}`,
      OTP: otp
    };

    console.log("📱 SMS request data:", smsData);

    const response = await axios.post("https://control.msg91.com/api/v5/flow/", smsData, {
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ SMS sent successfully!");
    console.log("✅ SMS response:", response.data);
    console.log("✅ SMS response status:", response.status);
  } catch (err: any) {
    console.error("❌ SMS error details:");
    console.error("❌ Error message:", err.message);
    console.error("❌ Error status:", err.response?.status);
    console.error("❌ Error data:", err.response?.data);
    if (err.response?.status) {
      console.error("❌ HTTP Status:", err.response.status);
    }
    if (err.response?.data) {
      console.error("❌ Response Data:", JSON.stringify(err.response.data, null, 2));
    }
  }
};