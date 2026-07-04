import User from '../models/User.js';
import { generateSignedCloudfrontUrl } from "../services/utilities/s3.js";

import { ObjectId } from 'mongodb';
import Message from "../models/Message.js";
import Host from "../models/Host.js";
import { uploadToCloudinary } from "../services/utilities/cloudinary.js";
import Property from "../models/Property.js";
import axios from "axios";
import { io } from '../config/socket.js';

// export const fetchSingleChat = async (req, res) => {
//     try {

//         const { from, user_id, creator_id } = req.body;
//         const user = await User.findById(req.body.user_id);
//         if (user?.isDeleted) {
//             req.body.user_id = null
//         }

//         const chats = await CreatorUserConversationMessage.find({
//             creator_id: req.body.creator_id,
//             user_id: req.body.user_id,
//             isDeleted: false
//         })
//             .sort({ createdAt: -1 })
//             .limit(50).lean()

//         // if (from === 'host') {
//         // 	const find_has_creator_seen = await CreatorUserConversationMessage.find({
//         // 		creator_id: req.body.creator_id,
//         // 		user_id: req.body.user_id,
//         // 		has_creator_seen: false
//         // 	});

//         // 	if (find_has_creator_seen.length > 0) {
//         // 		const update_has_creator_seen = await CreatorUserConversationMessage.updateMany(
//         // 			{
//         // 				creator_id: req.body.creator_id,
//         // 				user_id: req.body.user_id,
//         // 				has_creator_seen: false
//         // 			},
//         // 			{
//         // 				$set: { has_creator_seen: true }
//         // 			}
//         // 		);
//         // 	}
//         // }

//         if (from === 'web') {


//             const find_has_creator_seen = await CreatorUserConversationMessage.find({
//                 creator_id: req.body.creator_id,
//                 user_id: req.body.user_id,
//                 has_user_seen: false
//             });

//             if (find_has_creator_seen.length > 0) {
//                 const update_has_creator_seen = await CreatorUserConversationMessage.updateMany(
//                     {
//                         creator_id: req.body.creator_id,
//                         user_id: req.body.user_id,
//                         has_user_seen: false
//                     },
//                     {
//                         $set: { has_user_seen: true }
//                     }
//                 );
//             }
//         }





//         const userId = new ObjectId(req.body.user_id);
//         const creatorId = new ObjectId(req.body.creator_id);

//         const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

//         const contentWithUrl = [];

//         for (const item of chats) {
//             if (item.type !== "text") {
//                 const { content, ...restItem } = item;

//                 const updatedContent = await Promise.all(
//                     content.map(async (contentItem) => {
//                         const { s3Path, _id } = contentItem;


//                         const fileUrl = await generateSignedCloudfrontUrl(s3Path, expiryTime);

//                         return { _id, url: fileUrl };


//                     }),
//                 );

//                 contentWithUrl.push({
//                     ...restItem,
//                     content: updatedContent,
//                 });
//             } else {
//                 contentWithUrl.push(item);
//             }
//         }


//         return res.status(200).json({
//             statusCode: 200,
//             data: {
//                 content: contentWithUrl.reverse(),
//             },
//             message: "User Chat History For Creator fetched successfully",
//             error: null,

//         });

//     } catch (error) {

//         return res.status(500).json({
//             statusCode: 500,
//             data: null,
//             message: null,
//             error: error.message,

//         });
//     }
// }


