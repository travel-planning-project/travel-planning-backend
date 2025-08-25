const express = require('express');
const { query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Mock transport data
const mockTransportOptions = [
  {
    id: 'BUS001',
    type: 'bus',
    operator: 'Greyhound',
    route: 'New York to Boston',
    departure: {
      location: 'Port Authority Bus Terminal',
      address: '625 8th Ave, New York, NY',
      time: '08:00',
      date: '2024-03-15'
    },
    arrival: {
      location: 'South Station Bus Terminal',
      address: '700 Atlantic Ave, Boston, MA',
      time: '12:30',
      date: '2024-03-15'
    },
    duration: '4h 30m',
    price: {
      amount: 35,
      currency: 'USD'
    },
    amenities: ['WiFi', 'Power Outlets', 'Restroom', 'Air Conditioning'],
    seatsAvailable: 15,
    class: 'Standard'
  },
  {
    id: 'TRAIN001',
    type: 'train',
    operator: 'Amtrak',
    route: 'New York to Boston',
    departure: {
      location: 'Penn Station',
      address: '4 Pennsylvania Plaza, New York, NY',
      time: '09:15',
      date: '2024-03-15'
    },
    arrival: {
      location: 'South Station',
      address: '700 Atlantic Ave, Boston, MA',
      time: '13:45',
      date: '2024-03-15'
    },
    duration: '4h 30m',
    price: {
      amount: 89,
      currency: 'USD'
    },
    amenities: ['WiFi', 'Power Outlets', 'Cafe Car', 'Large Seats'],
    seatsAvailable: 8,
    class: 'Coach'
  },
  {
    id: 'METRO001',
    type: 'metro',
    operator: 'MTA',
    route: 'Times Square to Central Park',
    departure: {
      location: 'Times Square - 42nd St Station',
      address: 'Times Square, New York, NY',
      time: '10:00',
      date: '2024-03-15'
    },
    arrival: {
      location: '59th St - Columbus Circle',
      address: '59th St & Broadway, New York, NY',
      time: '10:15',
      date: '2024-03-15'
    },
    duration: '15m',
    price: {
      amount: 2.90,
      currency: 'USD'
    },
    amenities: ['Air Conditioning'],
    frequency: 'Every 4-6 minutes',
    line: 'A, C, D Lines'
  }
];

// @route   GET /api/transport/search
// @desc    Search for transport options
// @access  Private
router.get('/search', auth, [
  query('origin').notEmpty().withMessage('Origin is required'),
  query('destination').notEmpty().withMessage('Destination is required'),
  query('date').isISO8601().withMessage('Valid date is required'),
  query('type').optional().isIn(['bus', 'train', 'metro', 'taxi', 'rideshare']),
  query('passengers').optional().isInt({ min: 1, max: 10 }).withMessage('Passengers must be between 1 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      origin, 
      destination, 
      date, 
      type,
      passengers = 1,
      sortBy = 'price'
    } = req.query;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));

    // Filter transport options based on search criteria
    let transportOptions = mockTransportOptions.map(option => ({
      ...option,
      departure: {
        ...option.departure,
        date
      },
      arrival: {
        ...option.arrival,
        date
      },
      totalPrice: {
        amount: option.price.amount * parseInt(passengers),
        currency: option.price.currency,
        perPerson: option.price.amount
      }
    }));

    if (type) {
      transportOptions = transportOptions.filter(option => option.type === type);
    }

    // Sort transport options
    switch (sortBy) {
      case 'price':
        transportOptions.sort((a, b) => a.price.amount - b.price.amount);
        break;
      case 'duration':
        transportOptions.sort((a, b) => {
          const aDuration = parseInt(a.duration.replace(/[^\d]/g, ''));
          const bDuration = parseInt(b.duration.replace(/[^\d]/g, ''));
          return aDuration - bDuration;
        });
        break;
      case 'departure':
        transportOptions.sort((a, b) => a.departure.time.localeCompare(b.departure.time));
        break;
      default:
        transportOptions.sort((a, b) => a.price.amount - b.price.amount);
    }

    res.json({
      transportOptions,
      searchCriteria: {
        origin,
        destination,
        date,
        type,
        passengers: parseInt(passengers),
        sortBy
      },
      totalResults: transportOptions.length,
      message: 'Transport search completed successfully'
    });
  } catch (error) {
    console.error('Transport search error:', error);
    res.status(500).json({ error: 'Server error searching transport options' });
  }
});

