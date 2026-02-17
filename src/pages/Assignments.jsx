import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Clock, FileText, Upload } from 'lucide-react';
import { getAssignments, submitAssignment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Assignments.css';

const Assignments = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        try {
            const data = await getAssignments();
            setAssignments(data);
        } catch (error) {
            console.error("Failed to load assignments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (id) => {
        // Mock file upload
        const fileUrl = prompt("Enter file URL (mock upload):", "https://drive.google.com/file/...");
        if (fileUrl) {
            try {
                await submitAssignment(id, { fileUrl });
                alert("Assignment submitted successfully!");
            } catch (error) {
                console.error("Submission failed", error);
                alert("Failed to submit assignment.");
            }
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Assignments</h1>
                {(user.role === 'teacher' || user.role === 'admin') && (
                    <Link to="/assignments/add" className="btn btn-primary">
                        <Plus size={18} />
                        Create Assignment
                    </Link>
                )}
            </div>

            <div className="assignments-grid">
                {assignments.length === 0 ? (
                    <div className="empty-state">
                        <p>No assignments found.</p>
                    </div>
                ) : (
                    assignments.map(assign => (
                        <div key={assign.id} className="assignment-card">
                            <div className="card-header">
                                <h3>{assign.title}</h3>
                                <span className="course-badge">{assign.course}</span>
                            </div>
                            <p className="description">{assign.description}</p>
                            <div className="card-footer">
                                <div className="meta-info">
                                    <span className="due-date">
                                        <Clock size={16} /> Due: {assign.due_date}
                                    </span>
                                    <span className="teacher">
                                        <BookOpen size={16} /> {assign.teacher_name}
                                    </span>
                                </div>
                                {user.role === 'student' && (
                                    <button
                                        onClick={() => handleSubmit(assign.id)}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        <Upload size={16} /> Submit
                                    </button>
                                )}
                                {(user.role === 'teacher' || user.role === 'admin') && (
                                    <Link to={`/assignments/${assign.id}/submissions`} className="btn btn-secondary btn-sm">
                                        View Submissions
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Assignments;
