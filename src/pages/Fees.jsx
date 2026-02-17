import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { getFees, deleteFee } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Fees.css';

const Fees = () => {
    const { user } = useAuth();
    const [fees, setFees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFees();
    }, []);

    const loadFees = async () => {
        try {
            const data = await getFees();
            const mappedFees = data.map(f => ({
                ...f,
                id: f.id,
                studentId: f.student_id,
                studentName: f.student_name,
                type: f.type,
                amount: f.amount,
                dueDate: f.due_date,
                status: f.status
            }));
            setFees(mappedFees);
        } catch (error) {
            console.error("Failed to load fees", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this fee record?')) {
            await deleteFee(id);
            loadFees();
        }
    };

    const filteredFees = fees.filter(fee => {
        const studentName = fee.studentName || '';
        return studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fee.type.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const isAdmin = user?.role === 'admin';

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Fees Management</h1>
                {isAdmin && (
                    <Link to="/fees/add" className="btn btn-primary">
                        <Plus size={18} />
                        Add Fee Record
                    </Link>
                )}
            </div>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by student or fee type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                {filteredFees.length === 0 ? (
                    <div className="empty-state">
                        <p>No fee records found.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Fee Type</th>
                                <th>Amount</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFees.map((fee) => (
                                <tr key={fee.id}>
                                    <td>{fee.studentName || 'Unknown Student'}</td>
                                    <td>{fee.type}</td>
                                    <td>${fee.amount}</td>
                                    <td>{fee.dueDate}</td>
                                    <td>
                                        <span className={`status-badge ${fee.status.toLowerCase()}`}>
                                            {fee.status === 'Paid' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                            {fee.status}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="actions-cell">
                                            <Link to={`/fees/edit/${fee.id}`} className="icon-btn edit">
                                                <Edit size={18} />
                                            </Link>
                                            <button onClick={() => handleDelete(fee.id)} className="icon-btn delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Fees;
