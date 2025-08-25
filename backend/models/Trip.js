const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Trip title is required'],
    trim: true,
    maxlength: [100, 'Trip title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
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
      latitude: Number,
      longitude: Number
    },
    timezone: String
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
    },
    infants: {
      type: Number,
      default: 0,
      min: [0, 'Infants count cannot be negative'],
      max: [5, 'Maximum 5 infants allowed']
    }
  },
  budget: {
    total: {
      type: Number,
      min: [0, 'Budget cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR']
    },
    breakdown: {
      flights: { type: Number, default: 0 },
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      shopping: { type: Number, default: 0 },
      miscellaneous: { type: Number, default: 0 }
    }
  },
  status: {
    type: String,
    enum: ['planning', 'booked', 'ongoing', 'completed', 'cancelled'],
    default: 'planning'
  },
  privacy: {
    type: String,
    enum: ['private', 'friends', 'public'],
    default: 'private'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    }
  }],
  bookings: {
    flights: [{
      bookingReference: String,
      airline: String,
      flightNumber: String,
      departure: {
        airport: String,
        time: Date
      },
      arrival: {
        airport: String,
        time: Date
      },
      passengers: [String],
      cost: Number,
      status: {
        type: String,
        enum: ['confirmed', 'pending', 'cancelled'],
        default: 'pending'
      }
    }],
    accommodation: [{
      bookingReference: String,
      hotelName: String,
      address: String,
      checkIn: Date,
      checkOut: Date,
      roomType: String,
      guests: Number,
      cost: Number,
      status: {
        type: String,
        enum: ['confirmed', 'pending', 'cancelled'],
        default: 'pending'
      }
    }],
    activities: [{
      name: String,
      provider: String,
      date: Date,
      time: String,
      duration: String,
      participants: Number,
      cost: Number,
      status: {
        type: String,
        enum: ['confirmed', 'pending', 'cancelled'],
        default: 'pending'
      }
    }]
  },
  preferences: {
    travelStyle: {
      type: String,
      enum: ['budget', 'mid-range', 'luxury', 'backpacker', 'business'],
      default: 'mid-range'
    },
    interests: [{
      type: String,
      enum: [
        'adventure', 'culture', 'food', 'nightlife', 'nature', 
        'history', 'art', 'shopping', 'sports', 'wellness',
        'photography', 'music', 'festivals', 'beaches', 'mountains'
      ]
    }],
    accommodation: {
      type: String,
      enum: ['hotel', 'hostel', 'apartment', 'resort', 'bnb', 'camping'],
      default: 'hotel'
    },
    transport: {
      type: String,
      enum: ['flight', 'train', 'bus', 'car', 'mixed'],
      default: 'flight'
    }
  },
  weather: {
    forecast: [{
      date: Date,
      temperature: {
        min: Number,
        max: Number,
        unit: {
          type: String,
          enum: ['celsius', 'fahrenheit'],
          default: 'celsius'
        }
      },
      condition: String,
      humidity: Number,
      windSpeed: Number,
      precipitation: Number
    }],
    lastUpdated: Date
  },
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Virtual for trip duration
tripSchema.virtual('duration').get(function() {
  if (this.dates.startDate && this.dates.endDate) {
    const diffTime = Math.abs(this.dates.endDate - this.dates.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return 0;
});

// Virtual for total travelers
tripSchema.virtual('totalTravelers').get(function() {
  return this.travelers.adults + this.travelers.children + this.travelers.infants;
});

// Virtual for total spent
tripSchema.virtual('totalSpent').get(function() {
  const breakdown = this.budget.breakdown;
  return Object.values(breakdown).reduce((sum, amount) => sum + (amount || 0), 0);
});

// Indexes for better query performance
tripSchema.index({ owner: 1, createdAt: -1 });
tripSchema.index({ 'destination.city': 1, 'destination.country': 1 });
tripSchema.index({ 'dates.startDate': 1, 'dates.endDate': 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ tags: 1 });

// Pre-save middleware
tripSchema.pre('save', function(next) {
  // Ensure end date is after start date
  if (this.dates.endDate <= this.dates.startDate) {
    next(new Error('End date must be after start date'));
  }
  
  // Set deleted timestamp if trip is being soft deleted
  if (this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }
  
  next();
});

// Static method to find trips by destination
tripSchema.statics.findByDestination = function(city, country) {
  return this.find({
    'destination.city': new RegExp(city, 'i'),
    'destination.country': new RegExp(country, 'i'),
    isDeleted: false
  });
};

// Static method to get trip statistics
tripSchema.statics.getTripStats = function(userId) {
  return this.aggregate([
    { $match: { owner: mongoose.Types.ObjectId(userId), isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget.total' }
      }
    }
  ]);
};

// Instance method to add collaborator
tripSchema.methods.addCollaborator = function(userId, role = 'viewer') {
  const existingCollaborator = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );
  
  if (existingCollaborator) {
    existingCollaborator.role = role;
  } else {
    this.collaborators.push({
      user: userId,
      role: role
    });
  }
  
  return this.save();
};

module.exports = mongoose.model('Trip', tripSchema);