// @route   GET /api/transport/:id
// @desc    Get transport option details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const transport = mockTransportOptions.find(t => t.id === req.params.id);
    
    if (!transport) {
      return res.status(404).json({ error: 'Transport option not found' });
    }

    // Add additional details for specific transport option
    const detailedTransport = {
      ...transport,
      policies: {
        cancellation: 'Free cancellation up to 24 hours before departure',
        changes: 'Changes allowed with fee',
        baggage: transport.type === 'bus' ? 'One carry-on and one checked bag included' : 'Standard baggage allowance'
      },
      accessibility: {
        wheelchairAccessible: true,
        assistanceAvailable: true
      },
      bookingInfo: {
        confirmationRequired: true,
        eTicketAvailable: true,
        mobileTicket: true
      }
    };

    res.json({
      transport: detailedTransport,
      message: 'Transport details retrieved successfully'
    });
  } catch (error) {
    console.error('Get transport details error:', error);
    res.status(500).json({ error: 'Server error fetching transport details' });
  }
});

// @route   GET /api/transport/local/:city
// @desc    Get local transport information for a city
// @access  Private
router.get('/local/:city', auth, async (req, res) => {
  try {
    const { city } = req.params;

    // Mock local transport data
    const localTransport = {
      city,
      publicTransport: {
        metro: {
          available: true,
          lines: ['Red Line', 'Blue Line', 'Green Line'],
          ticketPrice: { amount: 2.90, currency: 'USD' },
          operatingHours: '05:00 - 01:00',
          frequency: 'Every 4-8 minutes'
        },
        bus: {
          available: true,
          routes: 200,
          ticketPrice: { amount: 2.90, currency: 'USD' },
          operatingHours: '24/7 on major routes',
          frequency: 'Every 10-20 minutes'
        },
        tram: {
          available: false
        }
      },
      rideshare: {
        uber: {
          available: true,
          estimatedWaitTime: '3-8 minutes',
          basePrice: { amount: 8, currency: 'USD' }
        },
        lyft: {
          available: true,
          estimatedWaitTime: '4-10 minutes',
          basePrice: { amount: 7.50, currency: 'USD' }
        }
      },
      taxi: {
        available: true,
        basePrice: { amount: 3.50, currency: 'USD' },
        perMile: { amount: 2.50, currency: 'USD' },
        estimatedWaitTime: '5-15 minutes'
      },
      bikeShare: {
        available: true,
        provider: 'Citi Bike',
        stations: 750,
        pricing: {
          singleRide: { amount: 4.95, currency: 'USD' },
          dayPass: { amount: 15, currency: 'USD' }
        }
      },
      walkability: {
        score: 85,
        description: 'Very walkable - most errands can be accomplished on foot'
      }
    };

    res.json({
      localTransport,
      message: 'Local transport information retrieved successfully'
    });
  } catch (error) {
    console.error('Get local transport error:', error);
    res.status(500).json({ error: 'Server error fetching local transport information' });
  }
});

// @route   GET /api/transport/routes
// @desc    Get route directions between two points
// @access  Private
router.get('/routes', auth, [
  query('origin').notEmpty().withMessage('Origin is required'),
  query('destination').notEmpty().withMessage('Destination is required'),
  query('mode').optional().isIn(['driving', 'walking', 'transit', 'bicycling'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { origin, destination, mode = 'driving' } = req.query;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock route data
    const route = {
      origin,
      destination,
      mode,
      distance: {
        text: '5.2 km',
        value: 5200
      },
      duration: {
        text: mode === 'walking' ? '1 hour 5 mins' : '15 mins',
        value: mode === 'walking' ? 3900 : 900
      },
      steps: [
        {
          instruction: `Head ${mode === 'walking' ? 'north' : 'northeast'} on Main St`,
          distance: '0.5 km',
          duration: '2 mins'
        },
        {
          instruction: 'Turn right onto Broadway',
          distance: '1.2 km',
          duration: '4 mins'
        },
        {
          instruction: 'Continue straight for 2.5 km',
          distance: '2.5 km',
          duration: '7 mins'
        },
        {
          instruction: 'Turn left onto Destination Ave',
          distance: '1.0 km',
          duration: '2 mins'
        }
      ],
      polyline: 'mock_encoded_polyline_string',
      warnings: mode === 'bicycling' ? ['Use caution on busy streets'] : [],
      tolls: mode === 'driving' ? { amount: 0, currency: 'USD' } : null
    };

    res.json({
      route,
      message: 'Route directions retrieved successfully'
    });
  } catch (error) {
    console.error('Get route directions error:', error);
    res.status(500).json({ error: 'Server error fetching route directions' });
  }
});

module.exports = router;
