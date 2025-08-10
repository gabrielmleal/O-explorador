const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration
app.use(session({
    secret: 'explorador-web-app-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup (using basic HTML for simplicity)
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

// Routes
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

// Legacy health check endpoint (for compatibility)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Explorador Web Application is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((req, res, next) => {
    res.status(404).send(`
        <html>
            <head>
                <title>Page Not Found</title>
                <link rel="stylesheet" href="/css/style.css">
            </head>
            <body>
                <div class="container">
                    <h1>404 - Page Not Found</h1>
                    <p>The page you are looking for does not exist.</p>
                    <a href="/" class="btn">Go Home</a>
                </div>
            </body>
        </html>
    `);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`
        <html>
            <head>
                <title>Server Error</title>
                <link rel="stylesheet" href="/css/style.css">
            </head>
            <body>
                <div class="container">
                    <h1>500 - Server Error</h1>
                    <p>Something went wrong on our end.</p>
                    <a href="/" class="btn">Go Home</a>
                </div>
            </body>
        </html>
    `);
});

// Start server
app.listen(PORT, () => {
    console.log(`Explorador Web Application server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
});

module.exports = app;