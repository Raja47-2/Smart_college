import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Edit2, Save, X, Award, Info } from 'lucide-react';
import axios from 'axios';
import './About.css';

const API = 'http://localhost:5000/api';

const FIELDS = [
    { key: 'college_name', label: 'College Name', type: 'text' },
    { key: 'established', label: 'Established Year', type: 'text' },
    { key: 'about', label: 'About College', type: 'textarea' },
    { key: 'vision', label: 'Vision', type: 'textarea' },
    { key: 'mission', label: 'Mission', type: 'textarea' },
    { key: 'achievements', label: 'Achievements', type: 'textarea' },
    { key: 'address', label: 'Address', type: 'textarea' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'website', label: 'Website', type: 'text' },
];

const About = () => {
    const { user } = useAuth();
    const [info, setInfo] = useState({});
    const [editKey, setEditKey] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => { loadInfo(); }, []);

    const loadInfo = async () => {
        try {
            const res = await axios.get(`${API}/college-info`, { headers: { Authorization: `Bearer ${token}` } });
            setInfo(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const startEdit = (key) => {
        setEditKey(key);
        setEditValue(info[key] || '');
    };

    const saveEdit = async () => {
        try {
            await axios.put(`${API}/college-info/${editKey}`, { value: editValue }, { headers: { Authorization: `Bearer ${token}` } });
            setInfo(prev => ({ ...prev, [editKey]: editValue }));
            setEditKey(null);
        } catch (e) {
            alert('Failed to save: ' + (e.response?.data?.error || e.message));
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="about-page">
            <div className="about-hero">
                <div className="hero-icon"><Info size={48} /></div>
                <h1>{info.college_name || 'Smart College'}</h1>
                <p className="hero-sub">Est. {info.established || 'N/A'}</p>
            </div>

            <div className="about-grid">
                {FIELDS.map(field => (
                    <div key={field.key} className={`about-card ${field.type === 'textarea' ? 'full-width' : ''}`}>
                        <div className="card-header">
                            <h3>{field.label}</h3>
                            {user?.role === 'admin' && editKey !== field.key && (
                                <button className="icon-btn edit" onClick={() => startEdit(field.key)}>
                                    <Edit2 size={16} />
                                </button>
                            )}
                        </div>

                        {editKey === field.key ? (
                            <div className="edit-area">
                                {field.type === 'textarea' ? (
                                    <textarea
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        rows={4}
                                        autoFocus
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        autoFocus
                                    />
                                )}
                                <div className="edit-actions">
                                    <button className="btn btn-primary btn-sm" onClick={saveEdit}><Save size={14} /> Save</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditKey(null)}><X size={14} /> Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <p className="card-value">{info[field.key] || <em>Not set</em>}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default About;
