import express from 'express';
import {  fetchHostEarning, fetchNotification, generateUploadURLForHost, generateUploadURLForHostCloudinary, getHostBankDetails, getHostWithdrawalHistory, saveHostBankDetails } from '../controllers/hostController.js';
import { cancelBookingByHost, getAllHostBooking, getHome } from '../controllers/bookingController.js';
import { hostVerifyToken } from '../middleware/hostVerifyToken.js';
import { createProperty, disableProperty, getAllPropertiesForHost, getHostPropertyById, updateProperty } from '../controllers/propertyController.js';
import { fetchAllChatForHost, fetchProfile, getChatForHost, sendMessageByHost, updateProfile } from '../controllers/chatController.js';



const router = express.Router();

//property asset upload route
router.post('/generate-upload-url', generateUploadURLForHost);
router.post('/generate-upload-url-cloudinary', generateUploadURLForHostCloudinary);


//host property route
router.get('/home', hostVerifyToken, getHome)
router.get('/booking/get-all-booking', hostVerifyToken, getAllHostBooking)
router.post('/add-property',hostVerifyToken, createProperty); 
router.post('/disable-property',hostVerifyToken, disableProperty); 
router.post('/update/:id', hostVerifyToken , updateProperty); 
router.get('/get-all-property-for-host', hostVerifyToken , getAllPropertiesForHost);         
router.get('/get-single-property-for-host/:id', getHostPropertyById); 

router.get('/fetch-all-chat-for-host',hostVerifyToken , fetchAllChatForHost); 
router.get('/get-chat/:propertyId', hostVerifyToken , getChatForHost)
router.post('/send-message', hostVerifyToken , sendMessageByHost)


router.get('/fetch-profile',hostVerifyToken , fetchProfile); 
router.post('/update-profile',hostVerifyToken , updateProfile); 


router.post('/booking/cancel-booking', hostVerifyToken, cancelBookingByHost)


//host fetch earning
router.get('/revenue/fetch-host-revenue' , hostVerifyToken , fetchHostEarning)
router.get('/notification/fetch-notification', hostVerifyToken , fetchNotification)

//withdrwal History
router.get('/hostearning/fetch-withdrawal-history', hostVerifyToken , getHostWithdrawalHistory)


router.get('/bankdetails/fetch-bank-details', hostVerifyToken , getHostBankDetails)
router.post('/bankdetails/save-bank-details', hostVerifyToken , saveHostBankDetails)


//host profile
// router.get('/get-profile' , hostVerifyToken , getHostProfile)

export default router;
