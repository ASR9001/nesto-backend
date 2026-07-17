// backend/pushNotification.ts

import axios from 'axios';
import { firebase_notify } from './utilities/firebasenotify.js';

// export const sendPushNotification = async (expoPushToken: string, title: string, body: string, data?: object) => {
//   try {
//     const message = {
//       to: expoPushToken, // e.g., 'ExponentPushToken[xxxxxx]'
//       sound: 'default',
//       title: title,
//       body: body,
//       data: data || {},
//     };

//     const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json',
//       },
//     });

//     console.log('✅ Notification sent:', response.data);
//   } catch (error) {
//     console.error('❌ Error sending notification:', error.response?.data || error.message);
//   }
// };


export const send_notification_to_creator_for_message = async (
	notificationData
) => {
	try {
		// const formatted_notification_payload = await send_notification_to_creator_for_message_message_formatter(
		//     user_details, creator_details, conversation_details
		// );


		// const totalUnreadUserChatsResult = await CreatorUserConversationMessage.aggregate([
		// 	{
		// 		$match: {
		// 			creator_id: creatorDetails.id,
		// 			user_id: userDetails.id,
		// 			has_creator_seen: false
		// 		}
		// 	},
		// 	{
		// 		$sort: {
		// 			user_id: 1,
		// 			createdAt: -1
		// 		}
		// 	},
		// 	// { $group: { _id: "$user_id", user: { $first: "$$ROOT" } } },
		// 	// {
		// 	// 	$count: "totalUnreadUserChats"
		// 	// },
		// 	{
		// 		"$project": {
		// 			"totalCount": "$totalUnreadUserChats"
		// 		}
		// 	}
		// ])


		// const totalUnreadUserChats = totalUnreadUserChatsResult.length > 0 ? totalUnreadUserChatsResult[0].totalCount : 0;

		// const totalUnreadUserChats = totalUnreadUserChatsResult.length

			const fcmToken = notificationData?.to
		
 
		const notifyData = {
			notification: {
				title: notificationData.title,
				body: notificationData.body,
			},
			token: fcmToken,
			data: {
				click_action: "FLUTTER_NOTIFICATION_CLICK",
				type: notificationData.data?.type || "NEW_MESSAGE",
				userId: notificationData.data?.userId ? notificationData.data.userId.toString() : "",
				propertyId: notificationData.data?.propertyId ? notificationData.data.propertyId.toString() : "",
				userName: notificationData.data?.userName ? notificationData.data.userName.toString() : "",
				userProfileImage: notificationData.data?.userProfileImage ? notificationData.data.userProfileImage.toString() : "",
				message_text: notificationData.body || "",
			},

			apns: {
				payload: {
					aps: {
						sound: "default"
					}
				}
			}
		}

		// console.log("formatted_notification_payload", notifyData);
		const response = await firebase_notify(notifyData);
		
		// console.log("---Inside send_notification_to_creator_for_message", notify);
		// if (notify.status) {
		// 	return {
		// 		status: true,
		// 		error: null
		// 	};
		// } else {
		// 	throw new Error(notify.error);
		// }
	} catch (error) {
		console.log("notification failed",error)
		throw error
	}
};

export const sendBookingNotificationToHost = async (hostFcmToken, bookingDetails) => {
	try {
		if (!hostFcmToken) {
			console.log("No FCM token found for host, skipping notification");
			return;
		}

		const notifyData = {
			token: hostFcmToken,
			notification: {
				title: "New Booking Request!",
				body: `You have a new booking request for ₹${bookingDetails.totalAmount}. Tap to Accept or Decline.`,
			},
			data: {
				click_action: "FLUTTER_NOTIFICATION_CLICK",
				type: "NEW_BOOKING",
				bookingId: bookingDetails._id.toString(),
				amount: bookingDetails.totalAmount.toString(),
				propertyName: bookingDetails.propertyName || "",
			},
			android: {
				priority: "high",
				notification: {
					sound: "default",
					channelId: "high_importance_channel",
				}
			},
			apns: {
				payload: {
					aps: {
						sound: "default",
						contentAvailable: true,
					}
				}
			}
		};

		await firebase_notify(notifyData);
		console.log("✅ Booking notification sent to host FCM Token:", hostFcmToken);
	} catch (error) {
		console.error("❌ Failed to send booking notification to host:", error);
	}
};