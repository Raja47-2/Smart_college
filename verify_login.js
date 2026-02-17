import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/login';

const testLogin = async (email, password, role) => {
    try {
        console.log(`Testing login for ${role}...`);
        const response = await axios.post(API_URL, { identifier: email, password });
        if (response.status === 200 && response.data.token) {
            console.log(`✅ Success: ${role} login working. Token received.`);
        } else {
            console.log(`❌ Failed: ${role} login. Status: ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ Error: ${role} login failed.`, error.response ? error.response.data : error.message);
    }
};

const runTests = async () => {
    await testLogin('admin@college.edu', 'admin123', 'admin');
    await testLogin('teacher@college.edu', 'teacher123', 'teacher');
    await testLogin('student@college.edu', 'student123', 'student');
};

runTests();
