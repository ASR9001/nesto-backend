import express from 'express';
import { protect  , isAdmin} from '../middleware/authMiddleware.js';
import { createBooking, getUserBookings } from '../controllers/bookingController.js';
import { cancelBooking } from '../controllers/bookingController.js';
import { getAllBookings } from '../controllers/bookingController.js';
import { updateBookingStatus } from '../controllers/bookingController.js';

const router = express.Router();




// router.delete('/:id', protect, cancelBooking); // DELETE /api/bookings/:id


// router.get('/', protect, isAdmin, getAllBookings); // GET /api/bookings (Admin only)


// router.put('/:id/status', protect, isAdmin, updateBookingStatus); // PUT /api/bookings/:id/status



export default router;
