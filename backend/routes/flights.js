const express = require('express');
const { query, validationResult } = require('express-validator');
const { asyncHandler, ValidationError, APIError } = require('../middleware/errorHandler');

const router = express.Router();

// Mock flight data for development
const mockFlights = [
  {
    id: 'FL001',
    airline: 'SkyWings Airlines',
    flightNumber: 'SW123',
    aircraft: 'Boeing 737-800',
    departure: {
      airport: 'JFK',
      city: 'New York',
      country: 'USA',
      terminal: '4',
      gate: 'A12',
      time: '2024-03-15T08:30:00Z'
    },
    arrival: {
      airport: 'CDG',
      city: 'Paris',
      country: 'France',
      terminal: '2E',
      gate: 'K45',
      time: '2024-03-15T14:45:00Z'
    },
    duration: '6h 15m',
    stops: 0,
    price: {
      economy: 299,
      premium: 599,
      business: 1299,
      first: 2499,
      currency: 'USD'
    },
    availability: {
      economy: 15,
      premium: 8,
      business: 4,
      first: 2
    },
    amenities: ['WiFi', 'Entertainment', 'Meals', 'Power Outlets'],
    baggage: {
      carry: '1 x 8kg',
      checked: '1 x 23kg included'
    },
    rating: 4.8,
    reviews: 1247
  },
  {
    id: 'FL002',
    airline: 'CloudJet Express',
    flightNumber: 'CJ456',
    aircraft: 'Airbus A320',
    departure: {
      airport: 'JFK',
      city: 'New York',
      country: 'USA',
      terminal: '4',
      gate: 'B08',
      time: '2024-03-15T12:15:00Z'
    },
    arrival: {
      airport: 'CDG',
      city: 'Paris',
      country: 'France',
      terminal: '2F',
      gate: 'L23',
      time: '2024-03-15T19:30:00Z'
    },
    duration: '7h 15m',
    stops: 1,
    stopover: {
      airport: 'LHR',
      city: 'London',
      duration: '1h 30m'
    },
    price: {
      economy: 249,
      premium: 499,
      business: 999,
      first: 1899,
      currency: 'USD'
    },
    availability: {
      economy: 22,
      premium: 12,
      business: 6,
      first: 3
    },
    amenities: ['WiFi', 'Entertainment', 'Snacks'],
    baggage: {
      carry: '1 x 7kg',
      checked: '1 x 20kg included'
    },
    rating: 4.6,
    reviews: 892
  },
  {
    id: 'FL003',
    airline: 'AeroFly International',
    flightNumber: 'AF789',
    aircraft: 'Boeing 787-9',
    departure: {
      airport: 'JFK',
      city: 'New York',
      country: 'USA',
      terminal: '1',
      gate: 'C15',
      time: '2024-03-15T16:45:00Z'
    },
    arrival: {
      airport: 'CDG',
      city: 'Paris',
      country: 'France',
      terminal: '2A',
      gate: 'M12',
      time: '2024-03-15T23:20:00Z'
    },
    duration: '6h 35m',
    stops: 0,
    price: {
      economy: 329,
      premium: 649,
      business: 1399,
      first: 2699,
      currency: 'USD'
    },
    availability: {
      economy: 18,
      premium: 10,
      business: 5,
      first: 2
    },
    amenities: ['WiFi', 'Entertainment', 'Premium Meals', 'Power Outlets', 'USB Ports'],
    baggage: {
      carry: '1 x 10kg',
      checked: '2 x 23kg included'
    },
    rating: 4.9,
    reviews: 2156
  }
];

