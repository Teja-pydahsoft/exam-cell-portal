const { masterPool } = require('../config/database');
const HrmsEmployee = require('../models/HrmsEmployee');

// GET all assignments for a Subject + Batch
exports.getAssignedFaculty = async (req, res) => {
    try {
        const { subject_id, batch } = req.query;
        let whereClause = 'WHERE fs.subject_id = ?';
        let params = [subject_id];

        if (batch) {
            whereClause += ' AND fs.batch = ?';
            params.push(batch);
        }

        const [rows] = await masterPool.query(`
            SELECT fs.*, s.name as subject_name 
            FROM faculty_subjects fs
            JOIN subjects s ON s.id = fs.subject_id
            ${whereClause}
        `, params);

        // Populate employee names from MongoDB
        const employeeIds = rows.map(r => r.employee_id);
        const employees = await HrmsEmployee.find({ _id: { $in: employeeIds } }).select('employee_name department designation emp_no');
        const empMap = {};
        employees.forEach(emp => {
            empMap[emp._id.toString()] = emp;
        });

        const enriched = rows.map(r => {
            const emp = empMap[String(r.employee_id)];
            let deptName = emp?.department || 'Unknown';
            if (typeof deptName === 'string' && deptName.startsWith('{')) {
                try { deptName = JSON.parse(deptName).name || deptName; } catch(e){}
            }

            return {
                ...r,
                employee_name: emp?.employee_name || 'Unknown',
                emp_no: emp?.emp_no || '',
                department: deptName,
                designation: emp?.designation || ''
            };
        });

        res.json({ success: true, data: enriched });
    } catch (error) {
        console.error('Error fetching assigned faculty:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST assign an employee to a subject
exports.assignFaculty = async (req, res) => {
    try {
        const { employee_id, subject_id, batch } = req.body;

        if (!employee_id || !subject_id) {
            return res.status(400).json({ success: false, message: 'employee_id and subject_id are required' });
        }

        // Validate employee exists in MongoDB
        const emp = await HrmsEmployee.findById(employee_id);
        if (!emp) {
            return res.status(404).json({ success: false, message: 'Employee not found in HRMS' });
        }

        // Check if already assigned
        const [existing] = await masterPool.query(
            'SELECT id FROM faculty_subjects WHERE employee_id = ? AND subject_id = ? AND (batch = ? OR (batch IS NULL AND ? IS NULL))',
            [employee_id, subject_id, batch || null, batch || null]
        );

        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Faculty already assigned to this subject/batch' });
        }

        // --- VALIDATION: Check Timetable Overlaps & Workload limits ---
        // Fetch ALL timetable entries for the TARGET subject/batch
        const [targetSlots] = await masterPool.query(`
            SELECT t.day_of_week, t.period_slot_id, p.start_time, p.end_time 
            FROM timetable_entries t
            JOIN period_slots p ON p.id = t.period_slot_id
            WHERE t.subject_id = ? AND (t.batch = ? OR (t.batch IS NULL AND ? IS NULL))
        `, [subject_id, batch || null, batch || null]);

        if (targetSlots.length > 0) {
            // Find all subjects this employee is ALREADY assigned to
            const [empSubjects] = await masterPool.query(
                'SELECT subject_id, batch FROM faculty_subjects WHERE employee_id = ?', 
                [employee_id]
            );

            if (empSubjects.length > 0) {
                // Construct condition to get all their existing timetable slots
                const conditions = empSubjects.map(es => 
                    `(t.subject_id = ${es.subject_id} AND ${es.batch ? `t.batch = '${es.batch}'` : 't.batch IS NULL'})`
                ).join(' OR ');

                const [empSlots] = await masterPool.query(`
                    SELECT t.day_of_week, t.period_slot_id, p.start_time, p.end_time 
                    FROM timetable_entries t
                    JOIN period_slots p ON p.id = t.period_slot_id
                    WHERE ${conditions}
                `);

                // 1. Check for Overlap
                for (let ts of targetSlots) {
                    const overlap = empSlots.find(es => es.day_of_week === ts.day_of_week && es.period_slot_id === ts.period_slot_id);
                    if (overlap) {
                        return res.status(400).json({ 
                            success: false, 
                            message: `Overlap error: ${emp.employee_name} already has a class on ${ts.day_of_week} during slot ${ts.period_slot_id}` 
                        });
                    }
                }

                // 2. Check 7-hour daily limit
                // Approximate 1 span = 1 hour usually, or count unique slots per day
                const slotsPerDay = {};
                [...empSlots, ...targetSlots].forEach(slot => {
                    slotsPerDay[slot.day_of_week] = (slotsPerDay[slot.day_of_week] || 0) + 1;
                });

                for (let [day, count] of Object.entries(slotsPerDay)) {
                    if (count > 7) {
                        return res.status(400).json({ 
                            success: false, 
                            message: `Workload limit exceeded: ${emp.employee_name} would have ${count} hours on ${day} (Max 7 hours)` 
                        });
                    }
                }
            }
        }

        // Safe to insert
        const [result] = await masterPool.query(
            'INSERT INTO faculty_subjects (employee_id, subject_id, batch) VALUES (?, ?, ?)',
            [employee_id, subject_id, batch || null]
        );

        res.status(201).json({ success: true, message: 'Faculty assigned successfully', data: { id: result.insertId } });

    } catch (error) {
        console.error('Error assigning faculty:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE unassign
exports.unassignFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await masterPool.query('DELETE FROM faculty_subjects WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        res.json({ success: true, message: 'Faculty unassigned successfully' });
    } catch (error) {
        console.error('Error unassigning faculty:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
