// import { Transaction } from "../../models/Transaction";

// export const payUFailureHandler = async (req, res) => {
//     try {
//         res.locals.level = "INFO"

//         const transactionDetails = await Transaction.findOne({
//             transaction_id: req.body.txnid,
//         })

//         // return res.status(200).send()
//         return res.redirect(`${process.env.FRONTEND_BASE_URL}/${transactionDetails.payment_for_creator}/chatsection`);

//     } catch (error) {
//         res.locals.level = "ERROR"
// 		res.locals.error = error
//     }
// };