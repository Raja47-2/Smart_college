import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { getStudents, deleteStudent } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Students.css';

const Students = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('All');
    const [selectedYear, setSelectedYear] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const data = await getStudents();
            setStudents(data);
        } catch (error) {
            console.error("Failed to load students", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await deleteStudent(id);
                loadStudents();
            } catch (error) {
                console.error("Failed to delete student", error);
            }
        }
    };

    const uniqueCourses = ['All', ...new Set(students.map(s => s.course).filter(Boolean))];
    const uniqueYears = ['All', ...new Set(students.map(s => s.year).filter(Boolean))].sort();

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCourse = selectedCourse === 'All' || student.course === selectedCourse;
        const matchesYear = selectedYear === 'All' || student.year === selectedYear;

        return matchesSearch && matchesCourse && matchesYear;
    });

    const isAdmin = user?.role === 'admin';

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Students</h1>
                {isAdmin && (
                    <Link to="/students/add" className="btn btn-primary">
                        <Plus size={18} />
                        Add Student
                    </Link>
                )}
            </div>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="course-filter"
                    >
                        {uniqueCourses.map(course => (
                            <option key={course} value={course}>{course}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="course-filter"
                        style={{ marginLeft: '10px' }}
                    >
                        {uniqueYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="table-container">
                {filteredStudents.length === 0 ? (
                    <div className="empty-state">
                        <p>No students found.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Registration No</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Stream</th>
                                <th>Department</th>
                                <th>Year</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr key={student.id}>
                                    <td>{student.registration_no}</td>
                                    <td>{student.name}</td>
                                    <td>{student.email}</td>
                                    <td>{student.course}</td>
                                    <td>{student.department}</td>
                                    <td>{student.year}</td>
                                    {isAdmin && (
                                        <td className="actions-cell">
                                            <Link to={`/students/edit/${student.id}`} className="icon-btn edit">
                                                <Edit size={18} />
                                            </Link>
                                            <button onClick={() => handleDelete(student.id)} className="icon-btn delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Students;
