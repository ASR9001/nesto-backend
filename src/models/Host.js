
import mongoose from 'mongoose';
const Schema = mongoose.Schema;


const hostSchema = new Schema(
    {
        
        email: {
            type: String,
            required:true
        },
        firstName: {
            type: String,
            required:true
        },
        lastName: {
            type: String,
            required:true
        },
        profilePic: {
            type: String,
            required:false,
            default:null
        },
        mobileNumber: {
            type: Number,
            required:true
        },
         password: {
            type: String,
            required:true
        },
        isDeleted:{
            type:Boolean,
            default:false
        },
        isDisabled:{
            type:Boolean,
            default:false
        },
        isLogin:{
            type:Boolean,
            default:false
        },

        loginToken:{
            type:String
        },
        isKycVerified:{
            type:Boolean,
            default:true
        },
        fcmToken:{
            type:String,
            default:null
        },
        bio:{
            type:String,
            default:null
        },
        commission:{
            type:Number,
            required:false,
            min:0,
            max:20,
            default:2
        }
    
    },
    {
        timestamps: true,
    }
);



const Host = mongoose.model('Host', hostSchema);
export default Host;


