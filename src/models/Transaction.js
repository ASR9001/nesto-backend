
import mongoose from 'mongoose';
const Schema = mongoose.Schema;


const transactionSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        hostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Host',
            required: true,
        },
        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
        },
        type: {
            type: String,
            default: "BOOKING"
        },
        numberOfNights: {
            type: Number,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        gst: {
            type: Number,
            required: true
        },
        serviceFee: {
            type: Number,
            required: true
        },
        totalAmount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            required: true,
            enum: ["PENDING", "SUCCESS"]
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
        paymentReceivedFrom: {
            type: String,
            required: true,
            enum: ["PAYU" , 'DUMMY' , 'RAZORPAY']
        },
        transactionId: {
            type: String,
            required: true,
        },
        paymentDate: {
            type: Date,
        }
    },
    {
        timestamps: true,
    }
);



const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;


