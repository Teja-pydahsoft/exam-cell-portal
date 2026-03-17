import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Settings, 
    GraduationCap, 
    Layers, 
    FileText, 
    Users,
    ChevronRight
} from 'lucide-react';

const TABS = [
    { 
        id: 'master-setup', 
        label: 'Master Setup', 
        icon: Settings, 
        description: 'Configure institutions, colleges, programs, and branches.',
        color: 'blue',
        path: '/admin/master-setup/dashboard'
    },
    { 
        id: 'student-management', 
        label: 'Student Management', 
        icon: GraduationCap, 
        description: 'Manage student directory, nominal rolls, and promotions.',
        color: 'emerald',
        path: '/admin/student-management'
    },
    { 
        id: 'regulation-mapping', 
        label: 'Regulation Mapping', 
        icon: Layers, 
        description: 'Define regulations, subjects, and faculty assignments.',
        color: 'purple',
        path: '/admin/regulation-mapping/regulations'
    },
    { 
        id: 'examinations', 
        label: 'Examinations', 
        icon: FileText, 
        description: 'Manage exam schedules, results, and certifications.',
        color: 'amber',
        path: '/admin/examinations'
    },
    { 
        id: 'user-management', 
        label: 'User Management', 
        icon: Users, 
        description: 'Manage faculty, staff, and system administrative roles.',
        color: 'rose',
        path: '/admin/user-management/faculty'
    }
];

const AdminHome = () => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Animated Background Layer */}
            <div className="home-bg-animation">
                <div className="mesh-gradient"></div>
                <div className="bg-orb orb-1"></div>
                <div className="bg-orb orb-2"></div>
                <div className="bg-orb orb-3"></div>
            </div>

            <div className="relative z-10 w-full px-10 pt-4 pb-12 flex flex-col justify-start min-h-full">
                <div className="mb-6 text-left anim-fade-in-up">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 tracking-tighter leading-none">
                        Admin <span className="text-accent-600">Control Center</span>
                    </h1>
                    <p className="text-gray-500 text-base md:text-lg max-w-3xl font-medium leading-relaxed">
                        Select a management module to monitor and configure your institution's examination data.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {TABS.map((tab) => (
                        <div 
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className="folder-card group relative rounded-2xl p-6 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden glass-effect"
                        >
                            {/* Folder Tab Effect */}
                            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-${tab.color}-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700`}></div>
                            
                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-xl bg-${tab.color}-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                    <tab.icon className={`w-6 h-6 text-${tab.color}-600`} />
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{tab.label}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                    {tab.description}
                                </p>
                                
                                <div className="flex items-center text-xs font-bold text-accent-600 group-hover:translate-x-2 transition-transform duration-500">
                                    Open Section <ChevronRight className="ml-2 w-4 h-4" />
                                </div>
                            </div>

                            {/* Bottom Stripe */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-${tab.color}-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`}></div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .folder-card {
                    perspective: 1000px;
                }
                .bg-blue-50 { background-color: #eff6ff; }
                .bg-blue-100 { background-color: #dbeafe; }
                .text-blue-600 { color: #2563eb; }
                .bg-blue-500 { background-color: #3b82f6; }

                .bg-emerald-50 { background-color: #ecfdf5; }
                .bg-emerald-100 { background-color: #d1fae5; }
                .text-emerald-600 { color: #059669; }
                .bg-emerald-500 { background-color: #10b981; }

                .bg-purple-50 { background-color: #f5f3ff; }
                .bg-purple-100 { background-color: #ede9fe; }
                .text-purple-600 { color: #7c3aed; }
                .bg-purple-500 { background-color: #8b5cf6; }

                .bg-amber-50 { background-color: #fffbeb; }
                .bg-amber-100 { background-color: #fef3c7; }
                .text-amber-600 { color: #d97706; }
                .bg-amber-500 { background-color: #f59e0b; }

                .bg-rose-50 { background-color: #fff1f2; }
                .bg-rose-100 { background-color: #ffe4e6; }
                .text-rose-600 { color: #e11d48; }
                .bg-rose-500 { background-color: #f43f5e; }
            `}</style>
        </div>
    );
};

export default AdminHome;
