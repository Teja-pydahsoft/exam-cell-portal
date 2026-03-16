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
