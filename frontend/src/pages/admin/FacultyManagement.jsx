import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Search, Edit, Trash2, Mail, Phone, Users, UserCog, GraduationCap, X, Check, ArrowRight, ArrowLeft, Eye } from 'lucide-react';
import './Faculty.css';

const FacultyManagement = ({ initialTab = 'principals' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalStep, setModalStep] = useState(1);
    const [institutionData, setInstitutionData] = useState({ colleges: [], courses: [], branches: [] });

    // User State
    const [newUser, setNewUser] = useState({
        name: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        role: 'college_principal',
        college_ids: [],
        course_ids: [],
        branch_ids: [],
        all_courses: false,
        all_branches: false
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    // Sync tab when prop changes (navigation)
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        fetchFaculty();
        fetchInstitutionDetails();
    }, []);

    const fetchInstitutionDetails = async () => {
        try {
            const response = await api.get('/institution/details');
            if (response.data.success) {
                setInstitutionData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch institution details', error);
        }
    };

    const fetchFaculty = async () => {
        try {
            const response = await api.get('/faculty');
            if (response.data.success) {
                // Filter immediately to include only Hods and Principals
                const allUsers = response.data.data;
                const relevantUsers = allUsers.filter(user => {
                    const r = user.role?.toLowerCase() || '';
                    return r.includes('principal') || r.includes('hod');
                });
                setFaculty(relevantUsers);
            }
        } catch (error) {
            console.error('Failed to fetch faculty', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        if (isViewMode) return;
        const { name, value, type, checked } = e.target;
        setNewUser(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleScopeChange = (type, id) => {
        if (isViewMode) return;
        setNewUser(prev => {
            const currentList = prev[type] || [];
            if (currentList.includes(id)) {
                return { ...prev, [type]: currentList.filter(item => item !== id) };
            } else {
                return { ...prev, [type]: [...currentList, id] };
            }
        });
    };

    const openCreateModal = () => {
        setNewUser({
            name: '', username: '', password: '', email: '', phone: '', role: 'college_principal',
            college_ids: [], course_ids: [], branch_ids: [], all_courses: false, all_branches: false
        });
        setIsEditing(false);
        setIsViewMode(false);
        setEditingId(null);
        setModalStep(1);
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setNewUser({
            ...user,
            password: '', // Don't show password
            college_ids: typeof user.college_ids === 'string' ? JSON.parse(user.college_ids) : (user.college_ids || []),
            course_ids: typeof user.course_ids === 'string' ? JSON.parse(user.course_ids) : (user.course_ids || []),
            branch_ids: typeof user.branch_ids === 'string' ? JSON.parse(user.branch_ids) : (user.branch_ids || []),
            all_courses: !!user.all_courses,
            all_branches: !!user.all_branches
        });
        setIsEditing(true);
        setIsViewMode(false);
        setEditingId(user.id);
        setModalStep(1);
        setShowModal(true);
    };

    const openViewModal = (user) => {
        setNewUser({
            ...user,
            password: '',
            college_ids: typeof user.college_ids === 'string' ? JSON.parse(user.college_ids) : (user.college_ids || []),
            course_ids: typeof user.course_ids === 'string' ? JSON.parse(user.course_ids) : (user.course_ids || []),
            branch_ids: typeof user.branch_ids === 'string' ? JSON.parse(user.branch_ids) : (user.branch_ids || []),
            all_courses: !!user.all_courses,
            all_branches: !!user.all_branches
        });
        setIsEditing(false);
        setIsViewMode(true);
        setEditingId(user.id);
        setModalStep(2); // Jump directly to scope view
        setShowModal(true);
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to deactivate ${user.name}?`)) return;
        try {
            await api.delete(`/faculty/${user.id}`);
            fetchFaculty();
        } catch (error) {
            console.error('Failed to delete user', error);
            alert('Failed to deactivate user');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (isViewMode) {
            setShowModal(false);
            return;
        }
        setSaving(true);
        try {
            const payload = { ...newUser };
            if (isEditing) {
                if (!payload.password) delete payload.password; // Don't send empty password on update
                await api.put(`/faculty/${editingId}`, payload);
            } else {
                await api.post('/faculty', payload);
            }

            setShowModal(false);
            fetchFaculty(); // Refresh list
        } catch (error) {
            console.error('Failed to save user', error);
            alert(error.response?.data?.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`tab-button ${activeTab === id ? 'active' : ''}`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    const formatRole = (role) => {
        if (!role) return 'N/A';
        return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Helper to categorize roles
    const getRoleCategory = (role) => {
        if (!role) return 'other';
        const r = role.toLowerCase();
        if (r.includes('principal')) return 'principals';
        if (r.includes('hod')) return 'hods';
        return 'other';
    };

    const renderContent = () => {
        const getActiveData = () => {
            if (activeTab === 'all') return faculty;
            return faculty.filter(f => getRoleCategory(f.role) === activeTab);
        };

        const allItems = getActiveData();
        const items = allItems.filter(item =>
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.role?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const getThemeClass = (activeTab) => {
            switch (activeTab) {
                case 'all': return 'theme-faculty';
                case 'principals': return 'theme-principals';
                case 'hods': return 'theme-hods';
                default: return 'theme-faculty';
            }
        };

        const themeClass = getThemeClass(activeTab);
        const title = activeTab === 'all' ? 'Users' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

        if (loading) return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}>
                <div style={{ width: '3rem', height: '3rem', border: '4px solid #e5e7eb', borderTopColor: '#3D4127', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );

        return (
            <div className="institution-grid anim-fade-in">
                {items.length > 0 ? (
                    items.map((item, index) => {
                        const itemTheme = activeTab === 'all' ? `theme-${getRoleCategory(item.role)}` : themeClass;

                        return (
                            <div key={index} className={`institution-card ${itemTheme} group`}>
                                <div className="card-bg-decoration"></div>

                                <div className="card-header justify-end" style={{ minHeight: 'auto', paddingBottom: 0, marginBottom: 0 }}>
                                    <span className={`id-badge ${item.is_active ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`} style={{ marginTop: '0.25rem' }}>
                                        {item.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="card-content">
                                    <h3 className="card-title text-base font-bold leading-tight mb-2">
                                        {item.name}
                                    </h3>
                                    <div className="mb-3">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 text-[10px] font-semibold text-gray-600 border border-gray-100 uppercase tracking-wider">
                                            <GraduationCap size={10} />
                                            {formatRole(item.role)}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 mb-3">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 truncate" title={item.email}>
                                            <Mail size={12} className="flex-shrink-0" />
                                            <span className="truncate">{item.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Phone size={12} className="flex-shrink-0" />
                                            <span>{item.phone || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="card-footer pt-3 mt-1 border-t border-gray-100">
                                        <div className="student-count">
                                            <span className="text-xs text-gray-400 font-mono">@{item.username}</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openViewModal(item)}
                                                className="p-1.5 rounded-full hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="View Access Scope"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(item)}
                                                className="p-1.5 rounded-full hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(item)}
                                                className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Deactivate User"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="empty-state">
                        <div className={`icon-box ${themeClass}`} style={{ marginBottom: '1rem', width: '4rem', height: '4rem' }}>
                            <Users size={32} strokeWidth={1.5} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            No users found
                        </h3>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-2 faculty-page">
            <div className="institution-header" style={{ marginBottom: '1rem' }}>
                <div>
                    <h1 className="institution-title">Faculty & Staff</h1>
                    <p className="institution-subtitle">Manage Principals and HODs.</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={18} />
                    <span>Add User</span>
                </button>
            </div>

            <div className="institution-controls">
                <div className="tabs-container">
                    <TabButton id="all" label="All" icon={Users} />
                    <TabButton id="principals" label="Principals" icon={GraduationCap} />
                    <TabButton id="hods" label="HODs" icon={UserCog} />
                </div>

                <div className="search-container">
                    <div className="search-icon">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="search-input"
                    />
                </div>
            </div>

            {renderContent()}

            {/* Add/Edit/View User Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <form onSubmit={handleCreateUser}>
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    {isViewMode ? 'View User Access' : (isEditing ? 'Edit User & Scope' : 'Add New User')}
                                </h3>
                                <button type="button" className="modal-close" onClick={() => setShowModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="modal-body">
                                {modalStep === 1 ? (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Full Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={newUser.name}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="e.g. Dr. John Doe"
                                                required
                                                disabled={isViewMode}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Role</label>
                                            <select
                                                name="role"
                                                value={newUser.role}
                                                onChange={handleInputChange}
                                                className="form-select"
                                                required
                                                disabled={isViewMode}
                                            >
                                                <option value="college_principal">College Principal</option>
                                                <option value="campus_principal">Campus Principal</option>
                                                <option value="course_principal">Course Principal</option>
                                                <option value="branch_hod">Branch HOD</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="form-group">
                                                <label className="form-label">Username</label>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={newUser.username}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    required
                                                    disabled={isViewMode}
                                                />
                                            </div>
                                            {!isViewMode && (
                                                <div className="form-group">
                                                    <label className="form-label">Password</label>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        value={newUser.password}
                                                        onChange={handleInputChange}
                                                        className="form-input"
                                                        placeholder={isEditing ? "(Unchanged)" : ""}
                                                        required={!isEditing}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={newUser.email}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                disabled={isViewMode}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={newUser.phone}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                disabled={isViewMode}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* View Mode: Access Scope */}
                                        <div className="scope-section">
                                            <h4 className="scope-title">Assigned Colleges</h4>
                                            {newUser.college_ids.length === 0 && <p className="text-xs text-gray-400 italic">No colleges assigned</p>}
                                            <div className="scope-grid">
                                                {isViewMode ? (
                                                    newUser.college_ids.map((id, i) => {
                                                        const item = institutionData.colleges.find(c => String(c.id) === String(id));
                                                        return (
                                                            <label key={i} className="scope-item cursor-default">
                                                                <input type="checkbox" checked readOnly disabled />
                                                                {item ? item.name : `ID: ${id}`}
                                                            </label>
                                                        );
                                                    })
                                                ) : (
                                                    institutionData.colleges.map((c, i) => (
                                                        <label key={i} className="scope-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={newUser.college_ids.includes(c.id)}
                                                                onChange={() => handleScopeChange('college_ids', c.id)}
                                                            />
                                                            {c.name}
                                                        </label>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="scope-section">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="scope-title mb-0">Assigned Courses/Programs</h4>
                                                {!isViewMode && (
                                                    <label className="text-sm flex items-center gap-2 cursor-pointer text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            name="all_courses"
                                                            checked={newUser.all_courses}
                                                            onChange={handleInputChange}
                                                        />
                                                        All Courses
                                                    </label>
                                                )}
                                            </div>

                                            {newUser.all_courses ? (
                                                <div className="p-3 bg-green-50 border border-green-100 rounded-md text-sm text-green-700 font-medium flex items-center gap-2">
                                                    <Check size={16} />
                                                    All Courses Assigned (Full Access)
                                                </div>
                                            ) : (
                                                <>
                                                    {newUser.course_ids.length === 0 && <p className="text-xs text-gray-400 italic">No courses assigned</p>}
                                                    <div className="scope-grid">
                                                        {isViewMode ? (
                                                            newUser.course_ids.map((id, i) => {
                                                                const item = institutionData.courses.find(c => String(c.id) === String(id));
                                                                return (
                                                                    <label key={i} className="scope-item cursor-default">
                                                                        <input type="checkbox" checked readOnly disabled />
                                                                        {item ? item.name : `ID: ${id}`}
                                                                    </label>
                                                                );
                                                            })
                                                        ) : (
                                                            institutionData.courses.map((c, i) => (
                                                                <label key={i} className="scope-item">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={newUser.course_ids.includes(c.id)}
                                                                        onChange={() => handleScopeChange('course_ids', c.id)}
                                                                    />
                                                                    {c.name}
                                                                </label>
                                                            ))
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="scope-section">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="scope-title mb-0">Assigned Branches</h4>
                                                {!isViewMode && (
                                                    <label className="text-sm flex items-center gap-2 cursor-pointer text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            name="all_branches"
                                                            checked={newUser.all_branches}
                                                            onChange={handleInputChange}
                                                        />
                                                        All Branches
                                                    </label>
                                                )}
                                            </div>

                                            {newUser.all_branches ? (
                                                <div className="p-3 bg-green-50 border border-green-100 rounded-md text-sm text-green-700 font-medium flex items-center gap-2">
                                                    <Check size={16} />
                                                    All Branches Assigned (Full Access)
                                                </div>
                                            ) : (
                                                <>
                                                    {newUser.branch_ids.length === 0 && <p className="text-xs text-gray-400 italic">No branches assigned</p>}
                                                    <div className="scope-grid">
                                                        {isViewMode ? (
                                                            newUser.branch_ids.map((id, i) => {
                                                                const item = institutionData.branches.find(b => String(b.id) === String(id));
                                                                return (
                                                                    <label key={i} className="scope-item cursor-default">
                                                                        <input type="checkbox" checked readOnly disabled />
                                                                        {item ? item.name : `ID: ${id}`}
                                                                    </label>
                                                                );
                                                            })
                                                        ) : (
                                                            institutionData.branches.map((b, i) => (
                                                                <label key={i} className="scope-item">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={newUser.branch_ids.includes(b.id)}
                                                                        onChange={() => handleScopeChange('branch_ids', b.id)}
                                                                    />
                                                                    {b.name}
                                                                </label>
                                                            ))
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="modal-footer">
                                {modalStep === 1 ? (
                                    <>
                                        <div style={{ flex: 1 }}></div>
                                        <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>
                                            {isViewMode ? 'Close' : 'Cancel'}
                                        </button>
                                        <button type="button" className="btn btn-primary" onClick={() => setModalStep(2)}>
                                            {isViewMode ? 'View Scope' : 'Next Step'} <ArrowRight size={16} className="ml-2" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button type="button" className="btn-ghost" onClick={() => setModalStep(1)}>
                                            <ArrowLeft size={16} className="mr-2" /> Back
                                        </button>
                                        <div className="flex gap-2">
                                            <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>
                                                {isViewMode ? 'Close' : 'Cancel'}
                                            </button>
                                            {!isViewMode && (
                                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                                    {saving ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default FacultyManagement;
