const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Note: Apply protect middleware if authentication is required for viewing the directory
router.get('/', studentController.getStudents);
router.put('/promote', authenticateToken, checkRole(['super_admin', 'admin', 'exam_cell']), studentController.promoteStudents);
router.put('/:id/verify', authenticateToken, checkRole(['super_admin', 'admin', 'exam_cell']), studentController.toggleVerification);
router.put('/:id/photo', authenticateToken, checkRole(['super_admin', 'admin', 'exam_cell']), studentController.updateStudentPhoto);
router.put('/:id/signature', authenticateToken, checkRole(['super_admin', 'admin', 'exam_cell']), studentController.updateStudentSignature);

module.exports = router;
