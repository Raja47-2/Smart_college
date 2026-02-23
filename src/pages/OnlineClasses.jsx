import React, { useState } from 'react';
import { Video, Plus, Trash2, ExternalLink, BookOpen, Users, Calendar, Clock, X, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './OnlineClasses.css';

// ── Static options ────────────────────────────────────────────────────────────
const STREAMS = ['Engineering', 'Polytechnic'];

const DEPARTMENTS_BY_STREAM = {
    Engineering: ['Civil', 'Mechanical', 'Electrical', 'Computer Engineering', 'IT', 'Chemical'],
    Polytechnic: ['Civil', 'Mechanical', 'Electrical', 'Computer Science', 'IT'],
};

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const CLASS_TYPES = ['Lecture', 'Tutorial', 'Lab', 'Seminar', 'Workshop'];

// ── MultiSelect component ─────────────────────────────────────────────────────
const MultiSelect = ({ label, options, selected, onChange, placeholder }) => {
    const [open, setOpen] = useState(false);

    const toggle = (val) => {
        onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
    };

    return (
        <div className="multi-select-wrapper">
            <label>{label}</label>
            <div className={`multi-select-box ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
                <div className="multi-select-display">
                    {selected.length === 0
                        ? <span className="ms-placeholder">{placeholder}</span>
                        : selected.map(v => (
                            <span key={v} className="ms-tag">
                                {v}
                                <button type="button" onClick={e => { e.stopPropagation(); toggle(v); }}>
                                    <X size={10} />
                                </button>
                            </span>
                        ))
                    }
                </div>
                <ChevronDown size={15} className={`ms-arrow ${open ? 'rotated' : ''}`} />
            </div>
            {open && (
                <div className="multi-select-dropdown">
                    {options.map(opt => (
                        <div
                            key={opt}
                            className={`ms-option ${selected.includes(opt) ? 'selected' : ''}`}
                            onClick={() => toggle(opt)}
                        >
                            <span className="ms-check"><Check size={12} /></span>
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const OnlineClasses = () => {
    const { user } = useAuth();
    const isCreator = user?.role === 'admin' || user?.role === 'teacher';

    const [classes, setClasses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        title: '',
        stream: '',
        departments: [],
        years: [],
        classType: 'Lecture',
        meetLink: '',
        date: '',
        time: '',
        duration: '60',
        description: '',
    });
    const [errors, setErrors] = useState({});

    const availableDepts = form.stream ? DEPARTMENTS_BY_STREAM[form.stream] : [];

    const handleChange = (field, value) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            // Reset departments if stream changes
            if (field === 'stream') updated.departments = [];
            return updated;
        });
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = 'Class title is required';
        if (!form.stream) e.stream = 'Please select a stream';
        if (form.departments.length === 0) e.departments = 'Select at least one department';
        if (form.years.length === 0) e.years = 'Select at least one year';
        if (!form.date) e.date = 'Please select a date';
        if (!form.time) e.time = 'Please select a time';
        if (!form.meetLink.trim()) e.meetLink = 'Meeting link is required';
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        const newClass = {
            id: Date.now(),
            ...form,
            createdBy: user?.name || 'Faculty',
            createdAt: new Date().toISOString(),
        };
        setClasses(prev => [newClass, ...prev]);
        setForm({ title: '', stream: '', departments: [], years: [], classType: 'Lecture', meetLink: '', date: '', time: '', duration: '60', description: '' });
        setShowForm(false);
        setErrors({});
    };

    const deleteClass = (id) => setClasses(prev => prev.filter(c => c.id !== id));

    return (
        <div className="oc-page page-container">
            {/* Header */}
            <div className="page-header">
                <h1><Video size={22} /> Online Classes</h1>
                {isCreator && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={16} /> Create Class
                    </button>
                )}
            </div>

            {/* ── Create Class Modal ─────────────────────────────────────── */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="oc-modal" onClick={e => e.stopPropagation()}>
                        <div className="oc-modal-header">
                            <h2><Plus size={18} /> Create Online Class</h2>
                            <button className="icon-btn" onClick={() => setShowForm(false)}><X size={18} /></button>
                        </div>
                        <div className="oc-modal-body">
                            <form onSubmit={handleSubmit} className="oc-form">

                                {/* Title */}
                                <div className={`form-group ${errors.title ? 'has-error' : ''}`}>
                                    <label>Class Title *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={e => handleChange('title', e.target.value)}
                                        placeholder="e.g. Introduction to Quantum Physics"
                                    />
                                    {errors.title && <span className="field-error">{errors.title}</span>}
                                </div>

                                {/* Stream */}
                                <div className={`form-group ${errors.stream ? 'has-error' : ''}`}>
                                    <label>Stream *</label>
                                    <select value={form.stream} onChange={e => handleChange('stream', e.target.value)}>
                                        <option value="">— Select Stream —</option>
                                        {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {errors.stream && <span className="field-error">{errors.stream}</span>}
                                </div>

                                {/* Departments (multi) */}
                                <div className={errors.departments ? 'has-error' : ''}>
                                    <MultiSelect
                                        label="Departments * (multi-select)"
                                        options={availableDepts}
                                        selected={form.departments}
                                        onChange={v => handleChange('departments', v)}
                                        placeholder={form.stream ? 'Select departments…' : 'Select a stream first'}
                                    />
                                    {errors.departments && <span className="field-error">{errors.departments}</span>}
                                </div>

                                {/* Years (multi) */}
                                <div className={errors.years ? 'has-error' : ''}>
                                    <MultiSelect
                                        label="Years * (multi-select)"
                                        options={YEARS}
                                        selected={form.years}
                                        onChange={v => handleChange('years', v)}
                                        placeholder="Select years…"
                                    />
                                    {errors.years && <span className="field-error">{errors.years}</span>}
                                </div>

                                {/* Class Type */}
                                <div className="form-group">
                                    <label>Class Type</label>
                                    <select value={form.classType} onChange={e => handleChange('classType', e.target.value)}>
                                        {CLASS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                {/* Date & Time */}
                                <div className="oc-row">
                                    <div className={`form-group ${errors.date ? 'has-error' : ''}`}>
                                        <label>Date *</label>
                                        <input type="date" value={form.date} onChange={e => handleChange('date', e.target.value)} />
                                        {errors.date && <span className="field-error">{errors.date}</span>}
                                    </div>
                                    <div className={`form-group ${errors.time ? 'has-error' : ''}`}>
                                        <label>Time *</label>
                                        <input type="time" value={form.time} onChange={e => handleChange('time', e.target.value)} />
                                        {errors.time && <span className="field-error">{errors.time}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Duration (min)</label>
                                        <input type="number" min="15" max="300" value={form.duration} onChange={e => handleChange('duration', e.target.value)} />
                                    </div>
                                </div>

                                {/* Meet Link */}
                                <div className={`form-group ${errors.meetLink ? 'has-error' : ''}`}>
                                    <label>Meeting Link * (Google Meet / Zoom / Teams)</label>
                                    <input
                                        type="url"
                                        value={form.meetLink}
                                        onChange={e => handleChange('meetLink', e.target.value)}
                                        placeholder="https://meet.google.com/xyz-abc-def"
                                    />
                                    {errors.meetLink && <span className="field-error">{errors.meetLink}</span>}
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label>Description (optional)</label>
                                    <textarea
                                        rows={3}
                                        value={form.description}
                                        onChange={e => handleChange('description', e.target.value)}
                                        placeholder="Topics to be covered, prerequisites, etc."
                                    />
                                </div>

                                <div className="oc-form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary"><Plus size={15} /> Create Class</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Class Cards ───────────────────────────────────────────── */}
            {classes.length === 0 ? (
                <div className="oc-empty">
                    <Video size={48} opacity={0.25} />
                    <p>No online classes scheduled yet.</p>
                    {isCreator && <p className="sub">Click <strong>Create Class</strong> to schedule one.</p>}
                </div>
            ) : (
                <div className="oc-grid">
                    {classes.map(cls => (
                        <div key={cls.id} className="oc-card">
                            <div className="oc-card-top">
                                <span className={`oc-type-badge type-${cls.classType.toLowerCase()}`}>{cls.classType}</span>
                                {isCreator && (
                                    <button className="icon-btn delete" onClick={() => deleteClass(cls.id)} title="Delete class">
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>

                            <h3 className="oc-title">{cls.title}</h3>

                            <div className="oc-meta">
                                <span><BookOpen size={13} /> {cls.stream}</span>
                                <span><Calendar size={13} /> {cls.date} at {cls.time}</span>
                                <span><Clock size={13} /> {cls.duration} min</span>
                                <span><Users size={13} /> By {cls.createdBy}</span>
                            </div>

                            {/* Tags */}
                            <div className="oc-tags">
                                {cls.departments.map(d => <span key={d} className="oc-tag dept">{d}</span>)}
                                {cls.years.map(y => <span key={y} className="oc-tag year">{y}</span>)}
                            </div>

                            {cls.description && <p className="oc-desc">{cls.description}</p>}

                            <a href={cls.meetLink} target="_blank" rel="noreferrer" className="btn btn-primary oc-join-btn">
                                <ExternalLink size={15} /> Join Class
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OnlineClasses;
