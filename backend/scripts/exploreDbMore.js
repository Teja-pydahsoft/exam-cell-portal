const mysql = require('mysql2/promise');
require('dotenv').config();

async function exploreMore() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const tablesToDescribe = ['batch_regulations', 'academic_years', 'academic_content', 'masters'];
        for (const table of tablesToDescribe) {
            try {
                const [desc] = await conn.query(`DESCRIBE ${table}`);
                console.log(`--- ${table} ---`);
                console.log(desc.map(d => `${d.Field} (${d.Type})`));
                
                // Peek at some data if it's a mapping table
                if (table === 'batch_regulations' || table === 'masters') {
                    const [data] = await conn.query(`SELECT * FROM ${table} LIMIT 5`);
                    console.log(`Data for ${table}:`, data);
                }
            } catch (e) {
                console.log(`Table ${table} not found or error.`);
            }
        }
    } finally {
        await conn.end();
    }
}

exploreMore();
