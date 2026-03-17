import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, BookOpen, Clock, FileText, Settings, LogOut, MessageSquare, ChevronRight, Building2, GraduationCap, Layers, Scroll, GitBranch, UploadCloud, UserPlus, ArrowRight, Home } from 'lucide-react';

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
        if (path.includes('/grade-system')) return 'regulation-mapping';
        if (path.includes('/user-management')) return 'user-management';
        if (path.includes('/student-management/nominal-roll')) return 'student-management';
        if (path.includes('/student-management')) return 'student-management';
        if (path.includes('/examinations')) return 'examinations';
        return 'master-setup'; // Default
    };
    
    const [activeTab, setActiveTab] = React.useState(getInitialTab());

    React.useEffect(() => {
        setActiveTab(getInitialTab());
    }, [location.pathname]);

    const isHomePage = location.pathname === '/admin/home' || location.pathname === '/admin/' || location.pathname === '/admin';

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
                            <Link to="/admin/regulation-mapping/grade-system" className={`nav-item ${location.pathname.includes('/regulation-mapping/grade-system') ? 'active' : ''}`}>
                                <Scroll size={18} />
                                <span>Grade System</span>
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
                            <Link to="/admin/student-management/nominal-roll" className={`nav-item ${location.pathname.includes('/student-management/nominal-roll') ? 'active' : ''}`}>
                                <FileText size={18} />
                                <span>Nominal Roll</span>
                            </Link>
                            <Link to="/admin/student-management/promotions" className={`nav-item ${location.pathname.includes('/student-management/promotions') ? 'active' : ''}`}>
                                <ArrowRight size={18} />
                                <span>Promotions</span>
                            </Link>
                            <Link to="/admin/student-management/update-photos" className={`nav-item ${location.pathname.includes('/student-management/update-photos') ? 'active' : ''}`}>
                                <UploadCloud size={18} />
                                <span>Update Photos</span>
                            </Link>
                            <Link to="/admin/student-management/update-signatures" className={`nav-item ${location.pathname.includes('/student-management/update-signatures') ? 'active' : ''}`}>
                                <UploadCloud size={18} />
                                <span>Update Signatures</span>
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

    const renderSidebarFooter = () => {
        return (
            <div className="mt-auto px-4 pb-6 space-y-4">
                {/* User Profile Mini */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 mb-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-white m-0">{user.name}</p>
                        <p className="text-xs text-gray-400 m-0 capitalize truncate">{user.role.replace('_', ' ')}</p>
                    </div>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center text-primary-900 font-bold text-xs">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={logout} 
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10"
                        title="Logout"
                        style={{ background: 'transparent', cursor: 'pointer' }}
                    >
                        <LogOut size={18} />
                        <span className="font-medium text-sm">Sign Out</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={`admin-layout flex h-screen overflow-hidden ${isHomePage ? 'bg-transparent' : 'bg-gray-50'}`}>
            {/* Sidebar */}
            {!isHomePage && (
                <aside className="sidebar flex flex-col w-[280px] flex-shrink-0" style={{ background: 'var(--primary-900)', height: '100%' }}>
                    {/* Brand Section in Sidebar with Home Button */}
                    <div className="px-5 py-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center shadow-lg shadow-accent-500/20">
                                <GraduationCap size={18} className="text-secondary-900" />
                            </div>
                            <span className="font-bold text-lg text-white tracking-tight">Exam Cell</span>
                        </div>
                        
                        <Link 
                            to="/admin/home" 
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-accent-500/20 text-gray-400 hover:text-accent-500 transition-all border border-white/10"
                            title="Go to Home Dashboard"
                        >
                            <Home size={18} />
                        </Link>
                    </div>

                    <nav className="nav-section custom-scrollbar flex-1" style={{ overflowY: 'auto' }}>
                        {renderSidebarContent()}
                    </nav>
                    
                    {renderSidebarFooter()}
                </aside>
            )}

            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col overflow-hidden ${isHomePage ? 'w-full' : ''}`}>
                {/* Simplified Top Bar for Home Page if needed, or just profile elsewhere */}
                {isHomePage && (
                    <div className="flex items-center justify-between px-10 py-6 absolute top-0 left-0 right-0 z-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-900 rounded-xl flex items-center justify-center shadow-xl">
                                <span className="text-accent-500 font-bold text-xl">P</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Pydah <span className="text-accent-600 font-medium">Portal</span></h2>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-2 pr-4 rounded-2xl border border-white/20 shadow-sm">
                             <div className="text-right">
                                 <p className="text-sm font-bold text-gray-900 m-0 leading-tight">{user.name}</p>
                                 <p className="text-[10px] text-gray-500 m-0 uppercase font-semibold tracking-wider">{user.role.replace('_', ' ')}</p>
                             </div>
                             <div className="w-9 h-9 rounded-xl bg-primary-900 flex items-center justify-center text-accent-500 font-extrabold shadow-lg">
                                 {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                             </div>
                             <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer" title="Logout">
                                 <LogOut size={18} />
                             </button>
                        </div>
                    </div>
                )}

                <div className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar ${isHomePage ? 'pt-20 bg-transparent' : 'p-4'}`}>
                    <div className="animate-fade-in relative min-h-full">
                        <React.Suspense fallback={
                            <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                                <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--accent-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                            </div>
                        }>
                            <Outlet />
                        </React.Suspense>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
