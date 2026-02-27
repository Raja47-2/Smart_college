import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudents } from '../services/api';
import axios from 'axios';
import { Camera, Save, ArrowLeft, User } from 'lucide-react';
import './StudentForm.css';

const API = 'http://localhost:5000/api';
const UPLOADS = 'http://localhost:5000';
const TOKEN = () => localStorage.getItem('token');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const TYPES = ['Regular', 'Lateral Entry', 'Distance'];
const COURSES = ['B.Tech', 'BCA', 'MCA', 'M.Tech', 'B.Sc', 'M.Sc'];
const DEPARTMENTS = ['Computer Science', 'Electronic & Communication', 'Mechanical', 'Civil', 'Electrical', 'Information Technology'];
const SECTIONS = ['A', 'B', 'C', 'D'];

const Field = ({ label, name, type = 'text', required = false, placeholder = '', value, onChange }) => (
    <div className="form-group">
        <label>{label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}</label>
        <input
            type={type}
            value={value}
            required={required}
            placeholder={placeholder}
            onChange={e => onChange(name, e.target.value)}
        />
    </div>
);

const StudentForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [form, setForm] = useState({
        name: '', email: '', course: '', department: '',
        year: '', registration_no: '', type: '', password: '',
        address: '', dob: '', blood_group: '', gender: '',
        father_name: '', mother_name: '', mobile: '', parent_mobile: '',
        section: '',
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEdit) {
            getStudents().then(students => {
                const s = students.find(s => String(s.id) === String(id));
                if (s) {
                    setForm(prev => ({ ...prev, ...s, password: '' }));
                    if (s.photo_url) setPhotoPreview(`${UPLOADS}${s.photo_url}`);
                } else navigate('/students');
            });
        }
    }, [id, isEdit, navigate]);

    const handleChange = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

    const handlePhoto = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (k !== 'photo_url' && k !== 'id' && k !== 'user_id') fd.append(k, v || '');
            });
            if (photoFile) fd.append('photo', photoFile);
            const headers = { Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'multipart/form-data' };
            if (isEdit) {
                await axios.put(`${API}/students/${id}`, fd, { headers });
            } else {
                await axios.post(`${API}/students`, fd, { headers });
            }
            navigate('/students');
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><User size={22} /> {isEdit ? 'Edit Student' : 'Add Student'}</h1>
                <button className="btn btn-secondary" onClick={() => navigate('/students')}>
                    <ArrowLeft size={16} /> Back
                </button>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="section-title">Profile Photo</div>
                    <div className="photo-upload-area">
                        <label htmlFor="stu-photo" className="photo-upload-label">
                            {photoPreview
                                ? <img src={photoPreview} alt="Preview" className="photo-preview-img" />
                                : <div className="photo-placeholder"><Camera size={30} /><span>Upload Photo</span></div>
                            }
                        </label>
                        <input id="stu-photo" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                        <p className="photo-hint">Click to upload · JPG / PNG / WEBP (max 5MB)</p>
                    </div>
                </div>

                <div className="form-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="section-title">Basic Information</div>
                    <div className="form-grid">
                        <Field label="Registration No" name="registration_no" required placeholder="REG-2024-001" value={form.registration_no} onChange={handleChange} />
                        <Field label="Full Name" name="name" required placeholder="Student full name" value={form.name} onChange={handleChange} />
                        <Field label="Email" name="email" required type="email" placeholder="student@email.com" value={form.email} onChange={handleChange} />
                        <Field label="Mobile Number" name="mobile" placeholder="10-digit mobile number" value={form.mobile} onChange={handleChange} />
                        <Field label="Parent / Guardian Mobile" name="parent_mobile" placeholder="Parent mobile for SMS alerts" value={form.parent_mobile} onChange={handleChange} />

                        <div className="form-group">
                            <label>Gender</label>
                            <div className="radio-group">
                                {['Male', 'Female', 'Other'].map(g => (
                                    <label key={g} className={`radio-btn ${form.gender === g ? 'selected' : ''}`}>
                                        <input type="radio" name="gender" value={g} checked={form.gender === g}
                                            onChange={e => handleChange('gender', e.target.value)}
                                            style={{ display: 'none' }} />
                                        {g === 'Male' ? '♂' : g === 'Female' ? '♀' : '⚧'} {g}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <Field label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} />

                        <div className="form-group">
                            <label>Blood Group <span className="optional-tag">optional</span></label>
                            <select value={form.blood_group} onChange={e => handleChange('blood_group', e.target.value)}>
                                <option value="">Select blood group</option>
                                {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <Field label="Address" name="address" placeholder="Full address (optional)" value={form.address} onChange={handleChange} />
                    </div>
                </div>

                <div className="form-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="section-title">Academic Details</div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Course <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <select value={form.course} onChange={e => handleChange('course', e.target.value)} required>
                                <option value="">Select Course</option>
                                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Branch / Department <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <select value={form.department} onChange={e => handleChange('department', e.target.value)} required>
                                <option value="">Select Department</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Year <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <select value={form.year} onChange={e => handleChange('year', e.target.value)} required>
                                <option value="">Select year</option>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Section <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <select value={form.section} onChange={e => handleChange('section', e.target.value)} required>
                                <option value="">Select Section</option>
                                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Admission Type</label>
                            <select value={form.type} onChange={e => handleChange('type', e.target.value)}>
                                <option value="">Select type</option>
                                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {!isEdit && (
                            <Field label="Password" name="password" type="password" placeholder="Leave blank for default (123456)" value={form.password} onChange={handleChange} />
                        )}
                    </div>
                </div>

                <div className="form-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="section-title">Family Details <span className="optional-tag">all optional</span></div>
                    <div className="form-grid">
                        <Field label="Father's Name" name="father_name" placeholder="Father's full name" value={form.father_name} onChange={handleChange} />
                        <Field label="Mother's Name" name="mother_name" placeholder="Mother's full name" value={form.mother_name} onChange={handleChange} />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/students')}>
                        <ArrowLeft size={16} /> Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        <Save size={16} /> {saving ? 'Saving…' : isEdit ? 'Update Student' : 'Add Student'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StudentForm;
