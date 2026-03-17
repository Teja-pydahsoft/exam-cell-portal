import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Search, Filter, CheckSquare, Square, Users, ShieldAlert, ArrowRight, GraduationCap } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentPromotions = () => {
    const [filters, setFilters] = useState({
        college: '',
        program: '',
        branch: '',
        batch: '',
        year: '',
        sem: '',
        search: ''
    });

    const [targetPromotion, setTargetPromotion] = useState({
        year: '',
        sem: ''
    });

    const [institutionData, setInstitutionData] = useState({
        colleges: [], courses: [], branches: [], batches: []
    });

    const [availablePrograms, setAvailablePrograms] = useState([]);
    const [availableBranches, setAvailableBranches] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [promoting, setPromoting] = useState(false);
    
    const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

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
        if (filters.college) {
            setAvailablePrograms(institutionData.courses.filter(c => String(c.college_id) === String(filters.college)));
        } else {
            setAvailablePrograms(institutionData.courses);
        }
    }, [filters.college, institutionData.courses]);

    useEffect(() => {
        if (filters.program) {
            setAvailableBranches(institutionData.branches.filter(b => String(b.course_id) === String(filters.program)));
        } else {
            setAvailableBranches(institutionData.branches);
        }
    }, [filters.program, institutionData.branches]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            if (name === 'college') { newFilters.program = ''; newFilters.branch = ''; }
            if (name === 'program') { newFilters.branch = ''; }
            return newFilters;
        });
    };

    const handleSearch = async () => {
        if (!filters.batch || !filters.college || !filters.program || !filters.branch) {
            toast.error("Please select all required filters (Batch, College, Program, Branch)");
            return;
        }

        setLoading(true);
        setSelectedStudentIds(new Set()); // Reset selections on new search
        try {
            const collegeName = institutionData.colleges.find(c => String(c.id) === String(filters.college))?.name || '';
            const programName = institutionData.courses.find(c => String(c.id) === String(filters.program))?.name || '';
            const branchName = institutionData.branches.find(c => String(c.id) === String(filters.branch))?.name || '';

            const queryParams = new URLSearchParams();
            if (collegeName) queryParams.append('college', collegeName);
            if (programName) queryParams.append('program', programName);
            if (branchName) queryParams.append('branch', branchName);
            if (filters.batch) queryParams.append('batch', filters.batch);
            if (filters.year) queryParams.append('year', filters.year);
            if (filters.sem) queryParams.append('sem', filters.sem);
            if (filters.search) queryParams.append('search', filters.search);

            const res = await api.get(`/students?${queryParams.toString()}`);
            if (res.data.success) {
                setStudents(res.data.data);
                if (res.data.data.length === 0) {
                    toast.error("No students found Matching the filters");
                }
            }
        } catch (error) {
            console.error("Fetch students error:", error);
            toast.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = students.map(s => s.id);
            setSelectedStudentIds(new Set(allIds));
        } else {
            setSelectedStudentIds(new Set());
        }
    };

    const handleSelectStudent = (id) => {
        const newSelected = new Set(selectedStudentIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedStudentIds(newSelected);
    };

    const handlePromoteStudents = async () => {
        if (selectedStudentIds.size === 0) {
            toast.error("Please select at least one student to promote.");
            return;
        }
        if (!targetPromotion.year || !targetPromotion.sem) {
            toast.error("Please specify both a Target Year and Target Sem.");
            return;
        }

        // Basic validation: preventing promoting down
        const currentYear = parseInt(filters.year) || 0;
        const currentSem = parseInt(filters.sem) || 0;
        const tgtYear = parseInt(targetPromotion.year);
        const tgtSem = parseInt(targetPromotion.sem);

        if (currentYear > 0 && currentSem > 0) {
             if (tgtYear < currentYear || (tgtYear === currentYear && tgtSem <= currentSem)) {
                 if (!window.confirm("Warning: You are attempting to 'promote' students to an equal or lower Year/Sem. Are you sure you want to proceed?")) {
                     return;
                 }
             }
        } else {
            if (!window.confirm(`Are you sure you want to promote ${selectedStudentIds.size} student(s) to Year ${tgtYear}, Sem ${tgtSem}?`)) {
                return;
            }
        }

        setPromoting(true);
        try {
            const res = await api.put('/students/promote', {
                studentIds: Array.from(selectedStudentIds),
                targetYear: targetPromotion.year,
                targetSem: targetPromotion.sem
            });

            if (res.data.success) {
                toast.success(res.data.message || "Students promoted successfully!");
                // Remove promoted students from the current view locally
                const remainingStudents = students.filter(s => !selectedStudentIds.has(s.id));
                setStudents(remainingStudents);
                setSelectedStudentIds(new Set());
                setTargetPromotion({ year: '', sem: '' });
            }
        } catch (error) {
            console.error("Promotion error:", error);
            toast.error(error.response?.data?.message || "Failed to promote students");
        } finally {
            setPromoting(false);
        }
    };

    const isAllSelected = students.length > 0 && selectedStudentIds.size === students.length;

    return (
        <div className="p-2 anim-fade-in">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-primary-900" style={{ fontFamily: 'Times New Roman' }}>Student Promotions</h1>
                <p className="text-[11px] text-gray-500 mt-0.5">Bulk promote students from their current academic year and semester to the next.</p>
            </div>

            {/* Source Filters Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4">
                <div className="flex items-center gap-2 mb-3 border-b border-gray-50 pb-2">
                    <Filter size={16} className="text-primary-500" />
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Step 1: Select Current Batch</h2>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[120px]">
                        <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1 block">Batch *</label>
                        <select name="batch" value={filters.batch} onChange={handleFilterChange} className="filter-input w-full py-1.5 text-xs">
                            <option value="">Batch</option>
                            {institutionData.batches?.map(b => <option key={b._id || b.id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1 block">College *</label>
                        <select name="college" value={filters.college} onChange={handleFilterChange} className="filter-input w-full py-1.5 text-xs">
                            <option value="">College</option>
                            {institutionData.colleges?.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1 block">Program *</label>
                        <select name="program" value={filters.program} onChange={handleFilterChange} className="filter-input w-full py-1.5 text-xs" disabled={!filters.college}>
                            <option value="">Program</option>
                            {availablePrograms?.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1 block">Branch *</label>
                        <select name="branch" value={filters.branch} onChange={handleFilterChange} className="filter-input w-full py-1.5 text-xs" disabled={!filters.program}>
                            <option value="">Branch</option>
                            {availableBranches?.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="w-[80px]">
                        <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1 block">Year</label>
                        <select name="year" value={filters.year} onChange={handleFilterChange} className="filter-input w-full py-1.5 text-xs">
                            <option value="">Year</option>
                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="w-[80px]">
                        <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1 block">Sem</label>
                        <select name="sem" value={filters.sem} onChange={handleFilterChange} className="filter-input w-full py-1.5 text-xs">
                            <option value="">Sem</option>
                            {[1, 2].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="w-auto">
                        <button onClick={handleSearch} className="btn-primary shadow-md filter-btn h-[32px] px-6 py-0 text-xs" disabled={loading}>
                            {loading ? '...' : <><Search size={14} /> Fetch</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Target Promotion Section (Sticky Action Bar when students are loaded) */}
            {students.length > 0 && (
                <div className="bg-blue-50/50 rounded-xl shadow-sm border border-blue-100 p-4 mb-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 backdrop-blur-md">
                   <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-lg border border-blue-100 flex items-center gap-3">
                            <div className="flex flex-col px-2">
                                <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1">Target Year</span>
                                <select 
                                    className="filter-input py-1 text-sm font-bold text-gray-800 border-gray-200"
                                    value={targetPromotion.year}
                                    onChange={(e) => setTargetPromotion({...targetPromotion, year: e.target.value})}
                                >
                                    <option value="">Select</option>
                                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                </select>
                            </div>
                            <div className="h-8 border-r border-gray-100"></div>
                            <div className="flex flex-col px-2">
                                <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1">Target Sem</span>
                                <select 
                                    className="filter-input py-1 text-sm font-bold text-gray-800 border-gray-200"
                                    value={targetPromotion.sem}
                                    onChange={(e) => setTargetPromotion({...targetPromotion, sem: e.target.value})}
                                >
                                    <option value="">Select</option>
                                    {[1, 2].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                </select>
                            </div>
                        </div>
                   </div>

                   <div className="flex items-center gap-3">
                       <span className="text-xs font-bold text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                           {selectedStudentIds.size} Selected
                       </span>
                       <button 
                            onClick={handlePromoteStudents} 
                            disabled={selectedStudentIds.size === 0 || promoting}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white shadow-md transition-all ${
                                selectedStudentIds.size > 0 && !promoting
                                    ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg' 
                                    : 'bg-gray-300 cursor-not-allowed'
                            }`}
                        >
                            {promoting ? 'Promoting...' : <><ArrowRight size={16} /> Promote Selected</>}
                       </button>
                   </div>
                </div>
            )}

            {/* Students Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#f8fafc] text-[#64748b] uppercase text-[9px] font-black tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 w-10">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        disabled={students.length === 0}
                                    />
                                </th>
                                <th className="px-3 py-3">S.No</th>
                                <th className="px-3 py-3">Hall Ticket</th>
                                <th className="px-3 py-3">Student Name</th>
                                <th className="px-3 py-3">Current Year/Sem</th>
                                <th className="px-3 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-[2px] border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                                            <p className="text-[11px] text-gray-500 font-medium">Fetching students...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : students.length > 0 ? (
                                students.map((student, index) => (
                                    <tr 
                                        key={student.id} 
                                        className={`transition-colors ${selectedStudentIds.has(student.id) ? 'bg-blue-50/30' : 'hover:bg-[#f8fafc]/50'}`}
                                        onClick={() => handleSelectStudent(student.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={selectedStudentIds.has(student.id)}
                                                onChange={() => handleSelectStudent(student.id)}
                                            />
                                        </td>
                                        <td className="px-3 py-3 text-gray-400 font-medium text-[11px]">{index + 1}</td>
                                        <td className="px-3 py-3 font-bold text-gray-900 text-xs">{student.rollNo}</td>
                                        <td className="px-3 py-3">
                                            <span className="font-bold text-gray-900 capitalize italic" style={{ fontFamily: 'Times New Roman' }}>{student.name?.toLowerCase()}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-2">
                                               <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">Y{student.year || '-'}</span>
                                               <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">S{student.sem || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
                                                {student.status || 'Active'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                                <GraduationCap size={48} />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-bold text-lg">No students found</p>
                                                <p className="text-gray-500 text-sm">Please select filters to find students for promotion.</p>
                                            </div>
                                        </div>
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

export default StudentPromotions;
