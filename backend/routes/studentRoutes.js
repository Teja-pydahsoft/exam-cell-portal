const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// Note: Apply protect middleware if authentication is required for viewing the directory
router.get('/', studentController.getStudents);

module.exports = router;
