const express = require('express');
const { body, validationResult } = require('express-validator');
const Trip = require('../models/Trip');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/trips
// @desc    Create a new trip plan
// @access  Private
router.post('/', auth, [
  body('destination.city').notEmpty().withMessage('Destination city is required'),
  body('destination.country').notEmpty().withMessage('Destination country is required'),
  body('dates.startDate').isISO8601().withMessage('Valid start date is required'),
  body('dates.endDate').isISO8601().withMessage('Valid end date is required'),
  body('travelers.adults').isInt({ min: 1, max: 20 }).withMessage('Adults must be between 1 and 20'),
  body('travelers.children').optional().isInt({ min: 0, max: 10 }).withMessage('Children must be between 0 and 10'),
  body('budget.total').isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('budget.currency').optional().isIn(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tripData = {
      ...req.body,
      userId: req.user._id
    };

    // Validate dates
    const startDate = new Date(tripData.dates.startDate);
    const endDate = new Date(tripData.dates.endDate);
    
    if (endDate <= startDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    if (startDate < new Date()) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }

    const trip = new Trip(tripData);
    await trip.save();

    res.status(201).json({
      message: 'Trip created successfully',
      trip
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Server error creating trip' });
  }
});

// @route   GET /api/trips
// @desc    Get all trips for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      trips,
      count: trips.length
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'Server error fetching trips' });
  }
});

// @route   GET /api/trips/:id
// @desc    Get a specific trip
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ trip });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Server error fetching trip' });
  }
});

// @route   PUT /api/trips/:id
// @desc    Update a trip
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Update trip with new data
    Object.assign(trip, req.body);
    await trip.save();

    res.json({
      message: 'Trip updated successfully',
      trip
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ error: 'Server error updating trip' });
  }
});

// @route   DELETE /api/trips/:id
// @desc    Delete a trip
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'Server error deleting trip' });
  }
});

// @route   POST /api/trips/:id/itinerary
// @desc    Add activity to trip itinerary
// @access  Private
router.post('/:id/itinerary', auth, [
  body('day').isInt({ min: 1 }).withMessage('Day must be a positive integer'),
  body('activity.type').isIn(['flight', 'accommodation', 'attraction', 'restaurant', 'transport', 'activity']),
  body('activity.name').notEmpty().withMessage('Activity name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const trip = await Trip.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const { day, activity } = req.body;
    
    // Find or create the day in itinerary
    let dayItinerary = trip.itinerary.find(item => item.day === day);
    if (!dayItinerary) {
      const tripStart = new Date(trip.dates.startDate);
      const activityDate = new Date(tripStart);
      activityDate.setDate(tripStart.getDate() + day - 1);
      
      dayItinerary = {
        day,
        date: activityDate,
        activities: []
      };
      trip.itinerary.push(dayItinerary);
    }

    dayItinerary.activities.push(activity);
    await trip.save();

    res.json({
      message: 'Activity added to itinerary',
      trip
    });
  } catch (error) {
    console.error('Add itinerary error:', error);
    res.status(500).json({ error: 'Server error adding activity' });
  }
});

module.exports = router;
