import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db";
import User from "../models/user.model";

dotenv.config();

const SEED_USERS = [
  {
    fullName: "Admin User",
    email: "zippora.admin@yopmail.com",
    phone: "9000000001",
    password: "Admin@123",
    role: "admin" as const,
  },
  {
    fullName: "Sender User",
    email: "sender@zippora.com",
    phone: "9000000002",
    password: "Sender@123",
    role: "sender" as const,
  },
  {
    fullName: "Traveler User",
    email: "traveler@zippora.com",
    phone: "9000000003",
    password: "Traveler@123",
    role: "traveller" as const,
  },
];

async function seed() {
  await connectDB();

  for (const seedUser of SEED_USERS) {
    const existing = await User.findOne({
      $or: [{ phone: seedUser.phone }, { email: seedUser.email }],
    });

    const hashedPassword = await bcrypt.hash(seedUser.password, 10);

    if (existing) {
      existing.fullName = seedUser.fullName;
      existing.email = seedUser.email;
      existing.role = seedUser.role;
      existing.password = hashedPassword;
      existing.isVerified = true;
      existing.otp = undefined;
      existing.otpExpiry = undefined;
      await existing.save();
      console.log(`Updated: ${seedUser.role} — ${seedUser.phone} (${seedUser.email})`);
      continue;
    }

    await User.create({
      fullName: seedUser.fullName,
      email: seedUser.email,
      phone: seedUser.phone,
      password: hashedPassword,
      role: seedUser.role,
      isVerified: true,
    });

    console.log(`Created: ${seedUser.role} — phone ${seedUser.phone}`);
  }

  console.log("\nSeed complete. Default accounts:");
  console.log("  Admin    — phone 9000000001 / Admin@123 / zippora.admin@yopmail.com");
  console.log("  Sender   — 9000000002 / Sender@123");
  console.log("  Traveler — 9000000003 / Traveler@123");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
