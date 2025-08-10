# Explorador Web App

A Node.js/Express.js web application built as part of a sequential task implementation test.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Visit the application:
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
webapp/
├── controllers/     # Request handlers and business logic
├── models/         # Data models and structures
├── views/          # HTML templates
├── routes/         # Route definitions
├── middleware/     # Custom middleware functions
└── config/         # Configuration files
```

## 🛠️ Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests (to be implemented)

## 📊 Health Check

The application includes a health check endpoint:
- `GET /health` - Returns application status and metrics

## 🔄 Sequential Implementation Status

This application is being built through a 4-task sequential process:

- ✅ **Task 1: Express.js Foundation** (Complete)
  - Basic server setup with Express.js
  - MVC architecture structure
  - Basic routing and middleware
  - Health check endpoint
  - HTML templates with basic styling

- ⏳ **Task 2: User Authentication System** (Upcoming)
  - User registration and login
  - Password hashing with bcrypt
  - JWT token authentication
  - Authentication middleware

- ⏳ **Task 3: User Profile CRUD Operations** (Upcoming)
  - Create, read, update, delete user profiles
  - User-specific data protection
  - Profile management interface

- ⏳ **Task 4: User Dashboard Interface** (Upcoming)
  - Integrated dashboard
  - User information display
  - Navigation and styling

## 🔧 Technologies Used

- **Backend**: Node.js, Express.js
- **Authentication**: bcryptjs, jsonwebtoken
- **Middleware**: cookie-parser, express-validator
- **Environment**: dotenv
- **Development**: nodemon

## 📝 API Endpoints

### Current Endpoints (Task 1)
- `GET /` - Home page
- `GET /about` - About page
- `GET /health` - Health check

### Upcoming Endpoints (Tasks 2-4)
- Authentication routes (Task 2)
- Profile management routes (Task 3)
- Dashboard routes (Task 4)

## 🎯 Features

### Implemented (Task 1)
- Express.js server with MVC architecture
- Basic routing system
- HTML template rendering
- Error handling (404, 500)
- Request logging middleware
- Health monitoring

### Planned (Tasks 2-4)
- User authentication and authorization
- User profile management
- Interactive dashboard
- CRUD operations
- Session management

## 🔒 Security Features (Planned)
- Password hashing with bcrypt
- JWT token authentication
- Input validation
- SQL injection protection
- XSS protection

## 📈 Performance
- Response time target: <200ms
- Lightweight foundation ready for scaling
- Efficient middleware chain

## 🤝 Contributing

This is part of a sequential task implementation test. Each task builds upon the previous implementation.

## 📄 License

MIT License - Built for sequential workflow testing purposes.