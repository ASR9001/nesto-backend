import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import { ObjectId } from 'mongodb';
import Refund from '../models/Refund.js';
import Host from '../models/Host.js';
import BaseRates from '../models/BaseRate.js';
import Transaction from '../models/Transaction.js';

//not in use abhishek
export const createBooking = async (req, res) => {
  const userId = req.user._id; // from auth middleware
  const { propertyId, checkIn, checkOut, guests, totalPrice } = req.body;

  try {
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    // Check for date conflicts
    const isBooked = property.bookings.some(booking =>
      new Date(booking.checkIn) < new Date(checkOut) &&
      new Date(booking.checkOut) > new Date(checkIn)
    );
    if (isBooked) return res.status(400).json({ message: 'Property not available for selected dates' });

    // Save booking in Booking model
    const booking = await Booking.create({
      user: userId,
      property: propertyId,
      checkIn,
      checkOut,
      guests,
      totalPrice,
    });

    // Add to property’s bookings
    property.bookings.push({ checkIn, checkOut });
    await property.save();

    res.status(201).json(booking);

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
};



export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.aggregate(
      [
        {
          $match: {
            userId: new ObjectId(
              userId
            )
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        },
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "property"
          }
        },
        {
          $unwind: {
            path: "$property"
          }
        },
        {
          $project: {
            userId: 1,
            hostId: 1,
            propertyId: 1,
            transactionId: 1,
            checkIn: 1,
            checkOut: 1,
            adult: 1,
            child: 1,
            pet: 1,
            amount: 1,
            totalAmount: 1,
            status: 1,
            createdAt: 1,
            // refundStatus:"PROCESSED",
            updatedAt: 1,
            propertyTitle: "$property.title",
            propertyType: "$property.type",
            propertyLocation: "$property.location",
            propertyImage: {
              $arrayElemAt: ["$property.images", 0]
            }
          }
        },
        {
          $group: {
            _id: "$status",
            bookings: {
              $push: "$$ROOT"
            }
          }
        }
      ]
    )



    const baseUrl = process.env.PUBLIC_CLOUDINARY_BASE_URL;
    const extension = process.env.PUBLIC_CLOUDINARY_IMAGE_EXTENSION;

    const updatedBookings = bookings.map(group => {
      return {
        _id: group._id,
        bookings: group.bookings.map(booking => {
          return {
            ...booking,
            propertyImage: booking.propertyImage
              ? `${baseUrl}/${booking.propertyImage}${extension}`
              : null
          };
        })
      };
    });




    return res.status(200).json({
      statusCode: 200,
      message: "Booking details fetch successfully.",
      data: updatedBookings,
      error: null
    })
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      statusCode: 500,
      message: error.message,
      data: null,
      error: error
    })
  }
};



export const cancelBooking = async (req, res) => {
  try {

    const { bookingId } = req.body;
    const userId = req.user.id;

    if (!bookingId) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Booking id not provided.',
        data: null,
        error: null
      });
    }


    const findBooking = await Booking.findOne({
      _id: new ObjectId(bookingId)
    })

    if (!findBooking) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Booking not found',
        data: null,
        error: null
      });
    }


    // Only allow user to cancel their own booking
    if (findBooking.userId.toString() !== userId) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Not authorized to cancel this booking',
        data: null,
        error: null
      });
    }

    const now = new Date();
    const checkInDate = new Date(findBooking.checkIn);
    const timeDiffInHours = (checkInDate - now) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (timeDiffInHours >= 72) {
      refundPercentage = 100;
    } else if (timeDiffInHours >= 24) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }


    const refundAmount = (findBooking.totalAmount || 0) * (refundPercentage / 100);
    await Refund.create({
      bookingId: findBooking._id,
      userId: findBooking.userId,
      refundPercentage,
      refundAmount,
      cancelledAt: now
    });

    findBooking.refundStatus = "UNPROCESSED"
    findBooking.status = "CANCELLED"
    findBooking.cancelledBy = "USER"
    await findBooking.save()


    await Property.updateOne(
      { _id: findBooking.propertyId },
      {
        $pull: {
          unavailability: {
            bookingId: findBooking._id
          }
        }
      }
    );

    return res.status(200).json({
      statusCode: 200,
      message: 'Booking cancelled successfully',
      data: {
        refundPercentage,
        refundAmount
      },
      error: null
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);

    return res.status(500).json({
      statusCode: 500,
      message: 'Failed to cancel booking',
      data: null,
      error: error
    });
  }
};



export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('property', 'title');

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};



