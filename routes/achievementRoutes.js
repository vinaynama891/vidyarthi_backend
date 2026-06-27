import express from 'express';
import {
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement
} from '../controllers/achievementController.js';
import protect from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', getAchievements);
router.post('/', protect, upload.single('photo'), createAchievement);
router.put('/:id', protect, upload.single('photo'), updateAchievement);
router.delete('/:id', protect, deleteAchievement);

export default router;
