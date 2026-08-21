const express = require('express');
const router = express.Router();
const contactsController = require('../controllers/contactsController');
const { submissionLimiter } = require('../middleware/rateLimiter');

router.post('/contacts', submissionLimiter, contactsController.storeContact);
router.post('/subscribers', submissionLimiter, contactsController.storeSubscriber);

module.exports = router;
