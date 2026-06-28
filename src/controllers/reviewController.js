import Review from '../models/reviewModel.js';
import { ObjectId } from 'mongodb';
import Property from '../models/Property.js';
import { generateSignedCloudfrontUrl } from '../services/utilities/s3.js';
import Booking from '../models/Booking.js';


export const createReview = async (req, res) => {
  try {
    const { rating, comment, bookingId, propertyId } = req.body;
    const userId = req.user.id

    // const existingReview = await Review.findOne({
    //   user: userId,
    //   property: propertyId,
    // });

    // if (existingReview) {
    //   return res.status(400).json({
    //     statusCode: 400,
    //     message: "You have already reviewed this property",
    //     data: null,
    //     error: null
    //   });
    // }

    const review = await Review.create({
      user: userId,
      property: propertyId,
      rating,
      comment,
    });


    // await Booking.findOneAndUpdate({
    //   propertyId: propertyId
    // }, { hasReviewed: true })


    await Booking.findOneAndUpdate(
  { propertyId },
  { hasReviewed: true },
  {
    sort: { createdAt: -1 }, // latest document
    new: true,
  }
);

    return res.status(200).json({
      statusCode: 200,
      message: "Review Published Successfully",
      data: review,
      error: null
    });

  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: error.message,
      data: null,
      error: error
    });
  }
};

export const getPropertyReviews = async (req, res) => {
  const reviews = await Review.find({ property: req.params.propertyId }).populate('user', 'name');
  res.json(reviews);
};


//check working or not

export const fetchPropertyReviews = async (req, res) => {
  try {
    const propertyId = req.params.id;
    // const propertyId = "682c901f4f03bf65214800de"; // Unused placeholder code

    // Fetch reviews for the given propertyId
    const findReviews = await Review.aggregate([
      {
        $match: {
          property: new ObjectId(propertyId),
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
        },
      },
      {
        $project: {
          _id: 1,
          rating: 1,
          comment: 1,
          createdAt: 1,
          userName: "$user.first_name",
          userProfilePic: "$user.profile_image",
        },
      },
    ]);

    // If no reviews are found
    if (findReviews.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "No reviews found",
        data: [],
        error: null,
      });
    }

    // Update the profile picture URL if needed
    const updatedReviews = findReviews.map((review) => {
      const pic = review.userProfilePic;

      if (pic && !pic.startsWith('http://') && !pic.startsWith('https://')) {
        // Append Cloudinary URL only if not an external URL
        review.userProfilePic = `${process.env.PUBLIC_CLOUDINARY_BASE_URL}/${pic}${process.env.PUBLIC_CLOUDINARY_IMAGE_EXTENSION}`;
      }

      return review;
    });

    return res.status(200).json({
      statusCode: 200,
      message: "Reviews fetched successfully.",
      data: updatedReviews,
      error: null,
    });

  } catch (error) {
    console.error('Error fetching reviews:', error); // Useful for debugging

    return res.status(500).json({
      statusCode: 500,
      message: error.message,
      data: null,
      error: error.stack, // Include stack trace for debugging purposes
    });
  }
};


// previous working correct
// export const propertySearch = async (req, res) => {
//   try {
//     const { city, area, guests, checkIn, checkOut } = req.query;
//     console.log("calling search result")
//     let query = {
//       'location.city': { $regex: new RegExp(city, 'i') },
//       isActive: true,
//       guestCapacity: { $gte: Number(guests || 1) }
//     };

//     if (area) {
//       query['location.address'] = { $regex: new RegExp(area, 'i') };
//     }

//     // 🟡 Check date overlap (only if both dates provided)
//     if (checkIn && checkOut) {
//       const checkInDate = new Date(checkIn);
//       const checkOutDate = new Date(checkOut);

//       query['unavailability'] = {
//         $not: {
//           $elemMatch: {
//             $or: [
//               {
//                 // User check-in falls inside an unavailable range
//                 startDate: { $lte: checkInDate },
//                 endDate: { $gte: checkInDate }
//               },
//               {
//                 // User check-out falls inside an unavailable range
//                 startDate: { $lte: checkOutDate },
//                 endDate: { $gte: checkOutDate }
//               },
//               {
//                 // The unavailability range is completely inside the requested dates
//                 startDate: { $gte: checkInDate },
//                 endDate: { $lte: checkOutDate }
//               }
//             ]
//           }
//         }
//       };

//     }
//     const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

//     const results = await Property.find(query);


//     // const updatedContent = [];


//     // for (const item of results) {
//     //   const { images, ...rest } = item.toObject();

//     //   const contentWithUrl = [];


//     //   for (const imagePath of images) {
//     //     const cloudfrontUrl = await generateSignedCloudfrontUrl(imagePath, expiryTime);

//     //     contentWithUrl.push(cloudfrontUrl);
//     //   }

//     //   updatedContent.push({
//     //     ...rest,
//     //     images: contentWithUrl,
//     //   });
//     // }

//     const updatedContent = [];

