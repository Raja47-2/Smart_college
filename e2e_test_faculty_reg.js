import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testFacultyRegistration() {
    try {
        console.log("Logging in as Admin...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@college.edu',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log("Logged in successfully. Token:", token ? "YES" : "NO");

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        const randomId = Math.floor(Math.random() * 1000);
        const newFaculty = {
            name: `Test Faculty ${randomId}`,
            email: `testfaculty${randomId}@college.edu`,
            department: 'Computer Science',
            designation: 'Lecturer',
            registration_no: `FAC-TEST-${randomId}`,
            password: 'password123'
        };

        console.log("Adding new faculty member:", newFaculty);
        const addRes = await axios.post(`${API_URL}/faculty`, newFaculty, config);
        console.log("Add Faculty Response:", addRes.data);

        if (addRes.data.registration_no === newFaculty.registration_no) {
            console.log("SUCCESS: Registration number persisted correctly in response.");
        } else {
            console.error("FAILURE: Registration number mismatch in response.");
        }

        console.log("Fetching faculty list...");
        const listRes = await axios.get(`${API_URL}/faculty`, config);
        const addedMember = listRes.data.find(f => f.email === newFaculty.email);

        if (addedMember && addedMember.registration_no === newFaculty.registration_no) {
            console.log("SUCCESS: Registration number found in faculty list.");
        } else {
            console.error("FAILURE: Registration number not found in faculty list.", addedMember);
        }

    } catch (error) {
        console.error("Test Failed:", error.response ? error.response.data : error.message);
    }
}

testFacultyRegistration();
