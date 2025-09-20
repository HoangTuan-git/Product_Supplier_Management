require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const flash = require('express-flash');
const path = require('path');
const helmet = require('helmet');

// Import configurations
const sessionConfig = require('./config/session');

// Import routes
const homeRoutes = require('./routes/homeRoutes');
const authRoutes = require('./routes/authRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const productRoutes = require('./routes/productRoutes');

// Import middleware
const { attachUser, setLocals } = require('./middleware/auth');
const errorMiddleware = require('./middleware/errorMiddleware');
const faviconMiddleware = require('./middleware/faviconMiddleware');

const app = express();

// Favicon middleware (early in the stack)
app.use(faviconMiddleware);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"]
        }
    }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Method override for DELETE and PUT requests
app.use(methodOverride('_method'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/product_supplier_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Kết nối MongoDB thành công');
})
.catch((error) => {
    console.error('❌ Lỗi kết nối MongoDB:', error);
    process.exit(1);
});

// Session configuration
app.use(session(sessionConfig));

// Flash messages
app.use(flash());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// EJS layout setup
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'partials/layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Global middleware
app.use(attachUser);
app.use(setLocals);

// Routes
app.use('/', homeRoutes);
app.use('/auth', authRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/products', productRoutes);

// Error handling middleware
app.use(errorMiddleware.handleDatabaseError);
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('💥 HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('💥 MongoDB connection closed');
            process.exit(0);
        });
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;