import express from 'express';
import { createReview, fetchPropertyReviews, propertySearch } from '../controllers/reviewController.js';
import { cancelBooking, createBooking, fetchBookingCharges, fetchTransaction, getUserBookings } from '../controllers/bookingController.js';
import {  getAllPropertiesForUser, getFeaturedProperty, getPropertyById } from '../controllers/propertyController.js';
import { userVerifyToken } from '../middleware/userVerifyToken.js';
import { fetchSingleChat, sendMessage } from '../controllers/chatController.js';
// import { register } from '../controllers/authController';
import multer from 'multer';
import { getDetails, registerUserManually, resetPassword, sendForgotPasswordOtp, sendUserOtp, updateName, updatePassword, userLogin, verifyUserOtp } from '../controllers/accountController.js';


const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();


router.get("/fetch-property-reviews/:id" , fetchPropertyReviews)
router.get("/search" , propertySearch)
router.get("/get-user-bookings" ,userVerifyToken, getUserBookings)
router.post('/cancel-booking',userVerifyToken, cancelBooking)
router.get('/get-featured-property' , getFeaturedProperty)
router.get('/get-all-property-for-user', getAllPropertiesForUser);         
router.get('/get-single-property/:id', getPropertyById); 
router.post('/create-booking', createBooking);
// router.post('/:propertyId', userVerifyToken, createReview);
router.post("/add-review",userVerifyToken , createReview)



router.post('/chat/fetch-single-chat-for-user',userVerifyToken, fetchSingleChat); 

router.post('/chat/send-message',userVerifyToken , upload.single('image'), sendMessage); 



router.post("/booking/fetch-booking-charges" ,fetchBookingCharges )
router.get("/booking/fetch-transaction" , userVerifyToken , fetchTransaction )
router.post("/account/update-password" , userVerifyToken , updatePassword )
router.post("/account/update-name" , userVerifyToken , updateName )
router.get("/account/details" , userVerifyToken , getDetails )
// router.post("/update-password"  , fetchBookingCharges )


router.post("/register/send-otp" , sendUserOtp)
router.post("/register/verify-otp" , verifyUserOtp)
router.post('/register/create-user', registerUserManually )
router.post("/account/login" , userLogin)
router.post("/account/forgot-password" , sendForgotPasswordOtp)
router.post("/account/reset-password" , resetPassword)


// router.get('/search', searchProperties);

// router.post("/register-user" , register)
// router.post("/send-otp", sendOTPForLogin);
// router.post("/signup", createUser);
// router.post("/login", loginUser);
// router.post("/profile/delete", userVerifyToken, deleteProfile);
// router.post("/google-login", GoogleUser);
// router.get("/logout", userVerifyToken, logoutUser);

export default router;
