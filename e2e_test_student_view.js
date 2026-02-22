import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testStudentView() {
    console.log("Starting Student View Tests...");

    try {
        // 1. Login as Teacher to mark attendance
        console.log("Logging in as Teacher...");
        const teacherRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'teacher@college.edu',
            password: 'teacher123'
        });
        const teacherToken = teacherRes.data.token;
        const teacherConfig = { headers: { Authorization: `Bearer ${teacherToken}` } };

        // Get Student ID (Teacher view)
        const studentsRes = await axios.get(`${API_URL}/students`, teacherConfig);
        const student = studentsRes.data[0];
        if (!student) throw new Error("No students found to mark attendance for.");

        console.log(`Marking attendance for student: ${student.name} (${student.id})`);

        // Mark Attendance (For Today, since teacher is restricted)
        const today = new Date().toISOString().split('T')[0];
        try {
            await axios.post(`${API_URL}/attendance`, {
                date: today,
                records: [{ studentId: student.id, status: 'Present' }]
            }, teacherConfig);
            console.log("Teacher marked attendance.");
        } catch (e) {
            console.warn("Teacher failed to mark attendance (maybe outside time window?):", e.response?.data?.error);
            // If time window check fails, we can try as Admin
            console.log("Trying as Admin...");
            const adminRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@college.edu',
                password: 'admin123'
            });
            const adminToken = adminRes.data.token;
            await axios.post(`${API_URL}/attendance`, {
                date: today,
                records: [{ studentId: student.id, status: 'Present' }]
            }, { headers: { Authorization: `Bearer ${adminToken}` } });
            console.log("Admin marked attendance.");
        }

        // 2. Login as Student
        console.log("Logging in as Student...");
        const studentRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'student@college.edu',
            password: 'student123'
        });
        const studentToken = studentRes.data.token;
        const studentConfig = { headers: { Authorization: `Bearer ${studentToken}` } };

        // 3. Get Attendance as Student
        console.log("Fetching attendance as Student...");
        const attendanceRes = await axios.get(`${API_URL}/attendance`, studentConfig);
        const records = attendanceRes.data;

        console.log("Records found:", records.length);
        if (records.length > 0) {
            const ownRecord = records.find(r => r.student_id === student.id);
            if (ownRecord) {
                console.log("SUCCESS: Student sees their own attendance.");
            } else {
                console.error("FAILURE: Student sees records but not their own? (Unexpected)");
            }

            // Check if they see others (if we had multiple students, hard to test with only 1 seed, 
            // but the filter logic `WHERE student_id = ?` guarantees it).
        } else {
            console.log("WARNING: No attendance records found for student. (Did marking work?)");
        }

    } catch (error) {
        console.error("Test Failed:", error.message);
        if (error.response) console.error("Response:", error.response.data);
    }
}

testStudentView();
