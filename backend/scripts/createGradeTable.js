const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    await connection.query('DROP TABLE IF EXISTS grade_settings');

    const sql = `
        CREATE TABLE grade_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT NOT NULL,
            regulation_id INT NOT NULL,
            batch VARCHAR(20) NOT NULL,
            subject_type VARCHAR(50) NOT NULL,
            grade_name VARCHAR(10) NOT NULL,
            min_percentage DECIMAL(5,2) NOT NULL,
            points DECIMAL(4,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE
        )
    `;

    try {
        await connection.query(sql);
        console.log('Grade settings table created successfully');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        await connection.end();
    }
}

createTable();
