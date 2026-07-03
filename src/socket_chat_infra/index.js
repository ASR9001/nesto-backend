import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';



import { redisSocketClient } from '../config/socket.js';
import moment from 'moment';
import { findCreatorDetails, findUserDetails } from './functions/helper.js';
import User from '../models/User.js';

const rooms = new Set();





export const setupSocketMiddleware = (io) => {
	io.use(async (socket, next) => {
		try {
			let token = socket.handshake.auth.token
				? socket.handshake.auth.token
				: socket.handshake.headers.authorization;
			const from = socket.handshake.auth.from
				? socket.handshake.auth.from
				: socket.handshake.headers.from;

			if (!token || !from) {
				throw new Error("Authentication error: Both token and 'from' are required.");
			}

			token = token.startsWith("Bearer ") ? token.slice(7) : token;

			// return next();

			if (from === "creator") {
				const decoded = jwt.verify(token, process.env.CREATOR_SECRET_KEY);

				const getCreatorIdFromHashMapper = await HashMapper.findOne({
					secret_value: decoded.id,
					active: true,
				});

				if (!getCreatorIdFromHashMapper) {
					throw new Error("Failed to find details in HashMapper");
				}

				const fetchCreatorDetails = await Creator.findById(
					getCreatorIdFromHashMapper.id,
				);

				if (!fetchCreatorDetails || fetchCreatorDetails.influencer_login_token !== token) {
					throw new Error("Authentication error: Invalid token");
				}

				const creatorId = fetchCreatorDetails.id;

				// ✅ Old socket disconnect — Redis se lo
				const oldSocketId = await redisSocketClient.get(`creator:socket:${creatorId}`);

				if (oldSocketId && oldSocketId !== socket.id) {
					const oldSocket = io.sockets.sockets.get(oldSocketId);

					if (oldSocket) {
						// console.log(`Disconnecting old Influencer socket ${oldSocketId} for Influencer ${creatorId}`);
						try {
							oldSocket.emit("force_disconnect", {
								message: "New socket connected for same creator",
								id: uuidv(),
							});
						} catch (e) { }

						oldSocket.disconnect(true);
					}
				}

				// ✅ Redis mein save karo
				await redisSocketClient.set(`creator:socket:${creatorId}`, socket.id);

				socket.join(creatorId);
				rooms.add(creatorId);

				socket.creator = {
					id: fetchCreatorDetails.id,
					email: fetchCreatorDetails.email,
					role: decoded.role,
					iat: decoded.iat
				};

				return next();
			}

			else if (from === "user") {
				const decoded = jwt.verify(token, process.env.USER_SECRET_KEY);

				// const fetchUserDetails = await User.findById(decoded.id);
				const fetchUserDetails = await User.findOne({email:decoded.email});

				if (!fetchUserDetails) {
					throw new Error("User not found!");
				}

				// ✅ fetchUserDetails.id use karo — userId typo fix
				await redisSocketClient.set(`user:socket:${fetchUserDetails.id}`, socket.id);

				socket.join(fetchUserDetails.id);
				rooms.add(fetchUserDetails.id);

				socket.user = {
					id: fetchUserDetails.id,
					email: fetchUserDetails.email,
					role: decoded.role,
					iat: decoded.iat,
				};

				return next();
			}

			else if (from === "admin") {
				return next();
			}

		} catch (error) {
			const socketId = socket.id;
			const socketHeaders = socket.handshake.headers ?? {};
			const socketRooms = Array.from(socket.rooms ?? []);
			const socketCreator = socket?.creator ?? {};
			const socketUser = socket?.user ?? {};

			const socketData = {
				socketHeaders, socketRooms, socketCreator, socketUser, socketId
			};

			console.error("Socket auth error:", {
				error,
				socketData,
			});

			return next(error instanceof Error ? error : new Error("Authentication error"));
		}
	});
}



