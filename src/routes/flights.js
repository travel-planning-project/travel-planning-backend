const express = require('express');
const { query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Mock flight data
const mockFlights = [
  {
    id: 'FL001',
    airline: 'Emirates',
    flightNumber: 'EK215',
    departure: {
      airport: 'JFK',
      city: 'New York',
      time: '14:30',
      date: '2024-03-15'
    },
    arrival: {
      airport: 'DXB',
      city: 'Dubai',
      time: '23:45',
      date: '2024-03-16'
    },
    duration: '13h 15m',
    stops: 0,
    price: {
      amount: 1250,
      currency: 'USD'
    },
    class: 'Economy',
    availableSeats: 15,
    baggage: {
      carry: '7kg',
      checked: '23kg'
    }
  },
  {
    id: 'FL002',
    airline: 'Qatar Airways',
    flightNumber: 'QR701',
    departure: {
      airport: 'JFK',
      city: 'New York',
      time: '22:15',
      date: '2024-03-15'
    },
    arrival: {
      airport: 'DOH',
      city: 'Doha',
      time: '18:30',
      date: '2024-03-16'
    },
    duration: '12h 15m',
    stops: 0,
    price: {
      amount: 1180,
      currency: 'USD'
    },
    class: 'Economy',
    availableSeats: 8,
    baggage: {
      carry: '7kg',
      checked: '30kg'
    }
  },
  {
    id: 'FL003',
    airline: 'Lufthansa',
    flightNumber: 'LH441',
    departure: {
      airport: 'JFK',
      city: 'New York',
      time: '19:45',
      date: '2024-03-15'
    },
    arrival: {
      airport: 'FRA',
      city: 'Frankfurt',
      time: '08:30',
      date: '2024-03-16'
    },
    duration: '7h 45m',
    stops: 0,
    price: {
      amount: 950,
      currency: 'USD'
    },
    class: 'Economy',
    availableSeats: 22,
    baggage: {
      carry: '8kg',
      checked: '23kg'
    }
  }
];

// @route   GET /api/flights/search
// @desc    Search for flights
// @access  Private
router.get('/search', auth, [
  query('origin').notEmpty().withMessage('Origin is required'),
  query('destination').notEmpty().withMessage('Destination is required'),
  query('departureDate').isISO8601().withMessage('Valid departure date is required'),
  query('returnDate').optional().isISO8601().withMessage('Valid return date required if provided'),
  query('passengers').optional().isInt({ min: 1, max: 9 }).withMessage('Passengers must be between 1 and 9'),
  query('class').optional().isIn(['Economy', 'Premium Economy', 'Business', 'First'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate, 
      passengers = 1, 
      class: flightClass = 'Economy' 
    } = req.query;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Filter and modify mock data based on search criteria
    let flights = mockFlights.map(flight => ({
      ...flight,
      departure: {
        ...flight.departure,
        date: departureDate
      },
      price: {
        ...flight.price,
        amount: flight.price.amount * passengers
      },
      class: flightClass,
      searchCriteria: {
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        class: flightClass
      }
    }));

    // Sort by price
    flights.sort((a, b) => a.price.amount - b.price.amount);

    res.json({
      flights,
      searchCriteria: {
        origin,
        destination,
        departureDate,
        returnDate,
        passengers: parseInt(passengers),
        class: flightClass
      },
      totalResults: flights.length,
      message: 'Flight search completed successfully'
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({ error: 'Server error searching flights' });
  }
});

// @route   GET /api/flights/:id
// @desc    Get flight details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const flight = mockFlights.find(f => f.id === req.params.id);
    
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    // Add additional details for specific flight
    const detailedFlight = {
      ...flight,
      aircraft: {
        type: 'Boeing 777-300ER',
        configuration: '3-4-3',
        wifi: true,
        entertainment: true
      },
      amenities: [
        'In-flight entertainment',
        'Complimentary meals',
        'Wi-Fi available',
        'Power outlets'
      ],
      policies: {
        cancellation: 'Free cancellation within 24 hours',
        changes: 'Changes allowed with fee',
        refund: 'Refundable with conditions'
      }
    };

    res.json({
      flight: detailedFlight,
      message: 'Flight details retrieved successfully'
    });
  } catch (error) {
    console.error('Get flight details error:', error);
    res.status(500).json({ error: 'Server error fetching flight details' });
  }
});

// @route   GET /api/flights/airports/search
// @desc    Search airports by city or code
// @access  Private
router.get('/airports/search', auth, [
  query('query').notEmpty().withMessage('Search query is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { query: searchQuery } = req.query;

    // Mock airport data
    const airports = [
      { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
      { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
      { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'UK' },
      { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
      { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
      { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' },
      { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
      { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
      { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
      { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar' }
    ];

    // Filter airports based on search query
    const filteredAirports = airports.filter(airport => 
      airport.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airport.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    res.json({
      airports: filteredAirports,
      query: searchQuery,
      totalResults: filteredAirports.length
    });
  } catch (error) {
    console.error('Airport search error:', error);
    res.status(500).json({ error: 'Server error searching airports' });
  }
});

module.exports = router;
