const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Trip reference is required']
  },
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'],
    default: 'USD'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'flights',
      'accommodation', 
      'food',
      'activities',
      'transport',
      'shopping',
      'miscellaneous'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now
  },
  location: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'paypal', 'bank_transfer', 'other'],
    default: 'cash'
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Paid by user is required']
  },
  splitBetween: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Split amount cannot be negative']
    },
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100']
    },
    settled: {
      type: Boolean,
      default: false
    },
    settledAt: Date
  }],
  receipt: {
    url: String,
    filename: String,
    uploadedAt: Date
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: function() { return this.isRecurring; }
    },
    endDate: {
      type: Date,
      required: function() { return this.isRecurring; }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'disputed', 'refunded'],
    default: 'confirmed'
  },
  exchangeRate: {
    rate: Number,
    baseCurrency: String,
    targetCurrency: String,
    date: Date
  },
  vendor: {
    name: String,
    category: String,
    website: String,
    phone: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for split status
expenseSchema.virtual('isSplit').get(function() {
  return this.splitBetween && this.splitBetween.length > 1;
});

// Virtual for total split amount
expenseSchema.virtual('totalSplitAmount').get(function() {
  if (!this.splitBetween || this.splitBetween.length === 0) return 0;
  return this.splitBetween.reduce((total, split) => total + split.amount, 0);
});

// Virtual for unsettled amount
expenseSchema.virtual('unsettledAmount').get(function() {
  if (!this.splitBetween || this.splitBetween.length === 0) return 0;
  return this.splitBetween
    .filter(split => !split.settled)
    .reduce((total, split) => total + split.amount, 0);
});

// Indexes for better query performance
expenseSchema.index({ trip: 1, date: -1 });
expenseSchema.index({ paidBy: 1, date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ 'splitBetween.user': 1 });
expenseSchema.index({ createdAt: -1 });

// Pre-save middleware
expenseSchema.pre('save', function(next) {
  // Validate split amounts
  if (this.splitBetween && this.splitBetween.length > 0) {
    const totalSplit = this.splitBetween.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplit - this.amount) > 0.01) { // Allow for small rounding differences
      return next(new Error('Split amounts must equal the total expense amount'));
    }
  }
  
  // Set deleted timestamp if expense is being soft deleted
  if (this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }
  
  // Update lastModifiedBy
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.createdBy; // This should be set by the controller
  }
  
  next();
});

// Static method to get expense summary for a trip
expenseSchema.statics.getTripSummary = function(tripId) {
  return this.aggregate([
    { $match: { trip: mongoose.Types.ObjectId(tripId), isDeleted: false } },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Static method to get user's expense summary
expenseSchema.statics.getUserSummary = function(userId, startDate, endDate) {
  const matchConditions = {
    paidBy: mongoose.Types.ObjectId(userId),
    isDeleted: false
  };
  
  if (startDate && endDate) {
    matchConditions.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          category: '$category',
          month: { $month: '$date' },
          year: { $year: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, totalAmount: -1 } }
  ]);
};

// Static method to get settlement summary
expenseSchema.statics.getSettlementSummary = function(tripId) {
  return this.aggregate([
    { $match: { trip: mongoose.Types.ObjectId(tripId), isDeleted: false } },
    { $unwind: '$splitBetween' },
    {
      $group: {
        _id: {
          paidBy: '$paidBy',
          owedBy: '$splitBetween.user'
        },
        totalOwed: { $sum: '$splitBetween.amount' },
        settledAmount: {
          $sum: {
            $cond: [
              { $eq: ['$splitBetween.settled', true] },
              '$splitBetween.amount',
              0
            ]
          }
        },
        unsettledAmount: {
          $sum: {
            $cond: [
              { $eq: ['$splitBetween.settled', false] },
              '$splitBetween.amount',
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.paidBy',
        foreignField: '_id',
        as: 'paidByUser'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.owedBy',
        foreignField: '_id',
        as: 'owedByUser'
      }
    }
  ]);
};

// Instance method to settle split
expenseSchema.methods.settleSplit = function(userId) {
  const split = this.splitBetween.find(
    s => s.user.toString() === userId.toString()
  );
  
  if (split) {
    split.settled = true;
    split.settledAt = new Date();
    return this.save();
  }
  
  throw new Error('Split not found for this user');
};

// Instance method to add split
expenseSchema.methods.addSplit = function(userId, amount, percentage) {
  // Remove existing split for this user if any
  this.splitBetween = this.splitBetween.filter(
    split => split.user.toString() !== userId.toString()
  );
  
  // Add new split
  this.splitBetween.push({
    user: userId,
    amount: amount,
    percentage: percentage
  });
  
  return this.save();
};

module.exports = mongoose.model('Expense', expenseSchema);
