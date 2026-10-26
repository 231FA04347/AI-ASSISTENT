const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, className } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const normalizedRole = String(role).toLowerCase();
    const normalizedClassName = (className ?? '').toString().trim();

    if (normalizedRole === 'student' && !normalizedClassName) {
      // Backward compatible default: existing setups assume class 10.
      // Frontend will ask for class, but we still default to 10 if omitted.
      req.body.className = '10';
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: normalizedRole,
      className: normalizedRole === 'student' ? (req.body.className || '10') : undefined,
    });

    await newUser.save();
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser._id, role: newUser.role, className: newUser.className },
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        className: user.className,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, profilePicture, className } = req.body;
    const update = { firstName, lastName, bio, profilePicture };

    // Allow students to update className (optional).
    if (typeof className !== 'undefined') {
      update.className = String(className).trim();
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      update,
      { new: true }
    ).select('-password');

    res.status(200).json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Logout
exports.logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};
