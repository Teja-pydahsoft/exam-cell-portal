const { masterPool } = require('../config/database');

async function migrate() {
    try {
        console.log('Starting migration: Adding field_category to exam_cell_field_definitions...');
        
        // Check if column already exists
        const [columns] = await masterPool.query('SHOW COLUMNS FROM exam_cell_field_definitions LIKE "field_category"');
        
        if (columns.length === 0) {
            await masterPool.query('ALTER TABLE exam_cell_field_definitions ADD COLUMN field_category VARCHAR(100) DEFAULT "General" AFTER field_options');
            console.log('Migration successful: field_category column added.');
        } else {
            console.log('Migration skipped: field_category column already exists.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
