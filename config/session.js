const session = require('express-session');
const MongoStore = require('connect-mongo');

const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key-for-product-supplier-management',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/product_supplier_management',
        collectionName: 'sessions',
        ttl: 24 * 60 * 60 // Session TTL (1 day in seconds)
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true, // Prevent XSS attacks
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
        sameSite: 'lax' // CSRF protection
    },
    name: 'sessionId' // Change default session name for security
};

module.exports = sessionConfig;