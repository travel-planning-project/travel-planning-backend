const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const { asyncHandler, ValidationError, NotFoundError, AuthorizationError } = require('../middleware/errorHandler');
const { requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createExpenseValidation = [
  body('trip').isMongoId().withMessage('Valid trip ID is required'),
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR']).withMessage('Invalid currency'),
  body('category').isIn(['flights', 'accommodation', 'food', 'activities', 'transport', 'shopping', 'miscellaneous']).withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('splitBetween').optional().isArray().withMessage('Split between must be an array'),
  body('splitBetween.*.user').optional().isMongoId().withMessage('Valid user ID required for split'),
  body('splitBetween.*.amount').optional().isFloat({ min: 0 }).withMessage('Split amount must be positive')
];

const updateExpenseValidation = [
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').optional().isIn(['flights', 'accommodation', 'food', 'activities', 'transport', 'shopping', 'miscellaneous']).withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('Valid date is required')
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

// Middleware to check trip access
const checkTripAccess = async (req, res, next) => {
  try {
    const tripId = req.body.trip || req.query.trip;
    if (!tripId) return next();

    const trip = await Trip.findById(tripId);
    if (!trip || trip.isDeleted) {
      throw new NotFoundError('Trip not found');
    }

    // Check if user has access to the trip
    const hasAccess = trip.owner.toString() === req.user._id.toString() ||
                     trip.collaborators.some(collab => 
                       collab.user.toString() === req.user._id.toString() && 
                       collab.status === 'accepted'
                     );

    if (!hasAccess && req.user.role !== 'admin') {
      throw new AuthorizationError('Access denied to this trip');
    }

    req.trip = trip;
    next();
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/expenses
// @desc    Get expenses for user or specific trip
// @access  Private
router.get('/', [
  query('trip').optional().isMongoId().withMessage('Valid trip ID required'),
  query('category').optional().isIn(['flights', 'accommodation', 'food', 'activities', 'transport', 'shopping', 'miscellaneous']),
  query('startDate').optional().isISO8601().withMessage('Valid start date required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], checkTripAccess, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Build query
  const query = { isDeleted: false };

  if (req.query.trip) {
    query.trip = req.query.trip;
  } else {
    // Get expenses from user's trips
    const userTrips = await Trip.find({
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.status': 'accepted' }
      ],
      isDeleted: false
    }).select('_id');
    
    query.trip = { $in: userTrips.map(trip => trip._id) };
  }

  // Add filters
  if (req.query.category) {
    query.category = req.query.category;
  }

  if (req.query.startDate || req.query.endDate) {
    query.date = {};
    if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
  }

  // Execute query
  const [expenses, total] = await Promise.all([
    Expense.find(query)
      .populate('trip', 'title destination')
      .populate('paidBy', 'firstName lastName email')
      .populate('splitBetween.user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Expense.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      expenses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }
  });
}));

// @route   GET /api/expenses/:id
// @desc    Get specific expense
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id)
    .populate('trip', 'title destination owner collaborators')
    .populate('paidBy', 'firstName lastName email avatar')
    .populate('splitBetween.user', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName email avatar');

  if (!expense || expense.isDeleted) {
    throw new NotFoundError('Expense not found');
  }

  // Check access
  const trip = expense.trip;
  const hasAccess = trip.owner.toString() === req.user._id.toString() ||
                   trip.collaborators.some(collab => 
                     collab.user.toString() === req.user._id.toString() && 
                     collab.status === 'accepted'
                   );

  if (!hasAccess && req.user.role !== 'admin') {
    throw new AuthorizationError('Access denied to this expense');
  }

  res.json({
    success: true,
    data: { expense }
  });
}));

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private
router.post('/', createExpenseValidation, checkTripAccess, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const expenseData = {
    ...req.body,
    paidBy: req.user._id,
    createdBy: req.user._id
  };

  // Validate split amounts if provided
  if (req.body.splitBetween && req.body.splitBetween.length > 0) {
    const totalSplit = req.body.splitBetween.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplit - req.body.amount) > 0.01) {
      throw new ValidationError('Split amounts must equal the total expense amount');
    }
  }

  const expense = new Expense(expenseData);
  await expense.save();

  // Populate the created expense
  await expense.populate('trip', 'title destination');
  await expense.populate('paidBy', 'firstName lastName email');
  await expense.populate('splitBetween.user', 'firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Expense created successfully',
    data: { expense }
  });
}));

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', updateExpenseValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const expense = await Expense.findById(req.params.id).populate('trip');
  if (!expense || expense.isDeleted) {
    throw new NotFoundError('Expense not found');
  }

  // Check if user can edit this expense
  const trip = expense.trip;
  const canEdit = expense.createdBy.toString() === req.user._id.toString() ||
                 trip.owner.toString() === req.user._id.toString() ||
                 req.user.role === 'admin';

  if (!canEdit) {
    throw new AuthorizationError('You can only edit expenses you created');
  }

  // Update expense
  Object.assign(expense, req.body);
  expense.lastModifiedBy = req.user._id;
  await expense.save();

  // Populate updated expense
  await expense.populate('paidBy', 'firstName lastName email');
  await expense.populate('splitBetween.user', 'firstName lastName email');

  res.json({
    success: true,
    message: 'Expense updated successfully',
    data: { expense }
  });
}));

