import dotenv from "dotenv";
import connectDB from "./config/db";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 5000;

// DB connect
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// PORT=5000
// MONGO_URI=mongodb://127.0.0.1:27017/parcel-app
// JWT_SECRET=57e55d58c3344823a2322d6774199592656124e6afef90b3fbbc849732c13643dbd5da7c3a94e8455cb652b9f010c95f03faf57a0f8b6d2be647abc2528bcec1
// REFRESH_SECRET=refresh_secret_456979833f8906d343db4def02dd81ec421f434b0990f8e24b7191c6765d914da1e9f76c5da933882ad0dd45f953a292702472b52f7d957657254f95a8f7cf7f2a3