import { Router } from 'express';
import { 
  getPendingPayments, 
  approvePayment, 
  rejectPayment,
  getAllBookings,
  createBookingManually,
  cancelBookingAdmin,
  issueManualRefund,
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getAllClassInstances,
  createClassInstance,
  updateClassInstance,
  deleteClassInstance,
  getAllClassTypes,
  getAllCoaches,
  getAllPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getPackageLocationPrices,
  setPackageLocationPrice,
  removePackageLocationPrice,
  getAttendanceReport,
  getRevenueReport,
  getDashboardStats,
  getAllMembers,
  getMemberDetails,
  getClassRoster,
  getMemberPackagePrices,
  setMemberPackagePrice,
  removeMemberPackagePrice,
  pauseMember,
  unpauseMember,
  freezeMember,
  unfreezeMember,
  updateMember,
  deleteMember,
  getAllCoachesForManagement,
  getCoachDetails,
  createCoach,
  updateCoach,
  pauseCoach,
  unpauseCoach,
  freezeCoach,
  unfreezeCoach,
  deleteCoach,
  createSchedule,
  getAllSchedules,
  getDefaultSchedules,
  updateSchedule,
  deleteSchedule,
  generateClassesFromSchedules
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard routes
// GET /api/admin/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', getDashboardStats);

// Payment routes
// GET /api/admin/payments/pending - Get all pending payments
router.get('/payments/pending', getPendingPayments);

// PUT /api/admin/payments/:id/approve - Approve a payment
router.put('/payments/:id/approve', approvePayment);

// PUT /api/admin/payments/:id/reject - Reject a payment
router.put('/payments/:id/reject', rejectPayment);

// Booking management routes
// GET /api/admin/bookings - Get all bookings with filters
router.get('/bookings', getAllBookings);

// POST /api/admin/bookings - Manually create a booking
router.post('/bookings', createBookingManually);

// DELETE /api/admin/bookings/:id - Cancel a booking with refund (bypass time restriction)
router.delete('/bookings/:id', cancelBookingAdmin);

// POST /api/admin/refund - Issue manual credit refund
router.post('/refund', issueManualRefund);

// Location management routes
// GET /api/admin/locations - Get all locations
router.get('/locations', getAllLocations);

// POST /api/admin/locations - Create a new location
router.post('/locations', createLocation);

// PUT /api/admin/locations/:id - Update a location
router.put('/locations/:id', updateLocation);

// DELETE /api/admin/locations/:id - Soft delete a location
router.delete('/locations/:id', deleteLocation);

// Class instance management routes
// GET /api/admin/classes - Get all class instances
router.get('/classes', getAllClassInstances);

// POST /api/admin/classes - Create a new class instance (with recurring support)
router.post('/classes', createClassInstance);

// GET /api/admin/classes/:id/roster - Get class roster
router.get('/classes/:id/roster', getClassRoster);

// PUT /api/admin/classes/:id - Update a class instance
router.put('/classes/:id', updateClassInstance);

// DELETE /api/admin/classes/:id - Delete a class instance with automatic refunds
router.delete('/classes/:id', deleteClassInstance);

// Class types routes
// GET /api/admin/class-types - Get all class types
router.get('/class-types', getAllClassTypes);

// Coaches routes
// GET /api/admin/coaches - Get all coaches
router.get('/coaches', getAllCoaches);

// Package management routes
// GET /api/admin/packages - Get all packages with purchase statistics
router.get('/packages', getAllPackages);

// POST /api/admin/packages - Create a new package
router.post('/packages', createPackage);

// PUT /api/admin/packages/:id - Update a package (only affects new purchases)
router.put('/packages/:id', updatePackage);

// DELETE /api/admin/packages/:id - Soft delete/deactivate a package
router.delete('/packages/:id', deletePackage);

// Location package price management routes
// GET /api/admin/packages/:id/location-prices - Get all location prices for a package
router.get('/packages/:id/location-prices', getPackageLocationPrices);

// PUT /api/admin/packages/:packageId/location-prices/:locationId - Set/update location-specific price
router.put('/packages/:packageId/location-prices/:locationId', setPackageLocationPrice);

// DELETE /api/admin/packages/:packageId/location-prices/:locationId - Remove location-specific price
router.delete('/packages/:packageId/location-prices/:locationId', removePackageLocationPrice);

// Reporting routes
// GET /api/admin/reports/attendance - Generate attendance report
router.get('/reports/attendance', getAttendanceReport);

// GET /api/admin/reports/revenue - Generate revenue report
router.get('/reports/revenue', getRevenueReport);

// Member management routes
// GET /api/admin/members - Get all members
router.get('/members', getAllMembers);
// GET /api/admin/members/:id - Get member details
router.get('/members/:id', getMemberDetails);

// GET /api/admin/members/:id/package-prices - Get member-specific package prices
router.get('/members/:id/package-prices', getMemberPackagePrices);

// Coach management routes
// GET /api/admin/coaches/list - Get all coaches for management
router.get('/coaches/list', getAllCoachesForManagement);
// GET /api/admin/coaches/:id - Get coach details
router.get('/coaches/:id', getCoachDetails);
// POST /api/admin/coaches - Create a new coach
router.post('/coaches', createCoach);
// PUT /api/admin/coaches/:id - Update a coach
router.put('/coaches/:id', updateCoach);
// PUT /api/admin/coaches/:id/pause - Pause coach account
router.put('/coaches/:id/pause', pauseCoach);
// PUT /api/admin/coaches/:id/unpause - Unpause coach account
router.put('/coaches/:id/unpause', unpauseCoach);
// PUT /api/admin/coaches/:id/freeze - Freeze coach account
router.put('/coaches/:id/freeze', freezeCoach);
// PUT /api/admin/coaches/:id/unfreeze - Unfreeze coach account
router.put('/coaches/:id/unfreeze', unfreezeCoach);
// DELETE /api/admin/coaches/:id - Soft delete coach account
router.delete('/coaches/:id', deleteCoach);

// Schedule management routes
// GET /api/admin/schedules - Get all recurring schedules
router.get('/schedules', getAllSchedules);
// GET /api/admin/schedules/default - Get schedules grouped by location (default schedule page)
router.get('/schedules/default', getDefaultSchedules);
// POST /api/admin/schedules - Create a recurring schedule
router.post('/schedules', createSchedule);
// PUT /api/admin/schedules/:id - Update a recurring schedule
router.put('/schedules/:id', updateSchedule);
// DELETE /api/admin/schedules/:id - Deactivate a recurring schedule
router.delete('/schedules/:id', deleteSchedule);
// POST /api/admin/schedules/generate - Manually generate classes from schedules
router.post('/schedules/generate', generateClassesFromSchedules);

// PUT /api/admin/members/:memberId/package-prices/:packageId - Set/update member-specific price
router.put('/members/:memberId/package-prices/:packageId', setMemberPackagePrice);

// DELETE /api/admin/members/:memberId/package-prices/:packageId - Remove member-specific price
router.delete('/members/:memberId/package-prices/:packageId', removeMemberPackagePrice);

// PUT /api/admin/members/:id/pause - Pause member account
router.put('/members/:id/pause', pauseMember);

// PUT /api/admin/members/:id/unpause - Unpause member account
router.put('/members/:id/unpause', unpauseMember);

// PUT /api/admin/members/:id/freeze - Freeze member account
router.put('/members/:id/freeze', freezeMember);

// PUT /api/admin/members/:id/unfreeze - Unfreeze member account
router.put('/members/:id/unfreeze', unfreezeMember);

// PUT /api/admin/members/:id - Update member account
router.put('/members/:id', updateMember);

// DELETE /api/admin/members/:id - Soft delete member account
router.delete('/members/:id', deleteMember);

export default router;
