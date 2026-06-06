import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRouter from './src/routes/User.js'
import authRoutes from './src/routes/Authentication.js';
import bookingRoutes from './src/routes/bookingRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import paymentRoutes from './src/routes/paymentGateway.js';
import hostRoutes from './src/routes/hostRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
import propertyRoutes from './src/routes/propertyRoutes.js'
import { connectDB } from './src/config/db.js'

import cron from "node-cron";
import moment from "moment-timezone";
import Booking from './src/models/Booking.js';
import HostRevenueHistory from './src/models/HostRevenueHistory.js';
import HostEarning from './src/models/HostEarning.js';
import passport from './src/services/passport.js';



// Load env variables
dotenv.config();

// Connect DB
connectDB();

const app = express()


app.use(passport.initialize());

// const allowedOrigins = [
//   'https://abhishek-dir.vercel.app',
//   'https://2475b0b3-6000.inc1.devtunnels.ms',
//   'http://localhost:3000',
//   'https://nesto-test.kunalsize9.workers.dev'
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
// }));

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));




app.use('/api/user', userRouter)

app.use('/api/auth', authRoutes)
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use("/api/payment-gateway", paymentRoutes);
app.use("/api/host", hostRoutes);


//chat-routes
app.use('/api/chat', chatRoutes)



const PORT = process.env.PORT || 6000
app.listen(PORT, () => console.log(`Server running on PORT:-${PORT}`))





cron.schedule("0 10 * * *", async () => {
// cron.schedule("* * * * *", async () => {

  console.log("🚀 Running Booking-Earnings Cron Job at 10 AM IST...");

  try {
    const now = moment().tz("Asia/Kolkata").startOf("day");

    //  Find bookings whose checkout date < today & not completed yet
    const completedBookings = await Booking.find({
      checkOut: { $lte: now.toDate() },
      status:  "UPCOMING",
    });

    for (const booking of completedBookings) {
      // Mark booking as completed
      booking.status = "COMPLETED";
      await booking.save();

      //  Check if earning already exists
      const existingEarning = await HostRevenueHistory.findOne({
        bookingId: booking._id,
      });

      if (!existingEarning) {

        await HostRevenueHistory.create({
          hostId: booking.hostId,
          bookingId: booking._id,
          earning: booking.amount

        })

        const hostEarningData = await HostEarning.findOne({
          hostId: booking.hostId,
        })

        if(!hostEarningData){
          await HostEarning.create({
            hostId: booking.hostId,
            earning: booking.amount
          });
        }else{
          hostEarningData.earning +=booking.amount
          await hostEarningData.save()
        }

        console.log(`✅ Earning created for host ${booking.hostId}`);
      }
    }

    console.log(
      `🎉 Cron Job Completed — ${completedBookings.length} bookings updated`
    );
  } catch (error) {
    console.error("❌ Cron Job Error:", error);
  }
});
