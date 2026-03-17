import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Skeleton from '../../components/ui/Skeleton';

const StatCard = ({ title, value, icon: Icon, colorClass, trend }) => (
    <div className="stat-card">
        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${colorClass.replace('bg-', 'bg-')}`}></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`stat-icon-box ${colorClass} shadow-lg shadow-opacity-30`}>
                <Icon size={24} color="white" />
            </div>
            {trend && (
                <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                    +{trend}%
                </span>
            )}
        </div>

        <div className="relative z-10">
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</p>
        </div>
    </div>
);

const DashboardSkeleton = () => {
    return (
        <div>
            {/* Header Skeleton */}
            <div className="dashboard-header" style={{ marginBottom: '1rem' }}>
                <div>
                    <Skeleton className="mb-2" width={200} height={40} style={{ marginBottom: '0.5rem' }} />
                    <Skeleton width={300} height={20} />
                </div>
                <Skeleton width={150} height={32} style={{ borderRadius: '9999px' }} />
            </div>

            {/* Stat Grid Skeleton */}
            <div className="stat-grid" style={{ marginBottom: '1rem' }}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <Skeleton variant="rectangular" width={48} height={48} style={{ borderRadius: '12px' }} />
                        </div>
                        <div>
                            <Skeleton width={60} height={36} style={{ marginBottom: '0.5rem' }} />
                            <Skeleton width={100} height={16} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {/* Recent Activities Skeleton */}
                <div className="card">
                    <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                        <Skeleton width={180} height={28} />
                        <Skeleton width={80} height={24} style={{ borderRadius: '9999px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex" style={{ alignItems: 'flex-start', gap: '1rem', padding: '0.75rem', border: '1px solid transparent' }}>
                                <Skeleton variant="circular" width={40} height={40} />
                                <div className="flex-1" style={{ flex: 1 }}>
                                    <Skeleton width="80%" height={20} style={{ marginBottom: '0.5rem' }} />
                                    <Skeleton width="40%" height={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Department Overview Skeleton */}
                <div className="card">
                    <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                        <Skeleton width={200} height={28} />
                        <Skeleton width={150} height={36} />
                    </div>
                    <div style={{ height: '16rem', borderRadius: '0.75rem', border: '2px dashed #e5e7eb', padding: '1rem' }}>
                        <Skeleton className="w-full h-full" style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        colleges: 0,
        faculty: 0,
        students: 0,
        regular_students: 0,
        attendance: 0
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Determine if we need to show skeleton (e.g. initial load)
                setIsLoading(true);
                const response = await api.get('/dashboard/stats');
                if (response.data.success) {
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            } finally {
                // Add a small delay to show off the skeleton if response is too fast, 
                // or just set it to false immediately. 
                // For "advanced" feel, we might want to ensure it shows for at least 500ms
                // But for responsiveness, immediate is better. Let's do immediate.
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div>
            <div className="dashboard-header">
                <div>
                    <h2 className="hero-title" style={{ color: 'var(--primary-900)', fontSize: '2rem', marginBottom: '0.5rem' }}>Dashboard</h2>
                    <p style={{ color: 'var(--gray-500)' }}>Welcome back, {user?.username}</p>
                </div>
                <div className="badge badge-success">
                    Current Session: 2025-26
                </div>
            </div>

            <div className="stat-grid">
                <StatCard
                    title="Total Colleges"
                    value={stats.colleges}
                    icon={BookOpen}
                    colorClass="bg-blue"
                />
                <StatCard
                    title="Active Students"
                    value={stats.students}
                    icon={Users}
                    colorClass="bg-green"
                    trend={10}
                />
                <StatCard
                    title="Regular Students"
                    value={stats.regular_students}
                    icon={Star}
                    colorClass="bg-purple"
                />
                <StatCard
                    title="Todays Attendance"
                    value={`${stats.attendance}%`}
                    icon={Calendar}
                    colorClass="bg-orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-xl font-bold text-gray-900 font-display">Recent Activities</h3>
                        <button className="text-sm text-primary-600 font-medium hover:text-primary-700 bg-primary-50 px-3 py-1 rounded-full transition-colors">View All</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-bold shrink-0">
                                    {i === 1 ? 'M' : i === 2 ? 'L' : 'S'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 leading-snug">Faculty meeting scheduled regarding semester exams</p>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        2 hours ago • Admin
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-xl font-bold text-gray-900 font-display">Department Overview</h3>
                        <div className="relative">
                            <select className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm font-medium cursor-pointer">
                                <option>Computer Science</option>
                                <option>Electronics</option>
                                <option>Mechanical</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>
                    <div className="h-64 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-dashed border-gray-300 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
                        <span className="text-gray-400 font-medium z-10 group-hover:scale-105 transition-transform">Analytics Chart Placeholder</span>
                        <p className="text-xs text-gray-400 mt-2 z-10">Data visualization coming soon</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
