const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTable() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Create pass_settings table
        const createQuery = `
        CREATE TABLE IF NOT EXISTS pass_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT NOT NULL,
            regulation_id INT NOT NULL,
            batch VARCHAR(20) NOT NULL,
            subject_type VARCHAR(50) NOT NULL,
            pass_percentage DECIMAL(5,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uni_scope (course_id, regulation_id, batch, subject_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(createQuery);
        console.log("Pass settings table created successfully.");
        await connection.end();

    } catch (err) {
        console.error("Error creating pass_settings table:", err);
    }
}

createTable();
