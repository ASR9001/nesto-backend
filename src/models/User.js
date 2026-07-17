
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import { v4 as uuidv4 } from 'uuid';

function generateUUID() {
  return uuidv4().replace(/-/g, '').substring(0, 8) + '-' +
  uuidv4().replace(/-/g, '').substring(8, 12) + '-' +
  uuidv4().replace(/-/g, '').substring(12, 16) + '-' +
  uuidv4().replace(/-/g, '').substring(16, 20) + '-' +
  uuidv4().replace(/-/g, '').substring(20);
}
const userSchema = new Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      unique: true,
      validate: {
        validator: (v) => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v),
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      required: false,
      default:null
    },
    gender: {
      type: String,
      required: false,
      default: null,
    },
    profile_image: {
      type: String,
      default: null,
      required: false,

    },
    has_logged_in_for_first_time: {
      type: Boolean,
      default: true,
    },
    sign_up_method: {
      type: String,
      default: "App",
      enum: ["App", "Google", "Facebook"],
    },
    is_logged_in: {
      type: Boolean,
      default: false,
    },
    user_holded: {
      type: Boolean,
      default: false
    },
    user_holded_at: {
      type: Date
    },
    session_id:{
      type:String,
      default:generateUUID
    },
    isDeleted:{
      type:Boolean,
      default:false
    },
    isDisabled:{
      type:Boolean,
      default:false
    },
  
    fcm_token:{
      type:String,
      default:null
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0
    }
  },


  {
    timestamps: true,
  }
);



const User = mongoose.model('User', userSchema);
export default User;


