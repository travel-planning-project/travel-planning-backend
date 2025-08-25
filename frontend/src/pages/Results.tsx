import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plane, 
  Building, 
  Star, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface SearchParams {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  budget: string;
}

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    destination: '',
    startDate: '',
    endDate: '',
    travelers: '2',
    budget: ''
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    setSearchParams({
      destination: urlParams.get('destination') || '',
      startDate: urlParams.get('startDate') || '',
      endDate: urlParams.get('endDate') || '',
      travelers: urlParams.get('travelers') || '2',
      budget: urlParams.get('budget') || ''
    });
  }, [location.search]);

  const mockFlights = [
    {
      id: 1,
      airline: 'SkyWings Airlines',
      departure: '08:30',
      arrival: '14:45',
      duration: '6h 15m',
      price: 299,
      stops: 'Direct',
      rating: 4.8,
      availability: 15,
      availabilityStatus: 'available',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=250&fit=crop',
      aircraft: 'Boeing 737-800',
      amenities: ['WiFi', 'Entertainment', 'Meals']
    },
    {
      id: 2,
      airline: 'CloudJet Express',
      departure: '12:15',
      arrival: '19:30',
      duration: '7h 15m',
      price: 249,
      stops: '1 Stop',
      rating: 4.6,
      availability: 22,
      availabilityStatus: 'available',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop',
      aircraft: 'Airbus A320',
      amenities: ['WiFi', 'Snacks', 'Entertainment']
    },
    {
      id: 3,
      airline: 'AeroFly International',
      departure: '16:45',
      arrival: '23:20',
      duration: '6h 35m',
      price: 329,
      stops: 'Direct',
      rating: 4.9,
      availability: 3,
      availabilityStatus: 'few-left',
      image: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=400&h=250&fit=crop',
      aircraft: 'Boeing 787-9',
      amenities: ['WiFi', 'Premium Meals', 'Lie-flat Seats']
    }
  ];

  const mockHotels = [
    {
      id: 1,
      name: 'Grand Paradise Resort',
      rating: 4.8,
      price: 189,
      image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=250&fit=crop',
      amenities: ['Pool', 'Spa', 'WiFi', 'Breakfast'],
      location: 'City Center',
      availability: 12,
      availabilityStatus: 'available',
      description: 'Luxury beachfront resort with world-class amenities'
    },
    {
      id: 2,
      name: 'Urban Luxury Suites',
      rating: 4.6,
      price: 149,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
      amenities: ['Gym', 'WiFi', 'Restaurant', 'Parking'],
      location: 'Business District',
      availability: 6,
      availabilityStatus: 'limited',
      description: 'Modern suites in the heart of the business district'
    },
    {
      id: 3,
      name: 'Seaside Boutique Hotel',
      rating: 4.9,
      price: 229,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=250&fit=crop',
      amenities: ['Beach Access', 'Spa', 'Pool', 'WiFi'],
      location: 'Beachfront',
      availability: 18,
      availabilityStatus: 'available',
      description: 'Charming boutique hotel with stunning ocean views'
    }
  ];

  return (
    <div className="results-page">
      <div className="results-container">
        {/* Navigation Header */}
        <div className="results-navigation">
          <button 
            onClick={() => navigate('/')} 
            className="back-button"
            aria-label="Go back to search"
          >
            <ArrowLeft className="back-icon" />
            <span>Back to Search</span>
          </button>
          <div className="breadcrumb">
            <span className="breadcrumb-item">Home</span>
            <ArrowRight className="breadcrumb-arrow" />
            <span className="breadcrumb-item current">Search Results</span>
          </div>
        </div>

        {/* Search Summary */}
        <div className="search-summary">
          <div className="search-summary-content">
            <h1 className="page-title">🔍 Search Results</h1>
            <div className="search-details">
              <span className="search-detail">📍 {searchParams.destination}</span>
              <span className="search-detail">📅 {searchParams.startDate} - {searchParams.endDate}</span>
              <span className="search-detail">👥 {searchParams.travelers} travelers</span>
              {searchParams.budget && <span className="search-detail">💰 ${searchParams.budget}</span>}
            </div>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="modify-search-button"
            aria-label="Modify search criteria"
          >
            Modify Search
          </button>
        </div>

        {/* Flights Section */}
        <div className="results-section">
          <h2 className="section-title">✈️ Available Flights</h2>
          <div className="results-grid">
            {mockFlights.map((flight) => (
              <div key={flight.id} className="result-card flight-card">
                <div className="card-image">
                  <img src={flight.image} alt={flight.airline} className="result-image" />
                  <div className="card-overlay">
                    <span className="aircraft-type">{flight.aircraft}</span>
                  </div>
                </div>
                <div className="card-content">
                  <div className="flight-header">
                    <h4 className="flight-airline">{flight.airline}</h4>
                    <div className="flight-rating">
                      <Star className="star-icon" />
                      <span>{flight.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flight-details">
                    <div className="flight-time">
                      <div className="time-block">
                        <span className="time">{flight.departure}</span>
                        <span className="label">Departure</span>
                      </div>
                      <div className="flight-duration">
                        <ArrowRight className="arrow-icon" />
                        <span>{flight.duration}</span>
                      </div>
                      <div className="time-block">
                        <span className="time">{flight.arrival}</span>
                        <span className="label">Arrival</span>
                      </div>
                    </div>
                    
                    <div className="flight-meta">
                      <span className="stops">{flight.stops}</span>
                    </div>
                  </div>
                  
                  <div className="flight-booking">
                    <div className="price-section">
                      <span className="price">${flight.price}</span>
                      <span className="price-label">per person</span>
                    </div>
                    <div className="availability-section">
                      <div className={`availability-status ${flight.availabilityStatus}`}>
                        <span className="availability-dot"></span>
                        <span className="availability-text">
                          {flight.availability} seats available
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hotels Section */}
        <div className="results-section">
          <h2 className="section-title">🏨 Available Hotels</h2>
          <div className="results-grid">
            {mockHotels.map((hotel) => (
              <div key={hotel.id} className="result-card hotel-card">
                <div className="card-image">
                  <img src={hotel.image} alt={hotel.name} className="result-image" />
                  <div className="card-overlay">
                    <span className="hotel-location">{hotel.location}</span>
                  </div>
                </div>
                <div className="card-content">
                  <div className="hotel-header">
                    <h4 className="hotel-name">{hotel.name}</h4>
                    <div className="hotel-rating">
                      <Star className="star-icon" />
                      <span>{hotel.rating}</span>
                    </div>
                  </div>
                  
                  <div className="hotel-details">
                    <div className="price-section">
                      <span className="price">${hotel.price}</span>
                      <span className="price-label">per night</span>
                    </div>
                    <div className="availability-section">
                      <div className={`availability-status ${hotel.availabilityStatus}`}>
                        <span className="availability-dot"></span>
                        <span className="availability-text">
                          {hotel.availability} rooms available
                        </span>
                      </div>
                    </div>
                    <div className="hotel-description">
                      <p>{hotel.description}</p>
                    </div>
                    <div className="amenities-list">
                      {hotel.amenities.map((amenity, index) => (
                        <span key={index} className="amenity-tag">{amenity}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
