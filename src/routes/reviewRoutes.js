import express from 'express';
import { createReview, getPropertyReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:propertyId', getPropertyReviews);

export default router;
