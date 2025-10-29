import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const creatorUserConversationSchema = new mongoose.Schema(
  {
    creator_id: {
      type: Schema.Types.ObjectId,
      ref: "Creator",
      required: true,
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    user_socket_id : {
      type : String,
      required : false
    },
    creator_socket_id : {
      type : String,
      required : false
    },
    is_creator_notified : {
      type : Boolean,
      default : false
    },
    is_creator_notified_about_ai_chat : {
      type : Boolean,
      default : false
    },
    has_interacted_on_chat:{
      type : Boolean,
      default: false
    },
    isDeleted: {
			type: Boolean,
			default:false
		},
    cost: {
      manualText:{
        type:Number,
        default:0
      },
      attachment:{
        type:Number,
        default:0
      },
    }
  },
  { timestamps: true }
);

export const creatorUserConversation = mongoose.model(
  "CreatorUserConversation",
  creatorUserConversationSchema
);
