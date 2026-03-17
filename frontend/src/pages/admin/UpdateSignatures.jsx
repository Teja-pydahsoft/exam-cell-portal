import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Search, Filter, PenTool, Upload, GraduationCap } from 'lucide-react';
import { toast } from 'react-hot-toast';

const UpdateSignatures = () => {
    const [filters, setFilters] = useState({
        college: '',
        program: '',
        branch: '',
        batch: '',
        year: '',
        sem: '',
        search: ''
    });

    const [institutionData, setInstitutionData] = useState({
        colleges: [], courses: [], branches: [], batches: []
    });

    const [availablePrograms, setAvailablePrograms] = useState([]);
    const [availableBranches, setAvailableBranches] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadingId, setUploadingId] = useState(null);

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

    const handleFileChange = async (studentId, e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size should be less than 2MB');
            return;
        }

        setUploadingId(studentId);
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64String = reader.result;
                const res = await api.put(`/students/${studentId}/signature`, { signatureUrl: base64String });
                
                if (res.data.success) {
                    toast.success("Signature updated successfully");
                    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, student_signature: base64String } : s));
                }
            } catch (error) {
                console.error("Upload error:", error);
                toast.error("Failed to upload signature");
            } finally {
                setUploadingId(null);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="p-2 anim-fade-in">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-primary-900" style={{ fontFamily: 'Times New Roman' }}>Update Student Signatures</h1>
                <p className="text-[11px] text-gray-500 mt-0.5">Quickly view and update scanned signatures for students.</p>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4">
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
                            {loading ? '...' : <><Filter size={14} /> Apply</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#f8fafc] text-[#64748b] uppercase text-[9px] font-black tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="px-3 py-2">S.No</th>
                                <th className="px-3 py-2">Hall Ticket</th>
                                <th className="px-3 py-2">Student Name</th>
                                <th className="px-3 py-2">Current Signature</th>
                                <th className="px-3 py-2 w-64 text-right">Upload New Signature</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-[2px] border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                                            <p className="text-[11px] text-gray-500 font-medium">Fetching students...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : students.length > 0 ? (
                                students.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                                        <td className="px-3 py-3 text-gray-400 font-medium text-[11px]">{index + 1}</td>
                                        <td className="px-3 py-3 font-bold text-gray-900 border-l border-gray-50 text-xs">{student.rollNo}</td>
                                        <td className="px-3 py-3">
                                            <span className="font-bold text-gray-900 capitalize italic" style={{ fontFamily: 'Times New Roman' }}>{student.name?.toLowerCase()}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="w-24 h-10 bg-gray-50 rounded border border-gray-200 overflow-hidden flex items-center justify-center p-1">
                                                {student.student_signature ? (
                                                    <img src={student.student_signature} alt="Signature" className="w-full h-full object-contain" />
                                                ) : (
                                                    <PenTool size={16} className="text-gray-300" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="relative inline-block overflow-hidden rounded-lg">
                                                <button 
                                                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-2 border-primary-100 text-primary-700 bg-primary-50/50 hover:bg-primary-50"
                                                    disabled={uploadingId === student.id}
                                                >
                                                    {uploadingId === student.id ? 'Uploading...' : <><Upload size={14} /> Choose Image</>}
                                                </button>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={(e) => handleFileChange(student.id, e)}
                                                    disabled={uploadingId === student.id}
                                                    title=""
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                                <GraduationCap size={48} />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-bold text-lg">No students to display</p>
                                                <p className="text-gray-500 text-sm">Please select filters and click Apply to load students.</p>
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

export default UpdateSignatures;
