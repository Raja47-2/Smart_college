import React, { useState } from 'react';
import { Database, Download, CheckCircle } from 'lucide-react';
import './Backup.css';

const Backup = () => {
    const [status, setStatus] = useState('idle'); // idle | downloading | done
    const token = localStorage.getItem('token');

    const handleBackup = async () => {
        setStatus('downloading');
        try {
            const res = await fetch('http://localhost:5000/api/backup', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Backup request failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `college_backup_${new Date().toISOString().split('T')[0]}.db`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setStatus('done');
        } catch (e) {
            alert('Backup failed: ' + e.message);
            setStatus('idle');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><Database size={24} /> Data Backup</h1>
            </div>

            <div className="backup-card">
                <div className="backup-icon">
                    <Database size={64} />
                </div>
                <h2>Database Backup</h2>
                <p>Download a full backup of the college database. This file includes all students, faculty, attendance, fees, and other records.</p>

                <button
                    className={`btn btn-primary backup-btn ${status === 'downloading' ? 'loading-btn' : ''}`}
                    onClick={handleBackup}
                    disabled={status === 'downloading'}
                >
                    {status === 'downloading' ? (
                        <><span className="spinner" /> Preparing Backup...</>
                    ) : status === 'done' ? (
                        <><CheckCircle size={18} /> Downloaded!</>
                    ) : (
                        <><Download size={18} /> Download Backup</>
                    )}
                </button>

                <div className="backup-info">
                    <p>⚠️ Keep this file secure. It contains all college data.</p>
                    <p>📅 Today: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};

export default Backup;
