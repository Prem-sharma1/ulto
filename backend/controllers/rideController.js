const Ride = require('../models/Ride');
const User = require('../models/User');

let ioInstance;
const setIo = (io) => { ioInstance = io; };

// @desc    Request a new ride
// @route   POST /api/rides/request
const requestRide = async (req, res) => {
  const { pickupLocation, dropLocation, fare } = req.body;
  const riderId = req.user._id;

  try {
    const ride = await Ride.create({
      riderId,
      pickupLocation,
      dropLocation,
      fare,
      status: 'pending'
    });

    // Broadcast to all online drivers via Socket.io from the server side (reliable)
    if (ioInstance) {
      ioInstance.to('drivers').emit('new_ride_request', {
        _id: ride._id,
        riderId: ride.riderId,
        pickupLocation: ride.pickupLocation,
        dropLocation: ride.dropLocation,
        fare: ride.fare,
        status: ride.status,
      });
      console.log('Broadcasted new ride request to drivers room');
    }

    res.status(201).json(ride);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Driver accepts a ride
// @route   PUT /api/rides/:id/accept
const acceptRide = async (req, res) => {
   const driverId = req.user._id;
   const rideId = req.params.id;

   try {
     // Check if user is a driver
     if (req.user.role !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can accept rides.' });
     }

     const ride = await Ride.findById(rideId);
     if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
     }
     
     if (ride.status !== 'pending') {
        return res.status(400).json({ message: 'Ride is no longer available' });
     }

     ride.driverId = driverId;
     ride.status = 'accepted';
     ride.acceptedAt = Date.now();
     
     await ride.save();

     res.json(ride);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

// @desc    Get user's ride history
// @route   GET /api/rides/history
const getRideHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    let query = req.user.role === 'driver' ? { driverId: userId } : { riderId: userId };
    
    // Sort by most recent
    const rides = await Ride.find(query).sort({ requestedAt: -1 }).populate('riderId', 'name').populate('driverId', 'name');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending rides (for drivers)
// @route   GET /api/rides/pending
const getPendingRides = async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can view pending rides' });
    }
    const rides = await Ride.find({ status: 'pending' })
      .sort({ requestedAt: -1 })
      .populate('riderId', 'name');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { requestRide, acceptRide, getRideHistory, getPendingRides, setIo };
