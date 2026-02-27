import db from './server/database.js';

async function testTargetedNotifications() {
    console.log('--- START VERIFICATION TEST ---');

    // 1. Create a student
    const studentId = 999;
    const studentUserId = 888;
    const dept = 'Computer Science';
    const year = '2nd Year';

    console.log('Cleaning up previous test data...');
    db.run("DELETE FROM notifications WHERE title LIKE 'TEST%'");

    console.log('Inserting test notification for CS 2nd Year students...');
    db.run(`
    INSERT INTO notifications (title, message, target_role, target_dept, target_year) 
    VALUES ('TEST CS 2nd Year', 'Targeted message', 'student', ?, ?)
  `, [dept, year]);

    console.log('Inserting test notification for ALL students...');
    db.run(`
    INSERT INTO notifications (title, message, target_role) 
    VALUES ('TEST ALL Students', 'Broadcast message', 'student')
  `);

    console.log('Inserting test notification for Staff...');
    db.run(`
    INSERT INTO notifications (title, message, target_role) 
    VALUES ('TEST Staff Only', 'Staff broadcast', 'staff')
  `);

    // Allow some time for inserts
    setTimeout(() => {
        // 2. Query as Student (CS 2nd Year)
        const refinedQuery = `
      SELECT * FROM notifications 
      WHERE (target_role = 'all')
      OR (target_role = 'student' AND 
          (target_dept IS NULL OR target_dept = ?) AND 
          (target_year IS NULL OR target_year = ?)
      )
      ORDER BY created_at DESC
    `;

        db.all(refinedQuery, [dept, year], (err, rows) => {
            if (err) console.error(err);
            console.log(`Student (CS 2nd Year) results count: ${rows.length}`);
            const titles = rows.map(r => r.title);
            console.log('Visible titles:', titles);

            const hasTargeted = titles.includes('TEST CS 2nd Year');
            const hasAllStudents = titles.includes('TEST ALL Students');
            const hasStaffOnly = titles.includes('TEST Staff Only');

            console.log(`- Received targeted: ${hasTargeted}`);
            console.log(`- Received all students: ${hasAllStudents}`);
            console.log(`- Received staff (CORRECTLY BLOCKED): ${!hasStaffOnly}`);

            if (hasTargeted && hasAllStudents && !hasStaffOnly) {
                console.log('✅ Student filtering logic PASSED');
            } else {
                console.error('❌ Student filtering logic FAILED');
            }
        });

        // 3. Query as different student (Mechanical 1st Year)
        db.all(refinedQuery, ['Mechanical', '1st Year'], (err, rows) => {
            if (err) console.error(err);
            console.log(`Student (Mech 1st Year) results count: ${rows.length}`);
            const titles = rows.map(r => r.title);

            const hasTargetedCS = titles.includes('TEST CS 2nd Year');
            const hasAllStudents = titles.includes('TEST ALL Students');

            console.log(`- Received CS targeted (CORRECTLY BLOCKED): ${!hasTargetedCS}`);
            console.log(`- Received all students: ${hasAllStudents}`);

            if (!hasTargetedCS && hasAllStudents) {
                console.log('✅ Cros-student filtering PASSED');
            } else {
                console.error('❌ Cross-student filtering FAILED');
            }
        });
    }, 1000);
}

testTargetedNotifications();
