import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Camera, 
  Utensils, 
  Car, 
  Plane,
  Plus,
  Edit3,
  Trash2,
  Star,
  Heart,
  Share2
} from 'lucide-react';

interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  type: 'flight' | 'hotel' | 'activity' | 'restaurant' | 'transport';
  duration: string;
  cost?: number;
  notes?: string;
}

interface DayPlan {
  date: string;
  day: string;
  items: ItineraryItem[];
}

const Itinerary: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const mockItinerary: DayPlan[] = [
    {
      date: '2024-03-15',
      day: 'Day 1',
      items: [
        {
          id: '1',
          time: '08:00',
          title: 'Flight Departure',
          description: 'Flight to Paris with SkyWings Airlines',
          location: 'JFK Airport, New York',
          type: 'flight',
          duration: '8h 30m',
          cost: 299
        },
        {
          id: '2',
          time: '18:30',
          title: 'Hotel Check-in',
          description: 'Check into Grand Paradise Resort',
          location: 'Champs-Élysées, Paris',
          type: 'hotel',
          duration: '30m',
          cost: 189
        },
        {
          id: '3',
          time: '20:00',
          title: 'Welcome Dinner',
          description: 'Traditional French cuisine at Le Petit Bistro',
          location: 'Latin Quarter, Paris',
          type: 'restaurant',
          duration: '2h',
          cost: 85
        }
      ]
    },
    {
      date: '2024-03-16',
      day: 'Day 2',
      items: [
        {
          id: '4',
          time: '09:00',
          title: 'Eiffel Tower Visit',
          description: 'Iconic landmark with panoramic city views',
          location: 'Champ de Mars, Paris',
          type: 'activity',
          duration: '3h',
          cost: 25
        },
        {
          id: '5',
          time: '13:00',
          title: 'Seine River Cruise',
          description: 'Scenic boat tour along the Seine',
          location: 'Port de la Bourdonnais',
          type: 'activity',
          duration: '1h 30m',
          cost: 15
        },
        {
          id: '6',
          time: '15:30',
          title: 'Louvre Museum',
          description: 'World-famous art museum and gallery',
          location: 'Rue de Rivoli, Paris',
          type: 'activity',
          duration: '4h',
          cost: 17
        }
      ]
    },
    {
      date: '2024-03-17',
      day: 'Day 3',
      items: [
        {
          id: '7',
          time: '10:00',
          title: 'Montmartre District',
          description: 'Explore artistic neighborhood and Sacré-Cœur',
          location: 'Montmartre, Paris',
          type: 'activity',
          duration: '4h',
          cost: 0
        },
        {
          id: '8',
          time: '15:00',
          title: 'Shopping at Champs-Élysées',
          description: 'Luxury shopping and café culture',
          location: 'Champs-Élysées, Paris',
          type: 'activity',
          duration: '3h',
          cost: 200
        },
        {
          id: '9',
          time: '19:00',
          title: 'Farewell Dinner',
          description: 'Rooftop dining with city views',
          location: 'Tour Montparnasse, Paris',
          type: 'restaurant',
          duration: '2h 30m',
          cost: 120
        }
      ]
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="type-icon" />;
      case 'hotel': return <MapPin className="type-icon" />;
      case 'activity': return <Camera className="type-icon" />;
      case 'restaurant': return <Utensils className="type-icon" />;
      case 'transport': return <Car className="type-icon" />;
      default: return <Clock className="type-icon" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'flight': return 'from-blue-500 to-blue-600';
      case 'hotel': return 'from-purple-500 to-purple-600';
      case 'activity': return 'from-green-500 to-green-600';
      case 'restaurant': return 'from-orange-500 to-orange-600';
      case 'transport': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const totalCost = mockItinerary.reduce((total, day) => 
    total + day.items.reduce((dayTotal, item) => dayTotal + (item.cost || 0), 0), 0
  );

  return (
    <div className="itinerary-page">
      <div className="itinerary-container">
        {/* Header */}
        <div className="itinerary-header">
          <div className="header-content">
            <h1 className="itinerary-title">🗓️ Your Paris Adventure</h1>
            <p className="itinerary-subtitle">March 15-17, 2024 • 3 Days • 2 Travelers</p>
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-value">${totalCost}</span>
                <span className="stat-label">Total Budget</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{mockItinerary.length}</span>
                <span className="stat-label">Days</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{mockItinerary.reduce((total, day) => total + day.items.length, 0)}</span>
                <span className="stat-label">Activities</span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="action-button secondary">
              <Share2 className="action-icon" />
              Share
            </button>
            <button className="action-button primary">
              <Edit3 className="action-icon" />
              Edit Trip
            </button>
          </div>
        </div>

        {/* Day Navigation */}
        <div className="day-navigation">
          {mockItinerary.map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              className={`day-tab ${selectedDay === index ? 'active' : ''}`}
            >
              <span className="day-number">{day.day}</span>
              <span className="day-date">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="day-count">{day.items.length} items</span>
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="timeline-container">
          <div className="timeline-header">
            <h2 className="timeline-title">
              {mockItinerary[selectedDay].day} - {new Date(mockItinerary[selectedDay].date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <button className="add-item-button">
              <Plus className="plus-icon" />
              Add Activity
            </button>
          </div>

          <div className="timeline">
            {mockItinerary[selectedDay].items.map((item, index) => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-marker">
                  <div className={`marker-icon bg-gradient-to-r ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  {index < mockItinerary[selectedDay].items.length - 1 && (
                    <div className="timeline-line"></div>
                  )}
                </div>

                <div className="timeline-content">
                  <div className="item-card">
                    <div className="item-header">
                      <div className="item-time">
                        <Clock className="time-icon" />
                        <span>{item.time}</span>
                        <span className="duration">({item.duration})</span>
                      </div>
                      <div className="item-actions">
                        <button className="item-action">
                          <Heart className="action-icon" />
                        </button>
                        <button className="item-action">
                          <Edit3 className="action-icon" />
                        </button>
                        <button className="item-action delete">
                          <Trash2 className="action-icon" />
                        </button>
                      </div>
                    </div>

                    <div className="item-body">
                      <h3 className="item-title">{item.title}</h3>
                      <p className="item-description">{item.description}</p>
                      <div className="item-location">
                        <MapPin className="location-icon" />
                        <span>{item.location}</span>
                      </div>
                      {item.cost && (
                        <div className="item-cost">
                          <span className="cost-amount">${item.cost}</span>
                          <span className="cost-label">per person</span>
                        </div>
                      )}
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

export default Itinerary;
