import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Calendar, Download } from 'lucide-react';
import axios from 'axios';
import './AttendanceReport.css';

const API = 'http://localhost:5000/api';

const AttendanceReport = () => {
    const [report, setReport] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');

    useEffect(() => { loadReport(); }, []);

    const loadReport = async () => {
        setLoading(true);
        try {
            const params = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : '';
            const res = await axios.get(`${API}/attendance/report${params}`, { headers: { Authorization: `Bearer ${token}` } });
            setReport(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const lowCount = report.filter(r => r.low_attendance).length;
    const avgPct = report.length ? Math.round(report.reduce((s, r) => s + r.percentage, 0) / report.length) : 0;

    const exportCSV = () => {
        const headers = ['Name', 'Course', 'Department', 'Year', 'Present', 'Absent', 'Total', 'Percentage'];
        const rows = report.map(r => [r.name, r.course, r.department, r.year, r.present_count, r.absent_count, r.total_count, r.percentage + '%']);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><TrendingUp size={24} /> Attendance Report</h1>
                <button className="btn btn-secondary" onClick={exportCSV}><Download size={16} /> Export CSV</button>
            </div>

            {lowCount > 0 && (
                <div className="alert alert-warning">
                    <AlertTriangle size={18} />
                    <strong>{lowCount} student{lowCount > 1 ? 's' : ''}</strong> have attendance below 75%!
                </div>
            )}

            <div className="report-stats">
                <div className="stat-pill"><TrendingUp size={16} /> Avg Attendance: <strong>{avgPct}%</strong></div>
                <div className="stat-pill low"><AlertTriangle size={16} /> Low Attendance: <strong>{lowCount}</strong></div>
                <div className="stat-pill"><span>Total Students:</span> <strong>{report.length}</strong></div>
            </div>

            <div className="filter-bar">
                <label>From: <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
                <label>To: <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
                <button className="btn btn-primary" onClick={loadReport}><Calendar size={16} /> Generate</button>
            </div>

            {loading ? (
                <div className="loading">Generating report...</div>
            ) : (
                <div className="table-container">
                    {report.length === 0 ? (
                        <div className="empty-state"><p>No attendance data found.</p></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Course</th>
                                    <th>Department</th>
                                    <th>Present</th>
                                    <th>Absent</th>
                                    <th>Total</th>
                                    <th>Percentage</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.map(r => (
                                    <tr key={r.student_id} className={r.low_attendance ? 'low-row' : ''}>
                                        <td>{r.name}</td>
                                        <td>{r.course}</td>
                                        <td>{r.department}</td>
                                        <td className="present-cell">{r.present_count}</td>
                                        <td className="absent-cell">{r.absent_count}</td>
                                        <td>{r.total_count}</td>
                                        <td>
                                            <div className="progress-bar">
                                                <div className={`progress-fill ${r.low_attendance ? 'low' : 'good'}`} style={{ width: `${r.percentage}%` }} />
                                                <span>{r.percentage}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            {r.low_attendance ? (
                                                <span className="badge badge-danger"><AlertTriangle size={12} /> Low</span>
                                            ) : (
                                                <span className="badge badge-success">✓ Good</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default AttendanceReport;
