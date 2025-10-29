// backend/pushNotification.ts

import axios from 'axios';

export const sendPushNotification = async (expoPushToken: string, title: string, body: string, data?: object) => {
  try {
    const message = {
      to: expoPushToken, // e.g., 'ExponentPushToken[xxxxxx]'
      sound: 'default',
      title: title,
      body: body,
      data: data || {},
    };

    const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('✅ Notification sent:', response.data);
  } catch (error) {
    console.error('❌ Error sending notification:', error.response?.data || error.message);
  }
};