export const fetchSingleChat = async (req, res, next) => {
  try {

    const { propertyId } = req.body;

    const userId = req.user.id

    // if (!hostId) {
    //   return res.status(400).json({
    //     statusCode: 400,
    //     data: null,
    //     message: "Host Id is Missing",
    //     error: null,
    //   })
    // }


    if (!propertyId) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: "Property Id is Missing",
        error: null,
      })
    }


    if (!userId) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: "User Id is Missing",
        error: null,
      })
    }

    const fetchChat = await Message.find({
      userId: userId,
      propertyId: propertyId
    }).sort({ createdAt: 1 })


    const titleData = await Property.aggregate(
      [
        {
          $match:

          {
            _id: new ObjectId(propertyId)
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
          $project: {
            _id: 1,
            hostName: "$host.firstName",
            hostProfilePic: "$host.profilePic",
            // propertyImage: {
            //   $arrayElemAt: ["$images", 0]
            // },
            title: 1
          }
        }
      ]
    )



    const contentWithUrl = titleData.map(chat => {
      // Generate Cloudinary URL or fallback if no profile image exists
      const hostCloudfrontUrl = chat.hostProfilePic
        ? `${process.env.PUBLIC_CLOUDINARY_BASE_URL}/${chat.hostProfilePic}${process.env.PUBLIC_CLOUDINARY_IMAGE_EXTENSION}`
        : "https://randomuser.me/api/portraits/women/67.jpg";



      // Return full chat object with image URL
      return {
        title: chat.title,
        hostName: chat.hostName,
        hostProfileImage: hostCloudfrontUrl,

      };
    });


    if (fetchChat.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        data: { titleData: contentWithUrl[0], fetchChat: [] },
        message: "Chat fetch successfully.",
        error: null,
      })
    }


    return res.status(200).json({
      statusCode: 200,
      data: { fetchChat, titleData: contentWithUrl[0] },
      message: "Chat fetch successfully.",
      error: null,
    })


  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}



export const fetchAllChatForUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetching all chats for the user with relevant details
    const fetchChat = await Message.aggregate(
      [
        // 1. Filter messages by userId
        {
          $match: {
            userId: new ObjectId(userId)
          }
        },
        // 2. Sort by latest messages first
        {
          $sort: {
            createdAt: -1
          }
        },
        // 3. Group by propertyId, taking the latest message per property
        {
          $group: {
            _id: "$propertyId",
            messageFrom: {
              $first: "$messageFrom"
            },
            messageText: {
              $first: "$messageText"
            },
            type: {
              $first: "$type"
            },
            propertyId: {
              $first: "$propertyId"
            },
            createdAt: {
              $first: "$createdAt"
            }
          }
        },
        // 4. Join with properties collection
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "property"
          }
        },
        // 5. Unwind property (each message belongs to one property)
        {
          $unwind: "$property"
        },
        // 6. Convert property.hostId to ObjectId (if it's stored as a string)
        {
          $addFields: {
            hostId: {
              $cond: [
                {
                  $not: [
                    {
                      $eq: [
                        {
                          $type: "$property.hostId"
                        },
                        "objectId"
                      ]
                    }
                  ]
                },
                {
                  $toObjectId: "$property.hostId"
                },
                "$property.hostId"
              ]
            }
          }
        },
        // 7. Join with hosts collection
        {
          $lookup: {
            from: "hosts",
            localField: "hostId",
            foreignField: "_id",
            as: "host"
          }
        },
        // 8. Unwind host (each property has one host)
        {
          $unwind: "$host"
        },
        // 9. Final projection of needed fields
        {
          $project: {
            _id: 1,
            messageFrom: 1,
            messageText: 1,
            type: 1,
            propertyId: 1,
            hostId: 1,
            createdAt: 1,
            hostName: "$host.firstName",
            hostProfilePic: "$host.profilePic",
            propertyImage: {
              $arrayElemAt: ["$property.images", 0]
            },
            propertyTitle: "$property.title"
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        }
      ]
    );

    if (fetchChat.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        data: [],
        message: "No chats found for this user.",
        error: null,
      });
    }

    const contentWithUrl = fetchChat.map(chat => {
      // Generate Cloudinary URL or fallback if no profile image exists
      const hostCloudfrontUrl = chat.hostProfilePic
        ? `${process.env.PUBLIC_CLOUDINARY_BASE_URL}/${chat.hostProfilePic}${process.env.PUBLIC_CLOUDINARY_IMAGE_EXTENSION}`
        : "https://randomuser.me/api/portraits/women/67.jpg";

      const propertyCloudfrontUrl = chat.propertyImage
        ? `${process.env.PUBLIC_CLOUDINARY_BASE_URL}/${chat.propertyImage}${process.env.PUBLIC_CLOUDINARY_IMAGE_EXTENSION}`
        : "https://randomuser.me/api/portraits/women/67.jpg";

      // Return full chat object with image URL
      return {
        hostId: chat.hostId,
        messageFrom: chat.messageFrom,
        messageText: chat.messageText,
        createdAt: chat.createdAt,
        hostName: chat.hostName,
        hostProfileImage: hostCloudfrontUrl,
        propertyImage: propertyCloudfrontUrl,
        propertyId: chat.propertyId,
        propertyTitle: chat.propertyTitle

      };
    });

    return res.status(200).json({
      statusCode: 200,
      data: contentWithUrl,
      message: "Chats fetched successfully.",
      error: null,
    });

  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};



