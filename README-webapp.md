# Explorador Web Application

A simple Node.js web application with user authentication and CRUD operations, built using Express.js and MVC architecture pattern.

## Project Structure

```
├── app.js                 # Main Express server file
├── package.json          # Node.js dependencies and scripts
├── controllers/          # MVC Controllers
│   ├── baseController.js # Base controller with common functionality
│   └── .gitkeep
├── models/               # MVC Models
│   ├── baseModel.js     # Base model with in-memory data operations
│   └── .gitkeep
├── views/                # MVC Views (HTML templates)
│   ├── index.html       # Home page template
│   └── .gitkeep
├── routes/               # Route definitions
│   ├── index.js         # Main routes
│   └── .gitkeep
└── public/               # Static assets
    ├── css/
    │   └── style.css    # Application styles
    └── js/
        └── main.js      # Client-side JavaScript
```

## Features Implemented (Task 1)

- ✅ Express.js server with MVC structure
- ✅ Session management configuration
- ✅ Static file serving
- ✅ Basic routing system
- ✅ Error handling middleware
- ✅ Health check endpoints
- ✅ Basic HTML views with CSS styling
- ✅ Base controller and model classes for future use

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. Visit http://localhost:3000 to view the application

## API Endpoints

- `GET /` - Home page
- `GET /health` - Health check
- `GET /api/health` - API health check
- `GET /api/status` - Server status and features

## Dependencies

- **express**: Web framework for Node.js
- **express-session**: Session middleware
- **bcryptjs**: Password hashing (for upcoming authentication)
- **body-parser**: Request body parsing
- **path**: File path utilities

## Development Dependencies

- **nodemon**: Development server with auto-restart

## Next Steps (Upcoming Tasks)

- **Task 2**: User Registration and Login System
- **Task 3**: User Profile Management with CRUD Operations
- **Task 4**: User Dashboard with Information Display

## Architecture Notes

This application follows the MVC (Model-View-Controller) pattern:

- **Models**: Handle data operations (currently in-memory, will be enhanced)
- **Views**: HTML templates for user interface
- **Controllers**: Handle request logic and coordinate between models and views
- **Routes**: Define URL endpoints and map to controllers

The base classes (`BaseController`, `BaseModel`) provide common functionality that will be extended in subsequent tasks.