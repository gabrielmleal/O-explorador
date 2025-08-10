const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session configuration
app.use(session({
    secret: 'explorador-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup (using basic HTML for now)
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Explorador Web App is running',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Explorador Web App</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .container { max-width: 600px; margin: 0 auto; text-align: center; }
                .link { display: inline-block; margin: 10px; padding: 10px 20px; 
                       background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
                .link:hover { background-color: #0056b3; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Explorador Web Application</h1>
                <p>Welcome to the E2E test web application!</p>
                <div>
                    <a href="/auth/register" class="link">Register</a>
                    <a href="/auth/login" class="link">Login</a>
                    <a href="/health" class="link">Health Check</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Page not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Explorador Web App is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
});

module.exports = app;