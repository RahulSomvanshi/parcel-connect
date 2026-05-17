/**
 * Upsert admin test user with Yopmail (for admin flow testing).
 * Run: npm run seed:admin
 */
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db";
import User from "../models/user.model";

dotenv.config();

const ADMIN = {
  fullName: "Admin User",
  email: "zippora.admin@yopmail.com",
  phone: "9000000001",
  password: "Admin@123",
  role: "admin" as const,
};

async function upsertAdmin() {
  await connectDB();

  const hashedPassword = await bcrypt.hash(ADMIN.password, 10);

  let user = await User.findOne({
    $or: [{ phone: ADMIN.phone }, { email: ADMIN.email }, { role: "admin" }],
  });

  if (user) {
    user.fullName = ADMIN.fullName;
    user.email = ADMIN.email;
    user.phone = ADMIN.phone;
    user.password = hashedPassword;
    user.role = ADMIN.role;
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    console.log("Updated existing admin user.");
  } else {
    user = await User.create({
      ...ADMIN,
      password: hashedPassword,
      isVerified: true,
    });
    console.log("Created admin user.");
  }

  console.log("\n--- Admin login (test admin flow) ---");
  console.log("  Phone:    ", ADMIN.phone);
  console.log("  Email:    ", ADMIN.email);
  console.log("  Password: ", ADMIN.password);
  console.log("  Inbox:    https://yopmail.com/en/?login=zippora.admin");
  console.log("\nAfter login, open: /#/dashboard/admin");

  process.exit(0);
}

upsertAdmin().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
