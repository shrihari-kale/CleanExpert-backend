const express = require("express");
const Razorpay = require("razorpay");
const Booking = require("../models/Booking");
const crypto = require("crypto");
const { protect } = require("../middleware/authMiddleware");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

const razorpay = new Razorpay({
key_id: process.env.RAZORPAY_KEY_ID,
key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const prices = {
"Home Cleaning": 999,
"Office Cleaning": 1499,
"Deep Cleaning": 1999,
"Water Tank Cleaning": 799,
"Bathroom Cleaning": 499,
"Garden Cleaning": 699,
};

// Test Razorpay authentication
router.get("/test-auth", async (req, res) => {
try {
await razorpay.orders.all({ count: 1 });


res.json({
  success: true,
  message: "Razorpay authentication successful!",
});


} catch (error) {
console.error("Razorpay authentication error:", error.message);


res.status(error.statusCode || 500).json({
  success: false,
  message: error.error?.description || error.message,
});


}
});

// CREATE ORDER AND SAVE PENDING BOOKING
router.post("/create-order", protect, async (req, res) => {
let booking;

try {
const {
name,
mobile,
email,
service,
date,
time,
address,
} = req.body;


if (
  !name ||
  !mobile ||
  !email ||
  !service ||
  !date ||
  !time ||
  !address
) {
  return res.status(400).json({
    success: false,
    message: "Please provide all booking details.",
  });
}

const amount = prices[service];

if (!amount) {
  return res.status(400).json({
    success: false,
    message: "Invalid service selected.",
  });
}

// Save booking for the authenticated customer
booking = await Booking.create({
  name,
  mobile,
  email,
  service,
  date,
  time,
  address,
  amount,
  user: req.user._id,
  status: "Pending",
  paymentStatus: "Pending",
});

// Create Razorpay order
const order = await razorpay.orders.create({
  amount: amount * 100,
  currency: "INR",
  receipt: `booking_${booking._id}`,
});

booking.razorpayOrderId = order.id;
await booking.save();

try {
await sendEmail({
to: booking.email,
subject: "Cleaning Service - Booking Received",
html: ` <h2>Thank You for Your Booking!</h2> <p>Hello ${booking.name},</p>


  <p>We have received your cleaning service booking.</p>

  <h3>Booking Details</h3>
  <p><strong>Service:</strong> ${booking.service}</p>
  <p><strong>Date:</strong> ${booking.date}</p>
  <p><strong>Time:</strong> ${booking.time}</p>
  <p><strong>Address:</strong>${booking.address}</p>
  <p><strong>Amount:</strong> ₹${booking.amount}</p>
  <p><strong>Booking ID:</strong> ${booking._id}</p>

  <p>Your booking is currently pending payment confirmation.</p>
  <p>Once your payment is successful, you will receive a payment confirmation email.</p>

  <p>Thank you for choosing our CleanExpert Service!</p>
`,

});
} catch (emailError) {
console.error("Booking confirmation email failed:", emailError.message);
}


return res.status(201).json({
  success: true,
  bookingId: booking._id,
  order,
  keyId: process.env.RAZORPAY_KEY_ID,
});


} catch (error) {
console.error("CREATE ORDER FAILED:", error.message);


// Delete pending booking only if order creation failed
if (booking && !booking.razorpayOrderId) {
  try {
    await Booking.findByIdAndDelete(booking._id);
  } catch (deleteError) {
    console.error("Booking cleanup error:", deleteError.message);
  }
}

return res.status(500).json({
  success: false,
  message: "Unable to create booking or payment order.",
});


}
});

// VERIFY PAYMENT
router.post("/verify-payment", protect, async (req, res) => {
try {
const {
razorpay_order_id,
razorpay_payment_id,
razorpay_signature,
} = req.body;


if (
  !razorpay_order_id ||
  !razorpay_payment_id ||
  !razorpay_signature
) {
  return res.status(400).json({
    success: false,
    message: "Payment details are missing.",
  });
}

// Find booking belonging to the logged-in customer
const booking = await Booking.findOne({
  razorpayOrderId: razorpay_order_id,
  user: req.user._id,
});

if (!booking) {
  return res.status(404).json({
    success: false,
    message: "Booking not found for this payment order.",
  });
}

// Verify Razorpay signature
const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest("hex");

const expectedBuffer = Buffer.from(expectedSignature, "hex");
const receivedBuffer = Buffer.from(razorpay_signature, "hex");

if (
  expectedBuffer.length !== receivedBuffer.length ||
  !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
) {
  return res.status(400).json({
    success: false,
    message: "Payment signature verification failed.",
  });
}

// Avoid duplicate processing
if (booking.paymentStatus === "Paid") {
  return res.status(200).json({
    success: true,
    message: "Payment already verified.",
    booking,
  });
}

booking.paymentStatus = "Paid";
booking.status = "Confirmed";
booking.razorpayPaymentId = razorpay_payment_id;

await booking.save();
 
try {
await sendEmail({
to: booking.email,
subject: "CleanExpert Cleaning Service - Payment Successful",
html: ` <h2>Payment Successful!</h2> <p>Thank you for booking our CleanExpert Service.</p>

  <h3>Payment Details</h3>
  <p><strong>Booking ID:</strong> ${booking._id}</p>
  <p><strong>Service:</strong> ${booking.service}</p>
  <p><strong>Amount Paid:</strong> ₹${booking.amount}</p>
  <p><strong>Payment ID:</strong> ${booking.razorpayPaymentId}</p>
  <p><strong>Booking Date:</strong> ${booking.date}</p>
  <p><strong>Booking Time:</strong> ${booking.time}</p>

  <p>Your booking is now confirmed.</p>
  <p>Thank you for choosing us!</p>
`,

});
} catch (emailError) {
console.error("Payment email failed:", emailError.message);
}



return res.status(200).json({
  success: true,
  message: "Payment verified and booking confirmed.",
  booking,
});


} catch (error) {
console.error("VERIFY PAYMENT FAILED:", error.message);


return res.status(500).json({
  success: false,
  message: "Unable to verify payment.",
});


}
});

module.exports = router;
