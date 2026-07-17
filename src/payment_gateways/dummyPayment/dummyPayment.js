import Booking from "../../models/Booking.js";
import Property from "../../models/Property.js";
import BaseRates from "../../models/BaseRate.js";
import Transaction from "../../models/Transaction.js";
import Host from "../../models/Host.js";
import axios from "axios";
import { sendBookingNotificationToHost } from "../../services/pushNotification.js";

// export const dummyPayment = async (req, res) => {
//     try {
//         const { amount, propertyId, adult, child, pet, startDate, endDate } = req.body;
//         const userId = req.user.id;
//         if (!amount || !propertyId || !adult || !startDate || !endDate) {
//             return res.status(400).json({
//                 statusCode: 400,
//                 message: "Missing required fields.",
//                 data: null,
//                 error: null
//             });
//         }

//         const property = await Property.findOne({ _id: propertyId });
//         if (!property) {
//             return res.status(404).json({
//                 statusCode: 404,
//                 message: "Property not found.",
//                 data: null,
//                 error: null
//             });
//         }

//         const requestedDate = new Date(date);
//         requestedDate.setHours(0, 0, 0, 0); // Normalize

//         // Step 1: Check availability window
//         if (!property.availability.availableAllTheTime) {
//             const { startDate, endDate } = property.availability;

//             if (!startDate || !endDate) {
//                 return res.status(400).json({
//                     statusCode: 400,
//                     message: "Property availability dates are not properly set.",
//                     data: null,
//                     error: null
//                 });
//             }

//             const start = new Date(startDate);
//             const end = new Date(endDate);
//             start.setHours(0, 0, 0, 0);
//             end.setHours(0, 0, 0, 0);

//             if (requestedDate < start || requestedDate > end) {
//                 return res.status(400).json({
//                     statusCode: 400,
//                     message: "Date is outside the property's available range.",
//                     data: null,
//                     error: null
//                 });
//             }
//         }

//         // Step 2: Check unavailability
//         const isUnavailable = property.unavailability.some(entry => {
//             const start = new Date(entry.startDate);
//             const end = new Date(entry.endDate);
//             start.setHours(0, 0, 0, 0);
//             end.setHours(0, 0, 0, 0);

//             return requestedDate >= start && requestedDate <= end;
//         });

//         if (isUnavailable) {
//             return res.status(400).json({
//                 statusCode: 400,
//                 message: "Property is unavailable on the selected date.",
//                 data: null,
//                 error: null
//             });
//         }

//         // ✅ All good — proceed with payment or booking abhishek

//         const findBaseRates = await BaseRates.find({})

//         if (!findBaseRates) {
//             throw new Error("Something went wrong. Please try again.")
//         }

//         //verify booking amount with property amount 

//         const propertyBaseCharge = property.pricePerNight;
//         const gst = findBaseRates.gst;
//         const serviceFee = findBaseRates.serviceFee;

//         const originalAmount = propertyBaseCharge + (propertyBaseCharge * (gst / 100)) + (propertyBaseCharge * (serviceFee / 100))

//         if (originalAmount !== amount) {
//             return res.status(404).json({
//                 statusCode: 404,
//                 message: "Failed to book this property. Price per Night is changed by the Host.",
//                 data: null,
//                 error: null
//             })
//         }

//         const checkIn = new Date(checkInDate);
//         const checkOut = new Date(checkOutDate);

//         // Normalize both to start of day to avoid time issues
//         checkIn.setHours(0, 0, 0, 0);
//         checkOut.setHours(0, 0, 0, 0);

//         // Calculate difference in milliseconds
//         const timeDiff = checkOut - checkIn;

//         // Convert to number of nights (days)
//         const numberOfNights = timeDiff / (1000 * 60 * 60 * 24);

//         const transaction = await Transaction.create({
//             userId: userId,
//             hostId: property.hostId,
//             propertyId: property._id,
//             type: "BOOKING",
//             numberOfNights: numberOfNights,
//             amount: propertyBaseCharge,
//             gst: gst,
//             serviceFee: serviceFee,
//             totalAmount: amount,
//             status: "SUCCESS",
//             checkIn: startDate,
//             checkOut: endDate,
//             adult: adult,
//             child: child,
//             pet: pet,
//             transactionId: "T02626524841515"

//         })


//         const createBooking = await Booking.create({
//             userId: userId,
//             propertyId: property._id,
//             transactionId: transaction._id
//         })


//     } catch (error) {
//         console.error("Error in dummyPayment:", error);
//         return res.status(500).json({
//             statusCode: 500,
//             message: "Internal Server Error",
//             data: null,
//             error: error.message
//         });
//     }
// };


export const dummyPayment = async (req, res) => {
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



        // const gst = findBaseRates.gst;
        // const serviceFee = findBaseRates.serviceFee;

        // const oneNightPrice = propertyBaseCharge + (propertyBaseCharge * gst / 100) + (propertyBaseCharge * serviceFee / 100);

        // const calculatedTotal = oneNightPrice * numberOfNights;

        if (totalPrice !== amount) {
            return res.status(400).json({
                statusCode: 400,
                message: "Price mismatch. Property price may have changed.",
                data: null,
                error: null
            });
        }

        // Step 4: Create transaction
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
            paymentReceivedFrom: "DUMMY",
            transactionId: "T" + Date.now()
        });

        // Step 5: Create booking record
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


           res.status(200).json({
            statusCode: 200,
            message: "Booking successful!",
            data: {
                transactionId: transaction._id,
                numberOfNights,
                totalAmount: amount
            },
            error: null
        });


    } catch (error) {
        console.error("Error in dummyPayment:", error);
        return res.status(500).json({
            statusCode: 500,
            message: "Internal Server Error",
            data: null,
            error: error.message
        });
    }
};
