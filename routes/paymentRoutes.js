const express = require("express");
const Razorpay = require("razorpay");
const Booking = require("../models/Booking");
const crypto = require("crypto");

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

router.post("/create-order", async (req, res) => {
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

    // 1. Validate booking details
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
        message: "Please provide all booking details",
      });
    }

    // 2. Get trusted price from backend
    const amount = prices[service];

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Invalid service selected",
      });
    }

    // 3. Save booking in MongoDB
    booking = await Booking.create({
      name,
      mobile,
      email,
      service,
      date,
      time,
      address,
      amount,
      status: "Pending",
      paymentStatus: "Pending",
    });

    // 4. Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `booking_${booking._id}`,
    });

    // 5. Save Razorpay order ID in booking
    booking.razorpayOrderId = order.id;
    await booking.save();

    // 6. Send details to frontend
    return res.status(201).json({
      success: true,
      bookingId: booking._id,
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error.message);

    // Remove pending booking if order creation failed
    if (booking && !booking.razorpayOrderId) {
      try {
        await Booking.findByIdAndDelete(booking._id);
      } catch (deleteError) {
        console.error("Booking cleanup error:", deleteError.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create booking or payment order",
    });
  }
});

// verification

router.post("/verify-payment", async (req, res) => {
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
        message: "Payment details are missing",
      });
    }

    // Generate expected signature on the backend
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Compare signatures safely
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Find the booking associated with this Razorpay order
    const booking = await Booking.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found for this payment order",
      });
    }

    // Avoid marking an already-paid booking again
    if (booking.paymentStatus === "Paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        booking,
      });
    }

    booking.paymentStatus = "Paid";
    booking.status = "Confirmed";
    booking.razorpayPaymentId = razorpay_payment_id;

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed",
      booking,
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
});



module.exports = router;

