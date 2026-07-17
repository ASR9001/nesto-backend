

import Razorpay from "razorpay";
import crypto from "crypto";
import Property from "../../models/Property.js";
import BaseRates from "../../models/BaseRate.js";
import Transaction from "../../models/Transaction.js";
import Booking from "../../models/Booking.js";
import Host from "../../models/Host.js";
import { sendBookingNotificationToHost } from "../../services/pushNotification.js";

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});




export const createRazorpayOrder = async (req, res) => {
    try {

        const { propertyId, adult, child, pet, startDate, endDate } = req.body;

        const userId = req.user.id;

        if (!propertyId || !adult || !startDate || !endDate) {
            return res.status(400).json({
                statusCode: 400,
                message: "Missing required fields.",
                data: null,
                error: null
            });
        }


        const property = await Property.findOne({ _id: propertyId });
        if (!property) {
            return res.status(404).json({
                statusCode: 404,
                message: "Property not found.",
                data: null,
                error: null
            });
        }


        const checkIn = new Date(startDate);
        const checkOut = new Date(endDate);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);



        if (checkOut <= checkIn) {
            return res.status(400).json({
                statusCode: 400,
                message: "End date must be after start date.",
                data: null,
                error: null
            });
        }


        // Step 1: Check availability window
        if (!property.availability.availableAllTheTime) {
            const availableStart = new Date(property.availability.startDate);
            const availableEnd = new Date(property.availability.endDate);
            availableStart.setHours(0, 0, 0, 0);
            availableEnd.setHours(0, 0, 0, 0);

            if (checkIn < availableStart || checkOut > availableEnd) {
                return res.status(400).json({
                    statusCode: 400,
                    message: "Selected dates are outside property's available range.",
                    data: null,
                    error: null
                });
            }
        }

        // Step 2: Check unavailability overlap
        const isUnavailable = property.unavailability.some(entry => {
            const bookedStart = new Date(entry.startDate);
            const bookedEnd = new Date(entry.endDate);
            bookedStart.setHours(0, 0, 0, 0);
            bookedEnd.setHours(0, 0, 0, 0);

            // Overlap check
            // return checkIn <= bookedEnd && checkOut >= bookedStart;
            return checkIn < bookedEnd && checkOut > bookedStart;

        });

        if (isUnavailable) {
            return res.status(400).json({
                statusCode: 400,
                message: "Property is unavailable during the selected date range.",
                data: null,
                error: null
            });
        }


        // Step 3: Pricing verification
        const findBaseRates = await BaseRates.findOne({});
        if (!findBaseRates) {
            throw new Error("Could not fetch base rates.");
        }

        const propertyBaseCharge = property.pricePerNight;
        const numberOfNights = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
        const propertyPriceAllNights = property.pricePerNight * numberOfNights
        const gstInPrice = (findBaseRates.gst * propertyPriceAllNights) / 100
        const serviceFeeInPrice = (findBaseRates.serviceFee * propertyPriceAllNights) / 100
        const cleaningFeePrice = (findBaseRates.cleaningFee * propertyPriceAllNights) / 100
        const exactTotalPrice = propertyPriceAllNights + gstInPrice + serviceFeeInPrice + cleaningFeePrice
        const totalPrice = Math.round(exactTotalPrice)


        function generateTxnId() {
            const now = new Date();

            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const hour = String(now.getHours()).padStart(2, "0");
            const minute = String(now.getMinutes()).padStart(2, "0");
            const second = String(now.getSeconds()).padStart(2, "0");
            const millisecond = String(now.getMilliseconds()).padStart(3, "0");

            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let randomPart = "";
            for (let i = 0; i < 3; i++) {
                randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            return `txn${year}${month}${day}${hour}${minute}${second}${millisecond}${randomPart}`;
        }


        const transaction = await Transaction.create({
            userId,
            hostId: property.hostId,
            propertyId: property._id,
            type: "BOOKING",
            numberOfNights,
            amount: propertyBaseCharge,
            gst: findBaseRates.gst,
            serviceFee: findBaseRates.serviceFee,
            totalAmount: Math.round(totalPrice),
            status: "PENDING",
            checkIn: checkIn,
            checkOut: checkOut,
            adult,
            child,
            pet,
            paymentReceivedFrom: "RAZORPAY",
            transactionId: generateTxnId()
        });



        const options = {
            amount: totalPrice * 100, // paise
            currency: "INR",
            receipt: transaction.transactionId,

        };

        const order = await razorpay.orders.create(options);

        transaction.razorpayOrderId = order.id;
        await transaction.save();


        return res.status(200).json({
            statusCode: 200,
            message: null,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID,
                receipt: order.receipt
            },
            error: null
        });



    } catch (error) {
        console.error("Error in razorpay Payment:", error);
        return res.status(500).json({
            statusCode: 500,
            message: "Internal Server Error",
            data: null,
            error: error.message
        });
    }
};


export const verifyRazorPayment = async (req, res) => {

    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            transactionId,
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                statusCode: 400,
                message: "Payment verification failed",
                data: null,
                error: null
            });
            // return res.status(400).json({ message: "Payment verification failed" });
        }




        const transaction = await Transaction.findOne({
            transactionId,
            status: "PENDING"
        });

        if (!transaction) {
            return res.status(400).json({ message: "Invalid transaction" });
        }




        // if (transaction.razorpayOrderId !== razorpay_order_id) {
        //     return res.status(400).json({
        //         statusCode: 400,
        //         message: "Payment verification failed",
        //         data: null,
        //         error: null
        //     });
        // }

        // Signature verification ke baad
        const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);

        const expectedAmountFromOrder = razorpayOrder.amount; // paise
        const expectedCurrency = razorpayOrder.currency;

        // DB ka amount (trusted)
        const dbAmount = transaction.totalAmount * 100;

        if (dbAmount !== expectedAmountFromOrder) {
            return res.status(400).json({
                statusCode: 400,
                message: "Amount mismatch",
                data: null,
                error: null
            });
        }

        if (expectedCurrency !== "INR") {
            return res.status(400).json({
                statusCode: 400,
                message: "Invalid currency",
                data: null,
                error: null
            });
        }


        const property = await Property.findOne({ _id: transaction.propertyId });
        if (!property) {
            return res.status(404).json({
                statusCode: 404,
                message: "Property not found.",
                data: null,
                error: null
            });
        }

        transaction.status = "SUCCESS"
        await transaction.save()




        const createBooking = await Booking.create({
            userId: transaction.userId,
            hostId: property.hostId,
            propertyId: property._id,
            transactionId: transaction._id,
            checkIn: transaction.checkIn,
            checkOut: transaction.checkOut,
            adult: transaction.adult,
            child: transaction.child,
            pet: transaction.pet,
            amount: transaction.amount * transaction.numberOfNights,
            totalAmount: transaction.totalAmount,
            status: "PENDING"
        });

        property.unavailability.push({
            bookingId: createBooking._id,
            startDate: transaction.checkIn,
            endDate: transaction.checkOut
        });


        await property.save();

        const fetchHost = await Host.findOne({
            _id: property.hostId
        });

        if (fetchHost) {
            await sendBookingNotificationToHost(fetchHost.fcmToken, {
                _id: createBooking._id,
                totalAmount: transaction.totalAmount,
                propertyName: property.title
            });
        }



        return res.status(200).json({
            statusCode: 200,
            message: "Payment Successful 🎉",
            data: null,
            error: null
        });

    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            message: "Internal Server Error",
            data: null,
            error: error.message
        });
    }
};
