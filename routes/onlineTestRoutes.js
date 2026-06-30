import express from 'express';
import protect from '../middleware/auth.js';
import {
  createOnlineTest,
  getAllTests,
  getTestById,
  updateOnlineTest,
  toggleTestStatus,
  deleteOnlineTest,
  getTestAttempts,
  getLiveTests,
  getMyAttempt,
  submitAttempt
} from '../controllers/onlineTestController.js';

const router = express.Router();

// ── Student routes ───────────────────────────────────
router.get('/live', protect, getLiveTests);                        // GET  /api/online-tests/live
router.get('/:id/my-attempt', protect, getMyAttempt);             // GET  /api/online-tests/:id/my-attempt
router.post('/:id/submit', protect, submitAttempt);               // POST /api/online-tests/:id/submit

// ── Admin routes ─────────────────────────────────────
router.get('/', protect, getAllTests);                             // GET  /api/online-tests
router.post('/', protect, createOnlineTest);                      // POST /api/online-tests
router.get('/:id', protect, getTestById);                         // GET  /api/online-tests/:id
router.put('/:id', protect, updateOnlineTest);                    // PUT  /api/online-tests/:id
router.patch('/:id/toggle', protect, toggleTestStatus);           // PATCH /api/online-tests/:id/toggle
router.delete('/:id', protect, deleteOnlineTest);                 // DELETE /api/online-tests/:id
router.get('/:id/attempts', protect, getTestAttempts);            // GET  /api/online-tests/:id/attempts

export default router;
