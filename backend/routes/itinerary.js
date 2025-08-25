const express = require('express');
const { body, validationResult } = require('express-validator');
const Trip = require('../models/Trip');
const { asyncHandler, ValidationError, NotFoundError, AuthorizationError } = require('../middleware/errorHandler');
const { requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createItineraryItemValidation = [
  body('tripId').isMongoId().withMessage('Valid trip ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)'),
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('location').optional().trim().isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),
  body('type').isIn(['flight', 'hotel', 'activity', 'restaurant', 'transport']).withMessage('Invalid type'),
  body('duration').optional().trim().isLength({ max: 50 }).withMessage('Duration cannot exceed 50 characters'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number')
];

const updateItineraryItemValidation = [
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)'),
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('location').optional().trim().isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),
  body('type').optional().isIn(['flight', 'hotel', 'activity', 'restaurant', 'transport']).withMessage('Invalid type'),
  body('duration').optional().trim().isLength({ max: 50 }).withMessage('Duration cannot exceed 50 characters'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number')
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

// Helper function to generate itinerary item ID
const generateItemId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Helper function to organize itinerary by days
const organizeItineraryByDays = (trip) => {
  if (!trip.itinerary || trip.itinerary.length === 0) {
    return [];
  }

  // Group items by date
  const itemsByDate = {};
  trip.itinerary.forEach(item => {
    const dateKey = item.date.toISOString().split('T')[0];
    if (!itemsByDate[dateKey]) {
      itemsByDate[dateKey] = [];
    }
    itemsByDate[dateKey].push(item);
  });

  // Sort items within each day by time
  Object.keys(itemsByDate).forEach(date => {
    itemsByDate[date].sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
  });

  // Convert to array format
  const days = Object.keys(itemsByDate).sort().map((date, index) => ({
    date,
    day: `Day ${index + 1}`,
    dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
    items: itemsByDate[date]
  }));

  return days;
};

// @route   GET /api/itinerary/trip/:tripId
// @desc    Get itinerary for a trip
// @access  Private
router.get('/trip/:tripId', requireOwnershipOrAdmin(Trip, 'tripId'), asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.tripId)
    .populate('owner', 'firstName lastName email')
    .populate('collaborators.user', 'firstName lastName email');

  if (!trip || trip.isDeleted) {
    throw new NotFoundError('Trip not found');
  }

  // Organize itinerary by days
  const itineraryByDays = organizeItineraryByDays(trip);

  // Calculate statistics
  const totalItems = trip.itinerary ? trip.itinerary.length : 0;
  const totalCost = trip.itinerary ? 
    trip.itinerary.reduce((sum, item) => sum + (item.cost || 0), 0) : 0;

  const itemsByType = trip.itinerary ? 
    trip.itinerary.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {}) : {};

  res.json({
    success: true,
    data: {
      trip: {
        id: trip._id,
        title: trip.title,
        destination: trip.destination,
        dates: trip.dates,
        travelers: trip.travelers
      },
      itinerary: itineraryByDays,
      statistics: {
        totalItems,
        totalCost,
        currency: trip.budget?.currency || 'USD',
        itemsByType,
        totalDays: itineraryByDays.length
      }
    }
  });
}));

// @route   POST /api/itinerary/items
// @desc    Add item to itinerary
// @access  Private
router.post('/items', createItineraryItemValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const { tripId, ...itemData } = req.body;

  const trip = await Trip.findById(tripId);
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
    throw new AuthorizationError('You do not have permission to edit this itinerary');
  }

  // Validate date is within trip dates
  const itemDate = new Date(itemData.date);
  const tripStart = new Date(trip.dates.startDate);
  const tripEnd = new Date(trip.dates.endDate);

  if (itemDate < tripStart || itemDate > tripEnd) {
    throw new ValidationError('Item date must be within trip dates');
  }

  // Create new itinerary item
  const newItem = {
    id: generateItemId(),
    ...itemData,
    date: itemDate,
    createdBy: req.user._id,
    createdAt: new Date()
  };

  // Initialize itinerary array if it doesn't exist
  if (!trip.itinerary) {
    trip.itinerary = [];
  }

  trip.itinerary.push(newItem);
  await trip.save();

  res.status(201).json({
    success: true,
    message: 'Itinerary item added successfully',
    data: { item: newItem }
  });
}));

// @route   PUT /api/itinerary/items/:itemId
// @desc    Update itinerary item
// @access  Private
router.put('/items/:itemId', updateItineraryItemValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const { tripId } = req.body;
  const itemId = req.params.itemId;

  const trip = await Trip.findById(tripId);
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
    throw new AuthorizationError('You do not have permission to edit this itinerary');
  }

  // Find and update the item
  const itemIndex = trip.itinerary.findIndex(item => item.id === itemId);
  if (itemIndex === -1) {
    throw new NotFoundError('Itinerary item not found');
  }

  // Validate date if provided
  if (req.body.date) {
    const itemDate = new Date(req.body.date);
    const tripStart = new Date(trip.dates.startDate);
    const tripEnd = new Date(trip.dates.endDate);

    if (itemDate < tripStart || itemDate > tripEnd) {
      throw new ValidationError('Item date must be within trip dates');
    }
  }

  // Update the item
  const updatedItem = {
    ...trip.itinerary[itemIndex],
    ...req.body,
    updatedBy: req.user._id,
    updatedAt: new Date()
  };

  trip.itinerary[itemIndex] = updatedItem;
  await trip.save();

  res.json({
    success: true,
    message: 'Itinerary item updated successfully',
    data: { item: updatedItem }
  });
}));

