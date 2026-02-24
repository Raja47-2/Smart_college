import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Edit, Trash2, CheckCircle, Clock } from 'lucide-react';
import { getRegistrations, deleteRegistration, getStudents, addRegistration, updateRegistration } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import './SemesterRegistration.css';

const SemesterRegistration = () => {
    const { user } = useAuth();
    const { hasPermission } = usePermissions();
    const [registrations, setRegistrations] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        student_id: '',
        semester: '1st Semester',
        registration_date: new Date().toISOString().split('T')[0],
        status: 'Provisionally Registered',
        remarks: ''
    });

    const canManage = user?.role === 'admin' || user?.role === 'principal' || (user?.role === 'teacher' && hasPermission('manage_registrations'));

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [regData, studentData] = await Promise.all([
                getRegistrations(),
                getStudents()
            ]);
            setRegistrations(regData);
            setStudents(studentData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await updateRegistration(editId, formData);
            } else {
                await addRegistration(formData);
            }
            setShowForm(false);
            setEditId(null);
            setFormData({
                student_id: '',
                semester: '1st Semester',
                registration_date: new Date().toISOString().split('T')[0],
                status: 'Provisionally Registered',
                remarks: ''
            });
            loadData();
        } catch (e) {
            alert('Operation failed');
        }
    };

    const handleEdit = (reg) => {
        setEditId(reg.id);
        setFormData({
            student_id: reg.student_id,
            semester: reg.semester,
            registration_date: reg.registration_date,
            status: reg.status,
            remarks: reg.remarks || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this registration?')) {
            await deleteRegistration(id);
            loadData();
        }
    };

    const filtered = registrations.filter(r =>
        r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.semester.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><BookOpen size={24} /> Semester Registration</h1>
                {canManage && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} /> New Registration
                    </button>
                )}
            </div>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search student or semester..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                {loading ? <div className="loading">Loading...</div> : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Reg No</th>
                                <th>Semester</th>
                                <th>Date</th>
                                <th>Status</th>
                                {canManage && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(reg => (
                                <tr key={reg.id}>
                                    <td>
                                        <div className="reg-student">
                                            <span className="name">{reg.student_name}</span>
                                            <small>{reg.department} | {reg.year}</small>
                                        </div>
                                    </td>
                                    <td>{reg.registration_no}</td>
                                    <td>{reg.semester}</td>
                                    <td>{reg.registration_date}</td>
                                    <td>
                                        <span className={`status-badge ${reg.status.split(' ')[0].toLowerCase()}`}>
                                            {reg.status === 'Registered' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                            {reg.status}
                                        </span>
                                    </td>
                                    {canManage && (
                                        <td className="actions-cell">
                                            <button className="icon-btn edit" onClick={() => handleEdit(reg)}><Edit size={18} /></button>
                                            <button className="icon-btn delete" onClick={() => handleDelete(reg.id)}><Trash2 size={18} /></button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{editId ? 'Edit Registration' : 'New Semester Registration'}</h2>
                            <button className="icon-btn" onClick={() => setShowForm(false)}><Plus style={{ transform: 'rotate(45deg)' }} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-grid">
                                <div className="form-group full">
                                    <label>Student</label>
                                    <select
                                        value={formData.student_id}
                                        onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                                        required
                                        disabled={!!editId}
                                    >
                                        <option value="">Select Student</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.registration_no})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Semester</label>
                                    <select value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
                                        {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(s => (
                                            <option key={s} value={`${s} Semester`}>{s} Semester</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Registration Date</label>
                                    <input
                                        type="date"
                                        value={formData.registration_date}
                                        onChange={e => setFormData({ ...formData, registration_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Provisionally Registered">Provisionally Registered</option>
                                        <option value="Registered">Registered</option>
                                        <option value="Pending Approval">Pending Approval</option>
                                    </select>
                                </div>
                                <div className="form-group full">
                                    <label>Remarks</label>
                                    <textarea
                                        value={formData.remarks}
                                        onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                        placeholder="Optional remarks..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Register'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SemesterRegistration;
