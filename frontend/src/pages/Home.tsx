import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, DollarSign, Search, Plane, Camera, Map, Star } from 'lucide-react';
import BudgetSplitter from '../components/BudgetSplitter';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchForm, setSearchForm] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 2,
    budget: '',
  });

  const [showBudgetSplitter, setShowBudgetSplitter] = useState(false);
  const [budgetBreakdown, setBudgetBreakdown] = useState({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSearchForm({
      ...searchForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    // Navigate to search results with form data
    const searchParams = new URLSearchParams({
      destination: searchForm.destination,
      startDate: searchForm.startDate,
      endDate: searchForm.endDate,
      travelers: searchForm.travelers.toString(),
      budget: searchForm.budget,
    });

    navigate(`/search?${searchParams.toString()}`);
  };

  const features = [
    {
      icon: Plane,
      title: "Smart Flight Search",
      description: "Find the best flights with AI-powered recommendations and price predictions."
    },
    {
      icon: Map,
      title: "Interactive Itineraries",
      description: "Create beautiful day-by-day plans with drag-and-drop timeline interface."
    },
    {
      icon: Camera,
      title: "Local Experiences",
      description: "Discover hidden gems and authentic experiences recommended by locals."
    },
    {
      icon: Star,
      title: "Smart Budgeting",
      description: "Track expenses, split bills, and get budget insights with visual charts."
    }
  ];



  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative gradient-primary overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-10 rounded-full floating"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white opacity-10 rounded-full floating" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white opacity-10 rounded-full floating" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-32 right-1/3 w-24 h-24 bg-white opacity-10 rounded-full floating" style={{animationDelay: '0.5s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-slide-up">
              ✈️ Plan Your Perfect Trip
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
              🌍 Discover amazing destinations, find the best deals on flights and hotels,
              and manage your travel expenses all in one place.
            </p>

            {/* Search Form */}
            <div className="max-w-5xl mx-auto animate-bounce-in" style={{animationDelay: '0.4s'}}>
              <form onSubmit={handleSearch} className="glass rounded-3xl p-8 backdrop-blur-lg border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">🔍 Start Your Journey</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {/* Destination */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-white mb-3">
                      <MapPin className="h-5 w-5 inline mr-2 text-white" />
                      🏖️ Destination
                    </label>
                    <input
                      type="text"
                      name="destination"
                      value={searchForm.destination}
                      onChange={handleInputChange}
                      placeholder="Where do you want to go? ✈️"
                      className="input-field"
                      required
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      <Calendar className="h-5 w-5 inline mr-2 text-white" />
                      📅 Check-in
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={searchForm.startDate}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      <Calendar className="h-5 w-5 inline mr-2 text-white" />
                      📅 Check-out
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={searchForm.endDate}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>

                  {/* Travelers */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      <Users className="h-5 w-5 inline mr-2 text-white" />
                      👥 Travelers
                    </label>
                    <select
                      name="travelers"
                      value={searchForm.travelers}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'People'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Budget */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-white mb-3">
                    <DollarSign className="h-5 w-5 inline mr-2 text-white" />
                    💰 Budget (Optional)
                  </label>
                  <div className="flex gap-4 items-end">
                    <input
                      type="number"
                      name="budget"
                      value={searchForm.budget}
                      onChange={(e) => {
                        handleInputChange(e);
                        setShowBudgetSplitter(!!e.target.value && parseInt(e.target.value) > 0);
                      }}
                      placeholder="Enter your total budget 💵"
                      className="input-field max-w-xs"
                    />
                    {searchForm.budget && (
                      <button
                        type="button"
                        onClick={() => setShowBudgetSplitter(!showBudgetSplitter)}
                        className="budget-splitter-toggle"
                      >
                        {showBudgetSplitter ? 'Hide' : 'Split'} Budget
                      </button>
                    )}
                  </div>
                </div>

                {/* Budget Splitter */}
                {showBudgetSplitter && searchForm.budget && (
                  <div className="mt-6">
                    <BudgetSplitter
                      totalBudget={parseInt(searchForm.budget) || 0}
                      onBudgetChange={setBudgetBreakdown}
                    />
                  </div>
                )}

                {/* Search Button */}
                <div className="mt-8 text-center">
                  <button
                    type="submit"
                    className="btn-primary text-lg px-12 py-4 text-xl font-bold space-x-3 transform hover:scale-105 transition-all duration-300"
                  >
                    <Search className="h-6 w-6" />
                    <span>🚀 Find My Perfect Trip</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23667eea' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              ✨ Everything You Need for Your Trip
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From planning to tracking expenses, we've got you covered with powerful tools
              to make your travel experience seamless and unforgettable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="icon-container w-20 h-20 mx-auto mb-6">
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="gradient-primary relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 right-10 w-32 h-32 bg-white opacity-5 rounded-full floating"></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 bg-white opacity-5 rounded-full floating" style={{animationDelay: '1s'}}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
            <div className="text-center animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                🎉 Ready to Start Planning?
              </h2>
              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                Join thousands of travelers who trust us with their trip planning.
                Start your adventure today! 🌟
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-white text-purple-600 hover:bg-gray-100 font-bold py-4 px-10 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-lg"
                >
                  🚀 Get Started Free
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="border-2 border-white text-white hover:bg-white hover:text-purple-600 font-bold py-4 px-10 rounded-2xl transition-all duration-300 transform hover:scale-105 text-lg"
                >
                  👋 Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
