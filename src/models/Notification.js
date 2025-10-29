
import mongoose from 'mongoose';
const Schema = mongoose.Schema;


const notificationSchema = new Schema(
    {

        hostId: {
            type: String,
            required: true
        },
        userId: {
            type: String,
            required: true
        },
        notificationText: {
            type: String,
            required: true
        },
        isDelivered: {
            type: Boolean,
            required: true
        },
        markReadByHost: {
            type: Boolean,
            required: true
        }

    },
    {
        timestamps: true,
    }
);



const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;


