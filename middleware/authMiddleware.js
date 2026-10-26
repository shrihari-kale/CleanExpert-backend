const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async(req, res, next)=>{
    try{
        // get token from request hearders
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer")) {
            return res.status(401).json({
                success:false,
                message:"Please login to access this resource",
            });
        }
        const token = authHeader.split(" ")[1];

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // find user in database
        const user = await User.findById(decoded.id).select("-password");

        if(!user){
            return res.status(401).json({
                success:false,
                message:"User no longer exists",
            });
        }
        // attach user to request
        req.user = user;

        // continue to route/controller
        next();
    }catch(error){
        if (
          error.name === "JsonWebTokenError" ||
          error.name === "TokenExpiredError"
        ) {
          return res.status(401).json({
            success: false,
            message: "Invalid or expired token.Please login again.",
          });
        }
           console.error("Authentication error:",error.message);

           return res.status(500).json({
            success: false,
            message: "Authentication failed",
           });
    }
};

const adminOnly = (req, res, next) =>{
  if(!req.user || req.user.role !== "admin"){
    return res.status(403).json({
        success:false,
        message:"Access denied. Admin only.",
    });
  }
  next();
};

module.exports={protect, adminOnly};