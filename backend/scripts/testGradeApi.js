const axios = require('axios');

async function testApi() {
    const baseUrl = 'http://localhost:3000/api/regulations/1/grades';
    // This requires a token, so it might fail if run directly without login context.
    // Instead of full API test, I'll just check if the database table has the columns correctly.
    console.log('Skipping remote API test as it requires authentication.');
}

testApi();
