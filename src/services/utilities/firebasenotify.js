import admin from '../../firebaseAdmin.js';

export const firebase_notify = async (message_payload) => {
    try {

        const response = await admin.messaging().send(message_payload);


    } catch (error) {
        throw error
    }
};
