import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  messageText: {
    type: String,
    default:null
  },
  messageFrom: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Host',
    required: true
  },

  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },

  type: {
    type: String,
    required: true,
    enum:["TEXT","IMAGE"]
  },
  content: [String],

}, {
  timestamps: true,
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