export const fetchAllChatForHost = async (req, res, next) => {
  try {
    const hostId = req.hostInfo.id; // Get host info from the request

    // Fetch the latest message for each user
    const fetchChat = await Message.aggregate(
      [
        {
          $match: {
            hostId: new ObjectId(hostId),
            messageFrom: "user"
          }
        },
        {
          $sort: {
            createdAt: -1 // Sort messages by newest first
          }
        },
        {
          $group: {
            _id: "$propertyId",
            // Group by propertyId first
            users: {
              $push: {
                userId: "$userId",
                lastMessage: "$messageText",
                // The latest message
                unread: {
                  $sum: {
                    $cond: [
                      {
                        $eq: ["$read", false]
                      },
                      1,
                      0
                    ]
                  }
                },
                createdAt: "$createdAt",
                messageFrom: "$messageFrom",
                type: "$type",
                content: "$content",
                avatar: "$avatar"
              }
            }
          }
        },
        {
          $unwind: "$users" // Flatten the users array to process each user individually
        },
        {
          $group: {
            _id: {
              propertyId: "$_id",
              userId: "$users.userId"
            },
            // Group by both propertyId and userId
            lastMessage: {
              $first: "$users.lastMessage"
            },
            unread: {
              $first: "$users.unread"
            },
            createdAt: {
              $first: "$users.createdAt"
            },
            messageFrom: {
              $first: "$users.messageFrom"
            },
            type: {
              $first: "$users.type"
            },
            content: {
              $first: "$users.content"
            },
            avatar: {
              $first: "$users.avatar"
            }
          }
        },
        {
          $addFields: {
            propertyId: "$_id.propertyId",
            userId: "$_id.userId" // Extract the propertyId and userId from the _id field
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails"
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
          $project: {
            _id: 0,
            propertyId: 1,
            userId: 1,
            lastMessage: 1,
            unread: 1,
            createdAt: 1,
            messageFrom: 1,
            type: 1,
            content: 1,
            avatar: 1,
            userName: {
              $concat: [
                {
                  $arrayElemAt: [
                    "$userDetails.first_name",
                    0
                  ]
                },
                " ",
                {
                  $arrayElemAt: [
                    "$userDetails.last_name",
                    0
                  ]
                }
              ]
            },
            userProfileImage: {
              $arrayElemAt: [
                "$userDetails.profile_image",
                0
              ]
            },
            property: {
              $arrayElemAt: ["$property.title", 0]
            },
            status: {
              $arrayElemAt: ["$userDetails.status", 0]
            }
          }
        },
        {
          $sort: {
            createdAt: -1
          } // Sort by the latest message
        }
      ]
    );

    if (fetchChat.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        data: [],
        message: "No chats found.",
        error: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      data: fetchChat,
      message: "Chat fetched successfully.",
      error: null,
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};



export const getChatForHost = async (req, res, next) => {
  try {
    const hostId = req.hostInfo.id; // Get host info from the request

    const propertyId = req.params.propertyId

    if (!propertyId) {
      return res.status(400).json({
        statusCode: 400,
        data: [],
        message: "No chats found.",
        error: null,
      });
    }


    const propertyTitle = await Property.findOne({
      _id: new ObjectId(propertyId)
    }).select('title').lean()


    const fetchChat = await Message.aggregate(
      [
        {
          $match: {
            hostId: new ObjectId(hostId),
            propertyId: new ObjectId(propertyId)
          }
        },
        {
          $sort: {
            createdAt: 1 // Sort messages by newest first
          }
        },
        {
          $addFields: {
            userId: {
              $toObjectId: "$userId"
            }
          }
        },
        {
          $lookup: {
            from: "users",
            // Lookup for user details
            localField: "userId",
            foreignField: "_id",
            as: "userDetails"
          }
        },
        {
          $project: {
            _id: 1,
            createdAt: 1,
            messageFrom: 1,
            type: 1,
            messageText: 1,
            content: 1,
            avatar: 1,


          }
        }
      ]
    );

    if (fetchChat.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        data: { fetchChat, propertyTitle },
        message: "Chat fetched successfully.",
        error: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      data: { fetchChat, propertyTitle },
      message: "Chat fetched successfully.",
      error: null,
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};


export const sendMessageByHost = async (req, res, next) => {
  try {


    const {
      messageText,
      messageFrom = "Host",
      userId,
      propertyId,
      type = 'TEXT',
    } = req.body;

    const hostId = req.hostInfo.id;

    if (!messageText) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: 'Message text is required',
        error: null,
      });
    }



    const newMessage = new Message({
      messageText,
      messageFrom,
      userId,
      hostId,
      propertyId,
      type,
      content: [],
    });

    await newMessage.save();

    return res.status(200).json({
      statusCode: 200,
      data: newMessage,
      message: 'Message sent successfully',
      error: null,
    });

  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};



export const fetchProfile = async (req, res, next) => {
  try {

    const hostId = req.hostInfo.id;

    const profile = await Host.findOne({
      _id: hostId
    })

    if (!profile) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: "Profile not found",
        error: null,
      })
    }


    return res.status(200).json({
      statusCode: 200,
      data: profile,
      message: "Profile fetch successfully.",
      error: null,
    })


  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}


export const updateProfile = async (req, res, next) => {
  try {


    const { updateData } = req.body;

    console.log("updateData", updateData)
    const hostId = req.hostInfo.id;

    const profile = await Host.findOne({
      _id: hostId
    })

    if (!profile) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: "Profile not found",
        error: null,
      })
    }

    if (updateData.firstName) {
      profile.firstName = updateData.firstName
    }
    if (updateData.lastName) {
      profile.lastName = updateData.lastName
    }
    if (updateData.bio) {
      profile.bio = updateData.bio
    }
    if (updateData.profilePic) {
      profile.profilePic = updateData.profilePic
    }

    await profile.save()

    return res.status(200).json({
      statusCode: 200,
      data: profile,
      message: "Profile updated successfully.",
      error: null,
    })


  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}




