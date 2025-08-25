const express = require('express');
const { query, validationResult } = require('express-validator');
const { asyncHandler, ValidationError, NotFoundError, APIError } = require('../middleware/errorHandler');

const router = express.Router();

// Mock attractions data
const mockAttractions = [
  {
    id: 'ATT001',
    name: 'Eiffel Tower',
    description: 'Iconic iron lattice tower and symbol of Paris, offering breathtaking views of the city',
    category: 'Landmark',
    subcategory: 'Historical Monument',
    location: {
      address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
      city: 'Paris',
      country: 'France',
      coordinates: {
        latitude: 48.8584,
        longitude: 2.2945
      },
      neighborhood: '7th Arrondissement',
      nearbyTransport: ['Bir-Hakeim Metro', 'Trocadéro Metro', 'École Militaire Metro']
    },
    images: [
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f',
      'https://images.unsplash.com/photo-1502602898536-47ad22581b52',
      'https://images.unsplash.com/photo-1549144511-f099e773c147'
    ],
    rating: {
      overall: 4.6,
      reviews: 125847,
      breakdown: {
        excellent: 65,
        veryGood: 25,
        average: 8,
        poor: 1,
        terrible: 1
      }
    },
    pricing: {
      adult: 25,
      child: 12.50,
      senior: 20,
      currency: 'EUR',
      freeEntry: false
    },
    openingHours: {
      monday: '09:30-23:45',
      tuesday: '09:30-23:45',
      wednesday: '09:30-23:45',
      thursday: '09:30-23:45',
      friday: '09:30-23:45',
      saturday: '09:30-23:45',
      sunday: '09:30-23:45',
      notes: 'Last admission 45 minutes before closing'
    },
    duration: '2-3 hours',
    bestTimeToVisit: 'Early morning or late evening to avoid crowds',
    accessibility: {
      wheelchairAccessible: true,
      elevatorAccess: true,
      audioGuides: true,
      brailleInformation: true
    },
    features: [
      'Panoramic city views',
      'Glass floor on 1st level',
      'Champagne bar on top floor',
      'Gift shops',
      'Restaurants',
      'Historical exhibitions'
    ],
    tips: [
      'Book tickets online to skip the line',
      'Visit at sunset for magical lighting',
      'Bring a jacket - it gets windy at the top',
      'Security checks can take time'
    ],
    nearbyAttractions: [
      { name: 'Seine River Cruise', distance: '0.2 km' },
      { name: 'Trocadéro Gardens', distance: '0.5 km' },
      { name: 'Invalides', distance: '1.2 km' }
    ]
  },
  {
    id: 'ATT002',
    name: 'Louvre Museum',
    description: 'World\'s largest art museum housing the Mona Lisa and countless masterpieces',
    category: 'Museum',
    subcategory: 'Art Museum',
    location: {
      address: 'Rue de Rivoli, 75001 Paris, France',
      city: 'Paris',
      country: 'France',
      coordinates: {
        latitude: 48.8606,
        longitude: 2.3376
      },
      neighborhood: '1st Arrondissement',
      nearbyTransport: ['Palais-Royal Metro', 'Louvre-Rivoli Metro']
    },
    images: [
      'https://images.unsplash.com/photo-1566139992631-c4d9d5e6e3b3',
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
      'https://images.unsplash.com/photo-1520637836862-4d197d17c93a'
    ],
    rating: {
      overall: 4.7,
      reviews: 89234,
      breakdown: {
        excellent: 72,
        veryGood: 20,
        average: 6,
        poor: 1,
        terrible: 1
      }
    },
    pricing: {
      adult: 17,
      child: 0,
      senior: 17,
      currency: 'EUR',
      freeEntry: 'Under 18 and EU residents under 26'
    },
    openingHours: {
      monday: 'Closed',
      tuesday: '09:00-18:00',
      wednesday: '09:00-21:45',
      thursday: '09:00-18:00',
      friday: '09:00-21:45',
      saturday: '09:00-18:00',
      sunday: '09:00-18:00',
      notes: 'Closed on Tuesdays and some holidays'
    },
    duration: '3-4 hours minimum',
    bestTimeToVisit: 'Wednesday or Friday evenings for smaller crowds',
    accessibility: {
      wheelchairAccessible: true,
      elevatorAccess: true,
      audioGuides: true,
      brailleInformation: true
    },
    features: [
      'Mona Lisa',
      'Venus de Milo',
      'Egyptian antiquities',
      'Islamic art collection',
      'Decorative arts',
      'Paintings from masters'
    ],
    tips: [
      'Book timed entry tickets online',
      'Use the Carrousel du Louvre entrance',
      'Download the museum app for navigation',
      'Focus on specific wings to avoid overwhelm'
    ],
    nearbyAttractions: [
      { name: 'Tuileries Garden', distance: '0.1 km' },
      { name: 'Place Vendôme', distance: '0.5 km' },
      { name: 'Palais Royal', distance: '0.3 km' }
    ]
  },
  {
    id: 'ATT003',
    name: 'Santorini Sunset at Oia',
    description: 'World-famous sunset viewing spot with stunning caldera views and traditional architecture',
    category: 'Natural Wonder',
    subcategory: 'Scenic Viewpoint',
    location: {
      address: 'Oia, Santorini, Greece',
      city: 'Santorini',
      country: 'Greece',
      coordinates: {
        latitude: 36.4618,
        longitude: 25.3753
      },
      neighborhood: 'Oia Village',
      nearbyTransport: ['Local bus from Fira', 'Taxi', 'Rental car/ATV']
    },
    images: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff',
      'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e',
      'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a'
    ],
    rating: {
      overall: 4.8,
      reviews: 45678,
      breakdown: {
        excellent: 78,
        veryGood: 18,
        average: 3,
        poor: 1,
        terrible: 0
      }
    },
    pricing: {
      adult: 0,
      child: 0,
      senior: 0,
      currency: 'EUR',
      freeEntry: true
    },
    openingHours: {
      monday: '24 hours',
      tuesday: '24 hours',
      wednesday: '24 hours',
      thursday: '24 hours',
      friday: '24 hours',
      saturday: '24 hours',
      sunday: '24 hours',
      notes: 'Best viewing time is 1 hour before sunset'
    },
    duration: '2-3 hours',
    bestTimeToVisit: 'April to October, arrive 1-2 hours before sunset',
    accessibility: {
      wheelchairAccessible: false,
      elevatorAccess: false,
      audioGuides: false,
      brailleInformation: false
    },
    features: [
      'Spectacular sunset views',
      'Traditional Cycladic architecture',
      'Blue-domed churches',
      'Narrow cobblestone streets',
      'Art galleries and shops',
      'Cliffside restaurants'
    ],
    tips: [
      'Arrive early to secure a good viewing spot',
      'Wear comfortable walking shoes',
      'Bring a camera with extra batteries',
      'Consider dining at a restaurant with sunset views'
    ],
    nearbyAttractions: [
      { name: 'Amoudi Bay', distance: '0.5 km' },
      { name: 'Maritime Museum', distance: '0.2 km' },
      { name: 'Atlantis Books', distance: '0.1 km' }
    ]
  }
];

