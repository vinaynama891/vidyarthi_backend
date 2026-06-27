import express from 'express';
import { getBroadcasts, sendBroadcast } from '../controllers/broadcastController.js';
import protect from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', protect, getBroadcasts);
router.post('/', protect, upload.single('image'), sendBroadcast);

export default router;
