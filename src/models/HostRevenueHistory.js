
import mongoose from 'mongoose';
const Schema = mongoose.Schema;


const HostRevenueHistorySchema = new Schema(
    {

        hostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Host',
            required: true
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },
        earning: {
            type: Number,
            default: 0,
            required: true,
        },

    },
    {
        timestamps: true,
    }
);



const HostRevenueHistory = mongoose.model('HostRevenueHistory', HostRevenueHistorySchema);
export default HostRevenueHistory;


