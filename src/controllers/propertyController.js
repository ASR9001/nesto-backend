import Property from '../models/Property.js';
import { ObjectId } from 'mongodb';
import { generateSignedCloudfrontUrl } from '../services/utilities/s3.js';


export const createProperty = async (req, res, next) => {
  try {
    const { data } = req.body;
    const hostId = req.hostInfo.id

    console.log("first", data);

    if (!data) {
      return res.status(400).json({
        statusCode: 400,
        message: "Data is undefined or null",
        data: null,
        error: null,
      })
    }

    const property = await Property.create({
      title: data.title,
      description: data.description,
      location: {
        address: data.address,
        area:data.area,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
      },
      propertyType: data.propertyType,

      pricePerNight: data.pricePerNight,
      images: data.images,
      amenities: data.amenities,
      guestCapacity: data.guestCapacity,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      // host:req.user._id,
      hostId: hostId,
      availability: data.availability,
      discount: data.discount,
      rules: data.rules,
      kingSizeBed: data.kingSizeBed,
      queenSizeBed: data.queenSizeBed,
      singleBed: data.singleBed,
      bestFor:data.bestFor,
      isLocalIdAllowed: data.isLocalIdAllowed,
      zeroContact:data.zeroContact

    })


    return res.status(200).json({
      statusCode: 200,
      message: "",
      data: property,
      error: null
    })



  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};



export const disableProperty = async (req, res, next) => {
  try {
    const { id } = req.body;
    const hostId = req.hostInfo.id


    if (!id) {
      return res.status(400).json({
        statusCode: 400,
        message: "Id is undefined or null",
        data: null,
        error: null,
      })
    }

    const property = await Property.findOne({
      _id: id,
      hostId: hostId
    })

    if (!property) {

      return res.status(400).json({
        statusCode: 400,
        message: "Property not found",
        data: null,
        error: null
      })
    }

    property.isActive = !property.isActive;
    await property.save();

    return res.status(200).json({
      statusCode: 200,
      message: `Property ${property.isActive === true ? "Enabled" : "Disabled"} successfully`,
      data: property,
      error: null
    })



  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};


// GET /api/properties?page=2&limit=6&sortBy=pricePerNight&order=asc

// export const getAllProperties = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const sortBy = req.query.sortBy || 'createdAt'; // or 'pricePerNight'
//     const order = req.query.order === 'asc' ? 1 : -1;

//     const skip = (page - 1) * limit;
//     const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // Set expiry time for signed URLs

//     // Fetch properties with pagination and sorting
//     const properties = await Property.find()
//       .sort({ [sortBy]: order })
//       .skip(skip)
//       .limit(limit);

//     const updatedContent = []; // Initialize updatedContent array

//     // Loop through the fetched properties
//     for (const item of properties) {
//       const { images } = item; // Destructure to separate images from other fields

//       const contentWithUrl = []; // Array to hold signed URLs

//       // Loop through images to generate signed URLs
//       for (const imagePath of images) {
//         const cloudfrontUrl = await generateSignedCloudfrontUrl(imagePath, expiryTime); // Generate signed URL

//         // Add the signed URL to the array
//         contentWithUrl.push(cloudfrontUrl);
//       }

//       // Push the updated property object with signed URLs in the images field
//       updatedContent.push({
//         ...item,
//         images: contentWithUrl, // Replace images array with the signed URLs
//       });
//     }

//     // Count total documents for pagination
//     const total = await Property.countDocuments();

//     // Send the response with updated properties data
//     res.json({
//       total,
//       page,
//       totalPages: Math.ceil(total / limit),
//       properties: updatedContent, // Send updated content (with signed URLs)
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error fetching properties' });
//   }
// };


export const getAllPropertiesForUser = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt'; // or 'pricePerNight'
    const order = req.query.order === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // Set expiry time for signed URLs

    // Fetch properties with pagination and sorting
    const properties = await Property.find()
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    const updatedContent = []; // Initialize updatedContent array

    // Loop through the fetched properties
    // for (const item of properties) {
    //   const { images, ...rest } = item.toObject(); // Destructure to separate images from other fields

    //   const contentWithUrl = []; // Array to hold signed URLs

    // Loop through images to generate signed URLs
    // for (const imagePath of images) {
    //   const cloudfrontUrl = await generateSignedCloudfrontUrl(imagePath, expiryTime); // Generate signed URL

    //   // Add the signed URL to the array
    //   contentWithUrl.push(cloudfrontUrl);
    // }

    // Push the updated property object with signed URLs in the images field
    //   updatedContent.push({
    //     ...rest,  // Include the rest of the fields of the property
    //     images: contentWithUrl, // Replace images array with the signed URLs
    //   });
    // }

    // Count total documents for pagination
    const total = await Property.countDocuments();

    // Send the response with updated properties data
    return res.status(200).json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      properties: properties, // Send updated content (with signed URLs)
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};

export const getAllPropertiesForHost = async (req, res, next) => {
  try {
    const hostId = req.hostInfo.id;

    const properties = await Property.aggregate(
      [
        {
          $match:
          {
            hostId: new ObjectId(hostId),
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        }
      ]
    )



    const total = properties.length;

    return res.status(200).json({
      statusCode: 200,
      data: {
        total,
        properties: properties,
      },
      message: "Property fetch successfully.",
      error: null
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};


export const getFeaturedProperty = async (req, res, next) => {
  try {

    const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

    const properties = await Property.aggregate(
      [
        {
          $match: {
            isActive: true
          }
        },
        {
          $match: {
            featured: true
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        },
        {
          $limit: 25
        },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "property",
            as: "reviews"
          }
        },
        {
          $addFields: {
            reviewCount: {
              $size: {
                $ifNull: ["$reviews", []]
              }
            },
            averageRating: {
              $cond: {
                if: {
                  $gt: [
                    {
                      $size: "$reviews"
                    },
                    0
                  ]
                },
                then: {
                  $round: [
                    {
                      $avg: "$reviews.rating"
                    },
                    1
                  ]
                },
                else: null
              }
            }
          }
        },
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
            zeroContact:1,
            isLocalIdAllowed:1,
            bestFor:1
          }
        }
      ]

    )

    const updatedContent = [];

    for (const item of properties) {
      const { images, ...rest } = item

      const contentWithUrl = [];

      for (const imagePath of images) {
        // const cloudfrontUrl = await generateSignedCloudfrontUrl(imagePath, expiryTime); // Generate signed URL
        const cloudfrontUrl = `${process.env.AWS_S3_CLOUDFRONT_BASE_URL}/${imagePath}`

        contentWithUrl.push(cloudfrontUrl);
      }

      updatedContent.push({
        ...rest,
        images: contentWithUrl,
      });
    }

    console.log("Featured property fetch successfully.")

    return res.status(200).json({
      statusCode: 200,
      message: "Featured property fetch successfully.",
      data: updatedContent,
      error: null
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};





// export const getPropertyById = async (req, res) => {
//   try {
//     const property = await Property.aggregate(
//       [
//         {
//           $match: {
//             _id: new ObjectId(req.params.id)
//           }
//         },
//         {
//           $addFields: {
//             convertedString: {
//               $toString: "$_id"
//             }
//           }
//         },
//         {
//           $lookup: {
//             from: "reviews",
//             localField: "convertedString",
//             foreignField: "property",
//             as: "comments"
//           }
//         },
//         {
//           $lookup: {
//             from: "reviews",
//             let: {
//               propertyId: "$convertedString"
//             },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $eq: ["$property", "$$propertyId"]
//                   }
//                 }
//               },
//               {
//                 $sort: {
//                   createdAt: -1
//                 }
//               },
//               {
//                 $limit: 4
//               }
//             ],
//             as: "reviews"
//           }
//         },
//         {
//           $addFields: {
//             averageRating: 4
//           }
//         },
//         {
//           $project: {
//             title: 1,
//             description: 1,
//             propertyType: 1,
//             location: 1,
//             pricePerNight: 1,
//             images: 1,
//             amenities: 1,
//             guestCapacity: 1,
//             bedrooms: 1,
//             bathrooms: 1,
//             availability: 1,
//             discount: 1,
//             rules: 1,
//             updatedAt: 1,
//             numberOfReviews: {
//               $size: "$comments"
//             },
//             comments: "$reviews",
//             averageRating: 1
//             // averageRating: {
//             //       $cond: {
//             //         if: { $gt: [{ $size: "$comments" }, 0] }, // Check if there are any reviews
//             //         then: { $divide: ["$totalStars", { $size: "$comments" }] }, // Calculate average if there are reviews
//             //         else: 0 // If no reviews, return 0 as average rating
//             //       }
//             //     }
//           }
//         }
//       ])

//     if (!property) {
//       return res.status(404).json({ message: 'Property not found' });
//     }

//      const updatedContent = []; // Initialize updatedContent array
//     const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // Set expiry time for signed URLs

//     // Loop through the fetched properties
//     for (const item of property) {
//       const { images, ...rest } = item // Destructure to separate images from other fields

//       const contentWithUrl = []; // Array to hold signed URLs

//       // Loop through images to generate signed URLs
//       for (const imagePath of images) {
//         const cloudfrontUrl = await generateSignedCloudfrontUrl(imagePath, expiryTime); // Generate signed URL

//         // Add the signed URL to the array
//         contentWithUrl.push(cloudfrontUrl);
//       }

//       // Push the updated property object with signed URLs in the images field
//       updatedContent.push({
//         ...rest,  // Include the rest of the fields of the property
//         images: contentWithUrl, // Replace images array with the signed URLs
//       });
//     }


//     return res.status(200).json({
//       statusCode: 200,
//       message: "Property fetch successfully",
//       data: property[0],
//       error: null
//     })
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching property' });
//   }
// };


//abhisehk working original
// export const getPropertyById = async (req, res) => {
//   try {


//     const propertyId = req.params.id

//     if (!propertyId) {
//       return res.status(400).json({
//         statusCode: 400,
//         message: "Property Id not provided.",
//         data: null,
//         error: null
//       });
//     }


//     const property = await Property.aggregate(
//       [
//         {
//           $match: {
//             _id: new ObjectId(propertyId)
//           }
//         },
//         {
//           $match: {
//             isActive: true
//           }
//         },
//         {
//           $lookup: {
//             from: "reviews",
//             localField: "_id",
//             foreignField: "property",
//             as: "reviews"
//           }
//         },
//         {
//           $addFields: {
//             reviewCount: {
//               $size: {
//                 $ifNull: ["$reviews", []]
//               }
//             },
//             averageRating: {
//               $cond: {
//                 if: {
//                   $gt: [
//                     {
//                       $size: "$reviews"
//                     },
//                     0
//                   ]
//                 },
//                 then: {
//                   $round: [
//                     {
//                       $avg: "$reviews.rating"
//                     },
//                     1
//                   ]
//                 },
//                 else: null
//               }
//             }
//           }
//         },
//         // {
//         //   $sort: {
//         //     averageRating: -1
//         //   }
//         // }
//         {
//           $lookup: {
//             from: "hosts",
//             localField: "hostId",
//             foreignField: "_id",
//             as: "host"
//           }
//         },
//         {
//           $unwind: {
//             path: "$host"
//           }
//         },
//         {
//           $addFields: {
//             latestReviews: {
//               $slice: [
//                 {
//                   $sortArray: {
//                     input: "$reviews",
//                     sortBy: {
//                       createdAt: -1
//                     } // descending by createdAt
//                   }
//                 },
//                 7
//               ]
//             }
//           }
//         },
//         {
//           $unwind: {
//             path: "$latestReviews"
//           }
//         },
//         {
//           $lookup: {
//             from: "users",
//             // Look up the users collection for the reviewer info
//             localField: "latestReviews.user",
//             // Assuming each review has a userId field
//             foreignField: "_id",
//             // Match by the _id field in the users collection
//             as: "reviewerDetails"
//           }
//         },
//         {
//           $unwind: {
//             path: "$reviewerDetails",
//             preserveNullAndEmptyArrays: true // In case there are reviews without associated user data
//           }
//         },
//         {
//           $addFields: {
//             "latestReviews.userName":
//               "$reviewerDetails.first_name",
//             "latestReviews.userProfilePic":
//               "$reviewerDetails.profile_image"
//           }
//         },
//         {
//           $project: {
//             title: 1,
//             description: 1,
//             propertyType: 1,
//             location: 1,
//             pricePerNight: 1,
//             // featured: 1,
//             images: 1,
//             amenities: 1,
//             guestCapacity: 1,
//             bedrooms: 1,
//             bathrooms: 1,
//             hostId: 1,
//             availability: 1,
//             unavailability: 1,
//             discount: 1,
//             rules: 1,
//             // isActive: 1,
//             averageRating: 1,
//             reviewCount: 1,
//             latestReviews: 1,
//             hostBio: "$host.bio",
//             hostName: "$host.firstName",
//             // hostName: {
//             //   $concat: [
//             //     "$host.firstName",
//             //     " ",
//             //     "$host.lastName"
//             //   ]
//             // },
//             hostProfilePic: "$host.profilePic"
//           }
//         }
//       ]
//       // [
//       //   {
//       //     $match: {
//       //       isActive: true
//       //     }
//       //   },

//       //   {
//       //     $lookup: {
//       //       from: "reviews",
//       //       localField: "_id",
//       //       foreignField: "property",
//       //       as: "reviews"
//       //     }
//       //   },
//       //   {
//       //     $addFields: {
//       //       reviewCount: {
//       //         $size: {
//       //           $ifNull: ["$reviews", []]
//       //         }
//       //       },
//       //       averageRating: {
//       //         $cond: {
//       //           if: {
//       //             $gt: [
//       //               {
//       //                 $size: "$reviews"
//       //               },
//       //               0
//       //             ]
//       //           },
//       //           then: {
//       //             $round: [
//       //               {
//       //                 $avg: "$reviews.rating"
//       //               },
//       //               1
//       //             ]
//       //           },
//       //           else: null
//       //         }
//       //       }
//       //     }
//       //   },
//       //   {
//       //     $sort: {
//       //       averageRating: -1
//       //     }
//       //   },
//       //   {
//       //     $lookup: {
//       //       from: "hosts",
//       //       localField: "hostId",
//       //       foreignField: "_id",
//       //       as: "host"
//       //     }
//       //   },
//       //   {
//       //     $unwind: {
//       //       path: "$host"
//       //     }
//       //   },
//       //   {
//       //     $project: {
//       //       title: 1,
//       //       description: 1,
//       //       propertyType: 1,
//       //       location: 1,
//       //       pricePerNight: 1,
//       //       featured: 1,
//       //       images: 1,
//       //       amenities: 1,
//       //       guestCapacity: 1,
//       //       bedrooms: 1,
//       //       bathrooms: 1,
//       //       hostId: 1,
//       //       availability: 1,
//       //       unavailability: 1,
//       //       discount: 1,
//       //       rules: 1,
//       //       averageRating: 1,
//       //       reviewCount: 1,
//       //       reviews: 1,
//       //       hostName: {
//       //         $concat: [
//       //           "$host.firstName",
//       //           " ",
//       //           "$host.lastName"
//       //         ]
//       //       },
//       //       hostProfilePic: "$host.profilePic"
//       //     }
//       //   }
//       // ]
//     );

//     if (!property) {
//       return res.status(400).json({
//         statusCode: 400,
//         message: 'Property not found',
//         data: null,
//         error: null
//       });
//     }

//     // const updatedContent = [];
//     // const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

//     // for (const item of property) {
//     //   const { images, ...rest } = item;

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

//     for (const item of property) {
//       const { images, hostProfilePic, ...rest } = item

//       const contentWithUrl = [];

//       for (const imagePath of images) {
//         // const cloudfrontUrl = await generateSignedCloudfrontUrl(imagePath, expiryTime); // Generate signed URL
//         const cloudfrontUrl = `${process.env.AWS_S3_CLOUDFRONT_BASE_URL}/${imagePath}`

//         contentWithUrl.push(cloudfrontUrl);
//       }



//       updatedContent.push({
//         ...rest,
//         images: contentWithUrl,

//         hostProfilePic: `${process.env.AWS_S3_CLOUDFRONT_BASE_URL}/${hostProfilePic}`
//       });
//     }

//     return res.status(200).json({
//       statusCode: 200,
//       message: "Property fetched successfully",
//       // data: updatedContent[0],
//       data: updatedContent[0],
//       error: null
//     });
//   } catch (error) {
//     return res.status(500).json({
//       statusCode: 500,
//       message: error.message,
//       data: null,
//       error: error
//     });
//   }
// };


export const getPropertyById = async (req, res, next) => {
  try {
    const propertyId = req.params.id;

    if (!propertyId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Property Id not provided.",
        data: null,
        error: null
      });
    }

    const property = await Property.aggregate(
      // [
      //   {
      //     $match: {
      //       _id: new ObjectId(propertyId)
      //     }
      //   },
      //   {
      //     $match: {
      //       isActive: true
      //     }
      //   },
      //   {
      //     $lookup: {
      //       from: "reviews",
      //       localField: "_id",
      //       foreignField: "property",
      //       as: "reviews"
      //     }
      //   },
      //   {
      //     $addFields: {
      //       reviewCount: {
      //         $size: {
      //           $ifNull: ["$reviews", []]
      //         }
      //       },
      //       averageRating: {
      //         $cond: {
      //           if: {
      //             $gt: [
      //               {
      //                 $size: "$reviews"
      //               },
      //               0
      //             ]
      //           },
      //           then: {
      //             $round: [
      //               {
      //                 $avg: "$reviews.rating"
      //               },
      //               1
      //             ]
      //           },
      //           else: null
      //         }
      //       }
      //     }
      //   },
      //   {
      //     $lookup: {
      //       from: "hosts",
      //       localField: "hostId",
      //       foreignField: "_id",
      //       as: "host"
      //     }
      //   },
      //   {
      //     $unwind: {
      //       path: "$host"
      //     }
      //   },
      //   {
      //     $addFields: {
      //       latestReviews: {
      //         $slice: [
      //           {
      //             $sortArray: {
      //               input: "$reviews",
      //               sortBy: {
      //                 createdAt: -1
      //               } // descending by createdAt
      //             }
      //           },
      //           7
      //         ]
      //       }
      //     }
      //   },
      //   {
      //     $unwind: {
      //       path: "$latestReviews"
      //     }
      //   },
      //   {
      //     $lookup: {
      //       from: "users",
      //       localField: "latestReviews.user",
      //       foreignField: "_id",
      //       as: "reviewerDetails"
      //     }
      //   },
      //   {
      //     $unwind: {
      //       path: "$reviewerDetails",
      //       preserveNullAndEmptyArrays: true // In case there are reviews without associated user data
      //     }
      //   },
      //   {
      //     $addFields: {
      //       "latestReviews.userName": "$reviewerDetails.first_name",
      //       "latestReviews.userProfilePic": "$reviewerDetails.profile_image"
      //     }
      //   },
      //   {
      //     $project: {
      //       title: 1,
      //       description: 1,
      //       propertyType: 1,
      //       location: 1,
      //       pricePerNight: 1,
      //       images: 1,
      //       amenities: 1,
      //       guestCapacity: 1,
      //       bedrooms: 1,
      //       bathrooms: 1,
      //       hostId: 1,
      //       availability: 1,
      //       unavailability: 1,
      //       discount: 1,
      //       rules: 1,
      //       averageRating: 1,
      //       reviewCount: 1,
      //       latestReviews: 1,
      //       hostBio: "$host.bio",
      //       hostName: "$host.firstName",
      //       hostProfilePic: "$host.profilePic"
      //     }
      //   }
      // ]
      [
        {
          $match: {
            _id: new ObjectId(propertyId),
            isActive: true
          }
        },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "property",
            as: "reviews"
          }
        },
        {
          $addFields: {
            reviewCount: {
              $size: {
                $ifNull: ["$reviews", []]
              }
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
        {
          $lookup: {
            from: "hosts",
            localField: "hostId",
            foreignField: "_id",
            as: "host"
          }
        },
        {
          $unwind: {
            path: "$host"
          }
        },
        {
          $addFields: {
            latestReviews: {
              $cond: {
                if: { $gt: [{ $size: "$reviews" }, 0] },
                then: {
                  $slice: [
                    {
                      $sortArray: {
                        input: "$reviews",
                        sortBy: { createdAt: -1 }
                      }
                    },
                    7
                  ]
                },
                else: []
              }
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "latestReviews.user",
            foreignField: "_id",
            as: "reviewerDetails"
          }
        },
        {
          $addFields: {
            latestReviews: {
              $map: {
                input: "$latestReviews",
                as: "review",
                in: {
                  $mergeObjects: [
                    "$$review",
                    {
                      userName: {
                        $arrayElemAt: [
                          {
                            $map: {
                              input: {
                                $filter: {
                                  input: "$reviewerDetails",
                                  as: "user",
                                  cond: { $eq: ["$$user._id", "$$review.user"] }
                                }
                              },
                              as: "matchedUser",
                              in: "$$matchedUser.first_name"
                            }
                          },
                          0
                        ]
                      },
                      userProfilePic: {
                        $arrayElemAt: [
                          {
                            $map: {
                              input: {
                                $filter: {
                                  input: "$reviewerDetails",
                                  as: "user",
                                  cond: { $eq: ["$$user._id", "$$review.user"] }
                                }
                              },
                              as: "matchedUser",
                              in: "$$matchedUser.profile_image"
                            }
                          },
                          0
                        ]
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $project: {
            title: 1,
            description: 1,
            propertyType: 1,
            location: 1,
            pricePerNight: 1,
            images: 1,
            amenities: 1,
            guestCapacity: 1,
            bedrooms: 1,
            bathrooms: 1,
            hostId: 1,
            availability: 1,
            unavailability: 1,
            discount: 1,
            rules: 1,
            averageRating: 1,
            reviewCount: 1,
            latestReviews: 1,
            hostBio: "$host.bio",
            hostName: "$host.firstName",
            hostProfilePic: "$host.profilePic",
            guestCapacity:1,
           zeroContact:1,
            isLocalIdAllowed:1,
            bestFor:1
          }
        }
      ]




    );

    if (!property) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Property not found',
        data: null,
        error: null
      });
    }

    const updatedContent = [];

    // Loop through the property to update image URLs and latestReviews.userProfilePic URLs
    for (const item of property) {
      const { images, hostProfilePic, latestReviews, ...rest } = item;

      // Handle images
      const contentWithUrl = [];
      for (const imagePath of images) {
        const cloudfrontUrl = `${process.env.AWS_S3_CLOUDFRONT_BASE_URL}/${imagePath}`;
        contentWithUrl.push(cloudfrontUrl);
      }

      // Handle host profile picture URL
      const hostProfilePicUrl = `${process.env.AWS_S3_CLOUDFRONT_BASE_URL}/${hostProfilePic}`;
     
     
     
      // Handle latestReviews.userProfilePic URLs
      if (latestReviews && latestReviews.length > 0) {
        for (const review of latestReviews) {
          const pic = review.userProfilePic;

          if (pic && !pic.startsWith('http://') && !pic.startsWith('https://')) {
            // Append Cloudinary URL only if not an external URL
            review.userProfilePic = `${process.env.AWS_S3_CLOUDFRONT_BASE_URL}/${pic}`;
          }
        }
      }


      updatedContent.push({
        ...rest,
        images: contentWithUrl,
        hostProfilePic: hostProfilePicUrl,
        latestReviews
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Property fetched successfully",
      data: updatedContent[0],
      error: null
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};


export const getHostPropertyById = async (req, res, next) => {
  try {


    const propertyId = req.params.id

    if (!propertyId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Property Id not provided.",
        data: null,
        error: null
      });
    }


    const property = await Property.aggregate(
      [
        {
          $match: {
            _id: new ObjectId(propertyId)
          }
        },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "property",
            as: "reviews"
          }
        },
        {
          $addFields: {
            reviewCount: {
              $size: {
                $ifNull: ["$reviews", []]
              }
            },
            averageRating: {
              $cond: {
                if: {
                  $gt: [
                    {
                      $size: "$reviews"
                    },
                    0
                  ]
                },
                then: {
                  $round: [
                    {
                      $avg: "$reviews.rating"
                    },
                    1
                  ]
                },
                else: null
              }
            }
          }
        },
        // {
        //   $sort: {
        //     averageRating: -1
        //   }
        // }
        {
          $lookup: {
            from: "hosts",
            localField: "hostId",
            foreignField: "_id",
            as: "host"
          }
        },
        {
          $unwind: {
            path: "$host"
          }
        },
        {
          $addFields: {
            latestReviews: {
              $slice: [
                {
                  $sortArray: {
                    input: "$reviews",
                    sortBy: {
                      createdAt: -1
                    } // descending by createdAt
                  }
                },
                7
              ]
            }
          }
        },
        {
          $project: {
            title: 1,
            description: 1,
            propertyType: 1,
            location: 1,
            pricePerNight: 1,
            featured: 1,
            images: 1,
            amenities: 1,
            guestCapacity: 1,
            bedrooms: 1,
            bathrooms: 1,
            hostId: 1,
            availability: 1,
            unavailability: 1,
            discount: 1,
            rules: 1,
            kingSizeBed: 1,
            queenSizeBed: 1,
            singleBed: 1,
            isActive: 1,
            averageRating: 1,
            reviewCount: 1,
            latestReviews: 1,
             zeroContact:1,
            isLocalIdAllowed:1,
            bestFor:1,
            hostName: {
              $concat: [
                "$host.firstName",
                " ",
                "$host.lastName"
              ]
            },
            hostProfilePic: "$host.profilePic"
          }
        }
      ]
      // [
      //   {
      //     $match: {
      //       isActive: true
      //     }
      //   },

      //   {
      //     $lookup: {
      //       from: "reviews",
      //       localField: "_id",
      //       foreignField: "property",
      //       as: "reviews"
      //     }
      //   },
      //   {
      //     $addFields: {
      //       reviewCount: {
      //         $size: {
      //           $ifNull: ["$reviews", []]
      //         }
      //       },
      //       averageRating: {
      //         $cond: {
      //           if: {
      //             $gt: [
      //               {
      //                 $size: "$reviews"
      //               },
      //               0
      //             ]
      //           },
      //           then: {
      //             $round: [
      //               {
      //                 $avg: "$reviews.rating"
      //               },
      //               1
      //             ]
      //           },
      //           else: null
      //         }
      //       }
      //     }
      //   },
      //   {
      //     $sort: {
      //       averageRating: -1
      //     }
      //   },
      //   {
      //     $lookup: {
      //       from: "hosts",
      //       localField: "hostId",
      //       foreignField: "_id",
      //       as: "host"
      //     }
      //   },
      //   {
      //     $unwind: {
      //       path: "$host"
      //     }
      //   },
      //   {
      //     $project: {
      //       title: 1,
      //       description: 1,
      //       propertyType: 1,
      //       location: 1,
      //       pricePerNight: 1,
      //       featured: 1,
      //       images: 1,
      //       amenities: 1,
      //       guestCapacity: 1,
      //       bedrooms: 1,
      //       bathrooms: 1,
      //       hostId: 1,
      //       availability: 1,
      //       unavailability: 1,
      //       discount: 1,
      //       rules: 1,
      //       averageRating: 1,
      //       reviewCount: 1,
      //       reviews: 1,
      //       hostName: {
      //         $concat: [
      //           "$host.firstName",
      //           " ",
      //           "$host.lastName"
      //         ]
      //       },
      //       hostProfilePic: "$host.profilePic"
      //     }
      //   }
      // ]
    );

    if (!property) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Property not found',
        data: null,
        error: null
      });
    }

    // const updatedContent = [];
    // const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

    // for (const item of property) {
    //   const { images, ...rest } = item;

    //   const contentWithUrl = [];

    //   for (const imagePath of images) {
    //     const cloudfrontUrl = await generateSignedCloudfrontUrl(imagePath, expiryTime);
    //     contentWithUrl.push(cloudfrontUrl);
    //   }

    //   updatedContent.push({
    //     ...rest,
    //     images: contentWithUrl,
    //   });
    // }

    return res.status(200).json({
      statusCode: 200,
      message: "Property fetched successfully",
      // data: updatedContent[0],
      data: property[0],
      error: null
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};


export const updateProperty = async (req, res, next) => {
  const propertyId = req.params.id;
  const { updates } = req.body;
  //check host or prproty same h na abhishek
  try {
    if (!updates) {
      return
    }
    const updatedProperty = await Property.findByIdAndUpdate(propertyId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty,
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};


// export const searchProperties = async (req, res) => {
//   const { location, checkIn, checkOut, guests } = req.query;

//   try {
//     let query = {};

//     // Location filter (case-insensitive partial match)
//     if (location) {
//       query.city = { $regex: location, $options: 'i' };
//     }

//     // Guests filter
//     if (guests) {
//       query.maxGuests = { $gte: guests };
//     }

//     // Date filter (properties NOT booked between given dates)
//     if (checkIn && checkOut) {
//       const checkInDate = new Date(checkIn);
//       const checkOutDate = new Date(checkOut);

//       query.bookings = {
//         $not: {
//           $elemMatch: {
//             checkIn: { $lt: checkOutDate },
//             checkOut: { $gt: checkInDate }
//           }
//         }
//       };
//     }

//     const properties = await Property.find(query);

//     res.json(properties);
//   } catch (error) {
//     console.error('Search error:', error);
//     res.status(500).json({ message: 'Error searching properties' });
//   }
// };




