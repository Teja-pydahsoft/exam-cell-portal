const { masterPool } = require('../config/database');

exports.getAllRegulations = async (req, res) => {
    try {
        const { college_id, course_id } = req.query;
        let query = `
            SELECT r.*, c.name as college_name, cr.name as course_name
            FROM regulations r
            LEFT JOIN colleges c ON r.college_id = c.id
            LEFT JOIN courses cr ON r.course_id = cr.id
            WHERE 1=1
        `;
        const params = [];

        if (college_id) { query += ' AND r.college_id = ?'; params.push(college_id); }
        if (course_id) { query += ' AND r.course_id = ?'; params.push(course_id); }

        query += ' ORDER BY r.created_at DESC';

        const [rows] = await masterPool.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching regulations:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch regulations' });
    }
};

exports.createRegulation = async (req, res) => {
    try {
        const { name, college_id, course_id, total_years, semesters_per_year } = req.body;

        const [result] = await masterPool.query(
            'INSERT INTO regulations (name, college_id, course_id, total_years, semesters_per_year) VALUES (?, ?, ?, ?, ?)',
            [name, college_id, course_id, total_years || 4, semesters_per_year || 2]
        );
        res.status(201).json({ success: true, message: 'Regulation created successfully', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'A regulation with this name already exists for the selected scope.' });
        }
        res.status(500).json({ success: false, message: 'Failed to create regulation' });
    }
};

exports.updateRegulation = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, college_id, course_id, total_years, semesters_per_year } = req.body;

        await masterPool.query(
            'UPDATE regulations SET name=?, college_id=?, course_id=?, total_years=?, semesters_per_year=? WHERE id=?',
            [name, college_id, course_id, total_years || 4, semesters_per_year || 2, id]
        );
        res.json({ success: true, message: 'Regulation updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'A regulation with this name already exists in this scope.' });
        }
        res.status(500).json({ success: false, message: 'Failed to update regulation' });
    }
};

exports.deleteRegulation = async (req, res) => {
    try {
        const { id } = req.params;
        await masterPool.query('DELETE FROM regulations WHERE id = ?', [id]);
        res.json({ success: true, message: 'Regulation deleted successfully' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ success: false, message: 'Cannot delete regulation as it has mapped subjects or batches.' });
        }
        res.status(500).json({ success: false, message: 'Failed to delete regulation' });
    }
};

exports.getBatchMappings = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await masterPool.query('SELECT * FROM batch_regulations WHERE regulation_id = ?', [id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch batch mappings' });
    }
};

exports.assignBatches = async (req, res) => {
    const connection = await masterPool.getConnection();
    try {
        const { id } = req.params;
        const { batches } = req.body;

        await connection.beginTransaction();
        await connection.query('DELETE FROM batch_regulations WHERE regulation_id = ?', [id]);

        if (batches && batches.length > 0) {
            const values = batches.map(b => [b, id]);
            await connection.query('INSERT INTO batch_regulations (batch, regulation_id) VALUES ?', [values]);
        }

        await connection.commit();
        res.json({ success: true, message: 'Batches assigned successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'Failed to assign batches' });
    } finally {
        connection.release();
    }
};

exports.getGradeSettings = async (req, res) => {
    try {
        const [rows] = await masterPool.query('SELECT * FROM grade_settings ORDER BY min_percentage DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching global grade settings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch grade settings' });
    }
};

exports.saveGradeSettings = async (req, res) => {
    const connection = await masterPool.getConnection();
    try {
        const { grades } = req.body;

        await connection.beginTransaction();
        await connection.query('DELETE FROM grade_settings');

        if (grades && grades.length > 0) {
            const values = grades.map(g => [
                g.grade_name,
                g.min_percentage,
                g.max_percentage,
                g.points || 0
            ]);
            await connection.query(
                'INSERT INTO grade_settings (grade_name, min_percentage, max_percentage, points) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Global grade settings saved successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error saving global grade settings:', error);
        res.status(500).json({ success: false, message: 'Failed to save grade settings' });
    } finally {
        connection.release();
    }
};
