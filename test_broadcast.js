import axios from 'axios';

const API = 'http://localhost:5000/api';

async function testBroadcast() {
    console.log("Starting Broadcast Notification Test...");

    try {
        // 1. Login as Admin
        const adminLogin = await axios.post(`${API}/auth/login`, {
            email: 'admin@college.edu',
            password: 'admin123'
        });
        const adminToken = adminLogin.data.token;
        console.log("Admin logged in.");

        // 2. Send Broadcast Notification
        const broadcastData = {
            userId: null, // Broadcast
            title: 'Campus Wide Alert - TEST',
            message: 'All classes are cancelled today.'
        };
        const sendNotif = await axios.post(`${API}/notifications`, broadcastData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log("Broadcast notification sent:", sendNotif.data);

        // 3. Login as Student
        const studentLogin = await axios.post(`${API}/auth/login`, {
            email: 'student@college.edu',
            password: 'student123'
        });
        const studentToken = studentLogin.data.token;
        console.log("Student logged in.");

        // 4. Fetch Notifications for Student
        const getNotifs = await axios.get(`${API}/notifications`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });

        const hasBroadcast = getNotifs.data.some(n => n.title === 'Campus Wide Alert - TEST');
        if (hasBroadcast) {
            console.log("SUCCESS: Student received broadcast notification.");
        } else {
            console.error("FAILURE: Student did not receive broadcast notification.");
            console.log("Notifications received:", getNotifs.data);
        }

    } catch (error) {
        console.error("Test Failed:", error.response?.data || error.message);
    }
}

testBroadcast();
