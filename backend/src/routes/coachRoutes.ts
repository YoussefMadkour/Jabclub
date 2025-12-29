import { Router } from 'express';
import { getCoachClasses, getClassRoster, markAttendance, getMemberDetails } from '../controllers/coachController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All coach routes require authentication and coach role
router.use(authenticate);
router.use(authorize('coach'));

// GET /api/coach/classes - Get coach's assigned classes
router.get('/classes', getCoachClasses);

// GET /api/coach/classes/:id/roster - Get class roster
router.get('/classes/:id/roster', getClassRoster);

// PUT /api/coach/attendance/:bookingId - Mark attendance
router.put('/attendance/:bookingId', markAttendance);

// GET /api/coach/members/:id - Get member details (limited)
router.get('/members/:id', getMemberDetails);

export default router;