// Validation rules
const searchAttractionsValidation = [
  query('destination').notEmpty().withMessage('Destination is required'),
  query('category').optional().isIn(['Museum', 'Landmark', 'Natural Wonder', 'Entertainment', 'Religious Site', 'Historical Site']),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Min rating must be between 0 and 5'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
  query('freeOnly').optional().isBoolean().withMessage('Free only must be boolean'),
  query('accessibleOnly').optional().isBoolean().withMessage('Accessible only must be boolean'),
  query('sortBy').optional().isIn(['rating', 'price', 'popularity', 'distance']).withMessage('Invalid sort option')
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

// Helper function to filter attractions
const filterAttractions = (attractions, query) => {
  let filtered = [...attractions];

  // Filter by category
  if (query.category) {
    filtered = filtered.filter(attraction => 
      attraction.category.toLowerCase() === query.category.toLowerCase()
    );
  }

  // Filter by minimum rating
  if (query.minRating) {
    const minRating = parseFloat(query.minRating);
    filtered = filtered.filter(attraction => attraction.rating.overall >= minRating);
  }

  // Filter by maximum price
  if (query.maxPrice) {
    const maxPrice = parseFloat(query.maxPrice);
    filtered = filtered.filter(attraction => 
      attraction.pricing.freeEntry || attraction.pricing.adult <= maxPrice
    );
  }

  // Filter for free attractions only
  if (query.freeOnly === 'true') {
    filtered = filtered.filter(attraction => attraction.pricing.freeEntry);
  }

  // Filter for accessible attractions only
  if (query.accessibleOnly === 'true') {
    filtered = filtered.filter(attraction => attraction.accessibility.wheelchairAccessible);
  }

  return filtered;
};

// Helper function to sort attractions
const sortAttractions = (attractions, sortBy) => {
  const sorted = [...attractions];

  switch (sortBy) {
    case 'rating':
      return sorted.sort((a, b) => b.rating.overall - a.rating.overall);
    case 'price':
      return sorted.sort((a, b) => {
        const aPrice = a.pricing.freeEntry ? 0 : a.pricing.adult;
        const bPrice = b.pricing.freeEntry ? 0 : b.pricing.adult;
        return aPrice - bPrice;
      });
    case 'popularity':
      return sorted.sort((a, b) => b.rating.reviews - a.rating.reviews);
    case 'distance':
      // In a real app, you would calculate distance from user's location
      return sorted;
    default:
      return sorted.sort((a, b) => b.rating.overall - a.rating.overall);
  }
};

// @route   GET /api/attractions/search
// @desc    Search for attractions
// @access  Private
router.get('/search', searchAttractionsValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const {
    destination,
    sortBy = 'rating'
  } = req.query;

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    // Filter and sort attractions
    let attractions = filterAttractions(mockAttractions, req.query);
    attractions = sortAttractions(attractions, sortBy);

    // Add search metadata
    const searchResults = {
      searchId: `attractions_search_${Date.now()}`,
      destination,
      searchTime: new Date().toISOString(),
      totalResults: attractions.length,
      filters: {
        category: req.query.category,
        minRating: req.query.minRating,
        maxPrice: req.query.maxPrice,
        freeOnly: req.query.freeOnly === 'true',
        accessibleOnly: req.query.accessibleOnly === 'true'
      },
      attractions: attractions.map(attraction => ({
        ...attraction,
        bookingUrl: `/api/attractions/${attraction.id}/book`,
        shareUrl: `https://travel-planner.com/attractions/${attraction.id}`
      }))
    };

    res.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    throw new APIError('Attractions search service temporarily unavailable', 503, 'AttractionsAPI');
  }
}));

