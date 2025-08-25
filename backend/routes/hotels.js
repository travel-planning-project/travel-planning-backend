const express = require('express');
const { query, validationResult } = require('express-validator');
const { asyncHandler, ValidationError, NotFoundError, APIError } = require('../middleware/errorHandler');

const router = express.Router();

// Mock hotel data for development
const mockHotels = [
  {
    id: 'HTL001',
    name: 'Grand Paradise Resort',
    description: 'Luxury beachfront resort with world-class amenities and stunning ocean views',
    category: 'Resort',
    starRating: 5,
    location: {
      address: '123 Paradise Beach, Cancun',
      city: 'Cancun',
      country: 'Mexico',
      coordinates: {
        latitude: 21.1619,
        longitude: -86.8515
      },
      neighborhood: 'Hotel Zone',
      distanceFromCenter: '2.5 km',
      nearbyAttractions: ['Chichen Itza', 'Xcaret Park', 'Tulum Ruins']
    },
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
    ],
    amenities: [
      'Free WiFi', 'Swimming Pool', 'Spa', 'Fitness Center', 
      'Restaurant', 'Bar', 'Room Service', 'Concierge',
      'Beach Access', 'Water Sports', 'Kids Club', 'Parking'
    ],
    roomTypes: [
      {
        type: 'Standard Ocean View',
        size: '35 sqm',
        occupancy: 2,
        beds: '1 King Bed',
        price: 189,
        amenities: ['Ocean View', 'Balcony', 'Mini Bar', 'Safe']
      },
      {
        type: 'Junior Suite',
        size: '55 sqm',
        occupancy: 4,
        beds: '1 King Bed + Sofa Bed',
        price: 289,
        amenities: ['Ocean View', 'Separate Living Area', 'Jacuzzi', 'Butler Service']
      },
      {
        type: 'Presidential Suite',
        size: '120 sqm',
        occupancy: 6,
        beds: '2 King Beds',
        price: 599,
        amenities: ['Panoramic Ocean View', 'Private Terrace', 'Personal Chef', 'Limousine Service']
      }
    ],
    policies: {
      checkIn: '15:00',
      checkOut: '11:00',
      cancellation: 'Free cancellation up to 48 hours before arrival',
      pets: 'Pets not allowed',
      smoking: 'Non-smoking property'
    },
    rating: {
      overall: 4.8,
      cleanliness: 4.9,
      service: 4.8,
      location: 4.7,
      value: 4.6,
      reviewCount: 1247
    },
    contact: {
      phone: '+52 998 123 4567',
      email: 'reservations@grandparadise.com',
      website: 'https://grandparadise.com'
    }
  },
  {
    id: 'HTL002',
    name: 'Urban Luxury Suites',
    description: 'Modern boutique hotel in the heart of the business district',
    category: 'Business Hotel',
    starRating: 4,
    location: {
      address: '456 Business Ave, Downtown',
      city: 'New York',
      country: 'USA',
      coordinates: {
        latitude: 40.7589,
        longitude: -73.9851
      },
      neighborhood: 'Midtown Manhattan',
      distanceFromCenter: '0.5 km',
      nearbyAttractions: ['Times Square', 'Central Park', 'Broadway Theater District']
    },
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461'
    ],
    amenities: [
      'Free WiFi', 'Fitness Center', 'Business Center', 'Restaurant',
      'Bar', 'Room Service', 'Concierge', 'Laundry Service',
      'Meeting Rooms', 'Airport Shuttle', 'Valet Parking'
    ],
    roomTypes: [
      {
        type: 'Executive Room',
        size: '28 sqm',
        occupancy: 2,
        beds: '1 Queen Bed',
        price: 149,
        amenities: ['City View', 'Work Desk', 'Coffee Machine', 'Safe']
      },
      {
        type: 'Business Suite',
        size: '45 sqm',
        occupancy: 3,
        beds: '1 King Bed + Sofa',
        price: 229,
        amenities: ['Skyline View', 'Separate Work Area', 'Kitchenette', 'Executive Lounge Access']
      }
    ],
    policies: {
      checkIn: '15:00',
      checkOut: '12:00',
      cancellation: 'Free cancellation up to 24 hours before arrival',
      pets: 'Small pets allowed with fee',
      smoking: 'Designated smoking areas'
    },
    rating: {
      overall: 4.6,
      cleanliness: 4.7,
      service: 4.6,
      location: 4.9,
      value: 4.4,
      reviewCount: 892
    },
    contact: {
      phone: '+1 212 555 0123',
      email: 'reservations@urbanluxury.com',
      website: 'https://urbanluxury.com'
    }
  },
  {
    id: 'HTL003',
    name: 'Seaside Boutique Hotel',
    description: 'Charming coastal retreat with personalized service and stunning sea views',
    category: 'Boutique Hotel',
    starRating: 4,
    location: {
      address: '789 Coastal Road, Santorini',
      city: 'Santorini',
      country: 'Greece',
      coordinates: {
        latitude: 36.3932,
        longitude: 25.4615
      },
      neighborhood: 'Oia',
      distanceFromCenter: '1.2 km',
      nearbyAttractions: ['Oia Sunset Point', 'Red Beach', 'Ancient Thera']
    },
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7'
    ],
    amenities: [
      'Free WiFi', 'Infinity Pool', 'Spa', 'Restaurant',
      'Beach Access', 'Sunset Terrace', 'Wine Cellar',
      'Yoga Classes', 'Boat Tours', 'Private Beach'
    ],
    roomTypes: [
      {
        type: 'Sea View Room',
        size: '32 sqm',
        occupancy: 2,
        beds: '1 King Bed',
        price: 229,
        amenities: ['Sea View', 'Private Balcony', 'Marble Bathroom', 'Welcome Champagne']
      },
      {
        type: 'Honeymoon Suite',
        size: '65 sqm',
        occupancy: 2,
        beds: '1 King Bed',
        price: 399,
        amenities: ['Panoramic Sea View', 'Private Hot Tub', 'Romantic Decoration', 'Butler Service']
      }
    ],
    policies: {
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: 'Free cancellation up to 72 hours before arrival',
      pets: 'Pets not allowed',
      smoking: 'Non-smoking property'
    },
    rating: {
      overall: 4.9,
      cleanliness: 4.9,
      service: 5.0,
      location: 4.8,
      value: 4.7,
      reviewCount: 456
    },
    contact: {
      phone: '+30 22860 71234',
      email: 'info@seasideboutique.gr',
      website: 'https://seasideboutique.gr'
    }
  }
];

