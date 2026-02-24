import axios from 'axios';

const API = 'http://localhost:5000/api';

async function verify() {
    try {
        console.log("Attempting to login as Principal...");
        const res = await axios.post(`${API}/auth/login`, {
            email: 'principal@college.edu',
            password: 'principal123'
        });

        const { user, token } = res.data;
        if (user.role === 'principal') {
            console.log("SUCCESS: Logged in as Principal.");
            console.log("User data:", user);
        } else {
            console.log("FAILURE: Logged in but role is:", user.role);
        }
    } catch (e) {
        console.error("FAILURE: Login failed:", e.response?.data?.error || e.message);
    }
}

verify();
