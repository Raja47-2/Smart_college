import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, User } from 'lucide-react';
import { getStudents, deleteStudent } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Students.css';

const UPLOADS = 'http://localhost:5000';

const Students = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('All');
    const [selectedYear, setSelectedYear] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStudents(); }, []);

    const loadStudents = async () => {
        try { setStudents(await getStudents()); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this student?')) {
            try { await deleteStudent(id); loadStudents(); }
            catch (e) { console.error(e); }
        }
    };

    const uniqueCourses = ['All', ...new Set(students.map(s => s.course).filter(Boolean))];
    const uniqueYears = ['All', ...new Set(students.map(s => s.year).filter(Boolean))].sort();

    const filtered = students.filter(s => {
        const q = searchTerm.toLowerCase();
        return (
            (s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.registration_no?.toLowerCase().includes(q)) &&
            (selectedCourse === 'All' || s.course === selectedCourse) &&
            (selectedYear === 'All' || s.year === selectedYear)
        );
    });

    const isAdmin = user?.role === 'admin' || user?.role === 'principal';
    const isTeacher = user?.role === 'teacher';
    const canEdit = isAdmin || isTeacher;

    if (loading) return <div className="loading">Loading students…</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><User size={20} /> Students
                    <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                        ({filtered.length} found)
                    </span>
                </h1>
                {isAdmin && (
                    <Link to="/students/add" className="btn btn-primary">
                        <Plus size={18} /> Add Student
                    </Link>
                )}
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="search-bar">
                    <Search size={16} className="search-icon" />
                    <input
                        placeholder="Search by name, email or reg. no…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select className="course-filter" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                        {uniqueCourses.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select className="course-filter" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                        {uniqueYears.map(y => <option key={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="table-container">
                {filtered.length === 0 ? (
                    <div className="empty-state"><p>No students found.</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Photo</th>
                                <th>Reg. No</th>
                                <th>Name</th>
                                <th>Branch / Year</th>
                                <th>Gender</th>
                                <th>Blood</th>
                                <th>Mobile</th>
                                {canEdit && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id}>
                                    {/* Photo */}
                                    <td>
                                        {s.photo_url
                                            ? <img src={`${UPLOADS}${s.photo_url}`} alt={s.name}
                                                style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                                            : <div className="student-avatar">{s.name?.charAt(0).toUpperCase()}</div>
                                        }
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.registration_no}</td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                                        {s.father_name && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Father: {s.father_name}</div>}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{s.department}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.course} · {s.year}</div>
                                    </td>
                                    <td>
                                        {s.gender
                                            ? <span className={`badge ${s.gender === 'Male' ? 'badge-primary' : s.gender === 'Female' ? 'badge-accent' : 'badge-secondary'}`} style={{ fontSize: '0.72rem' }}>
                                                {s.gender}
                                            </span>
                                            : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                                        }
                                    </td>
                                    <td>
                                        {s.blood_group
                                            ? <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.85rem' }}>{s.blood_group}</span>
                                            : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                                        }
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.mobile || '—'}</td>
                                    {canEdit && (
                                        <td>
                                            <div className="actions-cell">
                                                <Link to={`/students/edit/${s.id}`} className="icon-btn edit"><Edit size={16} /></Link>
                                                {isAdmin && <button onClick={() => handleDelete(s.id)} className="icon-btn delete"><Trash2 size={16} /></button>}
                                            </div>
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
