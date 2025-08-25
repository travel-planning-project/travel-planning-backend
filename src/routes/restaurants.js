const express = require('express');
const { query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Mock restaurants data
const mockRestaurants = [
  {
    id: 'REST001',
    name: 'The Italian Corner',
    cuisine: 'Italian',
    rating: 4.6,
    priceRange: '$$',
    address: '123 Little Italy, New York, NY',
    coordinates: {
      lat: 40.7194,
      lng: -73.9977
    },
    images: [
      'https://example.com/italian-corner-1.jpg',
      'https://example.com/italian-corner-2.jpg'
    ],
    openingHours: {
      monday: '11:30 - 22:00',
      tuesday: '11:30 - 22:00',
      wednesday: '11:30 - 22:00',
      thursday: '11:30 - 22:00',
      friday: '11:30 - 23:00',
      saturday: '11:30 - 23:00',
      sunday: '12:00 - 21:00'
    },
    contact: {
      phone: '+1-212-555-0123',
      website: 'www.italiancorner.com'
    },
    features: ['Outdoor Seating', 'Reservations', 'Takeout', 'Delivery'],
    averageCost: {
      amount: 45,
      currency: 'USD',
      perPerson: true
    },
    reviews: {
      average: 4.6,
      total: 892,
      highlights: ['Authentic pasta', 'Great atmosphere', 'Excellent service']
    },
    popularDishes: [
      'Spaghetti Carbonara',
      'Margherita Pizza',
      'Tiramisu'
    ]
  },
  {
    id: 'REST002',
    name: 'Sakura Sushi Bar',
    cuisine: 'Japanese',
    rating: 4.8,
    priceRange: '$$$',
    address: '456 East Village, New York, NY',
    coordinates: {
      lat: 40.7282,
      lng: -73.9942
    },
    images: [
      'https://example.com/sakura-sushi-1.jpg',
      'https://example.com/sakura-sushi-2.jpg'
    ],
    openingHours: {
      monday: 'Closed',
      tuesday: '17:00 - 22:00',
      wednesday: '17:00 - 22:00',
      thursday: '17:00 - 22:00',
      friday: '17:00 - 23:00',
      saturday: '17:00 - 23:00',
      sunday: '17:00 - 21:00'
    },
    contact: {
      phone: '+1-212-555-0456',
      website: 'www.sakurasushi.com'
    },
    features: ['Reservations Required', 'Omakase', 'Sake Bar', 'Chef\'s Counter'],
    averageCost: {
      amount: 85,
      currency: 'USD',
      perPerson: true
    },
    reviews: {
      average: 4.8,
      total: 567,
      highlights: ['Fresh fish', 'Skilled chefs', 'Intimate setting']
    },
    popularDishes: [
      'Omakase Tasting Menu',
      'Chirashi Bowl',
      'Miso Black Cod'
    ]
  },
  {
    id: 'REST003',
    name: 'Brooklyn Burger Joint',
    cuisine: 'American',
    rating: 4.3,
    priceRange: '$',
    address: '789 Brooklyn Heights, Brooklyn, NY',
    coordinates: {
      lat: 40.6962,
      lng: -73.9969
    },
    images: [
      'https://example.com/burger-joint-1.jpg',
      'https://example.com/burger-joint-2.jpg'
    ],
    openingHours: {
      monday: '11:00 - 22:00',
      tuesday: '11:00 - 22:00',
      wednesday: '11:00 - 22:00',
      thursday: '11:00 - 22:00',
      friday: '11:00 - 23:00',
      saturday: '11:00 - 23:00',
      sunday: '11:00 - 21:00'
    },
    contact: {
      phone: '+1-718-555-0789',
      website: 'www.brooklynburger.com'
    },
    features: ['Casual Dining', 'Family Friendly', 'Takeout', 'Delivery'],
    averageCost: {
      amount: 18,
      currency: 'USD',
      perPerson: true
    },
    reviews: {
      average: 4.3,
      total: 1245,
      highlights: ['Juicy burgers', 'Great fries', 'Good value']
    },
    popularDishes: [
      'Classic Cheeseburger',
      'BBQ Bacon Burger',
      'Sweet Potato Fries'
    ]
  }
];

// @route   GET /api/restaurants/search
// @desc    Search for restaurants
// @access  Private
router.get('/search', auth, [
  query('destination').notEmpty().withMessage('Destination is required'),
  query('cuisine').optional().isIn(['Italian', 'Japanese', 'American', 'Chinese', 'Mexican', 'French', 'Indian', 'Thai']),
  query('priceRange').optional().isIn(['$', '$$', '$$$', '$$$$']),
  query('minRating').optional().isFloat({ min: 0, max: 5 }),
  query('features').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      destination, 
      cuisine,
      priceRange,
      minRating,
      features,
      sortBy = 'rating',
      limit = 20
    } = req.query;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Filter restaurants based on search criteria
    let restaurants = [...mockRestaurants];

    if (cuisine) {
      restaurants = restaurants.filter(restaurant => restaurant.cuisine === cuisine);
    }

    if (priceRange) {
      restaurants = restaurants.filter(restaurant => restaurant.priceRange === priceRange);
    }

    if (minRating) {
      restaurants = restaurants.filter(restaurant => restaurant.rating >= parseFloat(minRating));
    }

    if (features && Array.isArray(features)) {
      restaurants = restaurants.filter(restaurant => 
        features.some(feature => restaurant.features.includes(feature))
      );
    }

    // Sort restaurants
    switch (sortBy) {
      case 'rating':
        restaurants.sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        restaurants.sort((a, b) => a.averageCost.amount - b.averageCost.amount);
        break;
      case 'reviews':
        restaurants.sort((a, b) => b.reviews.total - a.reviews.total);
        break;
      case 'name':
        restaurants.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        restaurants.sort((a, b) => b.rating - a.rating);
    }

    // Limit results
    restaurants = restaurants.slice(0, parseInt(limit));

    res.json({
      restaurants,
      searchCriteria: {
        destination,
        cuisine,
        priceRange,
        minRating,
        features,
        sortBy,
        limit: parseInt(limit)
      },
      totalResults: restaurants.length,
      message: 'Restaurant search completed successfully'
    });
  } catch (error) {
    console.error('Restaurant search error:', error);
    res.status(500).json({ error: 'Server error searching restaurants' });
  }
});

