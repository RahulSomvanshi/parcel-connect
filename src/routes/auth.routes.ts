import { Router } from "express";
import { refreshToken, register, resendOtp, verifyOtp } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { registerSchema } from "../validators/auth.validator";
import { login } from "../controllers/auth.controller";
import { testEmail } from "../controllers/test.controller";
const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/resend-otp", resendOtp);
router.get("/test-email", testEmail);

export default router;