// @route   DELETE /api/itinerary/items/:itemId
// @desc    Delete itinerary item
// @access  Private
router.delete('/items/:itemId', [
  body('tripId').isMongoId().withMessage('Valid trip ID is required')
], asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const { tripId } = req.body;
  const itemId = req.params.itemId;

  const trip = await Trip.findById(tripId);
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
    throw new AuthorizationError('You do not have permission to edit this itinerary');
  }

  // Find and remove the item
  const itemIndex = trip.itinerary.findIndex(item => item.id === itemId);
  if (itemIndex === -1) {
    throw new NotFoundError('Itinerary item not found');
  }

  trip.itinerary.splice(itemIndex, 1);
  await trip.save();

  res.json({
    success: true,
    message: 'Itinerary item deleted successfully'
  });
}));

// @route   POST /api/itinerary/items/:itemId/reorder
// @desc    Reorder itinerary items
// @access  Private
router.post('/items/:itemId/reorder', [
  body('tripId').isMongoId().withMessage('Valid trip ID is required'),
  body('newPosition').isInt({ min: 0 }).withMessage('Valid position is required'),
  body('newDate').optional().isISO8601().withMessage('Valid date is required'),
  body('newTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required')
], asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const { tripId, newPosition, newDate, newTime } = req.body;
  const itemId = req.params.itemId;

  const trip = await Trip.findById(tripId);
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
    throw new AuthorizationError('You do not have permission to edit this itinerary');
  }

  // Find the item
  const itemIndex = trip.itinerary.findIndex(item => item.id === itemId);
  if (itemIndex === -1) {
    throw new NotFoundError('Itinerary item not found');
  }

  // Update item position, date, and time if provided
  const item = trip.itinerary[itemIndex];
  if (newDate) item.date = new Date(newDate);
  if (newTime) item.time = newTime;
  item.updatedBy = req.user._id;
  item.updatedAt = new Date();

  // Remove item from current position
  trip.itinerary.splice(itemIndex, 1);

  // Insert at new position
  const insertIndex = Math.min(newPosition, trip.itinerary.length);
  trip.itinerary.splice(insertIndex, 0, item);

  await trip.save();

  res.json({
    success: true,
    message: 'Itinerary item reordered successfully',
    data: { item }
  });
}));

// @route   GET /api/itinerary/templates
// @desc    Get itinerary templates
// @access  Private
router.get('/templates', asyncHandler(async (req, res) => {
  const templates = [
    {
      id: 'city-break-3days',
      name: '3-Day City Break',
      description: 'Perfect template for a short city getaway',
      duration: 3,
      items: [
        { day: 1, time: '09:00', title: 'Arrival & Hotel Check-in', type: 'hotel', duration: '1h' },
        { day: 1, time: '11:00', title: 'City Walking Tour', type: 'activity', duration: '3h' },
        { day: 1, time: '19:00', title: 'Welcome Dinner', type: 'restaurant', duration: '2h' },
        { day: 2, time: '09:00', title: 'Museum Visit', type: 'activity', duration: '3h' },
        { day: 2, time: '14:00', title: 'Local Market Exploration', type: 'activity', duration: '2h' },
        { day: 2, time: '20:00', title: 'Traditional Restaurant', type: 'restaurant', duration: '2h' },
        { day: 3, time: '10:00', title: 'Landmark Visit', type: 'activity', duration: '2h' },
        { day: 3, time: '14:00', title: 'Shopping & Souvenirs', type: 'activity', duration: '2h' },
        { day: 3, time: '18:00', title: 'Departure', type: 'transport', duration: '1h' }
      ]
    },
    {
      id: 'beach-vacation-7days',
      name: '7-Day Beach Vacation',
      description: 'Relaxing beach holiday template',
      duration: 7,
      items: [
        { day: 1, time: '15:00', title: 'Resort Check-in', type: 'hotel', duration: '1h' },
        { day: 1, time: '19:00', title: 'Beachfront Dinner', type: 'restaurant', duration: '2h' },
        { day: 2, time: '09:00', title: 'Beach Day & Water Sports', type: 'activity', duration: '6h' },
        { day: 3, time: '10:00', title: 'Island Excursion', type: 'activity', duration: '8h' },
        { day: 4, time: '09:00', title: 'Spa & Wellness Day', type: 'activity', duration: '4h' },
        { day: 5, time: '08:00', title: 'Snorkeling Trip', type: 'activity', duration: '6h' },
        { day: 6, time: '10:00', title: 'Local Culture Tour', type: 'activity', duration: '4h' },
        { day: 7, time: '12:00', title: 'Departure', type: 'transport', duration: '2h' }
      ]
    }
  ];

  res.json({
    success: true,
    data: { templates }
  });
}));

module.exports = router;
