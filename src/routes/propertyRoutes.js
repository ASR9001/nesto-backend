import express from 'express';
import { createProperty, getFeaturedProperty, updateProperty } from '../controllers/propertyController.js';
import {protect} from '../middleware/authMiddleware.js';
import { getPropertyById  } from '../controllers/propertyController.js';
import { hostVerifyToken } from '../middleware/hostVerifyToken.js';



const router = express.Router();



router.get('/get-single-property/:id', getPropertyById); 




export default router;
