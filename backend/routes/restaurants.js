const express = require('express');
const { query, validationResult } = require('express-validator');
const { asyncHandler, ValidationError, NotFoundError, APIError } = require('../middleware/errorHandler');

const router = express.Router();

// Mock restaurant data
const mockRestaurants = [
  {
    id: 'REST001',
    name: 'Le Petit Bistro',
    description: 'Authentic French cuisine in a cozy, traditional setting with seasonal ingredients',
    cuisine: 'French',
    subcuisine: 'Traditional French',
    location: {
      address: '15 Rue de la Paix, 75001 Paris, France',
      city: 'Paris',
      country: 'France',
      coordinates: {
        latitude: 48.8698,
        longitude: 2.3314
      },
      neighborhood: 'Latin Quarter',
      distanceFromCenter: '1.2 km'
    },
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b'
    ],
    rating: {
      overall: 4.7,
      food: 4.8,
      service: 4.6,
      atmosphere: 4.7,
      value: 4.5,
      reviews: 1247
    },
    priceRange: '€€€',
    averageCost: {
      perPerson: 65,
      currency: 'EUR'
    },
    openingHours: {
      monday: '18:00-23:00',
      tuesday: '12:00-14:30, 18:00-23:00',
      wednesday: '12:00-14:30, 18:00-23:00',
      thursday: '12:00-14:30, 18:00-23:00',
      friday: '12:00-14:30, 18:00-23:30',
      saturday: '12:00-14:30, 18:00-23:30',
      sunday: 'Closed',
      notes: 'Reservations recommended'
    },
    features: [
      'Outdoor seating',
      'Wine bar',
      'Romantic atmosphere',
      'Live music weekends',
      'Private dining room',
      'Sommelier on staff'
    ],
    dietaryOptions: [
      'Vegetarian options',
      'Gluten-free options',
      'Vegan options available'
    ],
    specialties: [
      'Coq au Vin',
      'Bouillabaisse',
      'Duck Confit',
      'Cheese Selection',
      'Wine Pairing Menu'
    ],
    reservations: {
      required: true,
      phone: '+33 1 42 96 87 76',
      online: true,
      walkInsAccepted: false
    },
    paymentMethods: ['Cash', 'Credit Cards', 'Contactless'],
    accessibility: {
      wheelchairAccessible: true,
      brailleMenu: false,
      hearingLoop: false
    }
  },
  {
    id: 'REST002',
    name: 'Sakura Sushi Bar',
    description: 'Premium sushi experience with fresh fish flown in daily from Tokyo markets',
    cuisine: 'Japanese',
    subcuisine: 'Sushi',
    location: {
      address: '42 East 58th Street, New York, NY 10022',
      city: 'New York',
      country: 'USA',
      coordinates: {
        latitude: 40.7614,
        longitude: -73.9776
      },
      neighborhood: 'Midtown East',
      distanceFromCenter: '2.1 km'
    },
    images: [
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351',
      'https://images.unsplash.com/photo-1553621042-f6e147245754',
      'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0'
    ],
    rating: {
      overall: 4.9,
      food: 5.0,
      service: 4.8,
      atmosphere: 4.7,
      value: 4.6,
      reviews: 892
    },
    priceRange: '€€€€',
    averageCost: {
      perPerson: 120,
      currency: 'USD'
    },
    openingHours: {
      monday: '17:30-22:00',
      tuesday: '17:30-22:00',
      wednesday: '17:30-22:00',
      thursday: '17:30-22:00',
      friday: '17:30-22:30',
      saturday: '17:00-22:30',
      sunday: '17:00-21:30',
      notes: 'Omakase seatings at 6pm and 8:30pm'
    },
    features: [
      'Sushi counter seating',
      'Omakase experience',
      'Sake selection',
      'Chef interaction',
      'Premium ingredients',
      'Intimate setting'
    ],
    dietaryOptions: [
      'Vegetarian sushi available',
      'Gluten-free soy sauce',
      'Raw fish alternatives'
    ],
    specialties: [
      'Omakase Tasting Menu',
      'Bluefin Tuna Sashimi',
      'Uni Selection',
      'Seasonal Fish',
      'Sake Pairing'
    ],
    reservations: {
      required: true,
      phone: '+1 212 555 7890',
      online: true,
      walkInsAccepted: false
    },
    paymentMethods: ['Credit Cards', 'Contactless'],
    accessibility: {
      wheelchairAccessible: false,
      brailleMenu: false,
      hearingLoop: false
    }
  },
  {
    id: 'REST003',
    name: 'Taverna Mykonos',
    description: 'Traditional Greek taverna with stunning sea views and authentic island flavors',
    cuisine: 'Greek',
    subcuisine: 'Traditional Greek',
    location: {
      address: 'Little Venice, Mykonos Town, Greece',
      city: 'Mykonos',
      country: 'Greece',
      coordinates: {
        latitude: 37.4467,
        longitude: 25.3289
      },
      neighborhood: 'Little Venice',
      distanceFromCenter: '0.3 km'
    },
    images: [
      'https://images.unsplash.com/photo-1544148103-0773bf10d330',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96'
    ],
    rating: {
      overall: 4.6,
      food: 4.7,
      service: 4.5,
      atmosphere: 4.8,
      value: 4.4,
      reviews: 567
    },
    priceRange: '€€',
    averageCost: {
      perPerson: 35,
      currency: 'EUR'
    },
    openingHours: {
      monday: '12:00-15:00, 19:00-24:00',
      tuesday: '12:00-15:00, 19:00-24:00',
      wednesday: '12:00-15:00, 19:00-24:00',
      thursday: '12:00-15:00, 19:00-24:00',
      friday: '12:00-15:00, 19:00-01:00',
      saturday: '12:00-15:00, 19:00-01:00',
      sunday: '12:00-15:00, 19:00-24:00',
      notes: 'Live music Thursday-Saturday'
    },
    features: [
      'Sea view terrace',
      'Live Greek music',
      'Traditional dancing',
      'Sunset views',
      'Family-owned',
      'Local fishermen supply'
    ],
    dietaryOptions: [
      'Vegetarian dishes',
      'Vegan options',
      'Gluten-free available'
    ],
    specialties: [
      'Fresh Grilled Fish',
      'Moussaka',
      'Greek Salad',
      'Souvlaki',
      'Local Wine Selection'
    ],
    reservations: {
      required: false,
      phone: '+30 22890 24710',
      online: false,
      walkInsAccepted: true
    },
    paymentMethods: ['Cash', 'Credit Cards'],
    accessibility: {
      wheelchairAccessible: true,
      brailleMenu: false,
      hearingLoop: false
    }
  }
];

