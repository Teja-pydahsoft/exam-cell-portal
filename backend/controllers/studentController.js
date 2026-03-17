const { masterPool } = require('../config/database');

exports.getStudents = async (req, res) => {
    try {
        const { college, program, branch, batch, year, sem, search } = req.query;

        let query = `
            SELECT 
                s.id, 
                s.pin_no as rollNo, 
                s.admission_number,
                s.admission_no,
                s.student_name as name, 
                s.college,
                s.course,
                s.branch, 
                s.batch,
                s.current_year as year, 
                s.current_semester as sem, 
                s.student_status as status,
                s.email,
                s.student_mobile as phone,
                s.gender,
                s.dob,
                s.student_address as address,
                s.city_village,
                s.mandal_name,
                s.district,
                s.father_name as fatherName,
                s.parent_mobile1,
                s.parent_mobile2,
                s.caste,
                s.adhar_no,
                s.stud_type,
                s.scholar_status,
                s.admission_date,
                s.fee_status,
                s.registration_status,
                s.exam_cell_verified,
                s.student_photo,
                s.student_signature,
                s.previous_college,
                s.certificates_status,
                s.remarks,
                r.name as regulation
            FROM students s
            LEFT JOIN batch_regulations br ON s.batch COLLATE utf8mb4_unicode_ci = br.batch COLLATE utf8mb4_unicode_ci
            LEFT JOIN regulations r ON br.regulation_id = r.id
            WHERE 1=1
        `;
        const params = [];

        if (college) { query += ' AND s.college = ?'; params.push(college); }
        if (program) { query += ' AND s.course = ?'; params.push(program); }
        if (branch) { query += ' AND s.branch = ?'; params.push(branch); }
        if (batch) { query += ' AND s.batch = ?'; params.push(batch); }
        if (year) { query += ' AND s.current_year = ?'; params.push(year); }
        if (sem) { query += ' AND s.current_semester = ?'; params.push(sem); }
        
        if (search) {
            query += ' AND (s.student_name LIKE ? OR s.pin_no LIKE ? OR s.admission_number LIKE ? OR s.admission_no LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY s.pin_no ASC';

        const [rows] = await masterPool.query(query, params);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Error fetching MySQL students:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch student directory",
            error: error.message
        });
    }
};

exports.toggleVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { verified } = req.body;

        const query = 'UPDATE students SET exam_cell_verified = ? WHERE id = ?';
        const [result] = await masterPool.query(query, [verified ? 1 : 0, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        res.json({
            success: true,
            message: `Student successfully ${verified ? 'verified' : 'unverified'}.`
        });

    } catch (error) {
        console.error("Error toggling verification:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update verification status.",
            error: error.message
        });
    }
};

exports.updateStudentPhoto = async (req, res) => {
    try {
        const { id } = req.params;
        const { photoUrl } = req.body;
        
        if (!photoUrl) {
            return res.status(400).json({ success: false, message: 'Photo data is required' });
        }

        const query = 'UPDATE students SET student_photo = ? WHERE id = ?';
        const [result] = await masterPool.query(query, [photoUrl, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        res.json({ success: true, message: 'Photo updated successfully' });
    } catch (error) {
        console.error("Error updating photo:", error);
        res.status(500).json({ success: false, message: 'Failed to update photo' });
    }
};

exports.updateStudentSignature = async (req, res) => {
    try {
        const { id } = req.params;
        const { signatureUrl } = req.body;
        
        if (!signatureUrl) {
            return res.status(400).json({ success: false, message: 'Signature data is required' });
        }

        const query = 'UPDATE students SET student_signature = ? WHERE id = ?';
        const [result] = await masterPool.query(query, [signatureUrl, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        res.json({ success: true, message: 'Signature updated successfully' });
    } catch (error) {
        console.error("Error updating signature:", error);
        res.status(500).json({ success: false, message: 'Failed to update signature' });
    }
};

exports.promoteStudents = async (req, res) => {
    let connection;
    try {
        const { studentIds, targetYear, targetSem } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide an array of student IDs to promote.' });
        }
        if (!targetYear || !targetSem) {
            return res.status(400).json({ success: false, message: 'Target Year and Target Sem are required.' });
        }

        connection = await masterPool.getConnection();
        await connection.beginTransaction();

        // Update the top-level columns AND update the keys inside the student_data JSON blob
        // to ensure legacy projects reading the raw JSON stay in sync.
        const query = `
            UPDATE students 
            SET 
                current_year = ?, 
                current_semester = ?,
                student_data = JSON_SET(student_data, '$.current_year', CAST(? AS JSON), '$.current_semester', CAST(? AS JSON))
            WHERE id IN (?)
        `;
        const [result] = await connection.query(query, [targetYear, targetSem, targetYear, targetSem, studentIds]);

        await connection.commit();

        res.json({ 
            success: true, 
            message: `Successfully promoted ${result.affectedRows} student(s) to Year ${targetYear}, Sem ${targetSem}.` 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error promoting students:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to promote students. Please try again later.',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};
