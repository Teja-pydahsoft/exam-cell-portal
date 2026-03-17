import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Building2, Search, GraduationCap, Layers, GitBranch, ChevronRight, User } from 'lucide-react';
import './Institution.css';

const Institution = ({ initialTab = 'colleges' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [data, setData] = useState({ colleges: [], courses: [], batches: [], branches: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Sync tab when prop changes (navigation)
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get('/institution/details');
                if (response.data.success) {
                    setData(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch institution details', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, []);

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`tab-button ${activeTab === id ? 'active' : ''}`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    const renderContent = () => {
        const getActiveData = () => {
            switch (activeTab) {
                case 'colleges': return data.colleges || [];
                case 'programs': return data.courses || [];
                case 'branches': return data.branches || [];
                case 'batches': return data.batches || [];
                default: return [];
            }
        };

        const allItems = getActiveData();
        const items = allItems.filter(item =>
            item.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const getThemeClass = () => {
            switch (activeTab) {
                case 'colleges': return 'theme-colleges';
                case 'programs': return 'theme-programs';
                case 'branches': return 'theme-branches';
                case 'batches': return 'theme-batches';
                default: return '';
            }
        };

        const getIcon = () => {
            switch (activeTab) {
                case 'colleges': return Building2;
                case 'programs': return GraduationCap;
                case 'branches': return GitBranch;
                case 'batches': return Layers;
                default: return Layers;
            }
        };

        const Icon = getIcon();
        const themeClass = getThemeClass();
        const title = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

        if (loading) return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}>
                <div style={{ width: '3rem', height: '3rem', border: '4px solid #e5e7eb', borderTopColor: '#3D4127', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );

        return (
            <div className="institution-grid anim-fade-in">
                {items.length > 0 ? (
                    items.map((item, index) => (
                        <div key={index} className={`institution-card ${themeClass}`}>
                            {/* Background Decoration */}
                            <div className="card-bg-decoration"></div>

                            <div className="card-header">
                                <div className="icon-box">
                                    <Icon size={24} strokeWidth={2} />
                                </div>
                                <span className="id-badge">
                                    ID: {index + 1}
                                </span>
                            </div>

                            <div className="card-content">
                                <h3 className="card-title">
                                    {item.name}
                                </h3>

                                <div className="card-footer">
                                    <div className="student-count">
                                        <User size={14} />
                                        <span>{item.student_count?.toLocaleString()}</span>
                                        <span className="count-label">Students</span>
                                    </div>

                                    <div className="arrow-icon">
                                        <ChevronRight size={16} strokeWidth={2.5} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className={`icon-box ${themeClass}`} style={{ marginBottom: '1rem', width: '4rem', height: '4rem' }}>
                            <Icon size={32} strokeWidth={1.5} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            No {title.toLowerCase()} found
                        </h3>
                        <p style={{ color: 'var(--gray-500)' }}>
                            Try adjusting your search for "{searchTerm}"
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="institution-container min-h-full">
            <div className="institution-controls" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>

                <div className="search-container">
                    <div className="search-icon">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={`Search ${activeTab}...`}
                        className="search-input"
                    />
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default Institution;
