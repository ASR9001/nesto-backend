import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'node:http';
import helmet from 'helmet';
import { authLimiter, privateLimiter, publicLimiter } from './src/middleware/rateLimiter.js';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';

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
import { setupSocketServer } from './src/config/socket.js';
import sendTelegramLog from './src/services/telegramLogger.js';



// Load env variables
dotenv.config();

// Connect DB
connectDB();

const app = express()

// Trust proxy headers (like X-Forwarded-For) from dev tunnels/reverse proxies
app.set('trust proxy', 1);

// Create req.locals with request ID helper to prevent ReferenceError crashes in controllers
app.use((req, res, next) => {
  req.locals = { id: Math.random().toString(36).substring(2, 9) };
  next();
});

// Use Helmet for basic security headers (disables X-Powered-By, adds XSS/CSP filters, clickjacking prevention)
app.use(helmet({
  contentSecurityPolicy: false, // Turn off if it interferes with client-side, or configure it appropriately.
}));

// Compress all HTTP response payloads to optimize bandwidth and speed
app.use(compression());



app.use(passport.initialize());


export const server = http.createServer(app);

setupSocketServer(server)

// Dynamic CORS configuration using ALLOWED_ORIGINS environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.length === 0 ||
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.devtunnels.ms') ||
      origin.endsWith('.loca.lt') ||
      origin.endsWith('.lhr.life')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));





// app.use((req, res, next) => {
//   const start = Date.now();

//   console.log(
//     `➡️ ${new Date().toISOString()} | ${req.method} ${req.originalUrl} `
//   );

//   // res.on("finish", () => {
//   //   console.log(
//   //     `⬅️ ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | ${Date.now() - start}ms`
//   //   );
//   // });

//   next();
// });

// Workaround for Express 5 compatibility with express-mongo-sanitize
// Redefine req.query to be a writable property so that it can be mutated/assigned
app.use((req, res, next) => {
  if (req.query) {
    Object.defineProperty(req, 'query', {
      value: req.query,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  next();
});

// Prevent MongoDB Operator Injection (NoSQL Injection Sanitization)
app.use(mongoSanitize());




// Private routes (Moderate Rate Limit)
app.use('/api/user', privateLimiter, userRouter);
app.use('/api/bookings', privateLimiter, bookingRoutes);
app.use('/api/payment-gateway', privateLimiter, paymentRoutes);
app.use('/api/host', privateLimiter, hostRoutes);
app.use('/api/chat', privateLimiter, chatRoutes);

// Public routes (Generous Rate Limit)
app.use('/api/properties', publicLimiter, propertyRoutes);
app.use('/api/reviews', publicLimiter, reviewRoutes);

// Auth / OTP routes (Strict Rate Limit)
app.use('/api/auth', authLimiter, authRoutes);



const PORT = process.env.PORT || 6000
// app.listen(PORT, () => console.log(`Server running on PORT:-${PORT}`))
server.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
  // console.log(
  // 	"\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator",
  // );
  // console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});





cron.schedule("0 10 * * *", async () => {
  // cron.schedule("* * * * *", async () => {

  console.log("🚀 Running Booking-Earnings Cron Job at 10 AM IST...");

  try {
    const now = moment().tz("Asia/Kolkata").startOf("day");

    //  Find bookings whose checkout date < today & not completed yet
    const completedBookings = await Booking.find({
      checkOut: { $lte: now.toDate() },
      status: "UPCOMING",
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

        if (!hostEarningData) {
          await HostEarning.create({
            hostId: booking.hostId,
            earning: booking.amount
          });
        } else {
          hostEarningData.earning += booking.amount
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


//abhishek


app.use((err, req, res, next) => {

  const status = err.statusCode || 500;

  res.status(status).json({
    success: false,
    message: err.message
  });

  if (status >= 400) {

    const message = `
🚨  ERROR

Status: ${status}

Method: ${req.method}

Route: ${req.originalUrl}

IP: ${req.ip}

Time: ${new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}

Message:
${err.message}

Stack:
${err.stack}
`;

    setImmediate(() => {
      sendTelegramLog(message).catch(console.error);
    });
  }

});

//abhishek