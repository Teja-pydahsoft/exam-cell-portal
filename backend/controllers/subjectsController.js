const { masterPool } = require('../config/database');

// GET all subjects with advanced filtering
exports.getAllSubjects = async (req, res) => {
    try {
        const { regulation_id, branch_id, batch, year_of_study, semester_number } = req.query;

        let activeRegulationId = regulation_id;

        // Auto-resolve regulation from batch if needed
        if (batch && !activeRegulationId) {
            const [batchRegs] = await masterPool.query('SELECT regulation_id FROM batch_regulations WHERE batch = ?', [batch]);
            if (batchRegs.length > 0) {
                activeRegulationId = batchRegs[0].regulation_id;
            } else {
                return res.json({ success: true, data: [] });
            }
        }

        let whereClause = 'WHERE 1=1';
        const queryParams = [];

        if (activeRegulationId) {
            whereClause += ' AND s.regulation_id = ?';
            queryParams.push(activeRegulationId);
        }
        if (branch_id) {
            whereClause += ' AND s.branch_id = ?';
            queryParams.push(branch_id);
        }
        if (year_of_study) {
            whereClause += ' AND s.year_of_study = ?';
            queryParams.push(year_of_study);
        }
        if (semester_number) {
            whereClause += ' AND s.semester_number = ?';
            queryParams.push(semester_number);
        }

        const query = `
            SELECT s.*, r.name as regulation_name, r.college_id, r.course_id,
                   b.name as branch_name
            FROM subjects s
            LEFT JOIN regulations r ON s.regulation_id = r.id
            LEFT JOIN course_branches b ON s.branch_id = b.id
            ${whereClause}
            ORDER BY s.year_of_study ASC, s.semester_number ASC, s.name ASC
        `;

        const [rows] = await masterPool.query(query, queryParams);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST create subject
exports.createSubject = async (req, res) => {
    try {
        const {
            regulation_id, branch_id, year_of_study, semester_number,
            name, code, subject_type, units, experiments_count, credits,
            subject_order, short_name, is_elective, elective_name,
            is_replacement, internal_max_marks, external_max_marks,
            sub_type, is_running_regulation, is_common_subject, exam_code
        } = req.body;

        if (!regulation_id || !name || !year_of_study || !semester_number) {
            return res.status(400).json({ success: false, message: 'Regulation, Year, Semester, and Name are required' });
        }

        const query = `
            INSERT INTO subjects 
            (regulation_id, branch_id, year_of_study, semester_number, name, code, subject_type, units, experiments_count, credits, is_active,
             subject_order, short_name, is_elective, elective_name, is_replacement, internal_max_marks, external_max_marks,
             sub_type, is_running_regulation, is_common_subject, exam_code) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            regulation_id, branch_id || null, year_of_study, semester_number,
            name, code || null, subject_type || 'theory',
            units || null, experiments_count || null, credits || null,
            subject_order || null, short_name || null, is_elective || 0, elective_name || null,
            is_replacement || 0, internal_max_marks || null, external_max_marks || null,
            sub_type || 0, is_running_regulation === undefined ? 1 : is_running_regulation,
            is_common_subject || 0, exam_code || null
        ];

        const [result] = await masterPool.query(query, values);
        const [newSubject] = await masterPool.query('SELECT * FROM subjects WHERE id = ?', [result.insertId]);

        res.status(201).json({ success: true, message: 'Subject created successfully', data: newSubject[0] });
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT update subject
exports.updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            branch_id, year_of_study, semester_number, name, code, subject_type, units, experiments_count, credits, is_active,
            subject_order, short_name, is_elective, elective_name, is_replacement, internal_max_marks, external_max_marks,
            sub_type, is_running_regulation, is_common_subject, exam_code
        } = req.body;

        const [existing] = await masterPool.query('SELECT id FROM subjects WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        const query = `
            UPDATE subjects SET 
                branch_id = COALESCE(?, branch_id),
                year_of_study = COALESCE(?, year_of_study),
                semester_number = COALESCE(?, semester_number),
                name = COALESCE(?, name),
                code = ?,
                subject_type = COALESCE(?, subject_type),
                units = ?,
                experiments_count = ?,
                credits = ?,
                is_active = COALESCE(?, is_active),
                subject_order = ?,
                short_name = ?,
                is_elective = ?,
                elective_name = ?,
                is_replacement = ?,
                internal_max_marks = ?,
                external_max_marks = ?,
                sub_type = ?,
                is_running_regulation = ?,
                is_common_subject = ?,
                exam_code = ?
            WHERE id = ?
        `;
        const values = [
            branch_id || null, year_of_study, semester_number, name,
            code || null, subject_type, units || null, experiments_count || null,
            credits || null, is_active,
            subject_order || null, short_name || null, is_elective || 0, elective_name || null,
            is_replacement || 0, internal_max_marks || null, external_max_marks || null,
            sub_type || 0, is_running_regulation === undefined ? 1 : is_running_regulation,
            is_common_subject || 0, exam_code || null,
            id
        ];

        await masterPool.query(query, values);
        const [updated] = await masterPool.query('SELECT * FROM subjects WHERE id = ?', [id]);
        res.json({ success: true, message: 'Subject updated', data: updated[0] });
    } catch (error) {
        console.error('Error updating subject:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE subject
exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await masterPool.query('SELECT id FROM subjects WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        await masterPool.query('DELETE FROM subjects WHERE id = ?', [id]);
        res.json({ success: true, message: 'Subject deleted' });
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET template for bulk upload
exports.downloadTemplate = async (req, res) => {
    try {
        const headers = [
            'subject order', 'sub code', 'short name', 'sub name', 
            'elective(0- No, 1 - Yes)', 'elective name', 'replacement(0- No, 1- Yes)',
            'internal Max', 'External Max', 
            'Sub type(0-theary,1-lab, 2- dr, 3- pr, 4-others, 5-skill oriented course, 6-integrted, 7-audit, 8-mandatory, 9-community service project, 10-internship, 11-mini project, 12-semister)',
            'credits', 'running regulation(0 - no , 1 - Yes)', 'Commonsubject(0 - no 1 -yes)', 'Exam code'
        ];
        
        const csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=subject_upload_template.csv');
        res.status(200).send(csvContent);
    } catch (error) {
        console.error('Error in downloadTemplate:', error);
        res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
};

// POST bulk upload subjects
exports.bulkUpload = async (req, res) => {
    let connection;
    try {
        const { regulation_id, branch_id, year_of_study, semester_number } = req.body;
        
        if (!regulation_id || !year_of_study || !semester_number) {
            return res.status(400).json({ success: false, message: 'Regulation, Year, and Semester are required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const csvData = req.file.buffer.toString('utf8');
        const lines = csvData.split(/\r?\n/);
        
        if (lines.length <= 1) {
            return res.status(400).json({ success: false, message: 'File is empty or contains only headers' });
        }

        connection = await masterPool.getConnection();
        await connection.beginTransaction();

        const insertQuery = `
            INSERT INTO subjects 
            (regulation_id, branch_id, year_of_study, semester_number, 
             subject_order, code, short_name, name, is_elective, elective_name, 
             is_replacement, internal_max_marks, external_max_marks, sub_type, 
             credits, is_running_regulation, is_common_subject, exam_code,
             subject_type, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `;

        let successCount = 0;
        let skipCount = 0;

        // Helper to parse CSV line respecting quotes
        const parseLine = (line) => {
            const values = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                if (line[i] === '"') inQuotes = !inQuotes;
                else if (line[i] === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else current += line[i];
            }
            values.push(current.trim());
            return values;
        };

        // Skip header line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = parseLine(line);
            
            // Expected 14 fields
            if (values.length < 4) { // Minimum requirement: name (index 3)
                skipCount++;
                continue;
            }

            const subjectOrder = parseInt(values[0]) || null;
            const code = values[1] || null;
            const shortName = values[2] || null;
            const name = values[3];
            const isElective = parseInt(values[4]) || 0;
            const electiveName = values[5] || null;
            const isReplacement = parseInt(values[6]) || 0;
            const internalMax = parseInt(values[7]) || null;
            const externalMax = parseInt(values[8]) || null;
            const subType = parseInt(values[9]) || 0;
            const credits = parseFloat(values[10]) || null;
            const isRunningReg = values[11] === '0' ? 0 : 1;
            const isCommon = parseInt(values[12]) || 0;
            const examCode = values[13] || null;

            // Derived subject_type (legacy support)
            const subjectType = subType === 1 ? 'lab' : 'theory';

            if (!name) {
                skipCount++;
                continue;
            }

            await connection.query(insertQuery, [
                regulation_id, branch_id || null, year_of_study, semester_number,
                subjectOrder, code, shortName, name, isElective, electiveName,
                isReplacement, internalMax, externalMax, subType,
                credits, isRunningReg, isCommon, examCode,
                subjectType
            ]);
            successCount++;
        }

        await connection.commit();
        res.json({ 
            success: true, 
            message: `Successfully imported ${successCount} subjects. ${skipCount} lines skipped.`,
            data: { successCount, skipCount }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error in bulkUpload:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};
