const express = require('express');
const router = express.Router();
const controller = require('../controllers/subjectsController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticateToken, controller.getAllSubjects);
router.get('/template', authenticateToken, controller.downloadTemplate);
router.post('/', authenticateToken, controller.createSubject);
router.post('/upload', authenticateToken, upload.single('file'), controller.bulkUpload);
router.put('/:id', authenticateToken, controller.updateSubject);
router.delete('/:id', authenticateToken, controller.deleteSubject);

module.exports = router;
