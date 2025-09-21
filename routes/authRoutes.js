const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authValidation } = require('../middleware/validationMiddleware');
const { redirectIfAuth } = require('../middleware/auth');

// POST logout route (no redirect middleware needed)
router.post('/logout', authController.logout);

// Redirect authenticated users away from auth pages
router.use(redirectIfAuth);

// GET routes
router.get('/register', authController.showRegister);
router.get('/login', authController.showLogin);
router.get('/forgot', authController.showForgot);
router.get('/reset/:token', authController.showReset);

// POST routes
router.post('/register', authValidation.register, authController.register);
router.post('/login', authValidation.login, authController.login);
router.post('/forgot', authValidation.forgot, authController.forgot);
router.post('/reset/:token', authValidation.reset, authController.reset);

module.exports = router;