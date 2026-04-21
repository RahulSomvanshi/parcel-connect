import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import parcelRoutes from "./routes/parcel.routes";
import travellerRoutes from "./routes/traveller.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();


// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/parcels", parcelRoutes);
app.use("/api/traveller", travellerRoutes);
app.use("/api/admin", adminRoutes)


// Test route
app.get("/", (req, res) => {
    res.send("API is running 🚀");
  });
  
export default app;