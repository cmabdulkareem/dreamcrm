import axios from 'axios';
import fs from 'fs';

async function testApi() {
    try {
        const token = 'jp9gg8stq15zgyr62dzpc';
        const url = `http://localhost:3000/api/batches/public/${token}?month=2&year=2026`;
        console.log(`Calling ${url}`);
        const res = await axios.get(url);
        fs.writeFileSync('api_response.json', JSON.stringify(res.data, null, 2));
        console.log('Success! Response written to api_response.json');
    } catch (err) {
        console.error('API Error:', err.message);
        if (err.response) {
            fs.writeFileSync('api_response.json', JSON.stringify({
                status: err.response.status,
                data: err.response.data
            }, null, 2));
        } else {
            fs.writeFileSync('api_response.json', err.toString());
        }
    }
}

testApi();