export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({ message: 'Booking status updated', booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Failed to update booking status' });
  }
};

export const getAllHostBooking = async (req, res) => {
  try {
    const hostId = req.hostInfo.id
    const fetchBooking = await Booking.aggregate(
      [
        {
          $match: {
            hostId: new ObjectId(
              hostId
            )
          }
        },
        {
          $sort: {
            checkIn: 1
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "property"
          }
        },
        {
          $unwind: {
            path: "$property"
          }
        },
        {
          $unwind: {
            path: "$user"
          }
        },
        {
          $project: {
            userId: 1,
            propertyId: 1,
            checkIn: 1,
            checkOut: 1,
            adult: 1,
            child: 1,
            pet: 1,
            price: "$amount",
            status: 1,
            propertyName: "$property.title",
            propertyLocation: {
              $concat: [
                "$property.location.address",
                " ",
                "$property.location.city"
              ]
            },
            guestName: {
              $concat: [
                "$user.first_name",
                " ",
                "$user.last_name"
              ]
            },
            daterange: {
              $concat: [
                {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$checkIn"
                  }
                },
                " to ",
                {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$checkOut"
                  }
                }
              ]
            }
          }
        }
      ]

    )




    if (!fetchBooking) {
      return res.status(200).json({
        statusCode: 200,
        message: "No Booking found",
        data: [],
        error: null
      })
    }



    return res.status(200).json({
      statusCode: 200,
      message: "Booking fetch successfully.",
      data: { fetchBooking },
      error: null
    })



  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: error.message,
      data: null,
      error: error
    })
  }
}


export const getHome = async (req, res) => {
  try {
    const hostId = req.hostInfo.id
    const fetchBooking = await Booking.aggregate(
      [
        {
          $match: {
            hostId: new ObjectId(
              hostId
            ),
            status: "UPCOMING"
          }
        },
        {
          $sort: {
            checkIn: 1
          }
        },
        {
          $limit:

            3
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "property"
          }
        },
        {
          $unwind: {
            path: "$property"
          }
        },
        {
          $unwind: {
            path: "$user"
          }
        },
        {
          $project: {
            userId: 1,
            propertyId: 1,
            checkIn: 1,
            checkOut: 1,
            adult: 1,
            child: 1,
            pet: 1,
            price: "$amount",
            status: 1,
            propertyName: "$property.title",
            propertyLocation: {
              $concat: [
                "$property.location.address",
                " ",
                "$property.location.city"
              ]
            },
            guestName: {
              $concat: [
                "$user.first_name",
                " ",
                "$user.last_name"
              ]
            },
            daterange: {
              $concat: [
                {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$checkIn"
                  }
                },
                " to ",
                {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$checkOut"
                  }
                }
              ]
            }
          }
        }
      ]

    )




    if (!fetchBooking) {
      return res.status(200).json({
        statusCode: 200,
        message: "No Booking found",
        data: [],
        error: null
      })
    }


    const hostEarning = await Host.aggregate(
      [
        {
          $match: {
            _id: new ObjectId(hostId)
          }
        },
        {
          $lookup: {
            from: "hostearnings",
            localField: "_id",
            foreignField: "hostId",
            as: "earning"
          }
        },
        {
          $unwind: {
            path: "$earning"
          }
        },
        {
          $project: {
            email: 1,
            firstName: 1,
            lastName: 1,
            profilePic: 1,
            earning: "$earning.earning",
            totalWithdrawal: "$earning.totalWithdrawal"
          }
        }
      ]

    )

    return res.status(200).json({
      statusCode: 200,
      message: "Booking fetch successfully.",
      data: { fetchBooking, hostEarning },
      error: null
    })



  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: error.message,
      data: null,
      error: error
    })
  }
}



