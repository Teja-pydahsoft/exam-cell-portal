const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const sql = `
        CREATE TABLE IF NOT EXISTS grade_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            regulation_id INT NOT NULL,
            grade_name VARCHAR(10) NOT NULL,
            min_percentage DECIMAL(5,2) NOT NULL,
            max_percentage DECIMAL(5,2) NOT NULL,
            points DECIMAL(4,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
