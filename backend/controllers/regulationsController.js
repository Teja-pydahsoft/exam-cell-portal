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
        const { course_id, regulation_id, batch, subject_type } = req.query;

        if (!course_id || !regulation_id || !batch || !subject_type) {
            return res.status(400).json({ success: false, message: 'Missing mapping context parameters' });
        }

        const query = `
            SELECT id, grade_name, min_percentage, points 
            FROM grade_settings 
            WHERE course_id=? AND regulation_id=? AND batch=? AND subject_type=?
            ORDER BY min_percentage DESC`;
        const [rows] = await masterPool.execute(query, [course_id, regulation_id, batch, subject_type]);

        const passQuery = `
            SELECT pass_percentage 
            FROM pass_settings 
            WHERE course_id=? AND regulation_id=? AND batch=? AND subject_type=?`;
        const [passRows] = await masterPool.execute(passQuery, [course_id, regulation_id, batch, subject_type]);
        
        const pass_percentage = passRows.length > 0 ? passRows[0].pass_percentage : '';

        res.status(200).json({ success: true, data: { grades: rows, pass_percentage } });
    } catch (error) {
        console.error('Error in getGradeSettings:', error);
        res.status(500).json({ success: false, message: 'Server error tracking grades' });
    }
};

exports.getPassPercentageSettings = async (req, res) => {
    try {
        const { course_id, regulation_id, batch, subject_type } = req.query;

        let query = `SELECT * FROM pass_settings WHERE 1=1`;
        const params = [];

        if (course_id) { query += ' AND course_id = ?'; params.push(course_id); }
        if (regulation_id) { query += ' AND regulation_id = ?'; params.push(regulation_id); }
        if (batch) { query += ' AND batch = ?'; params.push(batch); }
        if (subject_type) { query += ' AND subject_type = ?'; params.push(subject_type); }

        const [rows] = await masterPool.execute(query, params);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error in getPassPercentageSettings:', error);
        res.status(500).json({ success: false, message: 'Server error fetching pass percentage settings' });
    }
};

exports.savePassPercentageSettings = async (req, res) => {
    try {
        const { course_id, regulation_id, batch, subject_type, pass_percentage } = req.body;

        if (!course_id || !regulation_id || !batch || !subject_type || pass_percentage === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }

        const upsertQuery = `
            INSERT INTO pass_settings (course_id, regulation_id, batch, subject_type, pass_percentage)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE pass_percentage = VALUES(pass_percentage)
        `;
        await masterPool.execute(upsertQuery, [course_id, regulation_id, batch, subject_type, pass_percentage]);

        res.status(200).json({ success: true, message: 'Pass percentage saved successfully' });
    } catch (error) {
        console.error('Error in savePassPercentageSettings:', error);
        res.status(500).json({ success: false, message: 'Server error saving pass percentage settings' });
    }
};

exports.saveGradeSettings = async (req, res) => {
    const connection = await masterPool.getConnection();
    try {
        const { course_id, regulation_id, batch, subject_type, grades, pass_percentage } = req.body;

        if (!course_id || !regulation_id || !batch || !subject_type || !Array.isArray(grades) || pass_percentage === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required context or grade parameters' });
        }

        await connection.beginTransaction();

        // 1. Delete old grades for this context
        const delQuery = `DELETE FROM grade_settings WHERE course_id=? AND regulation_id=? AND batch=? AND subject_type=?`;
        await connection.execute(delQuery, [course_id, regulation_id, batch, subject_type]);

        // 2. Insert new grades
        if (grades.length > 0) {
            const insertQuery = `INSERT INTO grade_settings (course_id, regulation_id, batch, subject_type, grade_name, min_percentage, points) VALUES ?`;
            const values = grades.map(g => [
                course_id,
                regulation_id,
                batch,
                subject_type,
                g.grade_name.trim(),
                g.min_percentage,
                g.points || 0
            ]);
            await connection.query(insertQuery, [values]);
        }

        // 3. Upsert pass percentage
        const upsertPassQuery = `
            INSERT INTO pass_settings (course_id, regulation_id, batch, subject_type, pass_percentage)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE pass_percentage = VALUES(pass_percentage)
        `;
        await connection.execute(upsertPassQuery, [course_id, regulation_id, batch, subject_type, pass_percentage]);

        await connection.commit();
        res.status(200).json({ success: true, message: 'Grade and Pass scheme defined successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error in saveGradeSettings:', error);
        res.status(500).json({ success: false, message: 'Server error saving grading scheme' });
    } finally {
        connection.release();
    }
};
