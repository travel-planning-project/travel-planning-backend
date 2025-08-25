const express = require('express');
const { query, validationResult } = require('express-validator');
const { asyncHandler, ValidationError, APIError } = require('../middleware/errorHandler');

const router = express.Router();

// Mock weather data
const mockWeatherData = {
  'paris': {
    current: {
      location: 'Paris, France',
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      temperature: 18,
      feelsLike: 16,
      condition: 'Partly Cloudy',
      description: 'Partly cloudy with occasional sunshine',
      humidity: 65,
      windSpeed: 12,
      windDirection: 'NW',
      pressure: 1013,
      visibility: 10,
      uvIndex: 4,
      sunrise: '07:45',
      sunset: '19:30',
      lastUpdated: new Date().toISOString()
    },
    forecast: [
      {
        date: '2024-03-15',
        day: 'Today',
        high: 20,
        low: 12,
        condition: 'Partly Cloudy',
        icon: 'partly-cloudy',
        precipitation: 10,
        humidity: 65,
        windSpeed: 12,
        hourly: [
          { time: '06:00', temp: 12, condition: 'Clear', precipitation: 0 },
          { time: '09:00', temp: 15, condition: 'Partly Cloudy', precipitation: 0 },
          { time: '12:00', temp: 18, condition: 'Partly Cloudy', precipitation: 5 },
          { time: '15:00', temp: 20, condition: 'Cloudy', precipitation: 10 },
          { time: '18:00', temp: 17, condition: 'Light Rain', precipitation: 20 },
          { time: '21:00', temp: 14, condition: 'Clear', precipitation: 0 }
        ]
      },
      {
        date: '2024-03-16',
        day: 'Tomorrow',
        high: 22,
        low: 14,
        condition: 'Sunny',
        icon: 'sunny',
        precipitation: 0,
        humidity: 55,
        windSpeed: 8
      },
      {
        date: '2024-03-17',
        day: 'Sunday',
        high: 19,
        low: 11,
        condition: 'Light Rain',
        icon: 'light-rain',
        precipitation: 60,
        humidity: 75,
        windSpeed: 15
      },
      {
        date: '2024-03-18',
        day: 'Monday',
        high: 16,
        low: 9,
        condition: 'Cloudy',
        icon: 'cloudy',
        precipitation: 20,
        humidity: 70,
        windSpeed: 10
      },
      {
        date: '2024-03-19',
        day: 'Tuesday',
        high: 21,
        low: 13,
        condition: 'Partly Cloudy',
        icon: 'partly-cloudy',
        precipitation: 15,
        humidity: 60,
        windSpeed: 9
      }
    ],
    alerts: [],
    travelAdvice: {
      clothing: 'Light jacket recommended for evening',
      activities: 'Good weather for outdoor sightseeing',
      transportation: 'No weather-related delays expected'
    }
  },
  'tokyo': {
    current: {
      location: 'Tokyo, Japan',
      coordinates: { latitude: 35.6762, longitude: 139.6503 },
      temperature: 24,
      feelsLike: 26,
      condition: 'Sunny',
      description: 'Clear skies with bright sunshine',
      humidity: 45,
      windSpeed: 8,
      windDirection: 'E',
      pressure: 1020,
      visibility: 15,
      uvIndex: 7,
      sunrise: '06:15',
      sunset: '18:45',
      lastUpdated: new Date().toISOString()
    },
    forecast: [
      {
        date: '2024-03-15',
        day: 'Today',
        high: 26,
        low: 18,
        condition: 'Sunny',
        icon: 'sunny',
        precipitation: 0,
        humidity: 45,
        windSpeed: 8
      },
      {
        date: '2024-03-16',
        day: 'Tomorrow',
        high: 28,
        low: 20,
        condition: 'Partly Cloudy',
        icon: 'partly-cloudy',
        precipitation: 5,
        humidity: 50,
        windSpeed: 10
      },
      {
        date: '2024-03-17',
        day: 'Sunday',
        high: 25,
        low: 17,
        condition: 'Cloudy',
        icon: 'cloudy',
        precipitation: 30,
        humidity: 65,
        windSpeed: 12
      },
      {
        date: '2024-03-18',
        day: 'Monday',
        high: 23,
        low: 16,
        condition: 'Light Rain',
        icon: 'light-rain',
        precipitation: 70,
        humidity: 80,
        windSpeed: 15
      },
      {
        date: '2024-03-19',
        day: 'Tuesday',
        high: 27,
        low: 19,
        condition: 'Sunny',
        icon: 'sunny',
        precipitation: 0,
        humidity: 40,
        windSpeed: 6
      }
    ],
    alerts: [
      {
        type: 'advisory',
        title: 'High UV Index',
        description: 'UV index will be high today. Use sunscreen and protective clothing.',
        severity: 'minor'
      }
    ],
    travelAdvice: {
      clothing: 'Light clothing recommended, bring sunscreen',
      activities: 'Perfect weather for outdoor activities',
      transportation: 'Excellent conditions for all transport'
    }
  }
};

