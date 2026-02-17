import sqlite3 from 'sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, 'server/college.db');
const API_URL = 'http://localhost:5000/api';

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
        process.exit(1);
    }
});

async function run() {
    console.log("--- Checking Users in DB ---");
    db.all("SELECT id, name, email, role FROM users", [], (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Users found:", rows.length);
            rows.forEach(row => {
                console.log(`ID: ${row.id}, Name: ${row.name}, Email: ${row.email}, Role: ${row.role}`);
            });
        }
    });

    // Wait briefly for DB query to finish (async but not awaited properly here)
    await new Promise(r => setTimeout(r, 1000));

    console.log("\n--- Testing Login ---");

    // Test 1: Admin Login (Email)
    try {
        console.log("Attempting Admin Login (Email)...");
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@college.edu',
            password: 'admin123'
        });
        console.log("SUCCESS: Admin Login");
    } catch (error) {
        console.error("FAILURE: Admin Login", error.response?.data || error.message);
    }

    // Test 2: Student Login (Email)
    try {
        console.log("Attempting Student Login (Email)...");
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'student@college.edu',
            password: 'student123'
        });
        console.log("SUCCESS: Student Login (Email)");
    } catch (error) {
        console.error("FAILURE: Student Login (Email)", error.response?.data || error.message);
    }

    // Test 2b: Student Login (Reg No)
    try {
        console.log("Attempting Student Login (Reg No: REG-2024-001)...");
        const res = await axios.post(`${API_URL}/auth/login`, {
            identifier: 'REG-2024-001',
            password: 'student123'
        });
        console.log("SUCCESS: Student Login (Reg No)");
    } catch (error) {
        console.error("FAILURE: Student Login (Reg No)", error.response?.data || error.message);
    }

    // Test 3: Faculty Login (Email)
    try {
        console.log("Attempting Faculty Login (Email)...");
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'teacher@college.edu',
            password: 'teacher123'
        });
        console.log("SUCCESS: Faculty Login (Email)");
    } catch (error) {
        console.error("FAILURE: Faculty Login (Email)", error.response?.data || error.message);
    }

    // Test 4: Faculty Login (Reg No) - Need to fetch a valid reg no first
    db.get("SELECT registration_no, email FROM faculty WHERE registration_no IS NOT NULL LIMIT 1", [], async (err, row) => {
        if (row) {
            console.log(`Attempting Faculty Login (Reg No: ${row.registration_no})...`);
            // We need the password. Assuming I created one recently with 'password123' or use known teacher password if I can map it.
            // If it's the default teacher, it might not have a reg no yet unless updated.
            // If it's the one from previous test, password is 'password123'.

            let password = 'password123';
            if (row.email === 'teacher@college.edu') password = 'teacher123';

            try {
                const res = await axios.post(`${API_URL}/auth/login`, {
                    identifier: row.registration_no,
                    password: password
                });
                console.log("SUCCESS: Faculty Login (Reg No)");
            } catch (error) {
                console.error("FAILURE: Faculty Login (Reg No)", error.response?.data || error.message);
            }
        } else {
            console.log("No faculty with registration number found to test.");
        }
    });
}

run();