//     for (const item of results) {
//       const { images, ...rest } = item.toObject();

//       const contentWithUrl = [];

//       for (const imagePath of images) {
//         // const cloudfrontUrl = await generateSignedCloudfrontUrl(imagePath, expiryTime); // Generate signed URL
//         const cloudfrontUrl = `${process.env.PUBLIC_CLOUDINARY_BASE_URL}/${imagePath}${process.env.PUBLIC_CLOUDINARY_IMAGE_EXTENSION}`

//         contentWithUrl.push(cloudfrontUrl);
//       }

//       updatedContent.push({
//         ...rest,
//         images: contentWithUrl,
//       });
//     }


//     return res.status(200).json({
//       statusCode: 200,
//       message: "Proprty fetch successfully.",
//       data: updatedContent,
//       error: null
//     })


//   } catch (error) {
//     console.error('Search error:', error);
//     return res.status(500).json({
//       statusCode: 500,
//       message: error.message,
//       data: null,
//       error: error
//     })
//   }
// }


export const propertySearch = async (req, res) => {
  try {
    const { city, area, guests, checkIn, checkOut } = req.query;
    console.log("calling search result");

    let matchStage = {
      isActive: true,
      guestCapacity: { $gte: Number(guests || 1) }
    };

    if (city) {
      matchStage['location.city'] = { $regex: new RegExp(city, 'i') };
    }

    if (area) {
      matchStage['location.address'] = { $regex: new RegExp(area, 'i') };
    }

    // 🟡 Check date overlap (only if both dates provided)
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      matchStage['unavailability'] = {
        $not: {
          $elemMatch: {
            $or: [
              {
                // User check-in falls inside an unavailable range
                startDate: { $lte: checkInDate },
                endDate: { $gte: checkInDate }
              },
              {
                // User check-out falls inside an unavailable range
                startDate: { $lte: checkOutDate },
                endDate: { $gte: checkOutDate }
              },
              {
                // The unavailability range is completely inside the requested dates
                startDate: { $gte: checkInDate },
                endDate: { $lte: checkOutDate }
              }
            ]
          }
        }
      };
    }

    const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

    // Aggregation Pipeline
    const properties = await Property.aggregate(
      [
        { $match: matchStage }, // Match properties based on filters

        // Lookup reviews collection and join data
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'property',
            as: 'reviews'
          }
        },

        // Add review count and average rating
        {
          $addFields: {
            reviewCount: {
              $size: { $ifNull: ["$reviews", []] }
            },
            averageRating: {
              $cond: {
                if: { $gt: [{ $size: "$reviews" }, 0] },
                then: { $round: [{ $avg: "$reviews.rating" }, 1] },
                else: null
              }
            }
          }
        },

        // Sort by averageRating in descending order (highest rating first)
        {
          $sort: { averageRating: -1 }
        },

        // Project relevant fields for the final response
        {
          $project: {
            title: 1,
            description: 1,
            propertyType: 1,
            location: 1,
            pricePerNight: 1,
            featured: 1,
            images: 1,
            discount: 1,
            averageRating: 1,
            reviewCount: 1,
            guestCapacity: 1,
            zeroContact: 1,
            isLocalIdAllowed: 1,
            bestFor: 1
          }
        }
      ]
    );

    // Process images URLs
    const updatedContent = properties.map((item) => {
      const { images, ...rest } = item;

      const contentWithUrl = images.map((imagePath) => {
        const cloudfrontUrl = `${process.env.PUBLIC_CLOUDINARY_BASE_URL}/${imagePath}${process.env.PUBLIC_CLOUDINARY_IMAGE_EXTENSION}`;
        return cloudfrontUrl;
      });

      return {
        ...rest,
        images: contentWithUrl,
      };
    });

    return res.status(200).json({
      statusCode: 200,
      message: "Property fetch successfully.",
      data: updatedContent,
      error: null
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: error.message,
      data: null,
      error: error
    });
  }
};



//latest add to show review banner on homescreen to user 




export const getPendingReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookingAggregation = await Booking.aggregate(
      [
        {
          $match:
        
          {
            userId: new ObjectId(userId),
            status: "COMPLETED",
            hasReviewed: false
          }
        },
        {
          $sort:
         
          {
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
            bookingId: 1,
            propertyId: "$property._id",
            propertyTitle: "$property.title",
            createdAt:1
          }
        },
        {
          $limit:

            1
        }
      ]
    )

    const booking = bookingAggregation[0]

    if (!booking || !booking.propertyId) {
      return res.status(200).json({
        statusCode: 200,
        message: "No pending review",
        data: null,
      });
    }



    return res.status(200).json({
      statusCode: 200,
      message: "Pending review found",
      data: {
        bookingId: booking._id,
        propertyId: booking.propertyId,
        propertyTitle: booking.propertyTitle,
        createdAt:booking.createdAt
      },
    });
  } catch (error) {
    console.error("getPendingReview error:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      data: null,
    });
  }
};