// Validation rules
const getWeatherValidation = [
  query('location').notEmpty().withMessage('Location is required'),
  query('units').optional().isIn(['metric', 'imperial']).withMessage('Units must be metric or imperial'),
  query('days').optional().isInt({ min: 1, max: 14 }).withMessage('Days must be between 1 and 14')
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

// Helper function to convert temperature units
const convertTemperature = (temp, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return temp;
  
  if (fromUnit === 'metric' && toUnit === 'imperial') {
    return Math.round((temp * 9/5) + 32);
  } else if (fromUnit === 'imperial' && toUnit === 'metric') {
    return Math.round((temp - 32) * 5/9);
  }
  
  return temp;
};

// Helper function to convert wind speed
const convertWindSpeed = (speed, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return speed;
  
  if (fromUnit === 'metric' && toUnit === 'imperial') {
    return Math.round(speed * 0.621371); // km/h to mph
  } else if (fromUnit === 'imperial' && toUnit === 'metric') {
    return Math.round(speed * 1.60934); // mph to km/h
  }
  
  return speed;
};

// Helper function to get weather data for location
const getWeatherForLocation = (location, units = 'metric') => {
  const locationKey = location.toLowerCase().replace(/[^a-z]/g, '');
  let weatherData = mockWeatherData[locationKey];
  
  if (!weatherData) {
    // Return default weather data for unknown locations
    weatherData = {
      current: {
        location: location,
        coordinates: { latitude: 0, longitude: 0 },
        temperature: 20,
        feelsLike: 22,
        condition: 'Partly Cloudy',
        description: 'Weather data not available for this location',
        humidity: 60,
        windSpeed: 10,
        windDirection: 'N',
        pressure: 1013,
        visibility: 10,
        uvIndex: 5,
        sunrise: '06:30',
        sunset: '18:30',
        lastUpdated: new Date().toISOString()
      },
      forecast: [],
      alerts: [],
      travelAdvice: {
        clothing: 'Check local weather conditions',
        activities: 'Weather data not available',
        transportation: 'Check local conditions'
      }
    };
  }

  // Convert units if needed
  if (units === 'imperial') {
    weatherData = JSON.parse(JSON.stringify(weatherData)); // Deep clone
    
    // Convert current weather
    weatherData.current.temperature = convertTemperature(weatherData.current.temperature, 'metric', 'imperial');
    weatherData.current.feelsLike = convertTemperature(weatherData.current.feelsLike, 'metric', 'imperial');
    weatherData.current.windSpeed = convertWindSpeed(weatherData.current.windSpeed, 'metric', 'imperial');
    
    // Convert forecast
    weatherData.forecast.forEach(day => {
      day.high = convertTemperature(day.high, 'metric', 'imperial');
      day.low = convertTemperature(day.low, 'metric', 'imperial');
      day.windSpeed = convertWindSpeed(day.windSpeed, 'metric', 'imperial');
      
      if (day.hourly) {
        day.hourly.forEach(hour => {
          hour.temp = convertTemperature(hour.temp, 'metric', 'imperial');
        });
      }
    });
  }

  return weatherData;
};

// @route   GET /api/weather/current
// @desc    Get current weather for a location
// @access  Private
router.get('/current', getWeatherValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const { location, units = 'metric' } = req.query;

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const weatherData = getWeatherForLocation(location, units);

    res.json({
      success: true,
      data: {
        current: weatherData.current,
        alerts: weatherData.alerts,
        travelAdvice: weatherData.travelAdvice,
        units: {
          temperature: units === 'metric' ? '°C' : '°F',
          windSpeed: units === 'metric' ? 'km/h' : 'mph',
          pressure: 'hPa',
          visibility: 'km'
        }
      }
    });

  } catch (error) {
    throw new APIError('Weather service temporarily unavailable', 503, 'WeatherAPI');
  }
}));

