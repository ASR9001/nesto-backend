import express from 'express';
import { forgotPassword, GoogleUser, hostLogin, hostLogout, registerHost, resetForgotPassword, sendOtp, verifyOtp, verifyOtpForgotPassword } from '../controllers/authController.js';
// import admin from '../firebaseAdmin.js';
import User from '../models/User.js';


const router = express.Router();

// router.post('/register', register);
// router.post('/login', login);
router.post('/google-user', GoogleUser);

router.post('/host/register', registerHost )

router.post("/host/register/send-otp" , sendOtp)
router.post("/host/register/verify-otp" , verifyOtp)


router.post("/host/login" , hostLogin)
router.post("/host/logout" ,  hostLogout)

router.post("/host/forgot-password" ,  forgotPassword)
router.post("/host/forgot-password/verify-otp" ,  verifyOtpForgotPassword)
router.post("/host/forgot-password/reset" ,  resetForgotPassword)

// router.post('/google', async (req, res) => {
//     const { idToken } = req.body;
  
//     try {
//       const decodedToken = await admin.auth().verifyIdToken(idToken);
//       const { uid, email, name, picture } = decodedToken;
  
//       let user = await User.findOne({ email });
  
//       if (!user) {
//         user = await User.create({
//           name,
//           email,
//           photo: picture,
//           googleId: uid,
//         });
//       }
  
//       // generate your own JWT here if needed for your app auth
//       res.status(200).json({ user });
//     } catch (error) {
//       console.error('Firebase verify error:', error);
//       res.status(401).json({ message: 'Unauthorized' });
//     }
//   });

export default router;
