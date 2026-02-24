import db from './server/database.js';
import bcrypt from 'bcryptjs';

async function addPrincipal() {
    const principalPassword = await bcrypt.hash('principal123', 10);

    db.get("SELECT id FROM users WHERE role = 'principal'", [], (err, row) => {
        if (err) {
            console.error(err.message);
            process.exit(1);
        }

        if (row) {
            console.log("Principal user already exists.");
            process.exit(0);
        }

        db.run(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'principal')",
            ['Principal User', 'principal@college.edu', principalPassword],
            function (err) {
                if (err) {
                    console.error("Error inserting principal:", err.message);
                    process.exit(1);
                }
                console.log("Principal user added successfully with ID:", this.lastID);
                process.exit(0);
            }
        );
    });
}

addPrincipal();