// @route   DELETE /api/expenses/:id
// @desc    Delete expense (soft delete)
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id).populate('trip');
  if (!expense || expense.isDeleted) {
    throw new NotFoundError('Expense not found');
  }

  // Check if user can delete this expense
  const trip = expense.trip;
  const canDelete = expense.createdBy.toString() === req.user._id.toString() ||
                   trip.owner.toString() === req.user._id.toString() ||
                   req.user.role === 'admin';

  if (!canDelete) {
    throw new AuthorizationError('You can only delete expenses you created');
  }

  // Soft delete
  expense.isDeleted = true;
  expense.deletedAt = new Date();
  await expense.save();

  res.json({
    success: true,
    message: 'Expense deleted successfully'
  });
}));

// @route   GET /api/expenses/trip/:tripId/summary
// @desc    Get expense summary for a trip
// @access  Private
router.get('/trip/:tripId/summary', asyncHandler(async (req, res) => {
  const tripId = req.params.tripId;

  // Check trip access
  const trip = await Trip.findById(tripId);
  if (!trip || trip.isDeleted) {
    throw new NotFoundError('Trip not found');
  }

  const hasAccess = trip.owner.toString() === req.user._id.toString() ||
                   trip.collaborators.some(collab => 
                     collab.user.toString() === req.user._id.toString() && 
                     collab.status === 'accepted'
                   );

  if (!hasAccess && req.user.role !== 'admin') {
    throw new AuthorizationError('Access denied to this trip');
  }

  // Get expense summary
  const summary = await Expense.getTripSummary(tripId);
  
  // Get total expenses
  const totalExpenses = await Expense.aggregate([
    { $match: { trip: mongoose.Types.ObjectId(tripId), isDeleted: false } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  // Get settlement summary
  const settlements = await Expense.getSettlementSummary(tripId);

  res.json({
    success: true,
    data: {
      tripId,
      totalAmount: totalExpenses[0]?.total || 0,
      totalExpenses: totalExpenses[0]?.count || 0,
      byCategory: summary,
      settlements,
      currency: trip.budget?.currency || 'USD'
    }
  });
}));

// @route   POST /api/expenses/:id/settle
// @desc    Settle a split expense
// @access  Private
router.post('/:id/settle', asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense || expense.isDeleted) {
    throw new NotFoundError('Expense not found');
  }

  // Check if user is part of the split
  const userSplit = expense.splitBetween.find(
    split => split.user.toString() === req.user._id.toString()
  );

  if (!userSplit) {
    throw new AuthorizationError('You are not part of this expense split');
  }

  if (userSplit.settled) {
    throw new ValidationError('This split is already settled');
  }

  // Settle the split
  await expense.settleSplit(req.user._id);

  res.json({
    success: true,
    message: 'Split settled successfully'
  });
}));

// @route   POST /api/expenses/:id/split
// @desc    Add or update split for an expense
// @access  Private
router.post('/:id/split', [
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Percentage must be between 0 and 100')
], asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const expense = await Expense.findById(req.params.id).populate('trip');
  if (!expense || expense.isDeleted) {
    throw new NotFoundError('Expense not found');
  }

  // Check if user can modify splits
  const trip = expense.trip;
  const canModify = expense.createdBy.toString() === req.user._id.toString() ||
                   trip.owner.toString() === req.user._id.toString() ||
                   req.user.role === 'admin';

  if (!canModify) {
    throw new AuthorizationError('You cannot modify splits for this expense');
  }

  const { userId, amount, percentage } = req.body;

  // Add or update split
  await expense.addSplit(userId, amount, percentage);

  res.json({
    success: true,
    message: 'Split updated successfully',
    data: { expense }
  });
}));

module.exports = router;
