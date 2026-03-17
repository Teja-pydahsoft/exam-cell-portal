import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, BookOpen, Clock, FileText, Settings, LogOut, MessageSquare, ChevronRight, Building2, GraduationCap, Layers, Scroll, GitBranch, UploadCloud, UserPlus } from 'lucide-react';


import logo from '../../assets/logo.png';

const TABS = [
    { id: 'master-setup', label: 'Master Setup', icon: Settings },
    { id: 'student-management', label: 'Student Management', icon: GraduationCap },
    { id: 'regulation-mapping', label: 'Regulation Mapping', icon: Layers },
    { id: 'examinations', label: 'Examinations', icon: FileText },
    { id: 'user-management', label: 'User Management', icon: Users }
];

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine active tab based on current path
    const getInitialTab = () => {
        const path = location.pathname;
        if (path.includes('/master-setup')) return 'master-setup';
        if (path.includes('/regulation-mapping')) return 'regulation-mapping';
        if (path.includes('/faculty-assignment')) return 'regulation-mapping';
        if (path.includes('/user-management')) return 'user-management';
        if (path.includes('/student-management')) return 'student-management';
        if (path.includes('/examinations')) return 'examinations';
        return 'master-setup'; // Default
    };
    
    const [activeTab, setActiveTab] = React.useState(getInitialTab());

    React.useEffect(() => {
        setActiveTab(getInitialTab());
    }, [location.pathname]);

    if (!user) return null;

    // Menus per tab
    const renderSidebarContent = () => {
        switch (activeTab) {
            case 'master-setup':
                return (
                    <>
                        <div style={{ marginBottom: '24px' }}>
                            <p className="nav-label">Main Menu</p>
                            <div className="flex-col gap-2">
                                <Link to="/admin/master-setup/dashboard" className={`nav-item ${location.pathname.includes('/master-setup/dashboard') ? 'active' : ''}`}>
                                    <LayoutDashboard size={18} />
                                    <span>Dashboard</span>
                                </Link>
                            </div>
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <p className="nav-label">Institution Setup</p>
                            <div className="flex-col gap-2">
                                <Link to="/admin/master-setup/colleges" className={`nav-item ${location.pathname.includes('/colleges') ? 'active' : ''}`}>
                                    <Building2 size={18} />
                                    <span>Colleges</span>
                                </Link>
                                <Link to="/admin/master-setup/programs" className={`nav-item ${location.pathname.includes('/programs') ? 'active' : ''}`}>
                                    <GraduationCap size={18} />
                                    <span>Programs</span>
                                </Link>
                                <Link to="/admin/master-setup/branches" className={`nav-item ${location.pathname.includes('/branches') ? 'active' : ''}`}>
                                    <GitBranch size={18} />
                                    <span>Branches</span>
                                </Link>
                                <Link to="/admin/master-setup/batches" className={`nav-item ${location.pathname.includes('/batches') ? 'active' : ''}`}>
                                    <Layers size={18} />
                                    <span>Batches</span>
                                </Link>
                            </div>
                        </div>
                    </>
                );
            case 'regulation-mapping':
                return (
                    <div style={{ marginBottom: '24px' }}>
                        <p className="nav-label">Academics & Regulations</p>
                        <div className="flex-col gap-2">
                            <Link to="/admin/regulation-mapping/regulations" className={`nav-item ${location.pathname.includes('/regulation-mapping/regulations') ? 'active' : ''}`}>
                                <Scroll size={18} />
                                <span>Regulations</span>
                            </Link>
                            <Link to="/admin/regulation-mapping/subjects" className={`nav-item ${location.pathname.includes('/regulation-mapping/subjects') ? 'active' : ''}`}>
                                <BookOpen size={18} />
                                <span>Subjects</span>
                            </Link>
                            <Link to="/admin/regulation-mapping/faculty-assignment" className={`nav-item ${location.pathname.includes('/regulation-mapping/faculty-assignment') ? 'active' : ''}`}>
                                <UserPlus size={18} />
                                <span>Faculty Assignment</span>
                            </Link>
                        </div>
                    </div>
                );
            case 'user-management':
                return (
                    <div style={{ marginBottom: '24px' }}>
                        <p className="nav-label">Users</p>
                        <div className="flex-col gap-2">
                            <Link to="/admin/user-management/faculty" className={`nav-item ${location.pathname.includes('/user-management/faculty') ? 'active' : ''}`}>
                                <Users size={18} />
                                <span>Faculty & Staff</span>
                            </Link>
                        </div>
                    </div>
                );
            case 'student-management':
                return (
                    <div style={{ marginBottom: '24px' }}>
                        <p className="nav-label">Students</p>
                        <div className="flex-col gap-2">
                            <Link to="/admin/student-management" className={`nav-item ${location.pathname === '/admin/student-management' ? 'active' : ''}`}>
                                <Users size={18} />
                                <span>Student Directory</span>
                            </Link>
                            <Link to="/admin/student-management/settings" className={`nav-item ${location.pathname.includes('/student-management/settings') ? 'active' : ''}`}>
                                <Settings size={18} />
                                <span>Field Settings</span>
                            </Link>
                        </div>
                    </div>
                );
            case 'examinations':
                return (
                    <div style={{ marginBottom: '24px' }}>
                        <p className="nav-label">Examinations</p>
                        <div className="flex-col gap-2">
                             <div className="nav-item opacity-50 cursor-not-allowed">
                                <MessageSquare size={18} />
                                <span>Coming Soon</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="admin-layout flex flex-col h-screen overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="top-nav flex items-center justify-between px-6 py-3" style={{ background: 'var(--primary-900)', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                <div className="flex items-center gap-6">
                    {/* Top Tabs */}
                    <nav className="flex items-center gap-2">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (tab.id === 'master-setup') navigate('/admin/master-setup/dashboard');
                                    else if (tab.id === 'student-management') navigate('/admin/student-management');
                                    else if (tab.id === 'regulation-mapping') navigate('/admin/regulation-mapping/regulations');
                                    else if (tab.id === 'examinations') navigate('/admin/examinations');
                                    else if (tab.id === 'user-management') navigate('/admin/user-management/faculty');
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                    activeTab === tab.id 
                                        ? 'bg-accent-500 text-white shadow-md' 
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                                style={{ 
                                    background: activeTab === tab.id ? 'var(--accent-500)' : 'transparent',
                                    color: activeTab === tab.id ? 'var(--primary-900)' : 'var(--gray-300)',
                                    fontWeight: activeTab === tab.id ? '600' : '400',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                 {/* User Profile Mini */}
                 <div className="flex items-center gap-4">
                     <div className="text-right">
                         <p className="text-sm font-semibold m-0">{user.name}</p>
                         <p className="text-xs text-gray-400 m-0 capitalize">{user.role.replace('_', ' ')}</p>
                     </div>
                      <div className="logo-box" style={{ width: '36px', height: '36px', background: 'var(--primary-700)', fontSize: '14px' }}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <button onClick={logout} className="text-gray-400 hover:text-red-400 ml-2" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} title="Logout">
                          <LogOut size={20} />
                      </button>
                 </div>
            </header>

            {/* Bottom Section (Sidebar + Main Content) */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="sidebar" style={{ background: 'var(--primary-900)', height: '100%' }}>
                    <nav className="nav-section custom-scrollbar" style={{ paddingTop: '2rem', height: '100%', overflowY: 'auto' }}>
                        {renderSidebarContent()}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="main-content flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 custom-scrollbar">
                    <div className="animate-fade-in relative min-h-full p-8">
                        <React.Suspense fallback={
                            <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                                <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--accent-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                            </div>
                        }>
                            <Outlet />
                        </React.Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
