import { Router } from 'express';
import { getPublicLocations, getPublicSchedule } from '../controllers/publicController';

const router = Router();

// Public, unauthenticated endpoints for the marketing website
router.get('/locations', getPublicLocations);
router.get('/schedule', getPublicSchedule);

export default router;