//working user controller
export const fetchBookingCharges = async (req, res) => {
  try {

    const { propertyId, nights, guests } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Property Id is missing",
        data: null,
        error: null
      })
    }


    if (!guests) {
      return res.status(400).json({
        statusCode: 400,
        message: "Number of guests is missing",
        data: null,
        error: null
      })
    }


    if (!nights) {
      return res.status(400).json({
        statusCode: 400,
        message: "Number of night is missing",
        data: null,
        error: null
      })
    }

    const fetchProperty = await Property.findOne({ _id: propertyId })


    if (!fetchProperty) {
      return res.status(400).json({
        statusCode: 400,
        message: "Property not found",
        data: null,
        error: null
      })
    }

    if (fetchProperty.guestCapacity < Number(guests)) {
      return res.status(400).json({
        statusCode: 400,
        message: `The property can accommodate up to ${fetchProperty.guestCapacity} guests. You cannot add more than that.`,
        data: null,
        error: null
      });
    }


    const fetchBaseRate = await BaseRates.findOne({})


    if (!fetchBaseRate) {
      return res.status(400).json({
        statusCode: 400,
        message: "Base Rate not found",
        data: null,
        error: null
      })
    }




    const propertyPrice = fetchProperty.pricePerNight
    const propertyPriceAllNights = fetchProperty.pricePerNight * nights
    const gstInPrice = (fetchBaseRate.gst * propertyPriceAllNights) / 100
    const serviceFeeInPrice = (fetchBaseRate.serviceFee * propertyPriceAllNights) / 100
    const cleaningFeePrice = (fetchBaseRate.cleaningFee * propertyPriceAllNights) / 100
    const totalPrice = propertyPriceAllNights + gstInPrice + serviceFeeInPrice + cleaningFeePrice

    const data = {
      propertyPrice,
      propertyPriceAllNights,
      gstInPrice,
      serviceFeeInPrice,
      cleaningFeePrice,
      totalPrice
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Booking Charges fetch successfully",
      data: data,
      error: null
    })



  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: error.message,
      data: null,
      error: error
    })
  }
}



export const fetchTransaction = async (req, res) => {
  try {


    const userId = req.user.id;

    const transactionData = await Transaction.aggregate(
      [
        {
          $match: {
            userId: new ObjectId(userId),
            status: "SUCCESS"
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        },
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "property"
          }
        },
        {
          $unwind: {
            path: "$property"
          }
        },
        {
          $project:
          /**
           * specifications: The fields to
           *   include or exclude.
           */
          {
            _id: 1,
            type: 1,
            numberOfNights: 1,
            totalAmount: 1,
            status: 1,
            checkIn: 1,
            checkOut: 1,
            adult: 1,
            child: 1,
            pet: 1,
            createdAt: 1,
            title: "$property.title",
            location: "$property.location.city",
            propertyId: 1
          }
        }
      ]
    )


    if (!transactionData) {
      return res.status(200).json({
        statusCode: 200,
        message: "Empty Transaction fetch successfully",
        data: [],
        error: null
      })
    }


    return res.status(200).json({
      statusCode: 200,
      message: "Transaction fetch successfully",
      data: transactionData,
      error: null
    })



  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: error.message,
      data: null,
      error: error
    })
  }
}




export const cancelBookingByHost = async (req, res) => {
  try {

    const { bookingId , reason} = req.body;
    const hostId = req.hostInfo.id;

    if (!bookingId) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Booking id not provided.',
        data: null,
        error: null
      });
    }
    if (!reason) {
      return res.status(400).json({
        statusCode: 400,
        message: 'reason not provided.',
        data: null,
        error: null
      });
    }


    const findBooking = await Booking.findOne({
      _id: new ObjectId(bookingId)
    })

    if (!findBooking) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Booking not found',
        data: null,
        error: null
      });
    }


    // Only allow host to cancel their own booking
    if (findBooking.hostId.toString() !== hostId) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Not authorized to cancel this booking',
        data: null,
        error: null
      });
    }

    // const checkInDate = new Date(findBooking.checkIn);
    // const timeDiffInHours = (checkInDate - now) / (1000 * 60 * 60);

    // if (timeDiffInHours >= 72) {
    //   refundPercentage = 100;
    // } else if (timeDiffInHours >= 24) {
    //   refundPercentage = 50;
    // } else {
    //   refundPercentage = 0;
    // }


    const now = new Date();
    const refundPercentage = 100;
    const refundAmount = (findBooking.totalAmount || 0) * (refundPercentage / 100);
    await Refund.create({
      bookingId: findBooking._id,
      userId: findBooking.userId,
      refundPercentage,
      refundAmount,
      cancelledAt: now
    });

    findBooking.refundStatus = "UNPROCESSED"
    findBooking.status = "CANCELLED"
    findBooking.cancelledBy = "HOST"
    findBooking.reason = reason
    await findBooking.save()


    await Property.updateOne(
      { _id: findBooking.propertyId },
      {
        $pull: {
          unavailability: {
            bookingId: findBooking._id
          }
        }
      }
    );

    return res.status(200).json({
      statusCode: 200,
      message: 'Booking cancelled successfully',
      data: {
        refundPercentage,
        refundAmount
      },
      error: null
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);

    return res.status(500).json({
      statusCode: 500,
      message: 'Failed to cancel booking',
      data: null,
      error: error
    });
  }
};