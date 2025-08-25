const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post('/', auth, [
  body('tripId').isMongoId().withMessage('Valid trip ID is required'),
  body('description').notEmpty().trim().isLength({ max: 200 }).withMessage('Description is required and must be under 200 characters'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD']),
  body('category').isIn(['flights', 'accommodation', 'food', 'activities', 'transport', 'shopping', 'miscellaneous']),
  body('participants').isArray({ min: 1 }).withMessage('At least one participant is required'),
  body('splitType').optional().isIn(['equal', 'custom', 'percentage'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tripId, description, amount, currency = 'USD', category, participants, splitType = 'equal', location, notes } = req.body;

    // Verify trip exists and user has access
    const trip = await Trip.findOne({ _id: tripId, userId: req.user._id });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or access denied' });
    }

    // Create expense
    const expenseData = {
      tripId,
      userId: req.user._id,
      description,
      amount,
      currency,
      category,
      paidBy: req.user._id,
      participants: participants.map(p => ({
        userId: p.userId || req.user._id,
        share: p.share || 0,
        settled: false
      })),
      splitType,
      location,
      notes
    };

    const expense = new Expense(expenseData);

    // Calculate shares based on split type
    if (splitType === 'equal') {
      expense.calculateEqualSplit();
    }

    await expense.save();

    // Populate participant details
    await expense.populate('participants.userId', 'name email');
    await expense.populate('paidBy', 'name email');

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Server error creating expense' });
  }
});

// @route   GET /api/expenses/trip/:tripId
// @desc    Get all expenses for a trip
// @access  Private
router.get('/trip/:tripId', auth, async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip exists and user has access
    const trip = await Trip.findOne({ _id: tripId, userId: req.user._id });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or access denied' });
    }

    const expenses = await Expense.find({ tripId })
      .populate('participants.userId', 'name email')
      .populate('paidBy', 'name email')
      .sort({ createdAt: -1 });

    // Calculate summary statistics
    const summary = {
      totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      expensesByCategory: {},
      expensesByUser: {},
      totalExpenseCount: expenses.length
    };

    // Group by category
    expenses.forEach(expense => {
      if (!summary.expensesByCategory[expense.category]) {
        summary.expensesByCategory[expense.category] = 0;
      }
      summary.expensesByCategory[expense.category] += expense.amount;

      // Group by user who paid
      const paidByName = expense.paidBy.name;
      if (!summary.expensesByUser[paidByName]) {
        summary.expensesByUser[paidByName] = 0;
      }
      summary.expensesByUser[paidByName] += expense.amount;
    });

    res.json({
      expenses,
      summary,
      tripId,
      message: 'Trip expenses retrieved successfully'
    });
  } catch (error) {
    console.error('Get trip expenses error:', error);
    res.status(500).json({ error: 'Server error fetching trip expenses' });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get expense details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('participants.userId', 'name email')
      .populate('paidBy', 'name email')
      .populate('tripId', 'destination dates');

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Verify user has access to this expense (through trip ownership)
    const trip = await Trip.findOne({ _id: expense.tripId._id, userId: req.user._id });
    if (!trip) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      expense,
      message: 'Expense details retrieved successfully'
    });
  } catch (error) {
    console.error('Get expense details error:', error);
    res.status(500).json({ error: 'Server error fetching expense details' });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', auth, [
  body('description').optional().trim().isLength({ max: 200 }),
  body('amount').optional().isFloat({ min: 0 }),
  body('category').optional().isIn(['flights', 'accommodation', 'food', 'activities', 'transport', 'shopping', 'miscellaneous']),
  body('participants').optional().isArray({ min: 1 }),
  body('splitType').optional().isIn(['equal', 'custom', 'percentage'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Verify user has access to this expense (through trip ownership)
    const trip = await Trip.findOne({ _id: expense.tripId, userId: req.user._id });
    if (!trip) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update expense fields
    const allowedUpdates = ['description', 'amount', 'category', 'participants', 'splitType', 'location', 'notes'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        expense[field] = req.body[field];
      }
    });

    // Recalculate shares if split type is equal
    if (expense.splitType === 'equal') {
      expense.calculateEqualSplit();
    }

    await expense.save();

    // Populate participant details
    await expense.populate('participants.userId', 'name email');
    await expense.populate('paidBy', 'name email');

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Server error updating expense' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Verify user has access to this expense (through trip ownership)
    const trip = await Trip.findOne({ _id: expense.tripId, userId: req.user._id });
    if (!trip) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Server error deleting expense' });
  }
});

