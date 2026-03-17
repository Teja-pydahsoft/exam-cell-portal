const express = require('express');
const router = express.Router();
const examCellController = require('../controllers/examCellController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// All routes are protected and for admins/exam_cell roles
router.use(authenticateToken);

// Field Definitions
router.get('/fields', examCellController.getFieldDefinitions);
router.post('/fields', checkRole(['super_admin', 'admin', 'exam_cell']), examCellController.addFieldDefinition);
router.put('/fields/:id', checkRole(['super_admin', 'admin', 'exam_cell']), examCellController.updateFieldDefinition);
router.delete('/fields/:id', checkRole(['super_admin', 'admin', 'exam_cell']), examCellController.deleteFieldDefinition);

// Student Values
router.get('/student-values/:studentId', examCellController.getStudentValues);
router.post('/student-values/:studentId', checkRole(['super_admin', 'admin', 'exam_cell']), examCellController.updateStudentValues);

module.exports = router;
