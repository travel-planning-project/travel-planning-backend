const express = require('express');
const { query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Mock hotel data
const mockHotels = [
  {
    id: 'HTL001',
    name: 'Grand Plaza Hotel',
    rating: 4.5,
    category: 'luxury',
    address: '123 Main Street, Downtown',
    coordinates: {
      lat: 40.7589,
      lng: -73.9851
    },
    images: [
      'https://example.com/hotel1-1.jpg',
      'https://example.com/hotel1-2.jpg'
    ],
    amenities: [
      'Free WiFi',
      'Swimming Pool',
      'Fitness Center',
      'Restaurant',
      'Room Service',
      'Concierge',
      'Parking'
    ],
    rooms: [
      {
        type: 'Standard Room',
        price: { amount: 150, currency: 'USD' },
        capacity: 2,
        size: '25 sqm',
        amenities: ['King Bed', 'City View', 'Free WiFi']
      },
      {
        type: 'Deluxe Room',
        price: { amount: 220, currency: 'USD' },
        capacity: 3,
        size: '35 sqm',
        amenities: ['King Bed', 'Ocean View', 'Balcony', 'Free WiFi']
      }
    ],
    policies: {
      checkIn: '15:00',
      checkOut: '11:00',
      cancellation: 'Free cancellation until 24 hours before check-in',
      pets: 'Pets allowed with additional fee'
    },
    reviews: {
      average: 4.5,
      total: 1250,
      breakdown: {
        cleanliness: 4.6,
        service: 4.4,
        location: 4.7,
        value: 4.2
      }
    }
  },
  {
    id: 'HTL002',
    name: 'Budget Inn Express',
    rating: 3.8,
    category: 'budget',
    address: '456 Budget Lane, City Center',
    coordinates: {
      lat: 40.7505,
      lng: -73.9934
    },
    images: [
      'https://example.com/hotel2-1.jpg',
      'https://example.com/hotel2-2.jpg'
    ],
    amenities: [
      'Free WiFi',
      'Continental Breakfast',
      '24/7 Front Desk',
      'Laundry Service'
    ],
    rooms: [
      {
        type: 'Economy Room',
        price: { amount: 75, currency: 'USD' },
        capacity: 2,
        size: '18 sqm',
        amenities: ['Queen Bed', 'Free WiFi', 'TV']
      },
      {
        type: 'Family Room',
        price: { amount: 95, currency: 'USD' },
        capacity: 4,
        size: '28 sqm',
        amenities: ['2 Queen Beds', 'Free WiFi', 'TV', 'Mini Fridge']
      }
    ],
    policies: {
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: 'Free cancellation until 48 hours before check-in',
      pets: 'No pets allowed'
    },
    reviews: {
      average: 3.8,
      total: 890,
      breakdown: {
        cleanliness: 3.9,
        service: 3.7,
        location: 4.0,
        value: 4.2
      }
    }
  },
  {
    id: 'HTL003',
    name: 'Boutique Suites',
    rating: 4.8,
    category: 'boutique',
    address: '789 Trendy Avenue, Arts District',
    coordinates: {
      lat: 40.7614,
      lng: -73.9776
    },
    images: [
      'https://example.com/hotel3-1.jpg',
      'https://example.com/hotel3-2.jpg'
    ],
    amenities: [
      'Free WiFi',
      'Rooftop Bar',
      'Spa Services',
      'Business Center',
      'Valet Parking',
      'Pet Friendly'
    ],
    rooms: [
      {
        type: 'Junior Suite',
        price: { amount: 280, currency: 'USD' },
        capacity: 2,
        size: '45 sqm',
        amenities: ['King Bed', 'Living Area', 'City View', 'Kitchenette']
      },
      {
        type: 'Executive Suite',
        price: { amount: 450, currency: 'USD' },
        capacity: 4,
        size: '65 sqm',
        amenities: ['King Bed', 'Separate Living Room', 'Panoramic View', 'Full Kitchen']
      }
    ],
    policies: {
      checkIn: '16:00',
      checkOut: '12:00',
      cancellation: 'Free cancellation until 72 hours before check-in',
      pets: 'Pets welcome with no additional fee'
    },
    reviews: {
      average: 4.8,
      total: 567,
      breakdown: {
        cleanliness: 4.9,
        service: 4.8,
        location: 4.6,
        value: 4.5
      }
    }
  }
];

// @route   GET /api/hotels/search
// @desc    Search for hotels
// @access  Private
router.get('/search', auth, [
  query('destination').notEmpty().withMessage('Destination is required'),
  query('checkIn').isISO8601().withMessage('Valid check-in date is required'),
  query('checkOut').isISO8601().withMessage('Valid check-out date is required'),
  query('guests').optional().isInt({ min: 1, max: 10 }).withMessage('Guests must be between 1 and 10'),
  query('rooms').optional().isInt({ min: 1, max: 5 }).withMessage('Rooms must be between 1 and 5'),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('category').optional().isIn(['budget', 'mid-range', 'luxury', 'boutique'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      destination, 
      checkIn, 
      checkOut, 
      guests = 2, 
      rooms = 1,
      minPrice,
      maxPrice,
      category,
      sortBy = 'price'
    } = req.query;

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    // Calculate number of nights
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Filter hotels based on search criteria
    let hotels = mockHotels.map(hotel => {
      // Calculate total price for the stay
      const roomPrice = hotel.rooms[0].price.amount;
      const totalPrice = roomPrice * nights * parseInt(rooms);
      
      return {
        ...hotel,
        searchResult: {
          nights,
          totalPrice: {
            amount: totalPrice,
            currency: 'USD',
            perNight: roomPrice
          },
          availableRooms: hotel.rooms.filter(room => room.capacity >= parseInt(guests))
        }
      };
    });

    // Apply filters
    if (category) {
      hotels = hotels.filter(hotel => hotel.category === category);
    }

    if (minPrice) {
      hotels = hotels.filter(hotel => hotel.searchResult.totalPrice.amount >= parseFloat(minPrice));
    }

    if (maxPrice) {
      hotels = hotels.filter(hotel => hotel.searchResult.totalPrice.amount <= parseFloat(maxPrice));
    }

    // Sort hotels
    switch (sortBy) {
      case 'price':
        hotels.sort((a, b) => a.searchResult.totalPrice.amount - b.searchResult.totalPrice.amount);
        break;
      case 'rating':
        hotels.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        hotels.sort((a, b) => b.reviews.total - a.reviews.total);
        break;
      default:
        hotels.sort((a, b) => a.searchResult.totalPrice.amount - b.searchResult.totalPrice.amount);
    }

    res.json({
      hotels,
      searchCriteria: {
        destination,
        checkIn,
        checkOut,
        guests: parseInt(guests),
        rooms: parseInt(rooms),
        nights,
        category,
        minPrice,
        maxPrice,
        sortBy
      },
      totalResults: hotels.length,
      message: 'Hotel search completed successfully'
    });
  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({ error: 'Server error searching hotels' });
  }
});

// @route   GET /api/hotels/:id
// @desc    Get hotel details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const hotel = mockHotels.find(h => h.id === req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    // Add additional details for specific hotel
    const detailedHotel = {
      ...hotel,
      description: 'Experience luxury and comfort at our premier hotel location. Perfect for business and leisure travelers.',
      nearbyAttractions: [
        { name: 'Central Park', distance: '0.5 km' },
        { name: 'Times Square', distance: '1.2 km' },
        { name: 'Broadway Theater District', distance: '0.8 km' }
      ],
      transportation: {
        airport: '45 minutes by taxi',
        subway: '2 minutes walk to nearest station',
        parking: 'Valet parking available ($35/night)'
      }
    };

    res.json({
      hotel: detailedHotel,
      message: 'Hotel details retrieved successfully'
    });
  } catch (error) {
    console.error('Get hotel details error:', error);
    res.status(500).json({ error: 'Server error fetching hotel details' });
  }
});

module.exports = router;
