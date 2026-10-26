const Booking = require("../models/Booking");
const sendEmail = require("../utils/sendEmail");

const createBooking = async (req, res) => {
    try {
      const bookingData ={
         ...req.body,
         user: req.user._id,
        };

      const booking = new Booking(bookingData);

      await booking.save(); // this line save data in mongodb


      try{
        await sendEmail({
          to:booking.email,
          subject:"Cleaning Service - Booking Confirmation",
          html:`
          <h2>Booking Confirmed Successfully!</h2>
          <p>Thank you for choosing our Cleaning Service.</p>
          
          <h3>Booking Details</h3>
          <p><strong>Name:</strong>${booking.name}</p>
          <p><strong>Service:</strong>${booking.service}</p>
          <p><strong>Date:</strong>${booking.date}</p>
          <p><strong>Time:</strong>${booking.time}</p>
          <p><strong>Address:</strong>${booking.address}</p>

          <p>We look forward to serving you!</p>
          `,
        });
      }catch(emailError){
        console.error("Booking email failed:",emailError.message);
      }

        res.status(201).json({
          success:true,
          message: "Booking created successfully",
          booking,
        });
        
    } catch (error){
      console.error("Create booking error:",error.message);

        res.status(500).json({
            success:false,
            message:"Server error",
        });
    }
   };
   
   
const getbookings = async (req, res) => {
  try {
    let bookings;

    
console.log("Logged-in user ID:", req.user._id.toString());
console.log("Logged-in user role:", req.user.role);

if (req.user.role === "admin") {
  // Admin can see all bookings
  bookings = await Booking.find().sort({ createdAt: -1 });
} else {
  console.log("Searching bookings for:", req.user._id);

  const allBookings = await Booking.find();

  console.log("Total bookings in database:", allBookings.length);

  console.log(
    "Booking user IDs:",
    allBookings.map((b) => ({
      bookingId: b._id.toString(),
      userId: b.user ? b.user.toString() : "NO USER ID",
    }))
  );

  bookings = await Booking.find({
    user: req.user._id,
  }).sort({ createdAt: -1 });

  console.log("Matched bookings:", bookings.length);
}

res.status(200).json({
  success: true,
  count: bookings.length,
  bookings,
});

  } catch (error) {
    console.error("Get bookings error:", error.message);

    
res.status(500).json({
  success: false,
  message: "Server error",
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
        