// Validation rules
const searchRestaurantsValidation = [
  query('destination').notEmpty().withMessage('Destination is required'),
  query('cuisine').optional().isString().withMessage('Cuisine must be a string'),
  query('priceRange').optional().isIn(['€', '€€', '€€€', '€€€€']).withMessage('Invalid price range'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Min rating must be between 0 and 5'),
  query('dietaryRestrictions').optional().isString().withMessage('Dietary restrictions must be a string'),
  query('openNow').optional().isBoolean().withMessage('Open now must be boolean'),
  query('reservationsRequired').optional().isBoolean().withMessage('Reservations required must be boolean'),
  query('sortBy').optional().isIn(['rating', 'price', 'distance', 'popularity']).withMessage('Invalid sort option')
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

// Helper function to filter restaurants
const filterRestaurants = (restaurants, query) => {
  let filtered = [...restaurants];

  // Filter by cuisine
  if (query.cuisine) {
    filtered = filtered.filter(restaurant => 
      restaurant.cuisine.toLowerCase().includes(query.cuisine.toLowerCase()) ||
      restaurant.subcuisine.toLowerCase().includes(query.cuisine.toLowerCase())
    );
  }

  // Filter by price range
  if (query.priceRange) {
    filtered = filtered.filter(restaurant => restaurant.priceRange === query.priceRange);
  }

  // Filter by minimum rating
  if (query.minRating) {
    const minRating = parseFloat(query.minRating);
    filtered = filtered.filter(restaurant => restaurant.rating.overall >= minRating);
  }

  // Filter by dietary restrictions
  if (query.dietaryRestrictions) {
    const restrictions = query.dietaryRestrictions.split(',').map(r => r.trim().toLowerCase());
    filtered = filtered.filter(restaurant => 
      restrictions.some(restriction => 
        restaurant.dietaryOptions.some(option => 
          option.toLowerCase().includes(restriction)
        )
      )
    );
  }

  // Filter by reservations requirement
  if (query.reservationsRequired !== undefined) {
    const requiresReservations = query.reservationsRequired === 'true';
    filtered = filtered.filter(restaurant => 
      restaurant.reservations.required === requiresReservations
    );
  }

  return filtered;
};

// Helper function to sort restaurants
const sortRestaurants = (restaurants, sortBy) => {
  const sorted = [...restaurants];

  switch (sortBy) {
    case 'rating':
      return sorted.sort((a, b) => b.rating.overall - a.rating.overall);
    case 'price':
      return sorted.sort((a, b) => a.averageCost.perPerson - b.averageCost.perPerson);
    case 'distance':
      return sorted.sort((a, b) => 
        parseFloat(a.location.distanceFromCenter) - parseFloat(b.location.distanceFromCenter)
      );
    case 'popularity':
      return sorted.sort((a, b) => b.rating.reviews - a.rating.reviews);
    default:
      return sorted.sort((a, b) => b.rating.overall - a.rating.overall);
  }
};

// @route   GET /api/restaurants/search
// @desc    Search for restaurants
// @access  Private
router.get('/search', searchRestaurantsValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const {
    destination,
    sortBy = 'rating'
  } = req.query;

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Filter and sort restaurants
    let restaurants = filterRestaurants(mockRestaurants, req.query);
    restaurants = sortRestaurants(restaurants, sortBy);

    // Add search metadata
    const searchResults = {
      searchId: `restaurants_search_${Date.now()}`,
      destination,
      searchTime: new Date().toISOString(),
      totalResults: restaurants.length,
      filters: {
        cuisine: req.query.cuisine,
        priceRange: req.query.priceRange,
        minRating: req.query.minRating,
        dietaryRestrictions: req.query.dietaryRestrictions
      },
      restaurants: restaurants.map(restaurant => ({
        ...restaurant,
        bookingUrl: `/api/restaurants/${restaurant.id}/book`,
        menuUrl: `/api/restaurants/${restaurant.id}/menu`,
        shareUrl: `https://travel-planner.com/restaurants/${restaurant.id}`
      }))
    };

    res.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    throw new APIError('Restaurant search service temporarily unavailable', 503, 'RestaurantAPI');
  }
}));