// @route   GET /api/expenses/trip/:tripId/settlement
// @desc    Get settlement summary for a trip
// @access  Private
router.get('/trip/:tripId/settlement', auth, async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip exists and user has access
    const trip = await Trip.findOne({ _id: tripId, userId: req.user._id });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or access denied' });
    }

    const expenses = await Expense.find({ tripId })
      .populate('participants.userId', 'name email')
      .populate('paidBy', 'name email');

    // Calculate who owes whom
    const balances = {};
    const settlements = [];

    expenses.forEach(expense => {
      const settlementSummary = expense.getSettlementSummary();
      
      Object.keys(settlementSummary).forEach(userId => {
        if (!balances[userId]) {
          balances[userId] = 0;
        }
        balances[userId] += settlementSummary[userId];
      });
    });

    // Generate settlement instructions
    const creditors = [];
    const debtors = [];

    Object.keys(balances).forEach(userId => {
      const user = expenses.find(e => 
        e.participants.some(p => p.userId._id.toString() === userId) ||
        e.paidBy._id.toString() === userId
      );
      
      const userName = user ? (user.paidBy._id.toString() === userId ? user.paidBy.name : 
        user.participants.find(p => p.userId._id.toString() === userId)?.userId.name) : 'Unknown';

      if (balances[userId] > 0) {
        creditors.push({ userId, name: userName, amount: balances[userId] });
      } else if (balances[userId] < 0) {
        debtors.push({ userId, name: userName, amount: Math.abs(balances[userId]) });
      }
    });

    // Create settlement transactions
    creditors.forEach(creditor => {
      debtors.forEach(debtor => {
        if (debtor.amount > 0 && creditor.amount > 0) {
          const settleAmount = Math.min(creditor.amount, debtor.amount);
          settlements.push({
            from: debtor.name,
            to: creditor.name,
            amount: settleAmount,
            currency: 'USD'
          });
          creditor.amount -= settleAmount;
          debtor.amount -= settleAmount;
        }
      });
    });

    res.json({
      balances,
      settlements,
      totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      expenseCount: expenses.length,
      message: 'Settlement summary calculated successfully'
    });
  } catch (error) {
    console.error('Get settlement summary error:', error);
    res.status(500).json({ error: 'Server error calculating settlement summary' });
  }
});

// @route   POST /api/expenses/:id/settle
// @desc    Mark expense as settled for a participant
// @access  Private
router.post('/:id/settle', auth, [
  body('participantId').isMongoId().withMessage('Valid participant ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { participantId } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Verify user has access to this expense
    const trip = await Trip.findOne({ _id: expense.tripId, userId: req.user._id });
    if (!trip) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find and update participant settlement status
    const participant = expense.participants.find(p => p.userId.toString() === participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found in this expense' });
    }

    participant.settled = true;

    // Check if all participants are settled
    expense.isSettled = expense.participants.every(p => p.settled);

    await expense.save();

    res.json({
      message: 'Expense settlement updated successfully',
      expense: {
        id: expense._id,
        isSettled: expense.isSettled,
        settledParticipants: expense.participants.filter(p => p.settled).length,
        totalParticipants: expense.participants.length
      }
    });
  } catch (error) {
    console.error('Settle expense error:', error);
    res.status(500).json({ error: 'Server error settling expense' });
  }
});

module.exports = router;
