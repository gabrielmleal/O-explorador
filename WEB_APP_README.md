# Explorador Web Application

A simple web application with user authentication and basic CRUD operations, built as part of the E2E Sequential Task System test.

## Features

- User registration and login
- User profile management
- Dashboard with user information
- Secure password hashing
- Session-based authentication
- Input validation and error handling

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite
- **Views**: EJS templates
- **CSS**: Custom responsive design
- **Security**: Helmet, bcryptjs, express-validator

## Setup and Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Visit http://localhost:3000 in your browser

## Application Structure

```
├── server.js              # Main application entry point
├── package.json           # Dependencies and scripts
├── models/                # Database models
│   ├── database.js        # SQLite database setup
│   └── User.js           # User model with CRUD operations
├── middleware/            # Express middleware
│   └── auth.js           # Authentication middleware
├── routes/               # Route handlers
│   ├── auth.js          # Authentication routes
│   ├── profile.js       # Profile management routes
│   └── dashboard.js     # Dashboard routes
├── views/                # EJS templates
│   ├── layout.ejs       # Base layout template
│   ├── auth/            # Authentication views
│   ├── profile/         # Profile management views
│   └── dashboard/       # Dashboard views
├── public/              # Static assets
│   └── css/            # Stylesheets
└── data/               # SQLite database storage
```

## Usage

1. **Registration**: Visit `/auth/register` to create a new account
2. **Login**: Visit `/auth/login` to sign in
3. **Dashboard**: View user information and quick actions
4. **Profile**: View and edit profile information
5. **Logout**: Use the logout button in the navigation

## Security Features

- Password hashing with bcryptjs
- Session-based authentication
- Input validation on all forms
- CSRF protection via sessions
- Security headers with Helmet
- SQL injection prevention with parameterized queries

## API Endpoints

- `GET /` - Redirect to login or dashboard
- `GET /auth/login` - Login page
- `POST /auth/login` - Process login
- `GET /auth/register` - Registration page
- `POST /auth/register` - Process registration
- `POST /auth/logout` - Logout user
- `GET /dashboard` - User dashboard (authenticated)
- `GET /profile` - View profile (authenticated)
- `GET /profile/edit` - Edit profile form (authenticated)
- `POST /profile/update` - Update profile (authenticated)

## Database Schema

### Users Table
- `id` - Primary key (auto-increment)
- `username` - Unique username (3-50 chars)
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `first_name` - User's first name
- `last_name` - User's last name
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

## Development Notes

This application is part of the Sequential Task System E2E test. It demonstrates:
- Task 1: Express.js server with authentication foundation ✅
- Task 2: User registration and login system (next)
- Task 3: User profile CRUD operations (next)
- Task 4: Dashboard and user interface (next)

The implementation follows MVC architecture patterns and includes comprehensive error handling, input validation, and security best practices.