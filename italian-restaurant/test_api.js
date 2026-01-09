const http = require('http');

http.get('http://localhost:3000/api/menu', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Data Preview:', data.substring(0, 200) + '...');
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});