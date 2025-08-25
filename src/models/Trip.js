const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  destination: {
    city: {
      type: String,
      required: [true, 'Destination city is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Destination country is required'],
      trim: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  dates: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    }
  },
  travelers: {
    adults: {
      type: Number,
      required: true,
      min: [1, 'At least 1 adult traveler is required'],
      max: [20, 'Maximum 20 travelers allowed']
    },
    children: {
      type: Number,
      default: 0,
      min: [0, 'Children count cannot be negative'],
      max: [10, 'Maximum 10 children allowed']
    }
  },
  budget: {
    total: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: [0, 'Budget cannot be negative']
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    },
    breakdown: {
      flights: { type: Number, default: 0 },
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      miscellaneous: { type: Number, default: 0 }
    }
  },
  preferences: {
    accommodationType: {
      type: String,
      enum: ['hotel', 'hostel', 'apartment', 'resort', 'guesthouse', 'any'],
      default: 'any'
    },
    transportMode: {
      type: String,
      enum: ['flight', 'train', 'bus', 'car', 'any'],
      default: 'any'
    },
    cuisinePreferences: [String],
    activityTypes: [String]
  },
  itinerary: [{
    day: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    activities: [{
      type: {
        type: String,
        enum: ['flight', 'accommodation', 'attraction', 'restaurant', 'transport', 'activity'],
        required: true
      },
      name: String,
      description: String,
      location: {
        address: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      timing: {
        startTime: String,
        endTime: String,
        duration: Number // in minutes
      },
      cost: {
        amount: Number,
        currency: String
      },
      bookingInfo: {
        confirmationNumber: String,
        bookingUrl: String,
        notes: String
      }
    }]
  }],
  status: {
    type: String,
    enum: ['planning', 'booked', 'in-progress', 'completed', 'cancelled'],
    default: 'planning'
  }
}, {
  timestamps: true
});

// Validate that end date is after start date
tripSchema.pre('save', function(next) {
  if (this.dates.endDate <= this.dates.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Calculate trip duration in days
tripSchema.virtual('duration').get(function() {
  const timeDiff = this.dates.endDate.getTime() - this.dates.startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Calculate total travelers
tripSchema.virtual('totalTravelers').get(function() {
  return this.travelers.adults + this.travelers.children;
});

module.exports = mongoose.model('Trip', tripSchema);
