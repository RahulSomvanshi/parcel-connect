import axios from "axios";

export const sendSMS = async (phone: string, otp: string) => {
  try {
    await axios.post("https://control.msg91.com/api/v5/flow/", {
      flow_id: process.env.MSG91_FLOW_ID,
      sender: "MSGIND",
      mobiles: `91${phone}`,
      OTP: otp
    }, {
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ SMS sent");
  } catch (err) {
    console.log("❌ SMS error", err);
  }
};