// Validation rules
const searchHotelsValidation = [
  query('destination').notEmpty().withMessage('Destination is required'),
  query('checkIn').isISO8601().withMessage('Valid check-in date is required'),
  query('checkOut').isISO8601().withMessage('Valid check-out date is required'),
  query('guests').optional().isInt({ min: 1, max: 10 }).withMessage('Guests must be between 1 and 10'),
  query('rooms').optional().isInt({ min: 1, max: 5 }).withMessage('Rooms must be between 1 and 5'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
  query('starRating').optional().isInt({ min: 1, max: 5 }).withMessage('Star rating must be between 1 and 5'),
  query('amenities').optional().isString().withMessage('Amenities must be a string'),
  query('sortBy').optional().isIn(['price', 'rating', 'distance', 'popularity']).withMessage('Invalid sort option')
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

// Helper function to filter hotels
const filterHotels = (hotels, query) => {
  let filtered = [...hotels];

  // Filter by price range
  if (query.minPrice || query.maxPrice) {
    filtered = filtered.filter(hotel => {
      const lowestPrice = Math.min(...hotel.roomTypes.map(room => room.price));
      if (query.minPrice && lowestPrice < parseFloat(query.minPrice)) return false;
      if (query.maxPrice && lowestPrice > parseFloat(query.maxPrice)) return false;
      return true;
    });
  }

  // Filter by star rating
  if (query.starRating) {
    const minStars = parseInt(query.starRating);
    filtered = filtered.filter(hotel => hotel.starRating >= minStars);
  }

  // Filter by amenities
  if (query.amenities) {
    const requiredAmenities = query.amenities.split(',').map(a => a.trim().toLowerCase());
    filtered = filtered.filter(hotel => 
      requiredAmenities.every(amenity => 
        hotel.amenities.some(hotelAmenity => 
          hotelAmenity.toLowerCase().includes(amenity)
        )
      )
    );
  }

  return filtered;
};

// Helper function to sort hotels
const sortHotels = (hotels, sortBy) => {
  const sorted = [...hotels];

  switch (sortBy) {
    case 'price':
      return sorted.sort((a, b) => {
        const aPrice = Math.min(...a.roomTypes.map(room => room.price));
        const bPrice = Math.min(...b.roomTypes.map(room => room.price));
        return aPrice - bPrice;
      });
    case 'rating':
      return sorted.sort((a, b) => b.rating.overall - a.rating.overall);
    case 'distance':
      return sorted.sort((a, b) => 
        parseFloat(a.location.distanceFromCenter) - parseFloat(b.location.distanceFromCenter)
      );
    case 'popularity':
      return sorted.sort((a, b) => b.rating.reviewCount - a.rating.reviewCount);
    default:
      return sorted;
  }
};

// @route   GET /api/hotels/search
// @desc    Search for hotels
// @access  Private
router.get('/search', searchHotelsValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const {
    destination,
    checkIn,
    checkOut,
    guests = 2,
    rooms = 1,
    sortBy = 'popularity'
  } = req.query;

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Filter and sort hotels
    let hotels = filterHotels(mockHotels, req.query);
    hotels = sortHotels(hotels, sortBy);

    // Calculate nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    // Add search metadata and pricing
    const searchResults = {
      searchId: `hotel_search_${Date.now()}`,
      destination,
      checkIn,
      checkOut,
      nights,
      guests: parseInt(guests),
      rooms: parseInt(rooms),
      currency: 'USD',
      searchTime: new Date().toISOString(),
      totalResults: hotels.length,
      hotels: hotels.map(hotel => ({
        ...hotel,
        lowestPrice: Math.min(...hotel.roomTypes.map(room => room.price)),
        totalPrice: Math.min(...hotel.roomTypes.map(room => room.price)) * nights,
        availableRooms: hotel.roomTypes.filter(room => room.occupancy >= guests),
        bookingUrl: `/api/hotels/${hotel.id}/book`,
        deepLink: `https://hotel-booking.com/book/${hotel.id}`
      }))
    };

    res.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    throw new APIError('Hotel search service temporarily unavailable', 503, 'HotelAPI');
  }
}));

