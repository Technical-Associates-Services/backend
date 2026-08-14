const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

// Categories (Often products and categories are closely linked in this API)
router.get('/categories', productsController.getCategories);
router.get('/category/:category', productsController.getCategoryBySlug);

// Products
router.get('/products', productsController.getProducts);
router.get('/products/:category', productsController.getProductsByCategory);
router.get('/products/:product/show', productsController.getProductBySlug);

// Enquiries
router.post('/products/:product', productsController.storeEnquiry);

module.exports = router;
