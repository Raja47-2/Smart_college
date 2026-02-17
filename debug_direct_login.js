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
    db.all("SELECT id, name, email, role, password FROM users", [], (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Users found:", rows.length);
            rows.forEach(row => {
                console.log(`ID: ${row.id}, Name: ${row.name}, Email: ${row.email}, Role: ${row.role}`);
                // Start of hash to verify it's hashed
                console.log(`Hash starts with: ${row.password.substring(0, 10)}...`);
            });
        }
    });

    await new Promise(r => setTimeout(r, 1000));

    console.log("\n--- Testing Direct Login Credentials ---");

    const credentials = [
        { role: 'admin', email: 'admin@college.edu', password: 'admin123' },
        { role: 'teacher', email: 'teacher@college.edu', password: 'teacher123' },
        { role: 'student', email: 'student@college.edu', password: 'student123' }
    ];

    for (const cred of credentials) {
        console.log(`\nTesting ${cred.role} (${cred.email} / ${cred.password})...`);
        try {
            const res = await axios.post(`${API_URL}/auth/login`, {
                email: cred.email,
                password: cred.password
            });
            console.log(`SUCCESS: ${cred.role} login works. Token: ${res.data.token ? 'YES' : 'NO'}`);
        } catch (error) {
            console.error(`FAILURE: ${cred.role} login failed.`);
            console.error("Status:", error.response?.status);
            console.error("Data:", error.response?.data);
        }
    }
}

run();
