import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

import { User, Shield, GraduationCap, ArrowLeft } from 'lucide-react';

const Login = () => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await login(email, password);

            // Verify role matches selection
            if (user.role !== selectedRole) {
                if (
                    (selectedRole === 'admin' && user.role !== 'admin') ||
                    (selectedRole === 'teacher' && user.role !== 'teacher') ||
                    (selectedRole === 'student' && user.role !== 'student')
                ) {
                    setError(`Access Denied: You are not a ${selectedRole}`);
                    // Optional: Logout immediately if token was set
                    // logout(); 
                    return;
                }
            }

            // Redirect based on role
            if (user.role === 'student') navigate('/student-dashboard');
            else if (user.role === 'teacher') navigate('/teacher-dashboard');
            else navigate('/');
        } catch (err) {
            if (selectedRole === 'student') {
                setError('Invalid Registration Number or password. Check your registration number and try again.');
            } else {
                setError('Invalid email or password. Please check your credentials.');
            }
        }
    };

    if (!selectedRole) {
        return (
            <div className="login-container">
                <div className="role-selection-container">
                    <h2>Select Your Profession</h2>
                    <p>login</p>
                    <div className="role-cards">
                        <div className="role-card student" onClick={() => setSelectedRole('student')}>
                            <GraduationCap className="role-icon" />
                            <h3>Student</h3>
                        </div>
                        <div className="role-card faculty" onClick={() => setSelectedRole('teacher')}>
                            <User className="role-icon" />
                            <h3>Faculty</h3>
                        </div>
                        <div className="role-card admin" onClick={() => setSelectedRole('admin')}>
                            <Shield className="role-icon" />
                            <h3>Admin</h3>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <button type="button" className="back-btn" onClick={() => {
                    setSelectedRole(null);
                    setError('');
                    setEmail('');
                    setPassword('');
                }}>
                    <ArrowLeft size={16} /> Back to Roles
                </button>
                <h2>{selectedRole === 'student' ? 'Student' : (selectedRole === 'teacher' ? 'Faculty' : 'Admin')} Login</h2>
                {error && <p className="error">{error}</p>}
                <div className="form-group">
                    <label>{selectedRole === 'student' ? 'Registration Number' : 'Email'}</label>
                    <input
                        type={selectedRole === 'student' ? 'text' : 'email'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                            selectedRole === 'student'
                                ? 'e.g. REG-2024-001'
                                : selectedRole === 'admin'
                                    ? 'admin@college.edu'
                                    : 'faculty@college.edu'
                        }
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={
                            selectedRole === 'admin'
                                ? 'Default: admin123'
                                : 'Enter your password (if set)'
                        }
                    />
                </div>
                <button type="submit" className="btn btn-primary">Login</button>
            </form>
        </div>
    );
};

export default Login;
