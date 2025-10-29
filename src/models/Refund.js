
import mongoose from 'mongoose';
const Schema = mongoose.Schema;


const refundSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },
        refundPercentage:{
            type:Number,
            required:true
        },
        refundAmount:{
            type:Number,
            required:true
        },
        cancelledAt:{
            type:Date,
            required:true
        },
        cancelBy:{
            type:String,
            required:false,
            default:"USER"
        }

    },
    {
        timestamps: true,
    }
);



const Refund = mongoose.model('Refund', refundSchema);
export default Refund;


