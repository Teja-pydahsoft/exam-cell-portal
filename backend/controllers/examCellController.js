const { masterPool } = require('../config/database');

// Field Definitions
exports.getFieldDefinitions = async (req, res) => {
    try {
        const [rows] = await masterPool.query('SELECT * FROM exam_cell_field_definitions ORDER BY created_at ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching field definitions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch field definitions' });
    }
};

exports.addFieldDefinition = async (req, res) => {
    const { label, type, options, category } = req.body;
    if (!label || !type) {
        return res.status(400).json({ success: false, message: 'Label and Type are required' });
    }
    try {
        const [result] = await masterPool.query(
            'INSERT INTO exam_cell_field_definitions (field_label, field_type, field_options, field_category) VALUES (?, ?, ?, ?)',
            [label, type, options ? JSON.stringify(options) : null, category || 'General']
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Error adding field definition:', error);
        res.status(500).json({ success: false, message: 'Failed to add field definition' });
    }
};

exports.updateFieldDefinition = async (req, res) => {
    const { id } = req.params;
    const { label, type, options, category } = req.body;
    
    if (!label || !type) {
        return res.status(400).json({ success: false, message: 'Label and Type are required' });
    }

    try {
        await masterPool.query(
            'UPDATE exam_cell_field_definitions SET field_label = ?, field_type = ?, field_options = ?, field_category = ? WHERE id = ?',
            [label, type, options ? JSON.stringify(options) : null, category || 'General', id]
        );
        res.json({ success: true, message: 'Field definition updated successfully' });
    } catch (error) {
        console.error('Error updating field definition:', error);
        res.status(500).json({ success: false, message: 'Failed to update field definition' });
    }
};

exports.deleteFieldDefinition = async (req, res) => {
    const { id } = req.params;
    try {
        await masterPool.query('DELETE FROM exam_cell_field_definitions WHERE id = ?', [id]);
        res.json({ success: true, message: 'Field definition deleted successfully' });
    } catch (error) {
        console.error('Error deleting field definition:', error);
        res.status(500).json({ success: false, message: 'Failed to delete field definition' });
    }
};

// Student Values
exports.getStudentValues = async (req, res) => {
    const { studentId } = req.params;
    try {
        // Fetch values for this student
        const [values] = await masterPool.query(
            'SELECT field_id, field_value FROM exam_cell_student_values WHERE student_id = ?',
            [studentId]
        );
        res.json({ success: true, data: values });
    } catch (error) {
        console.error('Error fetching student values:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch student values' });
    }
};

exports.updateStudentValues = async (req, res) => {
    const { studentId } = req.params;
    const { fieldValues } = req.body; // Array of {fieldId, value}

    if (!Array.isArray(fieldValues)) {
        return res.status(400).json({ success: false, message: 'fieldValues must be an array' });
    }

    try {
        // First, check if student is verified
        const [student] = await masterPool.query('SELECT exam_cell_verified FROM students WHERE id = ?', [studentId]);
        if (!student.length || !student[0].exam_cell_verified) {
            return res.status(403).json({ success: false, message: 'Only verified students can have additional details updated.' });
        }

        // Batch update/insert values
        for (const item of fieldValues) {
            await masterPool.query(
                'INSERT INTO exam_cell_student_values (student_id, field_id, field_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE field_value = ?',
                [studentId, item.fieldId, item.value, item.value]
            );
        }

        res.json({ success: true, message: 'Student values updated successfully' });
    } catch (error) {
        console.error('Error updating student values:', error);
        res.status(500).json({ success: false, message: 'Failed to update student values' });
    }
};