// @route   GET /api/attractions/:id
// @desc    Get attraction details
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const attractionId = req.params.id;
  
  const attraction = mockAttractions.find(a => a.id === attractionId);
  
  if (!attraction) {
    throw new NotFoundError('Attraction not found');
  }

  // Add additional details for single attraction view
  const detailedAttraction = {
    ...attraction,
    reviews: [
      {
        id: 1,
        author: 'Emma Wilson',
        rating: 5,
        date: '2024-02-20',
        title: 'Absolutely breathtaking!',
        comment: 'The views were incredible and the experience was unforgettable. Highly recommend visiting during sunset.',
        helpful: 24,
        photos: ['review1.jpg', 'review2.jpg']
      },
      {
        id: 2,
        author: 'Carlos Rodriguez',
        rating: 4,
        date: '2024-02-18',
        title: 'Great but crowded',
        comment: 'Beautiful attraction but very crowded. Try to visit early in the morning or late evening.',
        helpful: 15,
        photos: []
      }
    ],
    weather: {
      current: 'Sunny, 22°C',
      forecast: 'Clear skies expected for the next 3 days'
    },
    crowdLevels: {
      current: 'Moderate',
      prediction: {
        morning: 'Low',
        afternoon: 'High',
        evening: 'Moderate'
      }
    },
    ticketOptions: [
      {
        type: 'Standard Entry',
        price: attraction.pricing.adult,
        includes: ['General admission', 'Audio guide'],
        duration: '2-3 hours'
      },
      {
        type: 'Skip-the-Line',
        price: attraction.pricing.adult + 10,
        includes: ['Priority entry', 'Audio guide', 'Digital photos'],
        duration: '2-3 hours'
      }
    ]
  };

  res.json({
    success: true,
    data: { attraction: detailedAttraction }
  });
}));

// @route   GET /api/attractions/categories
// @desc    Get attraction categories
// @access  Private
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = [
    {
      name: 'Museums',
      icon: '🏛️',
      count: 1247,
      description: 'Art, history, and cultural museums'
    },
    {
      name: 'Landmarks',
      icon: '🗼',
      count: 892,
      description: 'Iconic monuments and architectural wonders'
    },
    {
      name: 'Natural Wonders',
      icon: '🏔️',
      count: 634,
      description: 'Parks, beaches, and scenic viewpoints'
    },
    {
      name: 'Entertainment',
      icon: '🎢',
      count: 456,
      description: 'Theme parks, shows, and activities'
    },
    {
      name: 'Religious Sites',
      icon: '⛪',
      count: 378,
      description: 'Churches, temples, and spiritual places'
    },
    {
      name: 'Historical Sites',
      icon: '🏰',
      count: 523,
      description: 'Ancient ruins and historical locations'
    }
  ];

  res.json({
    success: true,
    data: { categories }
  });
}));

// @route   GET /api/attractions/trending
// @desc    Get trending attractions
// @access  Private
router.get('/trending', asyncHandler(async (req, res) => {
  // Sort by recent review activity and rating
  const trending = mockAttractions
    .sort((a, b) => b.rating.reviews - a.rating.reviews)
    .slice(0, 6)
    .map(attraction => ({
      id: attraction.id,
      name: attraction.name,
      location: `${attraction.location.city}, ${attraction.location.country}`,
      image: attraction.images[0],
      rating: attraction.rating.overall,
      reviews: attraction.rating.reviews,
      price: attraction.pricing.freeEntry ? 'Free' : `${attraction.pricing.adult} ${attraction.pricing.currency}`,
      category: attraction.category,
      trending: true
    }));

  res.json({
    success: true,
    data: { attractions: trending }
  });
}));

module.exports = router;