// Validation rules
const searchFlightsValidation = [
  query('origin').notEmpty().withMessage('Origin is required'),
  query('destination').notEmpty().withMessage('Destination is required'),
  query('departureDate').isISO8601().withMessage('Valid departure date is required'),
  query('returnDate').optional().isISO8601().withMessage('Valid return date required if provided'),
  query('passengers').optional().isInt({ min: 1, max: 9 }).withMessage('Passengers must be between 1 and 9'),
  query('class').optional().isIn(['economy', 'premium', 'business', 'first']).withMessage('Invalid class'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
  query('stops').optional().isIn(['0', '1', '2+']).withMessage('Invalid stops filter'),
  query('airlines').optional().isString().withMessage('Airlines must be a string'),
  query('sortBy').optional().isIn(['price', 'duration', 'departure', 'arrival', 'rating']).withMessage('Invalid sort option')
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

// Helper function to filter flights based on query parameters
const filterFlights = (flights, query) => {
  let filtered = [...flights];

  // Filter by class availability
  if (query.class) {
    filtered = filtered.filter(flight => 
      flight.availability[query.class] > 0
    );
  }

  // Filter by max price
  if (query.maxPrice) {
    const maxPrice = parseFloat(query.maxPrice);
    const flightClass = query.class || 'economy';
    filtered = filtered.filter(flight => 
      flight.price[flightClass] <= maxPrice
    );
  }

  // Filter by stops
  if (query.stops) {
    if (query.stops === '0') {
      filtered = filtered.filter(flight => flight.stops === 0);
    } else if (query.stops === '1') {
      filtered = filtered.filter(flight => flight.stops === 1);
    } else if (query.stops === '2+') {
      filtered = filtered.filter(flight => flight.stops >= 2);
    }
  }

  // Filter by airlines
  if (query.airlines) {
    const airlineList = query.airlines.split(',').map(a => a.trim().toLowerCase());
    filtered = filtered.filter(flight => 
      airlineList.some(airline => 
        flight.airline.toLowerCase().includes(airline)
      )
    );
  }

  return filtered;
};

// Helper function to sort flights
const sortFlights = (flights, sortBy, flightClass = 'economy') => {
  const sorted = [...flights];

  switch (sortBy) {
    case 'price':
      return sorted.sort((a, b) => a.price[flightClass] - b.price[flightClass]);
    case 'duration':
      return sorted.sort((a, b) => {
        const aDuration = parseInt(a.duration.split('h')[0]) * 60 + parseInt(a.duration.split('h')[1]);
        const bDuration = parseInt(b.duration.split('h')[0]) * 60 + parseInt(b.duration.split('h')[1]);
        return aDuration - bDuration;
      });
    case 'departure':
      return sorted.sort((a, b) => new Date(a.departure.time) - new Date(b.departure.time));
    case 'arrival':
      return sorted.sort((a, b) => new Date(a.arrival.time) - new Date(b.arrival.time));
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    default:
      return sorted;
  }
};

// @route   GET /api/flights/search
// @desc    Search for flights
// @access  Private
router.get('/search', searchFlightsValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const {
    origin,
    destination,
    departureDate,
    returnDate,
    passengers = 1,
    class: flightClass = 'economy',
    sortBy = 'price'
  } = req.query;

  // In a real application, you would call external flight APIs here
  // For now, we'll use mock data and simulate API behavior

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Filter and sort flights
    let flights = filterFlights(mockFlights, req.query);
    flights = sortFlights(flights, sortBy, flightClass);

    // Add search metadata
    const searchResults = {
      searchId: `search_${Date.now()}`,
      origin,
      destination,
      departureDate,
      returnDate,
      passengers: parseInt(passengers),
      class: flightClass,
      currency: 'USD',
      searchTime: new Date().toISOString(),
      totalResults: flights.length,
      flights: flights.map(flight => ({
        ...flight,
        selectedPrice: flight.price[flightClass],
        selectedAvailability: flight.availability[flightClass],
        bookingUrl: `/api/flights/${flight.id}/book`,
        deepLink: `https://airline-booking.com/book/${flight.id}`
      }))
    };

    res.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    throw new APIError('Flight search service temporarily unavailable', 503, 'FlightAPI');
  }
}));

// @route   GET /api/flights/:id
// @desc    Get flight details
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const flightId = req.params.id;
  
  // Find flight in mock data
  const flight = mockFlights.find(f => f.id === flightId);
  
  if (!flight) {
    throw new NotFoundError('Flight not found');
  }

  // Add additional details for single flight view
  const detailedFlight = {
    ...flight,
    seatMap: {
      available: true,
      url: `/api/flights/${flightId}/seatmap`
    },
    policies: {
      cancellation: 'Free cancellation up to 24 hours before departure',
      changes: 'Changes allowed with fee',
      baggage: 'Standard baggage policy applies'
    },
    weatherInfo: {
      departure: 'Partly cloudy, 22°C',
      arrival: 'Sunny, 18°C'
    }
  };

  res.json({
    success: true,
    data: { flight: detailedFlight }
  });
}));

// @route   GET /api/flights/popular-destinations
// @desc    Get popular flight destinations
// @access  Private
router.get('/popular-destinations', asyncHandler(async (req, res) => {
  const popularDestinations = [
    {
      city: 'Paris',
      country: 'France',
      airport: 'CDG',
      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52',
      averagePrice: 299,
      description: 'City of Light and Romance',
      trending: true
    },
    {
      city: 'Tokyo',
      country: 'Japan',
      airport: 'NRT',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
      averagePrice: 599,
      description: 'Modern metropolis meets ancient culture',
      trending: true
    },
    {
      city: 'London',
      country: 'United Kingdom',
      airport: 'LHR',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
      averagePrice: 349,
      description: 'Historic charm and modern attractions',
      trending: false
    },
    {
      city: 'Dubai',
      country: 'UAE',
      airport: 'DXB',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
      averagePrice: 449,
      description: 'Luxury and innovation in the desert',
      trending: true
    }
  ];

  res.json({
    success: true,
    data: { destinations: popularDestinations }
  });
}));

module.exports = router;