export const setupSocketHandlers = (io) => {
	io.on("connection", (socket) => {
		console.log("New socket connected:", socket.id);

		socket.onAny((event) => {
			console.log(`[${new Date().toISOString()}] Event: ${event}`);
		});

		const socketId = socket.id
		const socketHeaders = socket.handshake.headers
		const socketRooms = Array.from(socket.rooms ?? []);

		socket.use(([event, ...args], next) => {
			const socketCreator = socket?.creator
			const socketUser = socket?.user


			// if (!socketCreator && !socketUser) {
			// 	return next(new Error("Creator or User sockets details are undefined"));
			// }
			next();
		});



		socket.onAny((event, ...data) => {
			try {
				// const id = uuidv()
				const socketCreator = socket?.creator ?? {}
				const socketUser = socket?.user ?? {}
				const socketData = {
					socketHeaders, socketRooms, data, socketCreator, socketUser, socketId
				}
				
			} catch (error) {
				// const id = uuidv()
				const socketCreator = socket?.creator ?? {}
				const socketUser = socket?.user ?? {}

				const socketData = {
					socketHeaders, socketRooms, socketCreator, socketUser, socketId
				}

			}
			// const id = uuidv()
			const socketCreator = socket?.creator ?? {}
			const socketUser = socket?.user ?? {}
			const socketData = {
				socketHeaders, socketRooms, data, socketCreator, socketUser, socketId
			}

		});

		socket.onAnyOutgoing((event, ...data) => {
			const socketCreator = socket?.creator ?? {}
			const socketUser = socket?.user ?? {}
			const socketData = {
				socketHeaders, socketRooms, data, socketCreator, socketUser, socketId
			}
			const id = data[0]?.id//

			
		});




		socket.on("error", (err) => {
			// const id = uuidv()
			const socketCreator = socket?.creator ?? {}
			const socketUser = socket?.user ?? {}

			const socketData = {
				socketHeaders, socketRooms, socketCreator, socketUser, socketId
			}



			socket.disconnect();

		});


		socket.on("sendMessage", async (data) => {
			const socketEvent = "sendMessage";

			try {
				//
				const { conversation_id, from, type, text, caption, price, uploadedPath } = data;


				const [creatorDetails, userDetails] = await Promise.all([
					findCreatorDetails(from, socket, data),
					findUserDetails(from, socket, data),
				]);
				// const creatorStatus = await checkCreatorStatus(creatorDetails.id);



				// const conversationExists = await creatorUserConversation.findOne({
				// 	_id: conversation_id,

				// });

				// if (!conversationExists) {
				// 	return io.to(socket.id).emit("messageError", {
				// 		message: "Conversation History Does Not Exist"
				// 		// id: uuidv()
				// 	});
				// }

				if (from === "web") {
					// conversationExists.user_socket_id = socket.id;

					// const checkIfUserCanMessage = await checkPermissionOfUser(
					// 	userDetails,
					// 	creatorDetails,
					// 	type,
					// );

					// if (checkIfUserCanMessage?.error) {
					// 	const generateAmountCard =
					// 		await chat_message_recharge_modal_for_insufficient_balance(
					// 			checkIfUserCanMessage,
					// 		);
					// 	//User Cant Send Message due to insufficient balance
					// 	return io
					// 		.to(socket.id)
					// 		.emit("insufficientToken", { generateAmountCard: checkIfUserCanMessage?.data });
					// }
				} else if (from === "flutter") {
					conversationExists.creator_socket_id = socket.id;
				}

				await conversationExists.save();


				let checkChatConnectivity = await chatConnectivity.findOne({
					user_id: conversationExists.user_id,
					creator_id: conversationExists.creator_id
				});


				if (!checkChatConnectivity) {
					checkChatConnectivity = await chatConnectivity.create({
						user_id: conversationExists.user_id,
						creator_id: conversationExists.creator_id,
						// yaha default fields bhi add kar sakte ho
						is_user_on_chat_window: true
					});
				}


				const isUserChatWindowOpen = checkChatConnectivity.is_user_on_chat_window
				const isCreatorChatWindowOpen = checkChatConnectivity.is_creator_on_chat_window
				if (conversationExists) {

					let totalWalletBalance;

					const hasInteractedOnChat = await creatorUserConversation.findByIdAndUpdate(
						conversation_id,
						{ has_interacted_on_chat: true },
						{ new: true }
					);

					if (conversationExists.isDeleted) {
						conversationExists.isDeleted = false;
						await conversationExists.save()
					}

					if (hasInteractedOnChat && !hasInteractedOnChat.has_interacted_on_chat) {
						// console.log("Failed to update creatoruserconversations document")
					}

					if (from === "web") {
						const creatorBotDetails = await CreatorBotSetting.findOne({
							creator_id: creatorDetails._id,
						});
						if (!creatorBotDetails) {
							return {
								error: true,
								message: "Creator bot details not found",
							};
						}
						const unchangedWallet = await Wallet.findOne({ user_id: userDetails.id });
						const wallet = await Wallet.findOne({ user_id: userDetails.id });
						const messagePrice = await findMessageCost(type, creatorDetails, userDetails, wallet, creatorBotDetails);
						if (messagePrice.error) {
							throw new Error(messagePrice.message);
						}
						wallet.wallet_balance -= messagePrice
						await wallet.save();
						const dbMessage = await createAndSendMessage(
							conversation_id,
							type,
							text,
							uploadedPath,
							userDetails,
							creatorDetails,
							from,
							false,
							_,
							_,
							_,
							price,
							caption,
							isUserChatWindowOpen,
							isCreatorChatWindowOpen,
							null,

							// deduct_token?.transaction

						);


						if (dbMessage?.error) {
							throw new Error(dbMessage.message)
						}


						const contentWithUrl = [];

						const { content } = dbMessage;

						const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

						for (const item of content) {

							const contentUrl = await generateSignedCloudfrontUrl(item.s3Path, expiryTime);

							const updatedContent = { url: contentUrl };

							contentWithUrl.push(updatedContent);
						}


						const userWalletHistoryDocument = await userWalletHistory.create({
							userId: userDetails.id,
							currentBalance: (wallet.wallet_balance),
							amount: messagePrice,
							type: "DEBIT",
							serviceCollectionName: "CreatorUserConversationMessage",
							serviceId: dbMessage._id,
						})


						io.to(socket.user.id).emit("fetchedUserToken", {
							message: "User Token Fetched Successfully",
							wallet_balance: (wallet.wallet_balance),
							// id: uuidv()
						});

						const deduct_token = await deductToken(
							{
								userId: userDetails.id,
								creatorId: creatorDetails.email,
								creatorName: `${creatorDetails.first_name} ${creatorDetails.last_name}`,
								userName: `${userDetails.first_name} ${userDetails.last_name}`,
								messageId: dbMessage._id,
								unchangedWallet,
								userWalletHistoryId: userWalletHistoryDocument._id


							},
							// type == "text" || "image" || "video" ? "chat" : type,
							type,
							_,
							_,
							_,
							// session,


						);

						if (deduct_token.error) {

							throw new Error(deduct_token.error)
						}


						totalWalletBalance = deduct_token.data

						const messageResponse = { ...dbMessage, content: contentWithUrl, userWalletBalance: totalWalletBalance }



						io.to(socket.user.id).emit("messageSentToInfluencer", {
							message: `Message Sent To Influencer Successfully`,
							data: messageResponse,
							// id: uuidv()
						});



						// const creatorSocketId = activeCreatorSockets.get(String(data.creator_id));

						// if (creatorSocketId) {
						// 	io.to(creatorSocketId).emit("messageReceived", {
						// 		data: messageResponse,
						// 		message: `Message Received From User Successfully`,
						// 		id: uuidv()
						// 	});
						// } else {
						// 	console.log("Creator socket not active for creator_id:", data.creator_id);
						// }

						io.to(String(conversationExists.creator_id)).emit("messageReceived", {
							data: messageResponse,
							message: `Message Received From User Successfully`,
							// id: uuidv()
						});


						await emitCreatorUnreadChatCount(io, creatorDetails.id);




						if (dbMessage) {
							const notify = await send_notification_to_creator_for_message(
								userDetails,
								creatorDetails,
								{
									conversation_id,
									text,
									updatedAt: dbMessage.updatedAt,
									createdAt: dbMessage.createdAt,
									type
								},
							);
						}
					} else if (from === "flutter") {


						const dbMessage = await createAndSendMessage(
							conversation_id,
							type,
							text,
							uploadedPath,
							userDetails,
							creatorDetails,
							from,
							false,
							_,
							_,
							_,
							price,
							caption,
							isUserChatWindowOpen,
							isCreatorChatWindowOpen,
						);

						const contentWithUrl = [];

						const { content } = dbMessage;

						const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

						for (const item of content) {

							const contentUrl = await generateSignedCloudfrontUrl(item.s3Path, expiryTime);

							const updatedContent = { url: contentUrl };

							contentWithUrl.push(updatedContent);
						}




						const messageResponse = { ...dbMessage, content: contentWithUrl, userWalletBalance: totalWalletBalance }


						// const userSocketId = activeUserSockets.get(String(data.user_id));

						// if (userSocketId) {
						// 	io.to(userSocketId).emit("messageReceived", {
						// 		data: messageResponse,
						// 		message: `Message Received From Influencer Successfully`,
						// 		id: uuidv()
						// 	});
						// }

						io.to(String(conversationExists.user_id)).emit("messageReceived", {
							data: messageResponse,
							message: `Message Received From Influencer Successfully`,
							// id: uuidv()
						});
						// 69ff3c4cf5be4724585b8925     ledrazpdNRlNMtTHAAAB

						const roomId = String(conversationExists.creator_id);

						const sockets = await io.in(roomId).fetchSockets();


						// io.to(String(conversationExists.creator_id)).emit("messageSentToUser", {
						io.to(String(socket.id)).emit("messageSentToUser", {
							message: `Message Sent To User Successfully`,
							data: messageResponse,
							// id: uuidv()
						});


					}
				} else {

					socket.emit(
						from === "web"
							? "unable_to_send_message_to_creator"
							: "unable_to_send_message_to_user",
						{
							message: "Conversation is not initialized",
							// id: uuidv()
						},
					);
				}

			} catch (error) {
				// await session.abortTransaction();

				// const id = uuidv()
				const socketCreator = socket?.creator ?? {}
				const socketUser = socket?.user ?? {}

				const socketData = {
					data, socketHeaders, socketRooms, socketCreator, socketUser, socketId
				}


				io.to(socket.id).emit("messageError", {
					message: "An error occurred while sending the message.",
					// id: uuidv()
				});
			} finally {
				// session.endSession();
			}
		});



	

		socket.on("disconnect", async () => {

			try {
				const isCreator = socket.creator && socket.creator.role === "creator";

				if (isCreator) {
					// console.log("Socket disconnected ❌");
					// ─── CREATOR DISCONNECT ───────────────────────────────────────────
					const creatorId = socket.creator.id;

					//new using ai abhishek
					// const currentActiveSocketId = activeCreatorSockets.get(String(creatorId));
					// if (currentActiveSocketId === socket.id) {
					// 	activeCreatorSockets.delete(String(creatorId));
					// }
					const currentActiveSocketId = await redisSocketClient.get(`creator:socket:${creatorId}`);
					if (currentActiveSocketId === socket.id) {
						await redisSocketClient.del(`creator:socket:${creatorId}`);
					}

					//end using ai abhishek

					// const [fetchCreatorDetails] = await Promise.all([
					// 	Creator.findByIdAndUpdate(
					// 		creatorId,
					// 		{
					// 			$set: {
					// 				is_creator_on_screen: false,
					// 				is_influencer_on_special_call: false,
					// 				is_influencer_on_screen_with_special_call: false,
					// 			},
					// 		},
					// 		{ new: true }
					// 	),
					// 	creatorOnlineStatus.updateOne(
					// 		{ creator_id: creatorId },
					// 		{ $set: { is_connected: false, lastSeen: new Date() } }
					// 	),
					// 	chatConnectivity.updateMany(
					// 		{ creator_id: creatorId },
					// 		{ $set: { is_creator_on_chat_window: false } }
					// 	),
					// ]);

					// if (!fetchCreatorDetails) return;

					//   if (fetchCreatorDetails.creator_status === "ai_mode") {
					//     io.to(`${creatorId}_users`).emit("creator_status", {
					//       creator_online: false,
					//       message: "Creator is now offline",
					//       id: uuidv(),
					//     });
					//     io.to(`${creatorId}_users`).emit("creator_mode", {
					//       message: `${fetchCreatorDetails.first_name}.ai is now live`,
					//       type: fetchCreatorDetails.creator_status,
					//       ai_mode: true,
					//       id: uuidv(),
					//     });
					//   }
				} else {
					// ─── USER DISCONNECT ──────────────────────────────────────────────
					const userId = socket.user?.id;
					if (!userId) return;


					//new using ai abhishek


					if (userId) {
						const currentActiveSocketId = await redisSocketClient.get(`user:socket:${userId}`);
						if (currentActiveSocketId === socket.id) {
							await redisSocketClient.del(`user:socket:${userId}`);
						}
					}

				}
			} catch (error) {
				const socketCreator = socket?.creator ?? {};
				const socketUser = socket?.user ?? {};
				// Log error properly — replace with your logger
				console.error("[disconnect] Error:", {
					error,
					socketCreator,
					socketUser,
					socketId: socket.id,
				});
			}
		});

	})
}