// @route   GET /api/restaurants/:id
// @desc    Get restaurant details
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const restaurantId = req.params.id;
  
  const restaurant = mockRestaurants.find(r => r.id === restaurantId);
  
  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  // Add additional details for single restaurant view
  const detailedRestaurant = {
    ...restaurant,
    menu: {
      available: true,
      url: `/api/restaurants/${restaurantId}/menu`,
      highlights: restaurant.specialties
    },
    reviews: [
      {
        id: 1,
        author: 'Maria Garcia',
        rating: 5,
        date: '2024-02-22',
        title: 'Exceptional dining experience',
        comment: 'The food was absolutely incredible and the service was impeccable. Will definitely return!',
        helpful: 18,
        photos: ['food1.jpg', 'ambiance1.jpg']
      },
      {
        id: 2,
        author: 'John Smith',
        rating: 4,
        date: '2024-02-20',
        title: 'Great food, busy atmosphere',
        comment: 'Delicious food but quite noisy. Perfect for groups but maybe not for romantic dinners.',
        helpful: 12,
        photos: []
      }
    ],
    availability: {
      today: 'Available slots: 7:30pm, 9:00pm',
      tomorrow: 'Available slots: 6:00pm, 7:30pm, 9:00pm',
      nextWeek: 'Good availability'
    },
    popularTimes: {
      monday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 2, 0, 0, 0, 4, 5, 4, 3, 2, 1],
      tuesday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 4, 3, 0, 0, 0, 5, 6, 5, 4, 3, 2],
      // ... other days
    }
  };

  res.json({
    success: true,
    data: { restaurant: detailedRestaurant }
  });
}));

// @route   GET /api/restaurants/cuisines
// @desc    Get available cuisines
// @access  Private
router.get('/cuisines', asyncHandler(async (req, res) => {
  const cuisines = [
    { name: 'Italian', icon: '🍝', count: 1247 },
    { name: 'French', icon: '🥖', count: 892 },
    { name: 'Japanese', icon: '🍣', count: 634 },
    { name: 'Chinese', icon: '🥢', count: 756 },
    { name: 'Indian', icon: '🍛', count: 523 },
    { name: 'Mexican', icon: '🌮', count: 445 },
    { name: 'Thai', icon: '🍜', count: 378 },
    { name: 'Greek', icon: '🫒', count: 289 },
    { name: 'Spanish', icon: '🥘', count: 356 },
    { name: 'American', icon: '🍔', count: 678 }
  ];

  res.json({
    success: true,
    data: { cuisines }
  });
}));

// @route   GET /api/restaurants/trending
// @desc    Get trending restaurants
// @access  Private
router.get('/trending', asyncHandler(async (req, res) => {
  const trending = mockRestaurants
    .sort((a, b) => b.rating.reviews - a.rating.reviews)
    .slice(0, 6)
    .map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      location: `${restaurant.location.city}, ${restaurant.location.country}`,
      image: restaurant.images[0],
      rating: restaurant.rating.overall,
      reviews: restaurant.rating.reviews,
      priceRange: restaurant.priceRange,
      averageCost: restaurant.averageCost,
      trending: true
    }));

  res.json({
    success: true,
    data: { restaurants: trending }
  });
}));

module.exports = router;
