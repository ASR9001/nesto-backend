import mongoose from 'mongoose';
import { type } from 'os';

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Host',
        required: true
    },
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },

    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    adult: {
        type: Number,
        required: true
    },
    child: {
        type: Number,
        required: true
    },
    pet: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    hasReviewed: {
        type: Boolean,
        required: false,
        default: false
    },
    refundStatus: {
        type: String,
        enum: ['NOT_REQUIRED', 'UNPROCESSED', 'PROCESSED'],
        default: 'NOT_REQUIRED'
    },
    status: {
        type: String,
        default: 'UPCOMING',
        enum: ['UPCOMING', 'CANCELLED', 'COMPLETED']
    },
    cancelledBy: {
        type: String,
        default: null,
        required: false,
        enum: ["USER", "HOST"]
    },
    reason: {
        type: String,
        required: false
    }
}, {
    timestamps: true,
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;

