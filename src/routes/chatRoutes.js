import express from 'express';
import {  fetchAllChatForUser } from '../controllers/chatController.js';
import { userVerifyToken } from '../middleware/userVerifyToken.js';




const router = express.Router();



router.get('/fetch-all-chat-for-user',userVerifyToken ,  fetchAllChatForUser); 




export default router;