// @route   GET /api/weather/forecast
// @desc    Get weather forecast for a location
// @access  Private
router.get('/forecast', getWeatherValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const { location, units = 'metric', days = 5 } = req.query;

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const weatherData = getWeatherForLocation(location, units);
    const forecastDays = parseInt(days);

    res.json({
      success: true,
      data: {
        location: weatherData.current.location,
        coordinates: weatherData.current.coordinates,
        forecast: weatherData.forecast.slice(0, forecastDays),
        alerts: weatherData.alerts,
        travelAdvice: weatherData.travelAdvice,
        units: {
          temperature: units === 'metric' ? '°C' : '°F',
          windSpeed: units === 'metric' ? 'km/h' : 'mph',
          precipitation: '%'
        },
        lastUpdated: weatherData.current.lastUpdated
      }
    });

  } catch (error) {
    throw new APIError('Weather forecast service temporarily unavailable', 503, 'WeatherAPI');
  }
}));

// @route   GET /api/weather/hourly
// @desc    Get hourly weather forecast
// @access  Private
router.get('/hourly', getWeatherValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const { location, units = 'metric' } = req.query;

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 350));

    const weatherData = getWeatherForLocation(location, units);
    const todayForecast = weatherData.forecast[0];

    if (!todayForecast || !todayForecast.hourly) {
      throw new APIError('Hourly forecast not available for this location', 404, 'WeatherAPI');
    }

    res.json({
      success: true,
      data: {
        location: weatherData.current.location,
        date: todayForecast.date,
        hourly: todayForecast.hourly,
        units: {
          temperature: units === 'metric' ? '°C' : '°F',
          precipitation: '%'
        },
        lastUpdated: weatherData.current.lastUpdated
      }
    });

  } catch (error) {
    throw new APIError('Hourly weather service temporarily unavailable', 503, 'WeatherAPI');
  }
}));

// @route   GET /api/weather/alerts
// @desc    Get weather alerts for a location
// @access  Private
router.get('/alerts', getWeatherValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const { location } = req.query;

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const weatherData = getWeatherForLocation(location);

    res.json({
      success: true,
      data: {
        location: weatherData.current.location,
        alerts: weatherData.alerts,
        alertCount: weatherData.alerts.length,
        lastUpdated: weatherData.current.lastUpdated
      }
    });

  } catch (error) {
    throw new APIError('Weather alerts service temporarily unavailable', 503, 'WeatherAPI');
  }
}));

// @route   GET /api/weather/travel-advice
// @desc    Get travel advice based on weather
// @access  Private
router.get('/travel-advice', getWeatherValidation, asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const { location, startDate, endDate } = req.query;

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));

    const weatherData = getWeatherForLocation(location);

    // Generate travel advice based on forecast
    const advice = {
      ...weatherData.travelAdvice,
      packingList: [
        'Light jacket or sweater',
        'Comfortable walking shoes',
        'Umbrella or rain jacket',
        'Sunscreen and sunglasses',
        'Layered clothing'
      ],
      bestTimes: {
        outdoor: 'Morning (9-11 AM) and late afternoon (4-6 PM)',
        indoor: 'Midday when it might be too hot or during rain',
        photography: 'Golden hour (1 hour before sunset)'
      },
      weatherTrends: 'Generally mild with occasional rain showers'
    };

    res.json({
      success: true,
      data: {
        location: weatherData.current.location,
        period: { startDate, endDate },
        advice,
        forecast: weatherData.forecast.slice(0, 7), // 7-day forecast
        lastUpdated: weatherData.current.lastUpdated
      }
    });

  } catch (error) {
    throw new APIError('Travel advice service temporarily unavailable', 503, 'WeatherAPI');
  }
}));

module.exports = router;
