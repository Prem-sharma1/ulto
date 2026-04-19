const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  vehicleType: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  isAvailable: { type: Boolean, default: false },
  rating: { type: Number, default: 5.0 },
  totalRides: { type: Number, default: 0 }
});

module.exports = mongoose.model('Driver', driverSchema);
