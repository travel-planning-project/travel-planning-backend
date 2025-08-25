const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Trip = require('../models/Trip');
const { asyncHandler, ValidationError, NotFoundError, AuthorizationError } = require('../middleware/errorHandler');
const { requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createTripValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('destination.city')
    .trim()
    .notEmpty()
    .withMessage('Destination city is required'),
  body('destination.country')
    .trim()
    .notEmpty()
    .withMessage('Destination country is required'),
  body('dates.startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('dates.endDate')
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.dates.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('travelers.adults')
    .isInt({ min: 1, max: 20 })
    .withMessage('Adults must be between 1 and 20'),
  body('travelers.children')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Children must be between 0 and 10'),
  body('travelers.infants')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('Infants must be between 0 and 5')
];

const updateTripValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('dates.endDate')
    .optional()
    .custom((endDate, { req }) => {
      const startDate = req.body.dates?.startDate || req.trip?.dates?.startDate;
      if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
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

// @route   GET /api/trips
// @desc    Get all trips for the authenticated user
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['planning', 'booked', 'ongoing', 'completed', 'cancelled']),
  query('search').optional().trim()
], asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {
    $or: [
      { owner: req.user._id },
      { 'collaborators.user': req.user._id, 'collaborators.status': 'accepted' }
    ],
    isDeleted: false
  };

  // Add filters
  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.search) {
    query.$and = [
      query.$and || {},
      {
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
          { 'destination.city': { $regex: req.query.search, $options: 'i' } },
          { 'destination.country': { $regex: req.query.search, $options: 'i' } }
        ]
      }
    ];
  }

  // Execute query with pagination
  const [trips, total] = await Promise.all([
    Trip.find(query)
      .populate('owner', 'firstName lastName email avatar')
      .populate('collaborators.user', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Trip.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      trips,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/trips/:id
// @desc    Get a specific trip
// @access  Private
router.get('/:id', requireOwnershipOrAdmin(Trip), asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id)
    .populate('owner', 'firstName lastName email avatar')
    .populate('collaborators.user', 'firstName lastName email avatar')
    .populate('notes.author', 'firstName lastName avatar');

  if (!trip || trip.isDeleted) {
    throw new NotFoundError('Trip not found');
  }

  res.json({
    success: true,
    data: { trip }
  });
}));

// @route   POST /api/trips
// @desc    Create a new trip
// @access  Private
router.post('/', createTripValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const tripData = {
    ...req.body,
    owner: req.user._id
  };

  const trip = new Trip(tripData);
  await trip.save();

  // Populate owner information
  await trip.populate('owner', 'firstName lastName email avatar');

  res.status(201).json({
    success: true,
    message: 'Trip created successfully',
    data: { trip }
  });
}));

// @route   PUT /api/trips/:id
// @desc    Update a trip
// @access  Private
router.put('/:id', requireOwnershipOrAdmin(Trip), updateTripValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const trip = await Trip.findById(req.params.id);
  if (!trip || trip.isDeleted) {
    throw new NotFoundError('Trip not found');
  }

  // Check if user has edit permissions
  const isOwner = trip.owner.toString() === req.user._id.toString();
  const isEditor = trip.collaborators.some(
    collab => collab.user.toString() === req.user._id.toString() && 
             ['editor', 'admin'].includes(collab.role) &&
             collab.status === 'accepted'
  );

  if (!isOwner && !isEditor && req.user.role !== 'admin') {
    throw new AuthorizationError('You do not have permission to edit this trip');
  }

  // Update trip
  Object.assign(trip, req.body);
  await trip.save();

  // Populate updated trip
  await trip.populate('owner', 'firstName lastName email avatar');
  await trip.populate('collaborators.user', 'firstName lastName email avatar');

  res.json({
    success: true,
    message: 'Trip updated successfully',
    data: { trip }
  });
}));

// @route   DELETE /api/trips/:id
// @desc    Delete a trip (soft delete)
// @access  Private
router.delete('/:id', requireOwnershipOrAdmin(Trip), asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip || trip.isDeleted) {
    throw new NotFoundError('Trip not found');
  }

  // Only owner or admin can delete
  const isOwner = trip.owner.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw new AuthorizationError('Only the trip owner can delete this trip');
  }

  // Soft delete
  trip.isDeleted = true;
  trip.deletedAt = new Date();
  await trip.save();

  res.json({
    success: true,
    message: 'Trip deleted successfully'
  });
}));

// @route   POST /api/trips/:id/collaborators
// @desc    Add a collaborator to a trip
// @access  Private
router.post('/:id/collaborators', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['viewer', 'editor', 'admin']).withMessage('Invalid role')
], requireOwnershipOrAdmin(Trip), asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const { email, role = 'viewer' } = req.body;
  
  const trip = await Trip.findById(req.params.id);
  if (!trip || trip.isDeleted) {
    throw new NotFoundError('Trip not found');
  }

  // Find user by email
  const User = require('../models/User');
  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError('User not found with this email');
  }

  // Check if user is already a collaborator
  const existingCollaborator = trip.collaborators.find(
    collab => collab.user.toString() === user._id.toString()
  );

  if (existingCollaborator) {
    throw new ValidationError('User is already a collaborator on this trip');
  }

  // Add collaborator
  trip.collaborators.push({
    user: user._id,
    role: role,
    status: 'pending'
  });

  await trip.save();
  await trip.populate('collaborators.user', 'firstName lastName email avatar');

  res.json({
    success: true,
    message: 'Collaborator invitation sent successfully',
    data: { trip }
  });
}));

// @route   PUT /api/trips/:id/collaborators/:collaboratorId
// @desc    Update collaborator role or status
// @access  Private
router.put('/:id/collaborators/:collaboratorId', [
  body('role').optional().isIn(['viewer', 'editor', 'admin']),
  body('status').optional().isIn(['pending', 'accepted', 'declined'])
], requireOwnershipOrAdmin(Trip), asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const trip = await Trip.findById(req.params.id);
  if (!trip || trip.isDeleted) {
    throw new NotFoundError('Trip not found');
  }

  const collaborator = trip.collaborators.id(req.params.collaboratorId);
  if (!collaborator) {
    throw new NotFoundError('Collaborator not found');
  }

  // Update collaborator
  if (req.body.role) collaborator.role = req.body.role;
  if (req.body.status) collaborator.status = req.body.status;

  await trip.save();
  await trip.populate('collaborators.user', 'firstName lastName email avatar');

  res.json({
    success: true,
    message: 'Collaborator updated successfully',
    data: { trip }
  });
}));

module.exports = router;
