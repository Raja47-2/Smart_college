import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addFaculty, updateFaculty, getFaculty } from '../services/api';
import './FacultyForm.css';

const FacultyForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        department: '',
        designation: '',
        registration_no: '',
        password: '' // Only for new faculty
    });

    useEffect(() => {
        if (isEditMode) {
            getFaculty().then(facultyList => {
                const member = facultyList.find(f => f.id === parseInt(id) || f.id === id);
                if (member) {
                    setFormData(member);
                } else {
                    navigate('/faculty');
                }
            });
        }
    }, [id, isEditMode, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await updateFaculty(id, formData);
                alert('Faculty updated successfully!');
            } else {
                await addFaculty(formData);
                alert('Faculty added successfully!');
            }
            navigate('/faculty');
        } catch (error) {
            console.error("Error saving faculty", error);
            alert('Failed to save faculty. Please check the console for details.\nError: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>{isEditMode ? 'Edit Faculty Member' : 'Add New Faculty Member'}</h1>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Dr. Sarah Smith"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="e.g. sarah@college.edu"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="registration_no">Registration Number</label>
                        <input
                            type="text"
                            id="registration_no"
                            name="registration_no"
                            value={formData.registration_no}
                            onChange={handleChange}
                            required
                            placeholder="e.g. FAC-2024-001"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="department">Department</label>
                            <select
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Department</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Mechanical">Mechanical</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Civil">Civil</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="designation">Designation</label>
                            <select
                                id="designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Designation</option>
                                <option value="Professor">Professor</option>
                                <option value="Associate Professor">Associate Professor</option>
                                <option value="Assistant Professor">Assistant Professor</option>
                                <option value="Lecturer">Lecturer</option>
                                <option value="Lab Instructor">Lab Instructor</option>
                            </select>
                        </div>

                        {!isEditMode && (
                            <div className="form-group">
                                <label htmlFor="password">Password (Optional)</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Default: 123456"
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate('/faculty')} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {isEditMode ? 'Update Member' : 'Save Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FacultyForm;
