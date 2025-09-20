const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { productValidation } = require('../middleware/validationMiddleware');
const { requireAuth } = require('../middleware/auth');

// All product routes require authentication
router.use(requireAuth);

// GET routes
router.get('/', productController.index);
router.get('/new', productController.new);
router.get('/statistics', productController.statistics);
router.get('/:id', productController.show);
router.get('/:id/edit', productController.edit);

// POST routes
router.post('/', productValidation.create, productController.create);

// PUT routes
router.put('/:id', productValidation.update, productController.update);

// DELETE routes
router.delete('/:id', productController.delete);

// API routes for AJAX
router.get('/api/search', productController.search);
router.get('/api/by-supplier/:supplierId', productController.getBySupplier);

module.exports = router;