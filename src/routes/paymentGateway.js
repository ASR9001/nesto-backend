import express from 'express';
// import { payUForm } from '../payment_gateways/payU/payUForm.js';
import { userVerifyToken } from '../middleware/userVerifyToken.js';
import { dummyPayment } from '../payment_gateways/dummyPayment/dummyPayment.js';
import { createRazorpayOrder, verifyRazorPayment } from '../payment_gateways/razorpay/razorpay.js';
// import { payUSuccessHandler } from '../payment_gateways/payU/payUSuccessHandler.js';

const router = express.Router();


// router.get("/", PaymentGatewayController.getAllPaymentGateways);


const minimumRecharge =(req,res,next)=>{
   try {
      const {amount} = req.body
      if(amount<100){
          return res.status(400).json({message:"Minimum recharge amount is 100"})
      }
      next()

   } catch (error) {

     return res.status(500).json({message:"Internal server error"})
   }
}


router.post('/dummy-payment' ,userVerifyToken, dummyPayment)
router.post('/razorpay/create-razorpay-order' ,userVerifyToken, createRazorpayOrder)
router.post('/razorpay/verify-razorpay-order' ,userVerifyToken, verifyRazorPayment)


//payU
// router.post('/pay-u/form',userVerifyToken , payUForm)
// router.post('/pay-u/success',payUSuccessHandler)
// router.post('/pay-u/failure',payUFailureHandler)

export default router;
