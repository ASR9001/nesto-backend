import HostEarning from "../models/HostEarning";
import { HostWithdrawHistory } from "../models/HostWithdrawHistory";



export const hostPayout = async (req, res, next) => {
    try {

        const { hostId, payoutAmount, newSecurityAmount } = req.body;

        if (!hostId) {
            return res.status(400).json({
                statusCode: 400,
                message: "hostId not provided.",
                data: null,
                error: null
            })
        }

        
        if (!payoutAmount) {
            return res.status(400).json({
                statusCode: 400,
                message: "Payout Amount not provided.",
                data: null,
                error: null
            })
        }
        if (!newSecurityAmount) {
            return res.status(400).json({
                statusCode: 400,
                message: "ecurity Amount not provided.",
                data: null,
                error: null
            })
        }


        const findEarning = await HostEarning.findOne({ hostId: hostId });
        if (!findEarning) {
            return res.status(400).json({
                statusCode: 400,
                data: null,
                message: "Host is Not Eligible for payout.",
                error: null,
                requestId: req.locals.id

            });
        }

        if ((newSecurityAmount + totalAmount) > earning) {
            return res.status(400).json({
                statusCode: 400,
                data: null,
                message: "Amount is not correct",
                error: null,
                requestId: req.locals.id

            });
        }

        findEarning.earning = 0
        findEarning.totalSecurityAmountLeft = newSecurityAmount
        findEarning.totalWithdrawal += totalAmount
        await findEarning.save()


        const createWithdrawHistory = await HostWithdrawHistory.create({
            hostId: req.body.creator_id,
            totalSecurityAmount: newSecurityAmount,
            withdrawAmount: totalAmount,
        });


        return res.status(200).json({
            statusCode: 200,
            data: null,
            message: "Payout done successfully",
            error: null,
            requestId: req.locals.id

        });



    } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}