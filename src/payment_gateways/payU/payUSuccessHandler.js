import { User } from "../../models/Users";
import { Wallet } from "../../models/Wallet";
import { Transaction } from "../../models/Transaction";
import { adminCommissionHistory } from "../../models/adminCommissionRevenueHistory";
import { CreatorBotSetting } from "../../models/CreatorBotSetting";
import { Creator } from "../../models/Creator";
import { AdminEarningAfterRevenueManagement } from "../../models/AdminEarningAfterRevenueManagement";
import { payuClient } from "../config";
import { generateInvoice } from "../../utilities/generate_invoice";
import { uploadFile } from "../../utilities/s3";
import { UserInvoice } from "../../models/userInvoice";
import { sendInvoiceEmail } from "../../utilities/email_invoive";
import { SubscriptionForAccess } from "../../models/SubscriptionForAccess";
import { newAgency } from "../../models/newAgency";
import { CreatorEarning } from "../../models/creatorEarning";
import { CreatorRevenueHistory } from "../../models/CreatorRevenueHistory";
import { ObjectId } from 'mongodb';
import { AgencyRevenueHistory } from "../../models/AgencyRevenueHistory";
import { SubscriptionRevenueManagement } from "../../models/SubscriptionRevenueManagement";
import { CreatorReferral } from "../../models/CreatorReferral";
import Booking from "../../models/Booking.js";
import HostEarning from "../../models/HostEarning";

const ENV = global.ENV


const validateReverseHash = async (transactionInfo) => {

    const { key, txnid, amount, productinfo, firstname, email, salt, udf1, udf2, udf3, udf4, udf5, status, hash } = transactionInfo

    const isValidHash = await payuClient.hasher.validateResponseHash({
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        salt,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
        status,
        hash
    })

    return isValidHash

}

const validatePaymentStatus = async (transactionId) => {

    const status = await payuClient.verifyPayment(transactionId)



    return status.transaction_details[transactionId].status === "success"
}


export const payUSuccessHandler = async (req, res) => {
    try {



        let updateTransaction;


        const isValidHash = await validateReverseHash(req.body)

        const paymentType = req.body.mode

        const isPaymentSuccess = await validatePaymentStatus(req.body.txnid)


        if (isValidHash && isPaymentSuccess) {
            const isUserExist = await User.findOne({ email: req.body.email });
            if (isUserExist) {
                updateTransaction = await Transaction.findOneAndUpdate(
                    { transactionId: req.body.txnid, status: "pending" },
                    {
                        status: "success",
                    },
                    { new: true },
                );


                if (updateTransaction) {
                    const createBooking = await Booking.create({
                        userId: updateTransaction.userId,
                        propertyId: updateTransaction.propertyId,
                        checkIn: updateTransaction.checkIn,
                        checkOut: updateTransaction.checkOut,
                        guest: updateTransaction.guest,
                        transactionId:updateTransaction.transactionId,
                        amount:updateTransaction.amount,
                        totalAmount: updateTransaction.totalAmount

                    })

                    const findHostEarning = await HostEarning.findOne({
                        hostId:updateTransaction.hostId
                    })

                    if(!findHostEarning){
                        await HostEarning.create({
                            hostId:updateTransaction.hostId,
                            earning:updateTransaction.amount
                        })

                    }

                    findHostEarning.earning +=  updateTransaction.amount;
                    await findHostEarning.save()



            }






            }
        }
    } catch (error) {
        res.locals.level = "ERROR"
        res.locals.error = error
    }
};
