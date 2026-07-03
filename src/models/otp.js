import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const OTPSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // OTP expires in 5 minutes
  },
  isValid: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  count : {
    type : Number,
    default : 1
  }
  // Additional fields can be added as required
});

export const OTP = mongoose.model("OTP", OTPSchema);


