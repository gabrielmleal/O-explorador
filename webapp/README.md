# Explorador Web Application

An E2E test web application demonstrating user authentication and basic CRUD operations built with Node.js and Express.js.

## Project Structure

```
webapp/
├── app.js                 # Main Express application
├── routes/               # Route handlers
│   ├── auth.js          # Authentication routes (Task 2)
│   ├── profile.js       # Profile management routes (Task 3)
│   └── dashboard.js     # Dashboard routes (Task 4)
├── models/              # Data models
│   └── User.js          # User model with in-memory storage
├── middleware/          # Custom middleware
│   └── auth.js          # Authentication middleware (Task 2)
├── public/              # Static assets
│   └── styles.css       # CSS styling
└── views/               # HTML templates (to be added)
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

Or start in production mode:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Application health status

### Authentication (Task 2 - Placeholder)
- `GET /auth/register` - Registration form
- `POST /auth/register` - User registration
- `GET /auth/login` - Login form  
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Profile Management (Task 3 - Placeholder)
- `GET /profile` - View user profile
- `GET /profile/edit` - Edit profile form
- `POST /profile/update` - Update profile
- `POST /profile/change-password` - Change password

### Dashboard (Task 4 - Placeholder)
- `GET /dashboard` - User dashboard
- `GET /dashboard/stats` - User statistics

## Features Implemented

### Task 1: ✅ Project Foundation
- [x] Express.js server setup
- [x] MVC folder structure
- [x] Basic middleware configuration
- [x] Session management setup
- [x] Health check endpoint
- [x] Static file serving
- [x] Error handling middleware
- [x] Basic CSS styling

## Upcoming Tasks

- **Task 2**: Implement authentication system with bcrypt password hashing
- **Task 3**: Build profile management with CRUD operations
- **Task 4**: Create user dashboard with information display

## Technology Stack

- **Backend**: Node.js, Express.js
- **Session**: express-session
- **Security**: bcryptjs (for password hashing)
- **Frontend**: Basic HTML/CSS
- **Architecture**: MVC pattern
- **Storage**: In-memory (for testing purposes)

## Development Notes

This is an E2E test implementation for the sequential workflow system. Each task builds upon the previous implementation, creating a progressive development chain.