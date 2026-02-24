import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Clock, MapPin, Users, BookOpen, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTimeTables, addTimeTable, deleteTimeTable, getStudents } from '../services/api';
import './TimeTable.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STREAMS = ['Engineering', 'Polytechnic'];
const DEPARTMENTS = {
    Engineering: ['Civil', 'Mechanical', 'Electrical', 'Computer Engineering', 'IT', 'Chemical'],
    Polytechnic: ['Civil', 'Mechanical', 'Electrical', 'Computer Science', 'IT'],
};
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const TimeTable = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'principal';

    const [timetables, setTimetables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [studentInfo, setStudentInfo] = useState(null);

    // Filters & Form
    const [filters, setFilters] = useState({
        stream: '',
        department: '',
        year: ''
    });

    const [form, setForm] = useState({
        stream: '',
        department: '',
        year: '',
        day: 'Monday',
        time: '',
        subject: '',
        faculty_name: ''
    });

    useEffect(() => {
        if (user?.role === 'student') {
            loadStudentData();
        } else {
            loadTimetables();
        }
    }, [user]);

    const loadStudentData = async () => {
        try {
            const students = await getStudents();
            const me = students.find(s => s.user_id === user.id);
            if (me) {
                setStudentInfo(me);
                const studentFilters = {
                    stream: me.course === 'Engineering' || me.course === 'Polytechnic' ? me.course : 'Engineering', // Fallback for simple demo
                    department: me.department,
                    year: me.year
                };
                setFilters(studentFilters);
                const data = await getTimeTables(studentFilters);
                setTimetables(data);
            }
        } catch (e) {
            console.error('Error loading student info:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadTimetables = async (params = filters) => {
        setLoading(true);
        try {
            const data = await getTimeTables(params);
            setTimetables(data);
        } catch (e) {
            console.error('Error loading timetables:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await addTimeTable(form);
            setShowForm(false);
            setForm({ ...form, subject: '', time: '', faculty_name: '' });
            loadTimetables();
        } catch (e) {
            alert('Error adding entry');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            await deleteTimeTable(id);
            loadTimetables();
        } catch (e) {
            alert('Error deleting entry');
        }
    };

    const groupTimetable = () => {
        const grouped = {};
        DAYS.forEach(day => grouped[day] = []);
        timetables.forEach(item => {
            if (grouped[item.day]) grouped[item.day].push(item);
        });
        return grouped;
    };

    const grouped = groupTimetable();

    return (
        <div className="timetable-page page-container">
            <div className="page-header">
                <h1><Calendar size={24} /> Time Table</h1>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} /> Add Entry
                    </button>
                )}
            </div>

            {user?.role === 'student' && studentInfo && (
                <div className="student-info-card">
                    <BookOpen size={18} />
                    <span>Showing timetable for: <strong>{studentInfo.course} - {studentInfo.department} ({studentInfo.year})</strong></span>
                </div>
            )}

            {isAdmin && (
                <div className="filter-card">
                    <h3><Filter size={18} /> Filter by Batch</h3>
                    <div className="filter-grid">
                        <div className="form-group">
                            <label>Stream</label>
                            <select value={filters.stream} onChange={e => {
                                const newFilters = { ...filters, stream: e.target.value, department: '' };
                                setFilters(newFilters);
                                if (e.target.value && newFilters.year) loadTimetables(newFilters);
                            }}>
                                <option value="">Select Stream</option>
                                {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Department</label>
                            <select value={filters.department} onChange={e => {
                                const newFilters = { ...filters, department: e.target.value };
                                setFilters(newFilters);
                                if (newFilters.stream && newFilters.department && newFilters.year) loadTimetables(newFilters);
                            }}>
                                <option value="">Select Dept</option>
                                {filters.stream && DEPARTMENTS[filters.stream].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Year</label>
                            <select value={filters.year} onChange={e => {
                                const newFilters = { ...filters, year: e.target.value };
                                setFilters(newFilters);
                                if (newFilters.stream && newFilters.department && newFilters.year) loadTimetables(newFilters);
                            }}>
                                <option value="">Select Year</option>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Add Timetable Entry</h2>
                            <button className="icon-btn" onClick={() => setShowForm(false)}><Plus style={{ transform: 'rotate(45deg)' }} /></button>
                        </div>
                        <form onSubmit={handleAdd} className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Stream</label>
                                    <select value={form.stream} onChange={e => setForm({ ...form, stream: e.target.value, department: '' })} required>
                                        <option value="">Select Stream</option>
                                        {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Department</label>
                                    <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required>
                                        <option value="">Select Dept</option>
                                        {form.stream && DEPARTMENTS[form.stream].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Year</label>
                                    <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required>
                                        <option value="">Select Year</option>
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Day</label>
                                    <select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} required>
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Time (e.g. 09:00 AM)</label>
                                    <input type="text" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} placeholder="09:00 AM" required />
                                </div>
                                <div className="form-group">
                                    <label>Subject</label>
                                    <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" required />
                                </div>
                                <div className="form-group full">
                                    <label>Faculty Name</label>
                                    <input type="text" value={form.faculty_name} onChange={e => setForm({ ...form, faculty_name: e.target.value })} placeholder="e.g. Dr. Smith" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-state">Loading schedule...</div>
            ) : timetables.length === 0 ? (
                <div className="empty-state">
                    <Calendar size={48} opacity={0.2} />
                    <p>No timetable found for this batch.</p>
                </div>
            ) : (
                <div className="timetable-grid">
                    {DAYS.map(day => (
                        <div key={day} className="day-column">
                            <div className="day-header">{day}</div>
                            <div className="slots">
                                {grouped[day].length === 0 ? (
                                    <div className="no-slot">No classes</div>
                                ) : (
                                    grouped[day].map(slot => (
                                        <div key={slot.id} className="time-slot">
                                            <div className="slot-time"><Clock size={12} /> {slot.time}</div>
                                            <div className="slot-subject">{slot.subject}</div>
                                            <div className="slot-faculty"><Users size={12} /> {slot.faculty_name}</div>
                                            {isAdmin && (
                                                <button className="slot-delete" onClick={() => handleDelete(slot.id)}>
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TimeTable;
