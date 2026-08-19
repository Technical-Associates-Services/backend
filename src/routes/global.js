const express = require('express');
const router = express.Router();
const globalController = require('../controllers/globalController');

// Associates
router.get('/associates', globalController.getAssociates);

// Sister Concerns
router.get('/sister-concern', globalController.getSisterConcerns);

// Testimonials
router.get('/testimonials', globalController.getTestimonials);

// Banners
router.get('/banners', globalController.getBanners);

// Brands
router.get('/brands', globalController.getBrands);

// FAQs
router.get('/faqs', globalController.getFaqs);

// Services
router.get('/services', globalController.getServices);
router.get('/services/:service', globalController.getServiceBySlug);

// Plugins
router.get('/plugins', globalController.getPlugins);

// Pages
router.get('/pages', globalController.getPages);
router.get('/pages/:page', globalController.getPageBySlug);

// Solutions
router.get('/solutions', globalController.getSolutions);
router.get('/solutions/:solution', globalController.getSolutionBySlug);

// References
router.get('/references', globalController.getReferences);

module.exports = router;
