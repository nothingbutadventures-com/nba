const express = require('express');
const {
  getAllTours,
  getTour,
  getToursByCountry,
  getFeaturedTours,
  getPopularTours,
  searchTours,
  checkTourAvailability,
  getTourStats,
  createTour,
  updateTour,
  deleteTour,
  getMyAssignedTours,
  assignDepartureLeader,
  getAdventureLeaders,
} = require('../controllers/tourController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllTours);
router.get('/featured', getFeaturedTours);
router.get('/popular', getPopularTours);
router.get('/search', searchTours);
router.get('/stats', getTourStats);
router.get('/country/:countryId', getToursByCountry);

// Protected routes for Adventure Leaders / field guides / affiliates / admins
router.get(
  '/adventure-leaders',
  protect,
  restrictTo('admin', 'partner'),
  getAdventureLeaders
);
router.get(
  '/my-assigned-tours',
  protect,
  restrictTo(
    'adventure_leader',
    'guide',
    'leader',
    'affiliate',
    'admin',
    'partner'
  ),
  getMyAssignedTours
);

router.get('/:id', getTour);
router.get('/:tourId/availability/:date', checkTourAvailability);

// Admin only routes
router.use(protect);
router.use(restrictTo('admin'));
router.post('/', createTour);
router.patch('/:id', updateTour);
router.patch('/:tourId/departures/:departureId/leader', assignDepartureLeader);
router.delete('/:id', deleteTour);

module.exports = router;