import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters"),

  email: z.string().email("Invalid email").optional(),

  phone: z.string().min(10, "Phone must be 10 digits"),

  password: z.string().min(6, "Password must be at least 6 characters"),

  role: z.enum(["user", "admin"]).optional(),
});