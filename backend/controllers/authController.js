const User = require('../models/User');
const Driver = require('../models/Driver');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user (Rider or Driver)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password, role, vehicleType, licenseNumber } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'rider'
    });

    // If role is driver, create a Driver profile
    if (user.role === 'driver') {
      if (!vehicleType || !licenseNumber) {
         await User.findByIdAndDelete(user._id); // Rollback
         return res.status(400).json({ message: 'Driver details missing (vehicleType, licenseNumber)' });
      }
      await Driver.create({
        userId: user._id,
        vehicleType,
        licenseNumber
      });
    }

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      let driverData = null;
      if (user.role === 'driver') {
        driverData = await Driver.findOne({ userId: user._id });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        driverInfo: driverData
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
     res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };
