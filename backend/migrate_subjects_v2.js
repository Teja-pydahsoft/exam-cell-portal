const { masterPool } = require('./config/database');

async function migrate() {
    let connection;
    try {
        connection = await masterPool.getConnection();
        await connection.beginTransaction();

        console.log('1. Adding new columns to subjects table...');
        
        const columnsToAdd = [
            { name: 'subject_order', type: 'INT' },
            { name: 'short_name', type: 'VARCHAR(255)' },
            { name: 'is_elective', type: 'TINYINT(1) DEFAULT 0' },
            { name: 'elective_name', type: 'VARCHAR(255)' },
            { name: 'is_replacement', type: 'TINYINT(1) DEFAULT 0' },
            { name: 'internal_max_marks', type: 'INT' },
            { name: 'external_max_marks', type: 'INT' },
            { name: 'sub_type', type: 'INT DEFAULT 0' },
            { name: 'is_running_regulation', type: 'TINYINT(1) DEFAULT 1' },
            { name: 'is_common_subject', type: 'TINYINT(1) DEFAULT 0' },
            { name: 'exam_code', type: 'VARCHAR(50)' }
        ];

        for (const col of columnsToAdd) {
            const [exists] = await connection.query(`SHOW COLUMNS FROM subjects LIKE '${col.name}'`);
            if (exists.length === 0) {
                console.log(`   Adding ${col.name}...`);
                await connection.query(`ALTER TABLE subjects ADD COLUMN ${col.name} ${col.type}`);
            } else {
                console.log(`   ${col.name} already exists - skipping.`);
            }
        }

        await connection.commit();
        console.log('✅ Migration complete!');
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('❌ Migration failed:', err.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

migrate();
