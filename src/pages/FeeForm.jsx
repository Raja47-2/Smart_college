import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addFee, updateFee, getFees, getStudents } from '../services/api';
import './FeeForm.css';

const FeeForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [students, setStudents] = useState([]);
    const [formData, setFormData] = useState({
        studentId: '',
        type: 'Tuition Fee',
        amount: '',
        dueDate: '',
        status: 'Pending'
    });

    useEffect(() => {
        loadInitialData();
    }, [id, isEditMode]);

    const loadInitialData = async () => {
        try {
            const studentsList = await getStudents();
            setStudents(studentsList);

            if (isEditMode) {
                const feesList = await getFees();
                const fee = feesList.find(f => f.id === parseInt(id) || f.id === id);
                if (fee) {
                    setFormData({
                        studentId: fee.student_id || fee.studentId,
                        type: fee.type,
                        amount: fee.amount,
                        dueDate: fee.due_date || fee.dueDate,
                        status: fee.status
                    });
                } else {
                    navigate('/fees');
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await updateFee(id, formData);
            } else {
                await addFee(formData);
            }
            navigate('/fees');
        } catch (error) {
            console.error("Error saving fee", error);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>{isEditMode ? 'Edit Fee Record' : 'Add New Fee Record'}</h1>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="studentId">Student</label>
                        <select
                            id="studentId"
                            name="studentId"
                            value={formData.studentId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Student</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.course})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="type">Fee Type</label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                <option value="Tuition Fee">Tuition Fee</option>
                                <option value="Library Fee">Library Fee</option>
                                <option value="Laboratory Fee">Laboratory Fee</option>
                                <option value="Hostel Fee">Hostel Fee</option>
                                <option value="Transport Fee">Transport Fee</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="amount">Amount ($)</label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                min="0"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="dueDate">Due Date</label>
                            <input
                                type="date"
                                id="dueDate"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                            >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate('/fees')} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {isEditMode ? 'Update Record' : 'Save Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeeForm;
