const mysql = require('mysql2/promise');
require('dotenv').config();

async function explore() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [tables] = await conn.query('SHOW TABLES');
        console.log('Tables:', tables.map(t => Object.values(t)[0]));

        const tablesToDescribe = ['batches', 'subjects', 'regulation_batches', 'regulations'];
        for (const table of tablesToDescribe) {
            try {
                const [desc] = await conn.query(`DESCRIBE ${table}`);
                console.log(`--- ${table} ---`);
                console.log(desc.map(d => `${d.Field} (${d.Type})`));
            } catch (e) {
                console.log(`Table ${table} not found or error.`);
            }
        }
    } finally {
        await conn.end();
    }
}

explore();
