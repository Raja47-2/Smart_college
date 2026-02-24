import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

import { User, Shield, GraduationCap, ArrowLeft, ShieldCheck } from 'lucide-react';

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
            // 'admin' profession handles both 'admin' and 'principal' database roles
            if (selectedRole === 'admin') {
                if (user.role !== 'admin' && user.role !== 'principal') {
                    setError("Access Denied: You do not have administrative privileges.");
                    return;
                }
            } else if (user.role !== selectedRole) {
                setError(`Access Denied: You are not a ${selectedRole === 'teacher' ? 'Faculty' : selectedRole}`);
                return;
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
                    <p>Login to your account to continue</p>
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
                            <h3>Administrator</h3>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const getRoleLabel = () => {
        if (selectedRole === 'student') return 'Student';
        if (selectedRole === 'teacher') return 'Faculty';
        return 'Administrator';
    };

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
                <h2>{getRoleLabel()} Login</h2>
                {error && <p className="error">{error}</p>}
                <div className="form-group">
                    <label>
                        {selectedRole === 'student' || selectedRole === 'teacher'
                            ? 'Email or Registration Number'
                            : 'Administrator Email'
                        }
                    </label>
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                            selectedRole === 'student'
                                ? 'e.g. student@email.com or REG-2024-001'
                                : selectedRole === 'teacher'
                                    ? 'e.g. faculty@college.edu or FAC-001'
                                    : 'admin@college.edu or principal@college.edu'
                        }
                        required
                    />
                    {(selectedRole === 'student' || selectedRole === 'teacher') && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                            You can login with your email address or registration number
                        </span>
                    )}
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={
                            selectedRole === 'admin'
                                ? 'Your admin or principal password'
                                : 'Default password: 123456'
                        }
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Login</button>
            </form>
        </div>
    );
};

export default Login;