// @route   GET /api/restaurants/:id
// @desc    Get restaurant details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const restaurant = mockRestaurants.find(r => r.id === req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Add additional details for specific restaurant
    const detailedRestaurant = {
      ...restaurant,
      menu: {
        appetizers: [
          { name: 'Bruschetta', price: 12, description: 'Toasted bread with tomatoes and basil' },
          { name: 'Calamari', price: 14, description: 'Fried squid rings with marinara sauce' }
        ],
        mains: [
          { name: 'Spaghetti Carbonara', price: 18, description: 'Classic pasta with eggs, cheese, and pancetta' },
          { name: 'Margherita Pizza', price: 16, description: 'Traditional pizza with tomato, mozzarella, and basil' }
        ],
        desserts: [
          { name: 'Tiramisu', price: 8, description: 'Classic Italian dessert with coffee and mascarpone' }
        ]
      },
      reservations: {
        required: true,
        phone: restaurant.contact.phone,
        online: 'Available through OpenTable'
      },
      nearbyAttractions: [
        { name: 'Central Park', distance: '0.3 km' },
        { name: 'Times Square', distance: '0.8 km' }
      ]
    };

    res.json({
      restaurant: detailedRestaurant,
      message: 'Restaurant details retrieved successfully'
    });
  } catch (error) {
    console.error('Get restaurant details error:', error);
    res.status(500).json({ error: 'Server error fetching restaurant details' });
  }
});

// @route   GET /api/restaurants/cuisines
// @desc    Get available cuisines
// @access  Private
router.get('/cuisines', auth, async (req, res) => {
  try {
    const cuisines = [
      { name: 'Italian', count: 125 },
      { name: 'Japanese', count: 89 },
      { name: 'American', count: 156 },
      { name: 'Chinese', count: 98 },
      { name: 'Mexican', count: 76 },
      { name: 'French', count: 54 },
      { name: 'Indian', count: 67 },
      { name: 'Thai', count: 43 }
    ];

    res.json({
      cuisines,
      message: 'Cuisines retrieved successfully'
    });
  } catch (error) {
    console.error('Get cuisines error:', error);
    res.status(500).json({ error: 'Server error fetching cuisines' });
  }
});

module.exports = router;
