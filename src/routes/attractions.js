const express = require('express');
const { query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Mock attractions data
const mockAttractions = [
  {
    id: 'ATT001',
    name: 'Central Park',
    type: 'park',
    rating: 4.6,
    category: 'Nature & Parks',
    description: 'A large public park in Manhattan, perfect for walking, picnicking, and outdoor activities.',
    address: 'Central Park, New York, NY',
    coordinates: {
      lat: 40.7829,
      lng: -73.9654
    },
    images: [
      'https://example.com/central-park-1.jpg',
      'https://example.com/central-park-2.jpg'
    ],
    openingHours: {
      monday: '06:00 - 01:00',
      tuesday: '06:00 - 01:00',
      wednesday: '06:00 - 01:00',
      thursday: '06:00 - 01:00',
      friday: '06:00 - 01:00',
      saturday: '06:00 - 01:00',
      sunday: '06:00 - 01:00'
    },
    admission: {
      price: { amount: 0, currency: 'USD' },
      type: 'free'
    },
    duration: '2-4 hours',
    reviews: {
      average: 4.6,
      total: 15420,
      highlights: ['Beautiful scenery', 'Great for families', 'Perfect for jogging']
    },
    tags: ['outdoor', 'family-friendly', 'free', 'walking', 'nature']
  },
  {
    id: 'ATT002',
    name: 'Statue of Liberty',
    type: 'monument',
    rating: 4.4,
    category: 'Monuments & Landmarks',
    description: 'Iconic symbol of freedom and democracy, located on Liberty Island.',
    address: 'Liberty Island, New York, NY',
    coordinates: {
      lat: 40.6892,
      lng: -74.0445
    },
    images: [
      'https://example.com/statue-liberty-1.jpg',
      'https://example.com/statue-liberty-2.jpg'
    ],
    openingHours: {
      monday: '09:00 - 17:00',
      tuesday: '09:00 - 17:00',
      wednesday: '09:00 - 17:00',
      thursday: '09:00 - 17:00',
      friday: '09:00 - 17:00',
      saturday: '09:00 - 17:00',
      sunday: '09:00 - 17:00'
    },
    admission: {
      price: { amount: 25, currency: 'USD' },
      type: 'paid',
      includes: ['Ferry ride', 'Audio guide', 'Access to pedestal']
    },
    duration: '3-5 hours',
    reviews: {
      average: 4.4,
      total: 8930,
      highlights: ['Historic significance', 'Great views', 'Must-see landmark']
    },
    tags: ['historic', 'landmark', 'ferry', 'views', 'cultural']
  },
  {
    id: 'ATT003',
    name: 'Metropolitan Museum of Art',
    type: 'museum',
    rating: 4.7,
    category: 'Museums',
    description: 'One of the world\'s largest and most prestigious art museums.',
    address: '1000 5th Ave, New York, NY',
    coordinates: {
      lat: 40.7794,
      lng: -73.9632
    },
    images: [
      'https://example.com/met-museum-1.jpg',
      'https://example.com/met-museum-2.jpg'
    ],
    openingHours: {
      monday: 'Closed',
      tuesday: '10:00 - 17:00',
      wednesday: '10:00 - 17:00',
      thursday: '10:00 - 17:00',
      friday: '10:00 - 21:00',
      saturday: '10:00 - 21:00',
      sunday: '10:00 - 17:00'
    },
    admission: {
      price: { amount: 30, currency: 'USD' },
      type: 'paid',
      includes: ['Access to all galleries', 'Audio guide available']
    },
    duration: '3-6 hours',
    reviews: {
      average: 4.7,
      total: 12650,
      highlights: ['Incredible collection', 'World-class art', 'Educational experience']
    },
    tags: ['art', 'culture', 'indoor', 'educational', 'historic']
  },
  {
    id: 'ATT004',
    name: 'Times Square',
    type: 'landmark',
    rating: 4.2,
    category: 'Entertainment',
    description: 'The bustling commercial intersection and entertainment hub of Manhattan.',
    address: 'Times Square, New York, NY',
    coordinates: {
      lat: 40.7580,
      lng: -73.9855
    },
    images: [
      'https://example.com/times-square-1.jpg',
      'https://example.com/times-square-2.jpg'
    ],
    openingHours: {
      monday: '24 hours',
      tuesday: '24 hours',
      wednesday: '24 hours',
      thursday: '24 hours',
      friday: '24 hours',
      saturday: '24 hours',
      sunday: '24 hours'
    },
    admission: {
      price: { amount: 0, currency: 'USD' },
      type: 'free'
    },
    duration: '1-2 hours',
    reviews: {
      average: 4.2,
      total: 25890,
      highlights: ['Bright lights', 'Street performers', 'Shopping opportunities']
    },
    tags: ['entertainment', 'shopping', 'nightlife', 'free', 'iconic']
  },
  {
    id: 'ATT005',
    name: 'Brooklyn Bridge',
    type: 'bridge',
    rating: 4.5,
    category: 'Monuments & Landmarks',
    description: 'Historic suspension bridge connecting Manhattan and Brooklyn.',
    address: 'Brooklyn Bridge, New York, NY',
    coordinates: {
      lat: 40.7061,
      lng: -73.9969
    },
    images: [
      'https://example.com/brooklyn-bridge-1.jpg',
      'https://example.com/brooklyn-bridge-2.jpg'
    ],
    openingHours: {
      monday: '24 hours',
      tuesday: '24 hours',
      wednesday: '24 hours',
      thursday: '24 hours',
      friday: '24 hours',
      saturday: '24 hours',
      sunday: '24 hours'
    },
    admission: {
      price: { amount: 0, currency: 'USD' },
      type: 'free'
    },
    duration: '1-2 hours',
    reviews: {
      average: 4.5,
      total: 18750,
      highlights: ['Stunning views', 'Historic architecture', 'Great for photos']
    },
    tags: ['historic', 'walking', 'views', 'free', 'architecture']
  }
];

// @route   GET /api/attractions/search
// @desc    Search for attractions
// @access  Private
router.get('/search', auth, [
  query('destination').notEmpty().withMessage('Destination is required'),
  query('category').optional().isIn(['Nature & Parks', 'Museums', 'Entertainment', 'Monuments & Landmarks', 'Tours & Activities']),
  query('type').optional().isIn(['park', 'museum', 'monument', 'landmark', 'bridge', 'theater', 'gallery']),
  query('minRating').optional().isFloat({ min: 0, max: 5 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('duration').optional().isIn(['1-2 hours', '2-4 hours', '3-6 hours', 'full-day'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      destination, 
      category,
      type,
      minRating,
      maxPrice,
      duration,
      sortBy = 'rating',
      limit = 20
    } = req.query;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Filter attractions based on search criteria
    let attractions = [...mockAttractions];

    if (category) {
      attractions = attractions.filter(attraction => attraction.category === category);
    }

    if (type) {
      attractions = attractions.filter(attraction => attraction.type === type);
    }

    if (minRating) {
      attractions = attractions.filter(attraction => attraction.rating >= parseFloat(minRating));
    }

    if (maxPrice) {
      attractions = attractions.filter(attraction => attraction.admission.price.amount <= parseFloat(maxPrice));
    }

    if (duration) {
      attractions = attractions.filter(attraction => attraction.duration === duration);
    }

    // Sort attractions
    switch (sortBy) {
      case 'rating':
        attractions.sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        attractions.sort((a, b) => a.admission.price.amount - b.admission.price.amount);
        break;
      case 'reviews':
        attractions.sort((a, b) => b.reviews.total - a.reviews.total);
        break;
      case 'name':
        attractions.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        attractions.sort((a, b) => b.rating - a.rating);
    }

    // Limit results
    attractions = attractions.slice(0, parseInt(limit));

    res.json({
      attractions,
      searchCriteria: {
        destination,
        category,
        type,
        minRating,
        maxPrice,
        duration,
        sortBy,
        limit: parseInt(limit)
      },
      totalResults: attractions.length,
      message: 'Attractions search completed successfully'
    });
  } catch (error) {
    console.error('Attractions search error:', error);
    res.status(500).json({ error: 'Server error searching attractions' });
  }
});

// @route   GET /api/attractions/:id
// @desc    Get attraction details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const attraction = mockAttractions.find(a => a.id === req.params.id);
    
    if (!attraction) {
      return res.status(404).json({ error: 'Attraction not found' });
    }

    // Add additional details for specific attraction
    const detailedAttraction = {
      ...attraction,
      nearbyAttractions: mockAttractions
        .filter(a => a.id !== attraction.id)
        .slice(0, 3)
        .map(a => ({
          id: a.id,
          name: a.name,
          rating: a.rating,
          distance: '0.5 km' // Mock distance
        })),
      transportation: {
        subway: 'Multiple subway lines nearby',
        bus: 'Several bus routes available',
        taxi: 'Easily accessible by taxi',
        walking: 'Walkable from many Manhattan locations'
      },
      tips: [
        'Best visited in the morning to avoid crowds',
        'Bring comfortable walking shoes',
        'Check weather conditions before visiting'
      ]
    };

    res.json({
      attraction: detailedAttraction,
      message: 'Attraction details retrieved successfully'
    });
  } catch (error) {
    console.error('Get attraction details error:', error);
    res.status(500).json({ error: 'Server error fetching attraction details' });
  }
});

// @route   GET /api/attractions/categories
// @desc    Get available attraction categories
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = [
      { name: 'Nature & Parks', count: 45 },
      { name: 'Museums', count: 32 },
      { name: 'Entertainment', count: 28 },
      { name: 'Monuments & Landmarks', count: 38 },
      { name: 'Tours & Activities', count: 52 }
    ];

    res.json({
      categories,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
});

module.exports = router;
