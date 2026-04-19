const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Can be null initially
  pickupLocation: {
    address: String,
    lat: Number,
    lng: Number
  },
  dropLocation: {
    address: String,
    lat: Number,
    lng: Number
  },
  fare: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  requestedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Ride', rideSchema);
