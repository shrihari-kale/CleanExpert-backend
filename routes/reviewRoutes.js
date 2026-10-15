const express = require("express");
const router = express.Router();

const { customerReview, getReview } = require("../controllers/reviewController");

router.post("/",customerReview);

router.get("/",getReview);

module.exports = router;