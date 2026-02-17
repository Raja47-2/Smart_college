import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addStudent, updateStudent, getStudents } from '../services/api';
import './StudentForm.css';

const StudentForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        course: '',
        department: '',
        year: '',
        registration_no: '',
        type: '',
        password: '' // Only for new students
    });

    useEffect(() => {
        if (isEditMode) {
            // Fetch all and find (since we don't have getById API yet)
            getStudents().then(students => {
                const student = students.find(s => s.id === parseInt(id) || s.id === id); // Handle string/int compatibility
                if (student) {
                    setFormData(student);
                } else {
                    navigate('/students');
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
                await updateStudent(id, formData);
            } else {
                await addStudent(formData);
            }
            navigate('/students');
        } catch (error) {
            console.error("Error saving student", error);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>{isEditMode ? 'Edit Student' : 'Add New Student'}</h1>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="registration_no">Registration No</label>
                        <input
                            type="text"
                            id="registration_no"
                            name="registration_no"
                            value={formData.registration_no}
                            onChange={handleChange}
                            required
                            placeholder="e.g. REG-2024-001"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. John Doe"
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
                            placeholder="e.g. john@college.edu"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="course">Stream (Course)</label>
                            <select
                                id="course"
                                name="course"
                                value={formData.course}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Stream</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Polytechnic">Polytechnic</option>
                            </select>
                        </div>

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
                    </div>

                    <div className="form-group">
                        <label htmlFor="year">Year</label>
                        <select
                            id="year"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Year</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                        </select>
                    </div>


                    <div className="form-group">
                        <label htmlFor="type">Student Type</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Type</option>
                            <option value="Hosteler">Hosteler</option>
                            <option value="Day Scholar">Day Scholar</option>
                        </select>
                    </div>

                    {!isEditMode && (
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Create a password"
                            />
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate('/students')} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {isEditMode ? 'Update Student' : 'Save Student'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default StudentForm;
