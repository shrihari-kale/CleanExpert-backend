const Review = require("../models/Review");

const customerReview = async (req, res) => {
    try{
        const reviewData = req.body;

        const review = new Review(reviewData);

        await review.save();

        res.status(201).json({
            message:"Review Added successull",
            review,
        });
    } catch (error){
        res.status(500).json({
            message:"server error",
            error:error.message
        });
    }
} 

const getReview = async (req, res) => {
    try{
        const reviews = await Review.find().sort({ createdAt: -1});

        res.status(200).json({
            reviews
        });
    }catch (error){
console.error("GET REVIEWS ERROR:",error);

        res.status(500).json({
            message:"Server error",
            error:error.message
        });
    }
};


module.exports = {customerReview, getReview};