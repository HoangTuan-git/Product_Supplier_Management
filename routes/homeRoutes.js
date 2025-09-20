const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const { contactValidation } = require('../middleware/validationMiddleware');
const { attachUser, setLocals } = require('../middleware/auth');

// Apply user attachment and locals for all routes
router.use(attachUser);
router.use(setLocals);

// Home routes
router.get('/', homeController.index);
router.get('/search', homeController.search);
router.get('/suppliers/:id/products', homeController.productsBySupplier);

// Info pages
router.get('/about', homeController.about);
router.get('/contact', homeController.contact);
router.post('/contact', contactValidation.submit, homeController.submitContact);

module.exports = router;