const express = require('express');
const router = express.Router();
const blogsController = require('../controllers/blogsController');

router.get('/blogs', blogsController.getBlogs);
router.get('/blogs/:blog', blogsController.getBlogBySlug);
router.get('/blogs/categories/:blog_category', blogsController.getBlogsByCategory);

module.exports = router;
