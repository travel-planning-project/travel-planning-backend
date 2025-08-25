import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tripApi } from '../services/api';
import { 
  PlusIcon, 
  MapPinIcon, 
  CalendarDaysIcon, 
  UsersIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';

interface Trip {
  _id: string;
  destination: {
    city: string;
    country: string;
  };
  dates: {
    startDate: string;
    endDate: string;
  };
  travelers: {
    adults: number;
    children: number;
  };
  budget: {
    total: number;
    currency: string;
  };
  status: string;
  createdAt: string;
}

const Trips: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await tripApi.getTrips();
      setTrips(response.data.trips);
    } catch (err: any) {
      setError('Failed to load trips');
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 animate-fade-in">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ✈️ My Trips
            </h1>
            <p className="text-xl text-gray-600">Manage and track all your amazing travel adventures 🌍</p>
          </div>
          <Link
            to="/trips/new"
            className="btn-primary flex items-center space-x-3 mt-6 md:mt-0 text-lg px-8 py-4 transform hover:scale-105 transition-all duration-300"
          >
            <PlusIcon className="h-6 w-6" />
            <span>🎯 Plan New Trip</span>
          </Link>
        </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {trips.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="icon-container w-32 h-32 mx-auto mb-8 floating">
            <MapPinIcon className="h-16 w-16 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">🌟 No trips yet</h3>
          <p className="text-xl text-gray-600 mb-10 max-w-md mx-auto">
            Ready to explore the world? Start planning your next amazing adventure! 🗺️
          </p>
          <Link
            to="/trips/new"
            className="btn-primary text-lg px-10 py-4 transform hover:scale-105 transition-all duration-300"
          >
            🚀 Plan Your First Trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trips.map((trip, index) => (
            <div key={trip._id} className="card p-8 hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    🏖️ {trip.destination.city}, {trip.destination.country}
                  </h3>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(trip.status)}`}>
                    ✨ {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-xl">
                  <CalendarDaysIcon className="h-5 w-5 mr-3 text-purple-600" />
                  <span className="font-medium">
                    📅 {formatDate(trip.dates.startDate)} - {formatDate(trip.dates.endDate)}
                  </span>
                </div>

                <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-xl">
                  <UsersIcon className="h-5 w-5 mr-3 text-blue-600" />
                  <span className="font-medium">
                    👥 {trip.travelers.adults + trip.travelers.children} travelers
                  </span>
                </div>

                <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-xl">
                  <CurrencyDollarIcon className="h-5 w-5 mr-3 text-green-600" />
                  <span className="font-medium">
                    💰 {trip.budget.currency} {trip.budget.total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-8 flex space-x-3">
                <Link
                  to={`/trips/${trip._id}`}
                  className="flex-1 text-center btn-primary text-sm py-3 font-semibold"
                >
                  👀 View Details
                </Link>
                <Link
                  to={`/trips/${trip._id}/edit`}
                  className="flex-1 text-center btn-secondary text-sm py-3 font-semibold"
                >
                  ✏️ Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Trips;
