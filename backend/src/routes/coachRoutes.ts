import { Router } from 'express';
import { 
  getCoachClasses, 
  getClassRoster, 
  markAttendance, 
  getMemberDetails,
  createOrUpdateNote,
  getNote,
  getClassNotes
} from '../controllers/coachController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All coach routes require authentication and coach role
router.use(authenticate);
router.use(authorize('coach'));

// GET /api/coach/classes - Get coach's assigned classes
router.get('/classes', getCoachClasses);

// GET /api/coach/classes/:id/roster - Get class roster
router.get('/classes/:id/roster', getClassRoster);

// GET /api/coach/classes/:id/notes - Get all notes for a class
router.get('/classes/:id/notes', getClassNotes);

// PUT /api/coach/attendance/:bookingId - Mark attendance
router.put('/attendance/:bookingId', markAttendance);

// POST /api/coach/notes/:bookingId - Create or update note
router.post('/notes/:bookingId', createOrUpdateNote);

// GET /api/coach/notes/:bookingId - Get note for a booking
router.get('/notes/:bookingId', getNote);

// GET /api/coach/members/:id - Get member details (limited)
router.get('/members/:id', getMemberDetails);

export default router;
