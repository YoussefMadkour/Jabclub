import { Router } from 'express';
import { getDashboard, getPackages, getActiveLocations, purchasePackage, createBooking, cancelBooking, getChildren, createChild, updateChild, deleteChild, getPaymentHistory } from '../controllers/memberController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadPaymentScreenshot } from '../middleware/upload';

const router = Router();

// All member routes require authentication and member role
router.use(authenticate);
router.use(authorize('member'));

// GET /api/members/dashboard - Get member dashboard data
router.get('/dashboard', getDashboard);

// GET /api/members/locations - Get all active locations
router.get('/locations', getActiveLocations);

// GET /api/members/packages - Get all active session packages
router.get('/packages', getPackages);

// GET /api/members/payments - Get payment history
router.get('/payments', getPaymentHistory);

// POST /api/members/purchase - Purchase package with payment screenshot
router.post('/purchase', uploadPaymentScreenshot.single('screenshot'), purchasePackage);

// POST /api/members/bookings - Create a new booking
router.post('/bookings', createBooking);

// DELETE /api/members/bookings/:id - Cancel a booking with refund
router.delete('/bookings/:id', cancelBooking);

// GET /api/members/children - List all children profiles
router.get('/children', getChildren);

// POST /api/members/children - Create a new child profile
router.post('/children', createChild);

// PUT /api/members/children/:id - Update a child profile
router.put('/children/:id', updateChild);

// DELETE /api/members/children/:id - Delete a child profile and cancel future bookings
router.delete('/children/:id', deleteChild);

export default router;
