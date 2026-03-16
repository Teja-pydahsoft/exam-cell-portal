const { masterPool } = require('../config/database');

exports.getStudents = async (req, res) => {
    try {
        const { college, program, branch, batch, year, sem } = req.query;

        let query = `
            SELECT 
                id, 
                pin_no as rollNo, 
                student_name as name, 
                branch, 
                current_year as year, 
                current_semester as sem, 
                student_status as status,
                email,
                student_mobile as phone,
                gender,
                dob,
                student_address as address,
                father_name as fatherName,
                caste
            FROM students 
            WHERE 1=1
        `;
        const params = [];

        if (college) { query += ' AND college = ?'; params.push(college); }
        if (program) { query += ' AND course = ?'; params.push(program); }
        if (branch) { query += ' AND branch = ?'; params.push(branch); }
        if (batch) { query += ' AND batch = ?'; params.push(batch); }
        if (year) { query += ' AND current_year = ?'; params.push(year); }
        if (sem) { query += ' AND current_semester = ?'; params.push(sem); }

        query += ' ORDER BY rollNo ASC';

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
