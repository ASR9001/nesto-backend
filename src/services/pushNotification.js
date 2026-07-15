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
				message_text: "hii",
				// type: conversationDetails.type,
				// user_conversation_id: conversationDetails.conversation_id.toString(),
				// message_text: conversationDetails.text.toString(),
				// recipient: "creator",
				// user_email: userDetails.email.toString(),
				// creator_email: creatorDetails.email.toString(),
				// user_id: userDetails._id.toString(),
				// creator_id: creatorDetails._id.toString(),
				// user_name: `${userDetails.first_name} ${userDetails.last_name}`,
				// creator_name: `${creatorDetails.first_name} ${creatorDetails.last_name}`,
				// message_from: "user",
				// createdAt: `${new Date(conversationDetails.createdAt).toISOString()}`,
				// updatedAt: `${new Date(conversationDetails.updatedAt).toISOString()}`,
				// user_profile_image: random_user_profile(),
				// totalUnreadMessages: totalUnreadUserChats.toString()
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