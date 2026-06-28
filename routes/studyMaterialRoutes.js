import express from 'express';
import { getStudyMaterials, createStudyMaterial, deleteStudyMaterial } from '../controllers/studyMaterialController.js';
import protect from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', protect, getStudyMaterials);
router.post('/', protect, upload.single('file'), createStudyMaterial);
router.delete('/:id', protect, deleteStudyMaterial);

export default router;