// @route   GET /api/hotels/:id
// @desc    Get hotel details
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const hotelId = req.params.id;
  
  const hotel = mockHotels.find(h => h.id === hotelId);
  
  if (!hotel) {
    throw new NotFoundError('Hotel not found');
  }

  // Add additional details for single hotel view
  const detailedHotel = {
    ...hotel,
    reviews: [
      {
        id: 1,
        author: 'Sarah Johnson',
        rating: 5,
        date: '2024-02-15',
        comment: 'Absolutely amazing stay! The staff was incredibly friendly and the views were breathtaking.',
        helpful: 12
      },
      {
        id: 2,
        author: 'Mike Chen',
        rating: 4,
        date: '2024-02-10',
        comment: 'Great location and clean rooms. The breakfast could be better but overall excellent value.',
        helpful: 8
      }
    ],
    nearbyRestaurants: [
      { name: 'Ocean Breeze Restaurant', distance: '0.2 km', rating: 4.5 },
      { name: 'Local Taverna', distance: '0.5 km', rating: 4.3 }
    ],
    transportation: {
      airport: '25 minutes by car',
      publicTransport: 'Bus stop 200m away',
      parking: 'Free on-site parking available'
    }
  };

  res.json({
    success: true,
    data: { hotel: detailedHotel }
  });
}));

// @route   GET /api/hotels/popular-destinations
// @desc    Get popular hotel destinations
// @access  Private
router.get('/popular-destinations', asyncHandler(async (req, res) => {
  const popularDestinations = [
    {
      city: 'Paris',
      country: 'France',
      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52',
      averagePrice: 189,
      hotelCount: 1247,
      description: 'Romantic city with world-class hotels',
      trending: true
    },
    {
      city: 'Santorini',
      country: 'Greece',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff',
      averagePrice: 229,
      hotelCount: 456,
      description: 'Stunning island getaway with luxury resorts',
      trending: true
    },
    {
      city: 'Dubai',
      country: 'UAE',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
      averagePrice: 299,
      hotelCount: 892,
      description: 'Luxury hotels in a modern oasis',
      trending: false
    },
    {
      city: 'Bali',
      country: 'Indonesia',
      image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1',
      averagePrice: 149,
      hotelCount: 678,
      description: 'Tropical paradise with boutique resorts',
      trending: true
    }
  ];

  res.json({
    success: true,
    data: { destinations: popularDestinations }
  });
}));

module.exports = router;
