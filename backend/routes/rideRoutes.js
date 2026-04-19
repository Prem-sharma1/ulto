const express = require('express');
const { requestRide, acceptRide, getRideHistory, getPendingRides } = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All ride routes are protected
router.use(protect);

router.post('/request', requestRide);
router.put('/:id/accept', acceptRide);
router.get('/history', getRideHistory);
router.get('/pending', getPendingRides);

module.exports = router;
