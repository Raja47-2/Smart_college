import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testOptionalPasswordCreation() {
    try {
        console.log("Logging in as Admin...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@college.edu',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Test Student Creation
        const randomId = Math.floor(Math.random() * 10000);
        const newStudent = {
            name: `Test Student ${randomId}`,
            email: `student${randomId}@college.edu`,
            course: 'Engineering',
            department: 'Computer Science',
            year: '1st Year',
            registration_no: `REG-NO-PASS-${randomId}`,
            type: 'Day Scholar',
            password: '' // Empty password
        };
        console.log("Creating Student without password:", newStudent.registration_no);
        await axios.post(`${API_URL}/students`, newStudent, config);
        console.log("SUCCESS: Student created.");

        // Test Faculty Creation
        const newFaculty = {
            name: `Test Faculty ${randomId}`,
            email: `faculty${randomId}@college.edu`,
            department: 'Civil',
            designation: 'Professor',
            registration_no: `FAC-NO-PASS-${randomId}`,
            password: '' // Empty password
        };
        console.log("Creating Faculty without password:", newFaculty.registration_no);
        await axios.post(`${API_URL}/faculty`, newFaculty, config);
        console.log("SUCCESS: Faculty created.");

        // Verify Login with Default Password '123456'
        console.log("Verifying Student Login with default password '123456'...");
        const studentLogin = await axios.post(`${API_URL}/auth/login`, {
            identifier: newStudent.registration_no,
            password: '123456'
        });
        if (studentLogin.data.token) console.log("SUCCESS: Student logged in with default password.");

        console.log("Verifying Faculty Login with default password '123456'...");
        const facultyLogin = await axios.post(`${API_URL}/auth/login`, {
            email: newFaculty.email,
            password: '123456'
        });
        if (facultyLogin.data.token) console.log("SUCCESS: Faculty logged in with default password.");

    } catch (error) {
        console.error("Test Failed:", error.response ? error.response.data : error.message);
    }
}

testOptionalPasswordCreation();
