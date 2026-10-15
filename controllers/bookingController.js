const Booking = require("../models/Booking");

const createBooking = async (req, res) => {
    try {
      const bookingData = req.body;

      const booking = new Booking(bookingData);

      await booking.save(); // this line save data in mongodb

        res.status(201).json({
          message: "Booking created successfully",
          booking,
        });
        
    } catch (error){
        res.status(500).json({
            message:"Server error",
            error:error.message
        });
    }
   }
   

   const getbookings = async (req, res) =>{
          try{
            const bookings = await Booking.find();

            res.status(200).json({
              bookings
            });
          } catch (error) {
            res.status(500).json({
              message:"server error",
              error:error.message
            });
          }
        };

   const updateBookingStatus = async (req,res) => {
    try{
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Completed",
        "Cancelled"
      ];
      
      if(!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:"Invalid booking status"
        });
      }
      const booking = await Booking.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators:true }
      );
      if(!booking){
        return res.status(404).json({
          message:"Booking not found"
        });
      }

      res.status(200).json({
        message:"Booking status updates successfully",
        booking
      });
    } catch(error){
      res.status(500).json({
        message:"Server error",
        error:error.message
      });
    }
   };

   module.exports = { createBooking, getbookings,updateBookingStatus};
        