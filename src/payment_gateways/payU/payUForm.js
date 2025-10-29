import Booking from "../../models/Booking.js";
import Property from "../../models/Property.js";
import Transaction from "../../models/Transaction.js";
import User from "../../models/User.js";


function calculateHash(key, txnid, amount, productinfo, firstname, email, salt, udf1 = "", udf2 = "", udf3 = "", udf4 = "", udf5 = "") {
   const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
   const hash = createHash("sha512").update(hashString).digest("hex");
   return hash;
}

const generatePayuHash = (key, txnid, amount, productinfo, firstname, email, salt, udf1 = "", udf2 = "", udf3 = "", udf4 = "", udf5 = "") => {
   const hash = payuClient.hasher.generatePaymentHash({
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
      udf5
   });

   return hash;
}

function generateTransactionId() {
   const uniqueId = uuidv4();
   const currentTime = Math.floor(Date.now() / 1000).toString();
   const randomChars = Math.random().toString(36).substring(7);
   const concatenatedString = uniqueId + currentTime + randomChars;
   const hashedString = createHash("sha256").update(concatenatedString).digest("hex");
   const transactionId = "T0" + hashedString.substring(0, 15).toLocaleUpperCase();
   return transactionId;
}

export const payUForm = async (req, res) => {
   try {


      const {amount , propertyId , guest , checkIn , checkOut} = req.body;


      if (req.user && req.user.id && amount) {
         const user = await User.findById(req.user.id);
         if (user) {

            const property = await Property.findOne({ propertyId: propertyId });
            const getBaseRate = await BaseRates.findOne({});
            // let finalAmount = Math.round(((amount * (getBaseRate.serviceFee / 100)) * getBaseRate.gst) / 100 + amount + amount * (getBaseRate.serviceFee / 100)) ;
            const baseRate = (getBaseRate.serviceFee / 100) ;
            const fees = amount * baseRate;
            const gstAmount = fees * (getBaseRate.gst / 100);
            const finalAmount = Math.round(amount + fees + gstAmount);

            const transactionId = generateTransactionId();
            const hash = generatePayuHash(process.env.PAYU_MERCHANT_KEY, transactionId, finalAmount, "booking", user.first_name, user.email, process.env.PAYU_MERCHANT_SALT);
            const paymentDate = moment().tz('Asia/Kolkata').toDate();


         

            const transactionRecord = await Transaction.create({
               userId: user._id,
               hostId:property.hostId,
               propertyId: property._id,
               numberOfNights:5,
               amount: Math.round(req.body.amount),
               totalAmount: Math.round(finalAmount),
               gst: gstAmount,
               serviceFee: fees,
               status: "PENDING",
               checkIn:checkIn,
               checkOut:checkOut,
               guest:guest,
               paymentReceivedFrom: "PAYU",
               transactionId: transactionId,
               paymentDate: paymentDate,
             
            });


           


            if (hash && transactionRecord) {

               const surl = `${process.env.BACKEND_BASE_URL}/api/payment-gateway/pay-u/success`
               const furl = `${process.env.BACKEND_BASE_URL}/api/payment-gateway/pay-u/failure`
               return res.status(200).json({ statusCode: 200, key: process.env.PAYU_MERCHANT_KEY, transactionId, hash, amount: finalAmount, productInfo: "booking", firstname: user.first_name, email: user.email, salt: process.env.PAYU_MERCHANT_SALT, surl, furl });
            }

            return res.status(500).json({ message: "hash generation failed", requestId: req.locals.id });
         }
         return res.status(400).json({ message: "user not found", requestId: req.locals.id });
      }
      return res.status(500).json({ message: "invalid request data" });
   } catch (error) {
      res.locals.level = "ERROR"
      res.locals.error = error
      return res.status(500).json({ message: error.message, requestId: req.locals.id, });
   }
};
