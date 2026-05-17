import { Router } from "express";
import {
  getMe,
  refreshToken,
  register,
  resendOtp,
  verifyOtp,
  login,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { registerSchema } from "../validators/auth.validator";
import { authMiddleware } from "../middleware/auth.middleware";
const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/resend-otp", resendOtp);
router.get("/me", authMiddleware, getMe);

export default router;
