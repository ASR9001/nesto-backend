import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Message schema
const creatorUserConversationMessageSchema = new mongoose.Schema(
	{
		user_conversation_id: {
			type: Schema.Types.ObjectId,
			ref: "CreatorUserConversation",
			required: true,
		},
		type: {
			type: String,
			enum: [ "CHAT_MANUAL_TEXT","CHAT_MANUAL_IMAGE","CHAT_MANUAL_VIDEO","CHAT_MANUAL_AUDIO","VIDEO_CALL_DIRECT", "VIDEO_CALL_PREMIUM"],
			required: true,
		},
		message_text: {
			type: String,
			required: function () {
				return this.type === "message";
			}, // Conditional requirement based on type
		},
		content: [
			{
				s3Path: {
					type: String,
					required: false,
				},
			},
		],
		recipient: {
			type: String,
			required: true,
		},
		user_email: {
			type: String,
			required: true,
		},
		creator_email: {
			type: String,
			required: true,
		},
		user_id: {
			type: String,
			required: true,
		},
		creator_id: {
			type: String,
			required: true,
		},
		from_ai: {
			type: Boolean,
			default: false,
		},
		user_name: {
			type: String,
			required: true,
		},
		creator_name: {
			type: String,
			required: true,
		},
		message_from: {
			type: String,
			required: true,
		},
		isDeleted: {
			type: Boolean,
			default:false
		},
		has_creator_seen: {
			type: Boolean,
			default:false
		},
		has_user_seen: {
			type: Boolean,
			default:false
		},
		price:{
			type: Number,
			default:0
		},
		caption:{
			type: String,
			default:""
		},
		is_locked:{
			type:Boolean,
			default: function() {
				return this.price !== 0;
			}
		},
		// image_local_path : {
		//   type : String,
		//   default : null
		// },
		// video_local_path : {
		//   type : String,
		//   default : null
		// },
		// voice_message_local_path : {
		//   type : String,
		//   default : null
		// },
		createdAt: { type: Date, default: Date.now, expires: 864000 },
	},
	{ timestamps: true },
);

export const CreatorUserConversationMessage = mongoose.model(
	"CreatorUserConversationMessage",
	creatorUserConversationMessageSchema,
);