export const sendMessage = async (req, res, next) => {
  try {
    const {
      messageText,
      messageFrom,
      propertyId,
      type,
    } = req.body;

    const userId = req.user.id;


    if (!userId) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: "User Id is Missing",
        error: null,
      })
    }
    if (!type) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: "Type is Missing",
        error: null,
      })
    }


    if (!propertyId) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: "Property Id is Missing",
        error: null,
      })
    }

    if (!messageText && !req.file) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: 'Message text or image is required',
        error: null,
      });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file, userId, propertyId); // expects file buffer
    }


    const property = await Property.findOne({
      _id: new ObjectId(propertyId),
    }).select("hostId");

    if (!property) {
      throw new Error("Property not found");
    }

    const hostId = property.hostId;

    const host = await Host.findOne({
      _id: hostId
    })


    const user = await User.findOne({
      _id: userId
    })


    const newMessage = new Message({
      messageText,
      messageFrom,
      userId,
      hostId,
      propertyId,
      type,
      content: imageUrl ? [imageUrl] : [],
    });

    await newMessage.save();

    const textMsg = messageText ? messageText : "🖼️"


    const notificationData = {
      "to": `${host?.fcmToken}`,
      "title": `New Message from ${user?.first_name}!`,
      "body": `${user?.first_name} says: "${textMsg}"`,
      "sound": "default"
    }

    io.to(host?._id.toString()).emit("messageSentToInfluencer", {
      message: `Message Sent To Influencer Successfully`,
      data: newMessage,
      // id: uuidv()
    });



    try {
      const sendNotification = await axios.post("https://exp.host/--/api/v2/push/send", notificationData)
    } catch (error) {
      console.log("failed to send Notification")
    }


    return res.status(200).json({
      statusCode: 200,
      data: newMessage,
      message: 'Message sent successfully',
      error: null,
    });

  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};
