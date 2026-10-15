const express = require("express");
const router = express.Router();

const { createBooking, getbookings, updateBookingStatus } = require("../controllers/bookingController");

router.post("/",createBooking);

router.get("/",getbookings);

router.put("/:id/status",updateBookingStatus);

module.exports = router;