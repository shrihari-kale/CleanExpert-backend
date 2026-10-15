const mongoose = require("mongoose");
const ReviewSchema = new mongoose.Schema(
    {
      name:{
         type:String,
         required:true
      },
      writeReview:{
        type:String,
        required:true
      }  
    },
    {
        timestamps:true
    }
);

module.exports = mongoose.model("Review",ReviewSchema);