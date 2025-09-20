const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware để attach user vào request
const attachUser = async (req, res, next) => {
    try {
        // Check session first
        if (req.session && req.session.userId) {
            const user = await User.findById(req.session.userId);
            if (user && user.isActive) {
                req.user = user;
                return next();
            }
        }

        // Check cookie token if no session
        const token = req.cookies.authToken;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt-secret-key');
                const user = await User.findById(decoded.userId);
                
                if (user && user.isActive) {
                    req.user = user;
                    // Restore session from cookie
                    req.session.userId = user._id;
                    req.session.user = {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    };
                }
            } catch (tokenError) {
                // Clear invalid cookie
                res.clearCookie('authToken');
            }
        }

        next();
    } catch (error) {
        console.error('Attach user error:', error);
        next();
    }
};

// Middleware để kiểm tra authentication
const requireAuth = (req, res, next) => {
    if (!req.user) {
        req.flash('error', 'Bạn cần đăng nhập để truy cập trang này');
        return res.redirect('/auth/login');
    }
    next();
};

// Middleware để kiểm tra admin role
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        req.flash('error', 'Bạn không có quyền truy cập trang này');
        return res.redirect('/');
    }
    next();
};

// Middleware để chuyển hướng nếu đã đăng nhập
const redirectIfAuth = (req, res, next) => {
    if (req.user) {
        return res.redirect('/');
    }
    next();
};

// Middleware để set locals cho views
const setLocals = (req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.isAuthenticated = !!req.user;
    res.locals.isAdmin = req.user && req.user.role === 'admin';
    res.locals.currentPath = req.path;
    res.locals.moment = require('moment');
    
    // Flash messages
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    res.locals.warningMessage = req.flash('warning');
    res.locals.infoMessage = req.flash('info');
    
    next();
};

module.exports = {
    attachUser,
    requireAuth,
    requireAdmin,
    redirectIfAuth,
    setLocals
};