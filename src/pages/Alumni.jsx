import React, { useState, useEffect } from 'react';
import { Plus, X, Camera, Save, Edit2, Users2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAlumni, addAlumni, deleteAlumni } from '../services/api';
import './Alumni.css';

const UPLOADS = 'http://localhost:5000';

const emptyForm = { name: '', batch_year: '', course: '', department: '', job_title: '', company: '', contact: '' };

const Alumni = () => {
    const { user } = useAuth();
    const [alumni, setAlumni] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    const isAdmin = user?.role === 'admin' || user?.role === 'principal';

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const data = await getAlumni();
            setAlumni(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openAdd = () => {
        setForm(emptyForm);
        setEditId(null);
        setPhotoFile(null);
        setPhotoPreview(null);
        setShowForm(true);
    };

    const openEdit = (a) => {
        setForm(a);
        setEditId(a.id);
        setPhotoFile(null);
        setPhotoPreview(a.photo_url ? `${UPLOADS}${a.photo_url}` : null);
        setShowForm(true);
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                if (key !== 'id' && key !== 'photo_url') formData.append(key, form[key] || '');
            });
            if (photoFile) formData.append('photo', photoFile);

            if (editId) {
                const axios = (await import('axios')).default; // Fallback if direct updateStudent-like put is needed, but index.js put handles it
                await axios.put(`http://localhost:5000/api/alumni/${editId}`, formData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await addAlumni(formData);
            }
            setShowForm(false);
            load();
        } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this alumni?')) return;
        try {
            await deleteAlumni(id);
            load();
        } catch (e) { alert('Error: ' + e.message); }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><Users2 size={24} /> Alumni</h1>
                {isAdmin && <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Alumni</button>}
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{editId ? 'Edit Alumni' : 'Add Alumni'}</h2>
                            <button className="icon-btn" onClick={() => setShowForm(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            {/* Photo Upload Area */}
                            <div className="photo-upload-area">
                                <label htmlFor="alumni-photo" className="photo-upload-label">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="photo-preview-img" />
                                    ) : (
                                        <div className="photo-placeholder">
                                            <Camera size={32} />
                                            <span>Upload Photo</span>
                                        </div>
                                    )}
                                </label>
                                <input
                                    id="alumni-photo"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handlePhotoChange}
                                />
                                <p className="photo-hint">Click to upload (max 5MB)</p>
                            </div>

                            <div className="form-grid-2">
                                {['name', 'batch_year', 'course', 'department', 'job_title', 'company', 'contact'].map(field => (
                                    <div className="form-group" key={field}>
                                        <label>{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                                        <input
                                            value={form[field] || ''}
                                            onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={14} /> Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save</button>
                        </div>
                    </div>
                </div>
            )}

            {alumni.length === 0 ? (
                <div className="empty-state"><p>No alumni records yet.</p></div>
            ) : (
                <div className="alumni-grid">
                    {alumni.map(a => (
                        <div key={a.id} className="alumni-card">
                            {/* Photo or Avatar */}
                            {a.photo_url ? (
                                <img
                                    src={`${UPLOADS}${a.photo_url}`}
                                    alt={a.name}
                                    className="alumni-photo"
                                />
                            ) : (
                                <div className="alumni-avatar">
                                    {a.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <h3>{a.name}</h3>
                            <p className="alumni-batch">Batch {a.batch_year} | {a.course}</p>
                            <p className="alumni-dept">{a.department}</p>
                            <div className="alumni-work">
                                <strong>{a.job_title}</strong>
                                <span>{a.company}</span>
                            </div>
                            {a.contact && <p className="alumni-contact">📞 {a.contact}</p>}
                            {isAdmin && (
                                <div className="alumni-actions">
                                    <button className="icon-btn edit" onClick={() => openEdit(a)}><Edit2 size={16} /></button>
                                    <button className="icon-btn delete" onClick={() => handleDelete(a.id)}><Trash2 size={16} /></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Alumni;
