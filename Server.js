const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// connect route
const bookingRouters = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

app.get("/", (req, res) => {
  res.send("");
});

app.use("/api/bookings", bookingRouters);
app.use("/api/review", reviewRoutes);
app.use("/api/payment",paymentRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
