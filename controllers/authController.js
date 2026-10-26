const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Register user

const registerUser = async(req, res) => {
    try{
        const { name, email, mobile, password, confirmPassword} = req.body;

        // validation required fields
        if(!name || !email || !mobile || !password || !confirmPassword) {
            return res.status(400).json({
                success:false,
                message:"Please fill all fields",
            });
          }
        //   validate email formate
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(!emailRegex.test(email)){
            return res.status(400).json({
                success:false,
                message:"Please enter a valid email",
            });
        }
        // cheack password length
        if(password.length < 8){
            return res.status(400).json({
                success:false,
                message:"Password must be at least 8 character",
            });
        }
        // cheak passeord confirmation
        if (password !== confirmPassword) {
          return res.status(400).json({
            success: false,
            message: "Password do not match",
          });
        }

        // check existing user
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email:normalizedEmail,
        });

        if(existingUser){
            return res.status(409).json({
                success:false,
                message:"Email is already registered",
            });
        }
        // hash password
        const hashedPassword = await bcrypt.hash(password,12);

        // create User
        const user = await User.create({
            name:name.trim(),
            email:normalizedEmail,
            mobile:mobile.trim(),
            password: hashedPassword,
            role:"customer",
        })
        // send safe user details
        return res.status(201).json({
            success:true,
            message:"Registration successfull",
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                mobile:user.mobile,
                role:user.role,
            },
        });

    }catch(error){
        // handle duplicate email index error safely
        if(error.code === 11000){
            return res.status(409).json({
                success:false,
                message:"Email is already registered",
            });
        }
        console.error("Registration error:",error.message);

        return res.status(500).json({
            success:false,
            message:"Registration failed. Please try again.",
        });
    }
};


const loginUser = async(req, res) => {
    try{
        const {email,password} = req.body;
        // cheack required fields
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"Please enter email and password",
            });
        }
    // find user by email
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
        email:normalizedEmail,
    });
    if(!user){
        return res.status(401).json({
            success:false,
            message:"Invalid email or password",
        });
    } 

    // compare enterd passeord with hashed password
    const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password
    );
    if(!isPasswordCorrect){
        return res.status(401).json({
            success:false,
            message:"Invalid email or password",
        });
     }
    //  generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );
    //  find response
    return res.status(200).json({
        success:true,
        message:"Login successfull",
        token,
        user:{
            id:user._id,
            name:user.name,
            email:user.email,
            mobile:user.mobile,
            role:user.role,
        },
    });

    }catch(error){
        console.error("Login error.",error.message);

        return res.status(500).json({
            success:false,
            message:"Login failed. Plz try again.",
        });
    }

}

const getMyProfile = async (req, res) => {
    try{
        res.status(200).json({
            success:true,
            user:{
                id: req.user._id,
                name: req.user.email,
                email:req.user.mobile,
                role:req.user.role,
            },
        });
    }catch(error){
        console.error("Profile error:",error.message);
        
        res.status(500).json({
            success:false,
            message:"Unable to fetch profile",
        })
    }
}

module.exports = { registerUser,loginUser, getMyProfile};