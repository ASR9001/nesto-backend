import mongoose from 'mongoose';
import moment from 'moment-timezone';
const Schema = mongoose.Schema;

const HostWithdrawHistorySchema = new Schema(
   {
      hostId: {
         type: Schema.Types.ObjectId,
         required: true,
      },
      totalSecurityAmount:{
        type: Number,
        default: 0,
      },
      withdrawAmount: {
         type: Number,
         default: 0,
      },
      withdrawDate:{
         type: Date,
         default: () => moment().tz("Asia/Kolkata").toDate(),
      }
   },
   {
      timestamps: true,
   },
);


export const HostWithdrawHistory = mongoose.model("HostWithdrawHistory", HostWithdrawHistorySchema);


