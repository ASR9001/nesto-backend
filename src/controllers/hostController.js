import { error } from "console";
import Host from "../models/Host.js";
import HostEarning from "../models/HostEarning.js";
import Notification from "../models/Notification.js";
import { generateUploadFileUrl } from "../services/utilities/s3.js";
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { HostWithdrawHistory } from "../models/HostWithdrawHistory.js";
import hostBankDetail from "../models/HostBankDetail.js";

export const generateUploadURLForHost = async (req, res, next) => {
  try {
    const { content } = req.body;
    const hostId = "6824d7db36c60dec26e7c38b";
    const uploadResponse = [];

    // let s3Folder = `public/room/${hostId}/images`;
    let s3Folder = `public/yourid/images`;

    if (content?.files?.length > 0) {
      for (const item of content.files) {
        const { fileName } = item;
        const s3Path = `${s3Folder}/${fileName}`;
        const url = await generateUploadFileUrl(s3Path); // No file buffer needed

        uploadResponse.push({ url, s3Path, fileName });
      }
    }

    return res.status(200).json({
      statusCode: 200,
      data: { files: uploadResponse, s3Folder },
      message: "Upload URL Fetched Successfully",
      error: null,
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};



export const generateUploadURLForHostCloudinary = async (req, res, next) => {
  try {
    const { folder } = req.body;
    const cleanFolder = folder.replace(/[^a-zA-Z0-9\-\/]/g, '');


    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${cleanFolder}&timestamp=${timestamp}`;

    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
      .digest('hex');

    res.json({
      timestamp,
      signature,
      cleanFolder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });


  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};


export const fetchHostEarning = async (req, res, next) => {
  try {
    const hostId = req.hostInfo.id;

    const findHostEarning = await HostEarning.findOne({
      hostId: hostId
    })

    if (!findHostEarning) {
      console.log("host earning not found")
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: "Host Earning not found.",
        error: null,
      });
    }

    console.log("Host earning fetch Successfully.")
    return res.status(200).json({
      statusCode: 200,
      data: findHostEarning,
      message: "Host earning fetch Successfully.",
      error: null,
    });

  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}



export const fetchNotification = async (req, res, next) => {
  try {
    const hostId = req.hostInfo.id;
    // const objHostId = new ObjectId(
    //           hostId
    //         )
    // const fetchResponse = await Notification.find({ hostId: objHostId });
    // const fetchResponse = await Notification.find({ hostId: hostId });
    // const fetchResponse3 = await Notification.find();

    const fetchResponse = await Notification.aggregate(
      [
        {
          $match:

          {
            hostId: hostId
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
          $project: {
            notificationText: 1,
            isDelivered: 1,
            markReadByHost: 1,
            createdAt: 1,
            profilePic: {
              $arrayElemAt: ["$user.profile_image", 0]
            },
            firstName: {
              $arrayElemAt: ["$user.first_name", 0]
            },
            lastName: {
              $arrayElemAt: ["$user.last_name", 0]
            }
          }
        }
      ]
    )





    if (!fetchResponse) {
      return res.status(200).json({
        statusCode: 200,
        message: "No Notification Found.",
        data: [],
        error: null
      })
    }


    return res.status(200).json({
      statusCode: 200,
      message: "Notification Fetch Successfully.",
      data: fetchResponse,
      error: null
    })

  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}



export const getHostProfile = async (req, res, next) => {
  try {
    const hostId = req.hostInfo.id;

    const findHost = await Host.findOne({
      _id: hostId
    })

    // const fetchBooking = await Booking.aggregate(
    //   [
    //     {
    //       $match: {
    //         hostId: new ObjectId(
    //           hostId
    //         )
    //       }
    //     },
    //     {
    //       $sort: {
    //         checkIn: 1
    //       }
    //     },
    //     {
    //       $lookup: {
    //         from: "users",
    //         localField: "userId",
    //         foreignField: "_id",
    //         as: "user"
    //       }
    //     },
    //     {
    //       $lookup: {
    //         from: "properties",
    //         localField: "propertyId",
    //         foreignField: "_id",
    //         as: "property"
    //       }
    //     },
    //     {
    //       $unwind: {
    //         path: "$property"
    //       }
    //     },
    //     {
    //       $unwind: {
    //         path: "$user"
    //       }
    //     },
    //     {
    //       $project: {
    //         userId: 1,
    //         propertyId: 1,
    //         checkIn: 1,
    //         checkOut: 1,
    //         adult: 1,
    //         child: 1,
    //         pet: 1,
    //         status: 1,
    //         propertyName: "$property.title",
    //         propertyLocation: {
    //           $concat: [
    //             "$property.location.address",
    //             " ",
    //             "$property.location.city"
    //           ]
    //         },
    //         guestName: {
    //           $concat: [
    //             "$user.first_name",
    //             " ",
    //             "$user.last_name"
    //           ]
    //         },
    //         daterange: {
    //           $concat: [
    //             {
    //               $dateToString: {
    //                 format: "%Y-%m-%d",
    //                 date: "$checkIn"
    //               }
    //             },
    //             " to ",
    //             {
    //               $dateToString: {
    //                 format: "%Y-%m-%d",
    //                 date: "$checkOut"
    //               }
    //             }
    //           ]
    //         }
    //       }
    //     }
    //   ]

    // )

  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}


export const getHostWithdrawalHistory = async (req, res, next) => {
  try {

    const hostId = req.hostInfo.id;
    const objectHostId = new ObjectId(hostId)


    // const isHostWithdrawHistory = await HostWithdrawHistory.find({ hostId: new ObjectId(hostId) }).sort({ withdrawDate: -1 }).limit(20).lean()
    const isHostWithdrawHistory = await HostWithdrawHistory.find({ hostId: objectHostId }).sort({ withdrawDate: -1 }).limit(20).lean()

    if (isHostWithdrawHistory) {
      return res.status(200).json({
        statusCode: 200,
        message: "fetched successfully",
        data: isHostWithdrawHistory,
        error: null

      });
    }
    return res.status(400).json({
      statusCode: 400,
      message: "No withdraw history found.",
      data: [],
      error: null
    });


  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}



// export const saveHostBankDetails = async (req, res) => {
//   try {

//     const hostId = req.hostInfo.id;

//     const { accountHolderName, accountNumber, bankName, ifscCode, upiId } = req.body;


//     if (!accountHolderName || !accountNumber || !bankName || !ifscCode) {
//       return res.status(400).json({
//         statusCode: 400,
//         message: "Some Details are missing",
//         data: null,
//         error: null

//       });
//     }

//     await hostBankDetail.create({
//       hostId:hostId,
//       accountHolderName: accountHolderName,
//       accountNumber: accountNumber,
//       bankName: bankName,
//       ifscCode: ifscCode,
//       upiId: upiId
//     })

//     return res.status(200).json({
//       statusCode: 200,
//       data: null,
//       message: "Bank Account Details Save Successfully",
//       error: null,
//     });


//   } catch (error) {
//     return res.status(500).json({
//       statusCode: 500,
//       data: null,
//       message: error.message,
//       error: error,
//     });
//   }
// }


export const saveHostBankDetails = async (req, res, next) => {
  try {
    const hostId = req.hostInfo.id;
    const { accountHolderName, accountNumber, bankName, ifscCode, upiId } = req.body;

    if (!accountHolderName || !accountNumber || !bankName || !ifscCode) {
      return res.status(400).json({
        statusCode: 400,
        message: "Some Details are missing",
        data: null,
        error: null,
      });
    }

    const existingDetails = await hostBankDetail.findOne({ where: { hostId } });

    if (existingDetails) {
      const isEmpty = (value) =>
        value === null || value === undefined || String(value).trim() === "";

      const updateData = {};
      const updatedFields = [];

      if (isEmpty(existingDetails.accountHolderName)) {
        updateData.accountHolderName = accountHolderName;
        updatedFields.push("accountHolderName");
      }

      if (isEmpty(existingDetails.accountNumber)) {
        updateData.accountNumber = accountNumber;
        updatedFields.push("accountNumber");
      }

      if (isEmpty(existingDetails.bankName)) {
        updateData.bankName = bankName;
        updatedFields.push("bankName");
      }

      if (isEmpty(existingDetails.ifscCode)) {
        updateData.ifscCode = ifscCode;
        updatedFields.push("ifscCode");
      }

      if (isEmpty(existingDetails.upiId) && upiId) {
        updateData.upiId = upiId;
        updatedFields.push("upiId");
      }

      if (Object.keys(updateData).length > 0) {
        await hostBankDetail.update(updateData, { where: { hostId } });

        return res.status(200).json({
          statusCode: 200,
          data: { updatedFields },
          message: "Bank Account Details updated (only empty fields).",
          error: null,
        });
      } else {
        return res.status(200).json({
          statusCode: 200,
          data: null,
          message: "No fields updated. All values already exist.",
          error: null,
        });
      }

    } else {
      await hostBankDetail.create({
        hostId,
        accountHolderName,
        accountNumber,
        bankName,
        ifscCode,
        upiId
      });

      return res.status(200).json({
        statusCode: 200,
        data: null,
        message: "Bank Account Details saved successfully.",
        error: null,
      });
    }

  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};




export const getHostBankDetails = async (req, res, next) => {
  try {

    const hostId = req.hostInfo.id;




    const getBankDetails = await hostBankDetail.findOne({
      hostId: hostId
    })

    // if (!getBankDetails) {
    //   return res.status(200).json({
    //     statusCode: 200,
    //     data: [],
    //     message: "Bank Account Details Fetch Successfully",
    //     error: null,
    //   });
    // }

    return res.status(200).json({
      statusCode: 200,
      data: getBankDetails,
      message: "Bank Account Details Fetch Successfully",
      error: null,
    });


  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}

export const updateFcmToken = async (req, res, next) => {
  try {
    const hostId = req.hostInfo?.id;
    const { fcmToken } = req.body;

    if (!hostId) {
      return res.status(401).json({
        statusCode: 401,
        message: "Access denied. Not authorized.",
        data: null,
        error: null,
      });
    }

    if (!fcmToken && fcmToken !== "") {
      return res.status(400).json({
        statusCode: 400,
        message: "FCM Token not provided.",
        data: null,
        error: null,
      });
    }

    const host = await Host.findById(hostId);
    if (!host) {
      return res.status(404).json({
        statusCode: 404,
        message: "Host account not found.",
        data: null,
        error: null,
      });
    }

    // Cost-saving: Avoid database update if token is unchanged
    if (host.fcmToken === fcmToken) {
      return res.status(200).json({
        statusCode: 200,
        message: "FCM token is already up to date.",
        data: null,
        error: null,
      });
    }

    host.fcmToken = fcmToken;
    await host.save();

    return res.status(200).json({
      statusCode: 200,
      message: "FCM Token updated successfully",
      data: null,
      error: null,
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};

