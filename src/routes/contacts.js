const express = require('express');
const router = express.Router();
const contactsController = require('../controllers/contactsController');

router.post('/contacts', contactsController.storeContact);
router.post('/subscribers', contactsController.storeSubscriber);

module.exports = router;
