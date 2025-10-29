
import mongoose from 'mongoose';
const Schema = mongoose.Schema;


const hostBankDetailSchema = new Schema(
    {
        hostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Host',
            required: true,
            unique:true
        },
        accountHolderName: {
            type: String,
            required: true,
        },
        accountNumber: {
            type: String,
            required: true,
        },
        bankName: {
            type: String,
            required: true,
        },
        ifscCode: {
            type: String,
            required: true,
        },
        upiId: {
            type: String,
            required: false,
        },


    },
    {
        timestamps: true,
    }
);



const hostBankDetail = mongoose.model('hostBankDetail', hostBankDetailSchema);
export default hostBankDetail;


