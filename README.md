<<<<<<< HEAD

=======
# 🚀 Smart Travel Planner

A comprehensive travel planning application with budget management, smart recommendations, and beautiful UI.

## ✨ Features

- 🎯 **Smart Travel Search** - Find flights, hotels, and attractions
- 💰 **Budget Splitter** - Intelligently allocate your travel budget
- 🖼️ **Beautiful Images** - Real travel photos from Unsplash
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Colorful UI** - Modern, vibrant design
- 🔄 **Easy Navigation** - Intuitive back buttons and breadcrumbs
- 📊 **Availability Tracking** - Real-time availability information

## 🚀 Quick Launch

### Option 1: One-Click Launch (Recommended)

**Windows:**
```bash
# Double-click the launch-app.bat file
# OR run in terminal:
launch-app.bat
```

**Mac/Linux:**
```bash
# Make executable (first time only):
chmod +x launch-app.sh

# Run the launcher:
./launch-app.sh
```

### Option 2: Manual Launch

1. **Start Backend:**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Start Frontend (in new terminal):**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Open Browser:**
   Navigate to `http://localhost:3000`

## 🌐 Access Points

- **Frontend App:** http://localhost:3000
- **Backend API:** http://localhost:5000

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS
- **Testing**: Jest, Supertest
- **Development**: Nodemon

## 📁 Project Structure

```
src/
├── app.js              # Express app configuration
├── server.js           # Server entry point
├── config/
│   └── database.js     # MongoDB connection
├── models/
│   ├── User.js         # User data model
│   ├── Trip.js         # Trip data model
│   └── Expense.js      # Expense data model
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── trips.js        # Trip management routes
│   ├── flights.js      # Flight search routes
│   ├── hotels.js       # Hotel search routes
│   ├── attractions.js  # Attractions routes
│   ├── restaurants.js  # Restaurant routes
│   ├── weather.js      # Weather data routes
│   ├── transport.js    # Transport routes
│   └── expenses.js     # Expense tracking routes
└── middleware/
    └── auth.js         # Authentication middleware
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd travel-planning-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/travel-planner
   JWT_SECRET=your_super_secret_jwt_key_here

   # API Keys (for future integration)
   AMADEUS_CLIENT_ID=your_amadeus_client_id
   AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   OPENWEATHER_API_KEY=your_openweather_api_key
   RAPIDAPI_KEY=your_rapidapi_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/preferences` - Update user preferences

### Trip Management

- `POST /api/trips` - Create new trip
- `GET /api/trips` - Get user's trips
- `GET /api/trips/:id` - Get specific trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip
- `POST /api/trips/:id/itinerary` - Add activity to itinerary

### Search & Discovery

- `GET /api/flights/search` - Search flights
- `GET /api/hotels/search` - Search hotels
- `GET /api/attractions/search` - Search attractions
- `GET /api/restaurants/search` - Search restaurants
- `GET /api/weather/current` - Get current weather
- `GET /api/weather/forecast` - Get weather forecast
- `GET /api/transport/search` - Search transport options

### Expense Management

- `POST /api/expenses` - Create expense
- `GET /api/expenses/trip/:tripId` - Get trip expenses
- `GET /api/expenses/trip/:tripId/settlement` - Get settlement summary
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

## 🧪 Testing

Run the test suite:
```bash
npm test
```

For development with auto-reload:
```bash
npm run test:watch
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Rate limiting (planned)

## 🌐 Current Status

**Phase 1: ✅ Complete - Project Setup & Mock Server**
- ✅ Express.js boilerplate with all routes
- ✅ MongoDB models and database configuration
- ✅ Authentication system with JWT
- ✅ Mock data for all external APIs
- ✅ Input validation and error handling

**Phase 2: 🔄 Next - Frontend Integration**
- React application setup
- API integration with backend
- User interface components

**Phase 3: 📋 Planned - Real API Integration**
- Amadeus API for flights and hotels
- Google Maps API for places and routes
- OpenWeatherMap for weather data
- RapidAPI for local transport

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please open an issue in the repository.
>>>>>>> 4f1a391 (Add complete Smart Travel Planner with all features)
