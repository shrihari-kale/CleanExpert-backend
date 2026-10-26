const express = require("express");
const router = express.Router();

const { registerUser,loginUser, getMyProfile } = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware")

// sigup API
router.post("/register",registerUser);

router.post("/login",loginUser);

router.get("/profile",protect,getMyProfile);

module.exports=router;