const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const uploadController = require('../controllers/admin/uploadController');
const categoriesController = require('../controllers/admin/categoriesController');
const productsController = require('../controllers/admin/productsController');
const bannersController = require('../controllers/admin/bannersController');
const blogsController = require('../controllers/admin/blogsController');
const testimonialsController = require('../controllers/admin/testimonialsController');
const usersController = require('../controllers/admin/usersController');
const brandsController = require('../controllers/admin/brandsController');
const inboxController = require('../controllers/admin/inboxController');

// Phase 1 Controllers
const servicesController = require('../controllers/admin/servicesController');
const solutionsController = require('../controllers/admin/solutionsController');
const concernsController = require('../controllers/admin/concernsController');
const associatesController = require('../controllers/admin/associatesController');

// All admin routes must be protected
router.use(authMiddleware);

// --- Media Upload ---
router.post('/upload', uploadController.uploadMiddleware, uploadController.uploadImage);

// --- Categories ---
router.post('/categories', categoriesController.createCategory);
router.put('/categories/:id', categoriesController.updateCategory);
router.delete('/categories/:id', categoriesController.deleteCategory);

// --- Products ---
router.post('/products', productsController.createProduct);
router.put('/products/:id', productsController.updateProduct);
router.delete('/products/:id', productsController.deleteProduct);

// --- Banners ---
router.post('/banners', bannersController.createBanner);
router.put('/banners/:id', bannersController.updateBanner);
router.delete('/banners/:id', bannersController.deleteBanner);

// --- Blogs ---
router.post('/blogs', blogsController.createBlog);
router.put('/blogs/:id', blogsController.updateBlog);
router.delete('/blogs/:id', blogsController.deleteBlog);

// --- Users ---
router.get('/users', usersController.getUsers);
router.post('/users', usersController.createUser);
router.put('/users/:id', usersController.updateUser);
router.delete('/users/:id', usersController.deleteUser);

// --- Testimonials ---
router.post('/testimonials', testimonialsController.createTestimonial);
router.put('/testimonials/:id', testimonialsController.updateTestimonial);
router.delete('/testimonials/:id', testimonialsController.deleteTestimonial);

// --- Brands ---
router.post('/brands', brandsController.createBrand);
router.put('/brands/:id', brandsController.updateBrand);
router.delete('/brands/:id', brandsController.deleteBrand);

// --- Inbox: Contacts & Subscribers ---
router.get('/contacts', inboxController.getContacts);
router.delete('/contacts/:id', inboxController.deleteContact);
router.get('/subscribers', inboxController.getSubscribers);
router.delete('/subscribers/:id', inboxController.deleteSubscriber);

// ============================================
// PHASE 1 ROUTES
// ============================================

// --- Services ---
router.get('/services', servicesController.getAllServices);
router.post('/services', servicesController.createService);
router.put('/services/:id', servicesController.updateService);
router.delete('/services/:id', servicesController.deleteService);

// --- Solutions ---
router.get('/solutions', solutionsController.getAllSolutions);
router.post('/solutions', solutionsController.createSolution);
router.put('/solutions/:id', solutionsController.updateSolution);
router.delete('/solutions/:id', solutionsController.deleteSolution);

// --- Sister Concerns ---
router.get('/concerns', concernsController.getAllConcerns);
router.post('/concerns', concernsController.createConcern);
router.put('/concerns/:id', concernsController.updateConcern);
router.delete('/concerns/:id', concernsController.deleteConcern);

// --- Associates ---
router.get('/associates', associatesController.getAllAssociates);
router.post('/associates', associatesController.createAssociate);
router.put('/associates/:id', associatesController.updateAssociate);
router.delete('/associates/:id', associatesController.deleteAssociate);
router.get('/associate-categories', associatesController.getAllAssociateCategories);

// ============================================
// PHASE 2 ROUTES
// ============================================
const referencesController = require('../controllers/admin/referencesController');
const cataloguesController = require('../controllers/admin/cataloguesController');
const jobsController = require('../controllers/admin/jobsController');
const candidatesController = require('../controllers/admin/candidatesController');

// --- References ---
router.get('/references', referencesController.getAllReferences);
router.post('/references', referencesController.createReference);
router.put('/references/:id', referencesController.updateReference);
router.delete('/references/:id', referencesController.deleteReference);
router.get('/reference-categories', referencesController.getAllReferenceCategories);

// --- Catalogues ---
router.get('/catalogues', cataloguesController.getAllCatalogues);
router.post('/catalogues', cataloguesController.createCatalogue);
router.put('/catalogues/:id', cataloguesController.updateCatalogue);
router.delete('/catalogues/:id', cataloguesController.deleteCatalogue);

// --- Jobs ---
router.get('/jobs', jobsController.getAllJobs);
router.post('/jobs', jobsController.createJob);
router.put('/jobs/:id', jobsController.updateJob);
router.delete('/jobs/:id', jobsController.deleteJob);

// --- Candidates ---
router.get('/candidates', candidatesController.getAllCandidates);
router.delete('/candidates/:id', candidatesController.deleteCandidate);

// ============================================
// PHASE 3 ROUTES
// ============================================
const pagesController = require('../controllers/admin/pagesController');
const blogCategoriesController = require('../controllers/admin/blogCategoriesController');
const faqsController = require('../controllers/admin/faqsController');

// --- Pages ---
router.get('/pages', pagesController.getAllPages);
router.post('/pages', pagesController.createPage);
router.put('/pages/:id', pagesController.updatePage);
router.delete('/pages/:id', pagesController.deletePage);

// --- Blog Categories ---
router.get('/blog-categories', blogCategoriesController.getAllBlogCategories);
router.post('/blog-categories', blogCategoriesController.createBlogCategory);
router.put('/blog-categories/:id', blogCategoriesController.updateBlogCategory);
router.delete('/blog-categories/:id', blogCategoriesController.deleteBlogCategory);

// --- FAQs ---
router.get('/faqs', faqsController.getAllFaqs);
router.post('/faqs', faqsController.createFaq);
router.put('/faqs/:id', faqsController.updateFaq);
router.delete('/faqs/:id', faqsController.deleteFaq);

// ============================================
// PHASE 4 ROUTES
// ============================================
const shopsController = require('../controllers/admin/shopsController');
const enquiriesController = require('../controllers/admin/enquiriesController');
const reviewsController = require('../controllers/admin/reviewsController');
const pluginsController = require('../controllers/admin/pluginsController');

// --- Shops ---
router.get('/shops', shopsController.getAllShops);
router.post('/shops', shopsController.createShop);
router.put('/shops/:id', shopsController.updateShop);
router.delete('/shops/:id', shopsController.deleteShop);

// --- Product Enquiries ---
router.get('/enquiries', enquiriesController.getAllEnquiries);
router.delete('/enquiries/:id', enquiriesController.deleteEnquiry);

// --- Product Reviews ---
router.get('/reviews', reviewsController.getAllReviews);
router.put('/reviews/:id/status', reviewsController.updateReviewStatus);
router.delete('/reviews/:id', reviewsController.deleteReview);

// --- Plugins ---
router.get('/plugins', pluginsController.getAllPlugins);
router.post('/plugins', pluginsController.createPlugin);
router.put('/plugins/:id', pluginsController.updatePlugin);
router.delete('/plugins/:id', pluginsController.deletePlugin);

module.exports = router;
