import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import parcelRoutes from "./routes/parcel.routes";

const app = express();


// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/parcels", parcelRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("API is running 🚀");
  });
  
export default app;