import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Phone, Mail, X, Save } from 'lucide-react';
import axios from 'axios';
import './Contact.css';

const API = 'http://localhost:5000/api';
const empty = { name: '', department: '', designation: '', phone: '', email: '' };

const Contact = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(empty);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');
    const isAdmin = user?.role === 'admin';

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await axios.get(`${API}/staff-contacts`, { headers: { Authorization: `Bearer ${token}` } });
            setContacts(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openAdd = () => { setForm(empty); setEditId(null); setShowForm(true); };
    const openEdit = (c) => { setForm(c); setEditId(c.id); setShowForm(true); };

    const handleSave = async () => {
        try {
            if (editId) {
                await axios.put(`${API}/staff-contacts/${editId}`, form, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`${API}/staff-contacts`, form, { headers: { Authorization: `Bearer ${token}` } });
            }
            setShowForm(false); load();
        } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this contact?')) return;
        await axios.delete(`${API}/staff-contacts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        load();
    };

    // Group by department
    const grouped = contacts.reduce((acc, c) => {
        acc[c.department || 'General'] = [...(acc[c.department || 'General'] || []), c];
        return acc;
    }, {});

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><Phone size={24} /> Staff Contacts</h1>
                {isAdmin && <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Contact</button>}
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{editId ? 'Edit Contact' : 'Add Contact'}</h2>
                            <button className="icon-btn" onClick={() => setShowForm(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body form-grid-2">
                            {['name', 'department', 'designation', 'phone', 'email'].map(field => (
                                <div className="form-group" key={field}>
                                    <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                                    <input value={form[field] || ''} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={14} /> Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save</button>
                        </div>
                    </div>
                </div>
            )}

            {contacts.length === 0 ? (
                <div className="empty-state"><p>No contacts added yet.</p></div>
            ) : (
                Object.keys(grouped).map(dept => (
                    <div key={dept} className="dept-section">
                        <h2 className="dept-title">{dept}</h2>
                        <div className="contact-grid">
                            {grouped[dept].map(c => (
                                <div key={c.id} className="contact-card">
                                    <div className="contact-avatar">{c.name.charAt(0).toUpperCase()}</div>
                                    <div className="contact-info">
                                        <h3>{c.name}</h3>
                                        <p className="designation">{c.designation}</p>
                                        <a href={`tel:${c.phone}`} className="contact-link"><Phone size={14} /> {c.phone}</a>
                                        <a href={`mailto:${c.email}`} className="contact-link"><Mail size={14} /> {c.email}</a>
                                    </div>
                                    {isAdmin && (
                                        <div className="contact-actions">
                                            <button className="icon-btn edit" onClick={() => openEdit(c)}><Edit2 size={15} /></button>
                                            <button className="icon-btn delete" onClick={() => handleDelete(c.id)}><Trash2 size={15} /></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default Contact;
