import Booking from "../../models/Booking.js";
import Property from "../../models/Property.js";
import BaseRates from "../../models/BaseRate.js";
import Transaction from "../../models/Transaction.js";
import User from "../../models/User.js";
import Host from "../../models/Host.js";
import { sendBookingNotificationToHost } from "../../services/pushNotification.js";

export const walletPayment = async (req, res) => {
    try {
        const { amount, propertyId, adult, child, pet, startDate, endDate } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!amount || !propertyId || !adult || !startDate || !endDate) {
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
            return checkIn <= bookedEnd && checkOut >= bookedStart;
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
        const totalPrice = propertyPriceAllNights + gstInPrice + serviceFeeInPrice + cleaningFeePrice

        if (totalPrice !== amount) {
            return res.status(400).json({
                statusCode: 400,
                message: "Price mismatch. Property price may have changed.",
                data: null,
                error: null
            });
        }

        // Step 4: Verify and Deduct Wallet Balance
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                statusCode: 404,
                message: "User not found.",
                data: null,
                error: null
            });
        }

        if ((user.walletBalance || 0) < amount) {
            return res.status(400).json({
                statusCode: 400,
                message: `Insufficient wallet balance. You have ₹${user.walletBalance || 0} but need ₹${amount}.`,
                data: null,
                error: null
            });
        }

        user.walletBalance = (user.walletBalance || 0) - amount;
        await user.save();

        // Step 5: Create transaction
        const transaction = await Transaction.create({
            userId,
            hostId: property.hostId,
            propertyId: property._id,
            type: "BOOKING",
            numberOfNights,
            amount: propertyBaseCharge,
            gst: findBaseRates.gst,
            serviceFee: findBaseRates.serviceFee,
            totalAmount: amount,
            status: "SUCCESS",
            checkIn: checkIn,
            checkOut: checkOut,
            adult,
            child,
            pet,
            paymentReceivedFrom: "WALLET",
            transactionId: "T-W" + Date.now()
        });

        // Step 6: Create booking record (PENDING approval)
        const createBooking = await Booking.create({
            userId: userId,
            hostId: property.hostId,
            propertyId: property._id,
            transactionId: transaction._id,
            checkIn: startDate,
            checkOut: endDate,
            adult: adult,
            child: child,
            pet: pet,
            amount: propertyBaseCharge * numberOfNights,
            totalAmount: amount,
            status: "PENDING"
        });

        property.unavailability.push({
            bookingId: createBooking._id,
            startDate: startDate,
            endDate: endDate
        });

        await property.save();

        const fetchHost = await Host.findOne({
            _id: property.hostId
        });

        if (fetchHost) {
            await sendBookingNotificationToHost(fetchHost.fcmToken, {
                _id: createBooking._id,
                totalAmount: amount,
                propertyName: property.title
            });
        }

        return res.status(200).json({
            statusCode: 200,
            message: "Booking successful! Pending approval from Host.",
            data: {
                transactionId: transaction._id,
                numberOfNights,
                totalAmount: amount
            },
            error: null
        });

    } catch (error) {
        console.error("Error in walletPayment:", error);
        return res.status(500).json({
            statusCode: 500,
            message: "Internal Server Error",
            data: null,
            error: error.message
        });
    }
};
