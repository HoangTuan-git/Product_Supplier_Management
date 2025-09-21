const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const { contactValidation } = require('../middleware/validationMiddleware');

// Home routes
router.get('/', homeController.index);
router.get('/search', homeController.search);
router.get('/suppliers/:id/products', homeController.productsBySupplier);

// Info pages
router.get('/about', homeController.about);
router.get('/contact', homeController.contact);
router.post('/contact', contactValidation.submit, homeController.submitContact);

module.exports = router;