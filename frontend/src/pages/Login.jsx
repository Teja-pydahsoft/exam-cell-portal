import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, User } from 'lucide-react';

import logo from '../assets/logo.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await login(username, password);
        if (success) {
            navigate('/admin/master-setup/dashboard');
        }
        setIsLoading(false);
    };

    return (
        <div className="login-page">
            {/* Left Panel - Hero */}
            <div className="login-hero">
                <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop" className="hero-bg-image" alt="Campus" />
                <div className="hero-overlay"></div>

                <div className="hero-content">
                    <div className="logo-highlight mb-12">
                        <img src={logo} className="w-64 h-auto" alt="Pydah Group" />
                    </div>
                    <h1 className="hero-title">
                        Exam Cell <br /> <span style={{ color: 'var(--accent-400)' }}>Portal</span>
                    </h1>
                    <p className="hero-subtitle">
                        Welcome to the central Exam Cell Portal. Manage examinations, track results, and coordinate faculty assignments in one seamless workspace.
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="login-form-container">
                <div className="login-card">
                    <div className="text-center mb-8">
                        <h2 style={{ fontFamily: 'Playfair Display', fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--primary-900)' }}>Welcome Back</h2>
                        <p style={{ color: 'var(--gray-500)' }}>Sign in to access your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <div className="input-wrapper">
                                <User size={20} className="input-icon" />
                                <input
                                    type="text"
                                    className="form-input"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your ID"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-wrapper">
                                <Lock size={20} className="input-icon" />
                                <input
                                    type="password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={isLoading}
                            style={{ marginTop: '1rem' }}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                            {!isLoading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-sm text-gray-400">
                        &copy; 2025 Pydah Educational Academy.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
