const express = require('express');
const { query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Mock weather data generator
const generateWeatherData = (city, date) => {
  const baseTemp = Math.floor(Math.random() * 20) + 15; // 15-35°C
  const conditions = ['sunny', 'partly-cloudy', 'cloudy', 'rainy', 'thunderstorm'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  return {
    date,
    temperature: {
      current: baseTemp,
      min: baseTemp - 5,
      max: baseTemp + 8,
      unit: 'celsius'
    },
    condition,
    description: getWeatherDescription(condition),
    humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
    windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
    windDirection: 'NW',
    pressure: Math.floor(Math.random() * 50) + 1000, // 1000-1050 hPa
    visibility: Math.floor(Math.random() * 5) + 10, // 10-15 km
    uvIndex: Math.floor(Math.random() * 8) + 1, // 1-8
    sunrise: '06:30',
    sunset: '19:45',
    precipitation: {
      probability: condition === 'rainy' || condition === 'thunderstorm' ? Math.floor(Math.random() * 60) + 40 : Math.floor(Math.random() * 20),
      amount: condition === 'rainy' ? Math.floor(Math.random() * 10) + 1 : 0
    }
  };
};

const getWeatherDescription = (condition) => {
  const descriptions = {
    'sunny': 'Clear skies with plenty of sunshine',
    'partly-cloudy': 'Partly cloudy with some sun breaks',
    'cloudy': 'Overcast skies with cloud cover',
    'rainy': 'Light to moderate rainfall expected',
    'thunderstorm': 'Thunderstorms with heavy rain possible'
  };
  return descriptions[condition] || 'Weather conditions vary';
};

// @route   GET /api/weather/current
// @desc    Get current weather for a location
// @access  Private
router.get('/current', auth, [
  query('city').notEmpty().withMessage('City is required'),
  query('country').optional().isLength({ min: 2, max: 3 }).withMessage('Country code should be 2-3 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { city, country = 'US', units = 'metric' } = req.query;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const currentWeather = generateWeatherData(city, new Date().toISOString().split('T')[0]);
    
    // Convert temperature units if needed
    if (units === 'imperial') {
      currentWeather.temperature = {
        current: Math.round((currentWeather.temperature.current * 9/5) + 32),
        min: Math.round((currentWeather.temperature.min * 9/5) + 32),
        max: Math.round((currentWeather.temperature.max * 9/5) + 32),
        unit: 'fahrenheit'
      };
    }

    const response = {
      location: {
        city,
        country,
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        },
        timezone: 'America/New_York'
      },
      current: currentWeather,
      lastUpdated: new Date().toISOString(),
      message: 'Current weather retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Current weather error:', error);
    res.status(500).json({ error: 'Server error fetching current weather' });
  }
});

// @route   GET /api/weather/forecast
// @desc    Get weather forecast for a location
// @access  Private
router.get('/forecast', auth, [
  query('city').notEmpty().withMessage('City is required'),
  query('days').optional().isInt({ min: 1, max: 14 }).withMessage('Days must be between 1 and 14'),
  query('country').optional().isLength({ min: 2, max: 3 }).withMessage('Country code should be 2-3 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { city, country = 'US', days = 7, units = 'metric' } = req.query;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Generate forecast data
    const forecast = [];
    const today = new Date();
    
    for (let i = 0; i < parseInt(days); i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      const dateString = forecastDate.toISOString().split('T')[0];
      
      let dayWeather = generateWeatherData(city, dateString);
      
      // Convert temperature units if needed
      if (units === 'imperial') {
        dayWeather.temperature = {
          current: Math.round((dayWeather.temperature.current * 9/5) + 32),
          min: Math.round((dayWeather.temperature.min * 9/5) + 32),
          max: Math.round((dayWeather.temperature.max * 9/5) + 32),
          unit: 'fahrenheit'
        };
      }
      
      // Add day name
      dayWeather.dayName = forecastDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      forecast.push(dayWeather);
    }

    const response = {
      location: {
        city,
        country,
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        },
        timezone: 'America/New_York'
      },
      forecast,
      forecastDays: parseInt(days),
      units,
      lastUpdated: new Date().toISOString(),
      message: 'Weather forecast retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Weather forecast error:', error);
    res.status(500).json({ error: 'Server error fetching weather forecast' });
  }
});

// @route   GET /api/weather/travel-advice
// @desc    Get travel weather advice for dates
// @access  Private
router.get('/travel-advice', auth, [
  query('city').notEmpty().withMessage('City is required'),
  query('startDate').isISO8601().withMessage('Valid start date is required'),
  query('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { city, startDate, endDate, country = 'US' } = req.query;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate weather data for travel period
    const travelDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const weatherData = [];
    
    for (let i = 0; i <= travelDays; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      weatherData.push(generateWeatherData(city, dateString));
    }

    // Generate travel advice
    const rainyDays = weatherData.filter(day => day.condition === 'rainy' || day.condition === 'thunderstorm').length;
    const avgTemp = weatherData.reduce((sum, day) => sum + day.temperature.current, 0) / weatherData.length;
    
    const advice = {
      packingRecommendations: [],
      bestDays: [],
      warnings: []
    };

    // Packing recommendations
    if (avgTemp < 10) {
      advice.packingRecommendations.push('Pack warm clothing and layers');
    } else if (avgTemp > 25) {
      advice.packingRecommendations.push('Pack light, breathable clothing');
    }

    if (rainyDays > 0) {
      advice.packingRecommendations.push('Bring rain gear and umbrella');
    }

    // Best days for outdoor activities
    const goodWeatherDays = weatherData.filter(day => 
      day.condition === 'sunny' || day.condition === 'partly-cloudy'
    );
    advice.bestDays = goodWeatherDays.slice(0, 3).map(day => ({
      date: day.date,
      reason: `${day.condition} with ${day.temperature.current}°C`
    }));

    // Warnings
    if (rainyDays > travelDays * 0.5) {
      advice.warnings.push('Expect frequent rain during your trip');
    }

    const response = {
      location: { city, country },
      travelPeriod: { startDate, endDate, days: travelDays + 1 },
      weatherSummary: {
        averageTemperature: Math.round(avgTemp),
        rainyDays,
        conditions: weatherData.map(day => day.condition)
      },
      dailyForecast: weatherData,
      travelAdvice: advice,
      message: 'Travel weather advice generated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Travel weather advice error:', error);
    res.status(500).json({ error: 'Server error generating travel advice' });
  }
});

module.exports = router;
