const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");
// const { getbookings } = require("../controllers/bookingController");


const { createBooking, getbookings, updateBookingStatus } = require("../controllers/bookingController");

router.post("/",protect, createBooking);

router.get("/",protect, getbookings);

router.put("/:id/status",protect, adminOnly, updateBookingStatus);

router.get("/admin/all", protect, adminOnly, getbookings);

module.exports = router;