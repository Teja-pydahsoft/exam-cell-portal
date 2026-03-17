import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';

// Lazy load layouts
const AdminLayout = lazy(() => import('./components/Layout/AdminLayout'));

// Lazy load pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const FacultyManagement = lazy(() => import('./pages/admin/FacultyManagement'));
// const AttendanceMonitoring = lazy(() => import('./pages/admin/AttendanceMonitoring'));
const Institution = lazy(() => import('./pages/admin/Institution'));
const StudentManagement = lazy(() => import('./pages/admin/StudentManagement'));
const StudentFieldSettings = lazy(() => import('./pages/admin/StudentFieldSettings'));
const Subjects = lazy(() => import('./pages/admin/Subjects'));
// const Timetable = lazy(() => import('./pages/admin/Timetable'));
const Regulations = lazy(() => import('./pages/admin/Regulations'));
const FacultyAssignment = lazy(() => import('./pages/admin/FacultyAssignment'));
const NominalRoll = lazy(() => import('./pages/admin/NominalRoll'));
const UpdatePhotos = lazy(() => import('./pages/admin/UpdatePhotos'));
const UpdateSignatures = lazy(() => import('./pages/admin/UpdateSignatures'));
const StudentPromotions = lazy(() => import('./pages/admin/StudentPromotions'));

function PrivateRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="loading-spinner"></div></div>;

    if (!user) return <Navigate to="/login" replace />;

    return children;
}

function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="loading-spinner"></div></div>}>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/admin" element={
                        <PrivateRoute allowedRoles={['admin', 'super_admin']}>
                            <AdminLayout />
                        </PrivateRoute>
                    }>
                        {/* Master Setup */}
                        <Route path="master-setup">
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="institution" element={<Institution />} />
                            <Route path="colleges" element={<Institution initialTab="colleges" />} />
                            <Route path="programs" element={<Institution initialTab="programs" />} />
                            <Route path="branches" element={<Institution initialTab="branches" />} />
                            <Route path="batches" element={<Institution initialTab="batches" />} />
                        </Route>

                        {/* Regulation Mapping */}
                        <Route path="regulation-mapping">
                            <Route index element={<Navigate to="regulations" replace />} />
                            <Route path="regulations" element={<Regulations />} />
                            <Route path="subjects" element={<Subjects />} />
                            <Route path="faculty-assignment" element={<FacultyAssignment />} />
                        </Route>

                        {/* User Management */}
                        <Route path="user-management">
                            <Route index element={<Navigate to="faculty" replace />} />
                            <Route path="faculty" element={<FacultyManagement />} />
                        </Route>

                        {/* Student Management & Examinations Routes */}
                        <Route path="student-management">
                            <Route index element={<StudentManagement />} />
                            <Route path="nominal-roll" element={<NominalRoll />} />
                            <Route path="promotions" element={<StudentPromotions />} />
                            <Route path="update-photos" element={<UpdatePhotos />} />
                            <Route path="update-signatures" element={<UpdateSignatures />} />
                            <Route path="settings" element={<StudentFieldSettings />} />
                        </Route>
                        <Route path="examinations" element={<div className="p-8 text-center"><h2 className="text-2xl font-bold">Examinations</h2><p>Coming Soon</p></div>} />
                    </Route>

                    {/* Default Redirect handles the new structure */}
                    <Route path="/admin" element={<Navigate to="/admin/master-setup/dashboard" replace />} />
                    <Route path="/" element={<Navigate to="/admin/master-setup/dashboard" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}

export default App;
