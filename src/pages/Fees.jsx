import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, CheckCircle, AlertCircle, Bell } from 'lucide-react';
import { getFees, deleteFee, markFeePaid, sendFeeReminders } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Fees.css';


const Fees = () => {
    const { user } = useAuth();
    const [fees, setFees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadFees(); }, []);

    const loadFees = async () => {
        try {
            const data = await getFees();
            setFees(data.map(f => ({ ...f, studentName: f.student_name, dueDate: f.due_date })));
        } catch (error) { console.error("Failed to load fees", error); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this fee record?')) { await deleteFee(id); loadFees(); }
    };

    const handleMarkPaid = async (id) => {
        try {
            await markFeePaid(id);
            loadFees();
        } catch (e) { alert('Failed: ' + (e.response?.data?.error || e.message)); }
    };

    const handleSendReminder = async () => {
        try {
            const data = await sendFeeReminders();
            alert(data.message);
        } catch (e) { alert('Failed: ' + (e.response?.data?.error || e.message)); }
    };

    const filteredFees = fees.filter(fee =>
        (fee.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingCount = fees.filter(f => f.status === 'Pending').length;
    const paidCount = fees.filter(f => f.status === 'Paid').length;
    const totalPending = fees.filter(f => f.status === 'Pending').reduce((s, f) => s + f.amount, 0);
    const isAdmin = user?.role === 'admin' || user?.role === 'principal';

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Fees Management</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {isAdmin && (
                        <>
                            <button className="btn btn-secondary" onClick={handleSendReminder}>
                                <Bell size={16} /> Send Reminders
                            </button>
                            <Link to="/fees/add" className="btn btn-primary">
                                <Plus size={18} /> Add Fee
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div className="fee-stats">
                <div className="fee-stat pending"><AlertCircle size={20} /><div><div className="stat-num">{pendingCount}</div><div className="stat-label">Pending (₹{totalPending})</div></div></div>
                <div className="fee-stat paid"><CheckCircle size={20} /><div><div className="stat-num">{paidCount}</div><div className="stat-label">Paid</div></div></div>
            </div>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="table-container">
                {filteredFees.length === 0 ? (
                    <div className="empty-state"><p>No fee records found.</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th><th>Fee Type</th><th>Amount</th><th>Due Date</th><th>Status</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFees.map((fee) => (
                                <tr key={fee.id}>
                                    <td>{fee.studentName || 'Unknown'}</td>
                                    <td>{fee.type}</td>
                                    <td>₹{fee.amount}</td>
                                    <td>{fee.dueDate}</td>
                                    <td>
                                        <span className={`status-badge ${fee.status.toLowerCase()}`}>
                                            {fee.status === 'Paid' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                            {fee.status}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="actions-cell">
                                            {fee.status === 'Pending' && (
                                                <button onClick={() => handleMarkPaid(fee.id)} className="btn btn-success btn-xs">
                                                    <CheckCircle size={14} /> Pay
                                                </button>
                                            )}
                                            <Link to={`/fees/edit/${fee.id}`} className="icon-btn edit"><Edit size={18} /></Link>
                                            <button onClick={() => handleDelete(fee.id)} className="icon-btn delete"><Trash2 size={18} /></button>
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
