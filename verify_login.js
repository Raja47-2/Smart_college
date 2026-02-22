import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testLogin() {
    console.log("Testing Login...");
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@college.edu',
            password: 'admin123'
        });
        console.log("LOGIN SUCCESS: Token received.");
    } catch (e) {
        console.error("LOGIN FAILED:", e.response?.data || e.message);
    }
}

testLogin();
