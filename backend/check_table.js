const { masterPool } = require('./config/database');

async function checkTable() {
    try {
        const [rows] = await masterPool.query('DESCRIBE exam_cell_field_definitions');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkTable();
