const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-travel-planner', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample users data
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    phone: '+1-555-0123',
    nationality: 'American',
    preferences: {
      currency: 'USD',
      language: 'en',
      travelStyle: 'mid-range',
      interests: ['culture', 'food', 'history'],
      dietaryRestrictions: ['none']
    },
    isEmailVerified: true,
    role: 'user'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    phone: '+1-555-0124',
    nationality: 'Canadian',
    preferences: {
      currency: 'CAD',
      language: 'en',
      travelStyle: 'luxury',
      interests: ['adventure', 'nature', 'wellness'],
      dietaryRestrictions: ['vegetarian']
    },
    isEmailVerified: true,
    role: 'user'
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@travelplanner.com',
    password: 'admin123',
    phone: '+1-555-0100',
    nationality: 'American',
    preferences: {
      currency: 'USD',
      language: 'en',
      travelStyle: 'business',
      interests: ['business', 'culture'],
      dietaryRestrictions: ['none']
    },
    isEmailVerified: true,
    role: 'admin'
  }
];

// Sample trips data
const sampleTrips = [
  {
    title: 'European Adventure',
    description: 'A wonderful journey through the heart of Europe',
    destination: {
      city: 'Paris',
      country: 'France',
      coordinates: {
        latitude: 48.8566,
        longitude: 2.3522
      },
      timezone: 'Europe/Paris'
    },
    dates: {
      startDate: new Date('2024-06-15'),
      endDate: new Date('2024-06-25')
    },
    travelers: {
      adults: 2,
      children: 0,
      infants: 0
    },
    budget: {
      total: 5000,
      currency: 'USD',
      breakdown: {
        flights: 1200,
        accommodation: 1500,
        food: 800,
        activities: 1000,
        transport: 300,
        shopping: 200,
        miscellaneous: 0
      }
    },
    status: 'planning',
    privacy: 'private',
    tags: ['europe', 'culture', 'romance'],
    preferences: {
      travelStyle: 'mid-range',
      interests: ['culture', 'food', 'history'],
      accommodation: 'hotel',
      transport: 'flight'
    }
  },
  {
    title: 'Tokyo Business Trip',
    description: 'Business meetings and cultural exploration in Tokyo',
    destination: {
      city: 'Tokyo',
      country: 'Japan',
      coordinates: {
        latitude: 35.6762,
        longitude: 139.6503
      },
      timezone: 'Asia/Tokyo'
    },
    dates: {
      startDate: new Date('2024-07-10'),
      endDate: new Date('2024-07-17')
    },
    travelers: {
      adults: 1,
      children: 0,
      infants: 0
    },
    budget: {
      total: 3500,
      currency: 'USD',
      breakdown: {
        flights: 1000,
        accommodation: 1200,
        food: 600,
        activities: 400,
        transport: 200,
        shopping: 100,
        miscellaneous: 0
      }
    },
    status: 'booked',
    privacy: 'private',
    tags: ['business', 'japan', 'culture'],
    preferences: {
      travelStyle: 'business',
      interests: ['culture', 'food', 'business'],
      accommodation: 'hotel',
      transport: 'flight'
    }
  }
];

// Sample expenses data
const sampleExpenses = [
  {
    title: 'Flight to Paris',
    description: 'Round trip flights for European adventure',
    amount: 1200,
    currency: 'USD',
    category: 'flights',
    date: new Date('2024-06-15'),
    location: {
      name: 'JFK Airport',
      address: 'Queens, NY, USA'
    },
    paymentMethod: 'credit_card',
    tags: ['flights', 'international'],
    status: 'confirmed'
  },
  {
    title: 'Hotel Le Marais',
    description: '5 nights at boutique hotel in Paris',
    amount: 750,
    currency: 'USD',
    category: 'accommodation',
    date: new Date('2024-06-15'),
    location: {
      name: 'Hotel Le Marais',
      address: 'Le Marais, Paris, France'
    },
    paymentMethod: 'credit_card',
    tags: ['hotel', 'accommodation'],
    status: 'confirmed'
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Trip.deleteMany({});
    await Expense.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      users.push(user);
      console.log(`👤 Created user: ${user.email}`);
    }

    // Create trips
    const trips = [];
    for (let i = 0; i < sampleTrips.length; i++) {
      const trip = new Trip({
        ...sampleTrips[i],
        owner: users[i % users.length]._id
      });
      await trip.save();
      trips.push(trip);
      console.log(`✈️  Created trip: ${trip.title}`);
    }

    // Create expenses
    for (let i = 0; i < sampleExpenses.length; i++) {
      const expense = new Expense({
        ...sampleExpenses[i],
        trip: trips[0]._id, // Associate with first trip
        paidBy: users[0]._id,
        createdBy: users[0]._id
      });
      await expense.save();
      console.log(`💰 Created expense: ${expense.title}`);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users created: ${users.length}`);
    console.log(`   Trips created: ${trips.length}`);
    console.log(`   Expenses created: ${sampleExpenses.length}`);
    
    console.log('\n🔐 Test Accounts:');
    console.log('   Regular User: john.doe@example.com / password123');
    console.log('   Regular User: jane.smith@example.com / password123');
    console.log('   Admin User: admin@travelplanner.com / admin123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  connectDB().then(() => {
    seedDatabase();
  });
}

module.exports = { seedDatabase, connectDB };
