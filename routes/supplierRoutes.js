const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { supplierValidation } = require('../middleware/validationMiddleware');
const { requireAuth } = require('../middleware/auth');

// All supplier routes require authentication
router.use(requireAuth);

// GET routes
router.get('/', supplierController.index);
router.get('/new', supplierController.new);
router.get('/:id', supplierController.show);
router.get('/:id/edit', supplierController.edit);

// POST routes
router.post('/', supplierValidation.create, supplierController.create);

// PUT routes
router.put('/:id', supplierValidation.update, supplierController.update);

// DELETE routes
router.delete('/:id', supplierController.delete);

// API routes for AJAX
router.get('/api/search', supplierController.search);

module.exports = router;