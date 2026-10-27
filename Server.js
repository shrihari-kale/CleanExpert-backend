const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
console.log("JWT_SECRET loaded:", Boolean(process.env.JWT_SECRET));

const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// connect route
const bookingRouters = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");

app.get("/", (req, res) => {
  res.send("");
});

app.use("/api/bookings", bookingRouters);
app.use("/api/review", reviewRoutes);
app.use("/api/payment",paymentRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT ||3000;

app.listen(PORT,() => {
  console.log("Server running on port 3000");
});
