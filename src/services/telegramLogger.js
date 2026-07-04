import axios from 'axios';

export default async function sendTelegramLog(message) {
    try {
        await axios.post(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: "HTML"
            },
            { timeout: 5000 }

        );
    } catch (error) {
        console.error("Telegram Logger Error:", error.message);
    }
}