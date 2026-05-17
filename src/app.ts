import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import parcelRoutes from "./routes/parcel.routes";
import travellerRoutes from "./routes/traveller.routes";
import adminRoutes from "./routes/admin.routes";
import statsRoutes from "./routes/stats.routes";
import { authRateLimit } from "./middleware/security.middleware";

const app = express();
app.set("etag", false);


// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.use("/api/auth", authRateLimit);
app.use("/api/auth", authRoutes);
app.use("/api/parcels", parcelRoutes);
app.use("/api/traveller", travellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stats", statsRoutes);


// Test route
app.get("/", (req, res) => {
    res.send("API is running 🚀");
  });
  
export default app;