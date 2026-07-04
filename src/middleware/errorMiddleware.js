// const sendTelegramLog = require("./telegramLogger");

// app.use((err, req, res, next) => {

//     const status = err.statusCode || 500;

//     res.status(status).json({
//         success: false,
//         message: err.message
//     });

//     if (status >= 400) {

//         const message = `
// 🚨 Error Alert

// Status : ${status}

// Method : ${req.method}

// URL : ${req.originalUrl}

// Message :
// ${err.message}

// Time :
// ${new Date().toLocaleString()}
// `;

//         sendTelegramLog(message)
//             .catch(console.error);

//     }

// });