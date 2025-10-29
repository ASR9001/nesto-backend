
import mongoose from 'mongoose';
const Schema = mongoose.Schema;


const HostEarningSchema = new Schema(
    {

        hostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Host',
            required: true
        },
        earning: {
            type: Number,
            default: 0
        },
        totalWithdrawal: {
            type: Number,
            default: 0
        },
        totalSecurityAmountLeft: {
            type: Number,
            default: 0
        }


    },
    {
        timestamps: true,
    }
);



const HostEarning = mongoose.model('HostEarning', HostEarningSchema);
export default HostEarning;


