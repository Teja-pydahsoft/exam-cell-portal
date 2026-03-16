import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Search, Users, Filter, Eye, X, Mail, Phone, MapPin, Calendar, User, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentManagement = () => {
    const [filters, setFilters] = useState({
        college: '',
        program: '',
        branch: '',
        batch: '',
        year: '',
        sem: ''
    });

    const [institutionData, setInstitutionData] = useState({
        colleges: [], courses: [], branches: [], batches: []
    });

    // Derived states for cascading dropdowns
    const [availablePrograms, setAvailablePrograms] = useState([]);
    const [availableBranches, setAvailableBranches] = useState([]);
    const [availableBatches, setAvailableBatches] = useState([]);

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        const fetchInstitutionData = async () => {
            try {
                const res = await api.get('/institution/details');
                if (res.data.success) {
                    setInstitutionData(res.data.data);
                }
            } catch (error) {
                console.error("Failed to load institution details", error);
            }
        };
        fetchInstitutionData();
    }, []);

    useEffect(() => {
        // Cascade: College -> Programs
        if (filters.college) {
            setAvailablePrograms(institutionData.courses.filter(c => String(c.college_id) === String(filters.college)));
        } else {
            setAvailablePrograms(institutionData.courses);
        }
    }, [filters.college, institutionData.courses]);

    useEffect(() => {
        // Cascade: Program -> Branches
        if (filters.program) {
            setAvailableBranches(institutionData.branches.filter(b => String(b.course_id) === String(filters.program)));
        } else {
            setAvailableBranches(institutionData.branches);
        }
    }, [filters.program, institutionData.branches]);

    useEffect(() => {
        // Cascade: Branch -> Batches (Batches are independent of branches usually)
        setAvailableBatches(institutionData.batches);
    }, [filters.branch, institutionData.batches]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            // Reset dependents
            if (name === 'college') { newFilters.program = ''; newFilters.branch = ''; newFilters.batch = ''; }
            if (name === 'program') { newFilters.branch = ''; newFilters.batch = ''; }
            if (name === 'branch') { newFilters.batch = ''; }
            return newFilters;
        });
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            // Find names from IDs for the backend query
            const collegeName = institutionData.colleges.find(c => String(c.id) === String(filters.college))?.name || '';
            const programName = institutionData.courses.find(c => String(c.id) === String(filters.program))?.name || '';
            const branchName = institutionData.branches.find(c => String(c.id) === String(filters.branch))?.name || '';

            // Build query params
            const queryParams = new URLSearchParams();
            if (collegeName) queryParams.append('college', collegeName);
            if (programName) queryParams.append('program', programName);
            if (branchName) queryParams.append('branch', branchName);
            if (filters.batch) queryParams.append('batch', filters.batch);
            if (filters.year) queryParams.append('year', filters.year);
            if (filters.sem) queryParams.append('sem', filters.sem);

            const res = await api.get(`/students?${queryParams.toString()}`);
            if (res.data.success) {
                setStudents(res.data.data);
            } else {
                toast.error('Failed to load students directory');
            }
        } catch (error) {
            console.error("Fetch students error:", error);
            toast.error('Failed to fetch students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (selectedStudent) {
        return (
            <div className="p-6 max-w-5xl mx-auto anim-fade-in">
                <div className="flex items-center gap-4 mb-6">
                    <button 
                        onClick={() => setSelectedStudent(null)} 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                        title="Back to Directory"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-primary-900" style={{ fontFamily: 'Times New Roman' }}>Student Profile</h1>
                        <p className="text-gray-500 mt-1">Detailed view of student records and information.</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 shrink-0 shadow-inner">
                            <User size={40} />
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedStudent.name || 'Unknown'}</h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-medium border border-gray-200">
                                    PIN: {selectedStudent.rollNo || '-'}
                                </span>
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md font-medium border border-green-200">
                                    Status: {selectedStudent.status || 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                    <Calendar size={16} /> Academic Details
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Branch</label>
                                        <p className="font-medium text-gray-900 text-lg">{selectedStudent.branch || 'N/A'}</p>
                                    </div>
                                    <div className="flex gap-12">
                                        <div>
                                            <label className="text-xs text-gray-500">Current Year</label>
                                            <p className="font-medium text-gray-900 text-lg">{selectedStudent.year || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Semester</label>
                                            <p className="font-medium text-gray-900 text-lg">{selectedStudent.sem || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                    <User size={16} /> Personal Details
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                            <Mail size={18} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block">Email</label>
                                            <p className="font-medium text-gray-900">{selectedStudent.email || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block">Phone</label>
                                            <p className="font-medium text-gray-900">{selectedStudent.phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block">Date of Birth</label>
                                            <p className="font-medium text-gray-900">{selectedStudent.dob || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block">Address</label>
                                            <p className="font-medium text-gray-900 whitespace-pre-line leading-relaxed">{selectedStudent.address || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto anim-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-primary-900" style={{ fontFamily: 'Times New Roman' }}>Student Management</h1>
                    <p className="text-gray-500 mt-1">Search and view student directory records.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                    {/* Filters Section */}
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">College</label>
                            <select name="college" value={filters.college} onChange={handleFilterChange} className="form-input py-2 px-3 text-sm w-full">
                                <option value="">All Colleges</option>
                                {institutionData.colleges?.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Program</label>
                            <select name="program" value={filters.program} onChange={handleFilterChange} className="form-input py-2 px-3 text-sm w-full" disabled={!filters.college && institutionData.courses.length > 0}>
                                <option value="">All Programs</option>
                                {availablePrograms?.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Branch</label>
                            <select name="branch" value={filters.branch} onChange={handleFilterChange} className="form-input py-2 px-3 text-sm w-full" disabled={!filters.program && institutionData.branches.length > 0}>
                                <option value="">All Branches</option>
                                {availableBranches?.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Batch</label>
                            <select name="batch" value={filters.batch} onChange={handleFilterChange} className="form-input py-2 px-3 text-sm w-full" disabled={!filters.branch && institutionData.batches.length > 0}>
                                <option value="">All Batches</option>
                                {availableBatches?.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Year</label>
                            <select name="year" value={filters.year} onChange={handleFilterChange} className="form-input py-2 px-3 text-sm w-full">
                                <option value="">All Years</option>
                                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Semester</label>
                            <select name="sem" value={filters.sem} onChange={handleFilterChange} className="form-input py-2 px-3 text-sm w-full">
                                <option value="">All Sems</option>
                                {[1,2].map(s => <option key={s} value={s}>Sem {s}</option>)}
                            </select>
                        </div>
                        <div className="flex-none">
                            <button onClick={handleSearch} className="btn btn-primary py-2 px-6 shadow-sm text-sm" disabled={loading}>
                                <Filter size={16} /> Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4 border-b">PIN No</th>
                                <th className="px-6 py-4 border-b">Student Name</th>
                                <th className="px-6 py-4 border-b">Branch</th>
                                <th className="px-6 py-4 border-b">Year/Sem</th>
                                <th className="px-6 py-4 border-b">Status</th>
                                <th className="px-6 py-4 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-16 text-gray-500">Loading students...</td></tr>
                            ) : students.length > 0 ? (
                                students.map(student => (
                                    <tr key={student.id} className="border-b border-gray-100 last:border-0 hover:bg-primary-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-primary-700">{student.rollNo || '-'}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{student.name || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{student.branch || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{student.year || '-'} / {student.sem || '-'}</td>
                                        <td className="px-6 py-4"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold tracking-wide">{student.status || 'Active'}</span></td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedStudent(student)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-accent-700 bg-accent-50 hover:bg-accent-100 rounded-md font-medium transition-colors border border-accent-200"
                                                title="View Full Profile"
                                            >
                                                <Eye size={16} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-24 text-gray-500">
                                        <Users size={48} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-lg text-gray-600 font-medium">No students found.</p>
                                        <p className="text-sm mt-1">Apply filters and click 'Apply Filters' to search the directory.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentManagement;
