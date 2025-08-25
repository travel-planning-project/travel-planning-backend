const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  category: {
    type: String,
    required: true,
    enum: ['flights', 'accommodation', 'food', 'activities', 'transport', 'shopping', 'miscellaneous'],
    default: 'miscellaneous'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  location: {
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    share: {
      type: Number,
      required: true,
      min: [0, 'Share cannot be negative']
    },
    settled: {
      type: Boolean,
      default: false
    }
  }],
  splitType: {
    type: String,
    enum: ['equal', 'custom', 'percentage'],
    default: 'equal'
  },
  receipt: {
    url: String,
    filename: String
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isSettled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate individual shares for equal split
expenseSchema.methods.calculateEqualSplit = function() {
  const shareAmount = this.amount / this.participants.length;
  this.participants.forEach(participant => {
    participant.share = shareAmount;
  });
};

// Calculate settlement amounts
expenseSchema.methods.getSettlementSummary = function() {
  const summary = {};
  
  this.participants.forEach(participant => {
    if (participant.userId.toString() === this.paidBy.toString()) {
      // Person who paid gets back the amount others owe
      summary[participant.userId] = this.amount - participant.share;
    } else {
      // Others owe their share
      summary[participant.userId] = -participant.share;
    }
  });
  
  return summary;
};

// Check if expense is fully settled
expenseSchema.virtual('isFullySettled').get(function() {
  return this.participants.every(participant => participant.settled);
});

module.exports = mongoose.model('Expense', expenseSchema);
