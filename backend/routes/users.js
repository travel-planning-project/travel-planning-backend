const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please enter a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please enter a valid date of birth'),
  body('nationality')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Nationality cannot exceed 50 characters')
];

const updatePreferencesValidation = [
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'])
    .withMessage('Invalid currency'),
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'])
    .withMessage('Invalid language'),
  body('travelStyle')
    .optional()
    .isIn(['budget', 'mid-range', 'luxury', 'backpacker', 'business'])
    .withMessage('Invalid travel style'),
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  body('interests.*')
    .optional()
    .isIn([
      'adventure', 'culture', 'food', 'nightlife', 'nature', 
      'history', 'art', 'shopping', 'sports', 'wellness',
      'photography', 'music', 'festivals', 'beaches', 'mountains'
    ])
    .withMessage('Invalid interest')
];

// Helper function to handle validation errors
const handleValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().reduce((acc, error) => {
      acc[error.path] = error.msg;
      return acc;
    }, {});
    throw new ValidationError('Validation failed', errorMessages);
  }
};

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        nationality: user.nationality,
        passportNumber: user.passportNumber,
        preferences: user.preferences,
        socialProfiles: user.socialProfiles,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
}));

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', updateProfileValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const allowedFields = [
    'firstName', 'lastName', 'phone', 'dateOfBirth', 
    'nationality', 'passportNumber', 'avatar'
  ];

  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
}));

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', updatePreferencesValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Update preferences
  Object.keys(req.body).forEach(key => {
    if (user.preferences[key] !== undefined) {
      user.preferences[key] = req.body[key];
    }
  });

  await user.save();

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: { preferences: user.preferences }
  });
}));

// @route   PUT /api/users/social-profiles
// @desc    Update social media profiles
// @access  Private
router.put('/social-profiles', [
  body('facebook').optional().isURL().withMessage('Invalid Facebook URL'),
  body('instagram').optional().isURL().withMessage('Invalid Instagram URL'),
  body('twitter').optional().isURL().withMessage('Invalid Twitter URL')
], asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Update social profiles
  const { facebook, instagram, twitter } = req.body;
  user.socialProfiles = {
    facebook: facebook || user.socialProfiles.facebook,
    instagram: instagram || user.socialProfiles.instagram,
    twitter: twitter || user.socialProfiles.twitter
  };

  await user.save();

  res.json({
    success: true,
    message: 'Social profiles updated successfully',
    data: { socialProfiles: user.socialProfiles }
  });
}));

// @route   DELETE /api/users/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Soft delete - deactivate account
  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
}));

// @route   GET /api/users/stats
// @desc    Get user statistics (trips, expenses, etc.)
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get trip statistics
  const Trip = require('../models/Trip');
  const Expense = require('../models/Expense');

  const [tripStats, expenseStats] = await Promise.all([
    Trip.aggregate([
      { $match: { owner: userId, isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget.total' }
        }
      }
    ]),
    Expense.aggregate([
      { $match: { createdBy: userId, isDeleted: false } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  // Calculate totals
  const totalTrips = tripStats.reduce((sum, stat) => sum + stat.count, 0);
  const totalBudget = tripStats.reduce((sum, stat) => sum + (stat.totalBudget || 0), 0);
  const totalExpenses = expenseStats.reduce((sum, stat) => sum + stat.totalAmount, 0);

  res.json({
    success: true,
    data: {
      trips: {
        total: totalTrips,
        byStatus: tripStats,
        totalBudget
      },
      expenses: {
        total: totalExpenses,
        byCategory: expenseStats
      },
      joinedDate: req.user.createdAt,
      lastActive: req.user.lastLogin
    }
  });
}));

// Admin routes
// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.search) {
    query.$or = [
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }
  });
}));

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private/Admin
router.put('/:id/status', requireAdmin, [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (req.body.isActive !== undefined) {
    user.isActive = req.body.isActive;
  }

  if (req.body.role) {
    user.role = req.body.role;
  }

  await user.save();

  res.json({
    success: true,
    message: 'User status updated successfully',
    data: { user: user.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }) }
  });
}));

module.exports = router;
