import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Search, Users, Filter, Eye, X, Mail, Phone, MapPin, Calendar, User, ArrowLeft, ShieldCheck, ShieldAlert, CreditCard, Award, Info, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './StudentManagement.css';

const ExamCellFieldsSection = ({ studentId, isVerified }) => {
    const [fields, setFields] = useState([]);
    const [values, setValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [studentId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [fieldsRes, valuesRes] = await Promise.all([
                api.get('/exam-cell/fields'),
                api.get(`/exam-cell/student-values/${studentId}`)
            ]);
            
            if (fieldsRes.data.success) setFields(fieldsRes.data.data);
            
            if (valuesRes.data.success) {
                const valMap = {};
                valuesRes.data.data.forEach(v => {
                    valMap[v.field_id] = v.field_value;
                });
                setValues(valMap);
            }
        } catch (error) {
            console.error("Exam Cell Fetch Error:", error);
            toast.error("Failed to load custom fields");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const fieldValues = Object.entries(values).map(([fieldId, value]) => ({
                fieldId: parseInt(fieldId),
                value
            }));
            
            const res = await api.post(`/exam-cell/student-values/${studentId}`, { fieldValues });
            if (res.data.success) {
                toast.success("Fields updated successfully");
                fetchData();
            }
        } catch (error) {
            console.error("Exam Cell Save Error:", error);
            toast.error(error.response?.data?.message || "Failed to update fields");
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (fieldId, value) => {
        setValues(prev => ({ ...prev, [fieldId]: value }));
    };

    if (loading) return <div className="py-12 text-center text-gray-500 font-medium">Loading custom fields...</div>;

    if (fields.length === 0) return (
        <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Info size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No custom fields defined in settings.</p>
        </div>
    );

    return (
        <form onSubmit={handleSave} className="anim-fade-in">
            <div className="space-y-6">
                {fields.map(field => (
                    <div key={field.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <label className="filter-label mb-3 flex items-center justify-between">
                             <span>{field.field_label}</span>
                             {!isVerified && <span className="text-[9px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 font-bold uppercase tracking-wider">Verification Required</span>}
                        </label>
                        {field.field_type === 'select' ? (
                            <select 
                                className="filter-input w-full"
                                value={values[field.id] || ''}
                                onChange={e => handleInputChange(field.id, e.target.value)}
                                disabled={!isVerified}
                            >
                                <option value="">Select Option</option>
                                {(() => {
                                    try {
                                        const opts = JSON.parse(field.field_options || '[]');
                                        return Array.isArray(opts) ? opts.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        )) : null;
                                    } catch (e) { return null; }
                                })()}
                            </select>
                        ) : field.field_type === 'date' ? (
                            <input 
                                type="date"
                                className="filter-input w-full"
                                value={values[field.id] || ''}
                                onChange={e => handleInputChange(field.id, e.target.value)}
                                disabled={!isVerified}
                            />
                        ) : field.field_type === 'number' ? (
                            <input 
                                type="number"
                                className="filter-input w-full"
                                value={values[field.id] || ''}
                                onChange={e => handleInputChange(field.id, e.target.value)}
                                disabled={!isVerified}
                            />
                        ) : field.field_type === 'textarea' ? (
                            <textarea 
                                className="filter-input w-full h-24 py-3 leading-relaxed"
                                value={values[field.id] || ''}
                                onChange={e => handleInputChange(field.id, e.target.value)}
                                disabled={!isVerified}
                                placeholder="Enter detailed information..."
                            />
                        ) : (
                            <input 
                                type="text"
                                className="filter-input w-full"
                                value={values[field.id] || ''}
                                onChange={e => handleInputChange(field.id, e.target.value)}
                                disabled={!isVerified}
                                placeholder={`Enter ${field.field_label.toLowerCase()}`}
                            />
                        )}
                    </div>
                ))}
            </div>
            {isVerified && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button type="submit" disabled={saving} className="btn btn-primary px-10 shadow-lg filter-btn">
                        {saving ? 'Saving...' : <><Save size={18} /> Save Exam Cell Fields</>}
                    </button>
                </div>
            )}
        </form>
    );
};

const StudentDetailsModal = ({ student, onClose, onRefresh }) => {
    const [verifying, setVerifying] = useState(false);
    const [activeTab, setActiveTab] = useState('general'); // 'general' or 'exam-cell'
    
    if (!student) return null;

    const handleVerify = async () => {
        setVerifying(true);
        try {
            const res = await api.put(`/students/${student.id}/verify`, { 
                verified: !student.exam_cell_verified 
            });
            if (res.data.success) {
                toast.success(res.data.message);
                if (onRefresh) onRefresh();
                onClose();
            }
        } catch (error) {
            toast.error("Failed to update verification status");
        } finally {
            setVerifying(false);
        }
    };

    const DetailItem = ({ label, value, icon: Icon }) => (
        <div className="detail-row">
            <div className="detail-label flex items-center gap-2">
                {Icon && <Icon size={14} className="text-gray-400" />}
                {label}
            </div>
            <div className="detail-value">{value || '-'}</div>
        </div>
    );

    return (
        <div className="student-modal-overlay" onClick={onClose}>
            <div className="student-modal-container" onClick={e => e.stopPropagation()}>
                <div className="student-modal-header">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-900 flex items-center justify-center text-accent-400 shadow-lg">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 m-0" style={{ fontFamily: 'Times New Roman' }}>Student Profile</h2>
                            <p className="text-xs text-gray-500 m-0">Detailed information of {student.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-btn-top">
                        <X size={20} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex px-8 bg-white border-b border-gray-100">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`py-3 px-6 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                            activeTab === 'general' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        General Information
                    </button>
                    <button 
                        onClick={() => setActiveTab('exam-cell')}
                        className={`py-3 px-6 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                            activeTab === 'exam-cell' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Exam Cell Fields
                    </button>
                </div>

                <div className="student-modal-body custom-scrollbar">
                    {activeTab === 'general' ? (
                        <>
                            <div className="student-profile-section">
                        {student.student_photo ? (
                            <img src={student.student_photo} alt={student.name} className="student-photo-large" />
                        ) : (
                            <div className="student-photo-placeholder">
                                <User size={64} />
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{student.name}</h1>
                                    <div className="flex items-center gap-3">
                                        <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-md text-sm font-bold border border-primary-100">
                                            PIN: {student.rollNo}
                                        </span>
                                        {student.exam_cell_verified ? (
                                            <span className="verified-badge">
                                                <ShieldCheck size={14} /> Verified
                                            </span>
                                        ) : (
                                            <span className="not-verified-badge">
                                                <Info size={14} /> Unverified
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Batch</p>
                                    <p className="font-bold text-gray-800">{student.batch}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Program</p>
                                    <p className="font-bold text-gray-800">{student.course}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Status</p>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[10px] font-black uppercase">{student.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="section-title">Academic Information</div>
                    <div className="student-details-grid">
                        <DetailItem label="College" value={student.college} icon={Info} />
                        <DetailItem label="Branch" value={student.branch} icon={Info} />
                        <DetailItem label="Current Year" value={student.year} icon={Calendar} />
                        <DetailItem label="Semester" value={student.sem} icon={Calendar} />
                        <DetailItem label="Admission No" value={student.admission_no} icon={CreditCard} />
                        <DetailItem label="Admission Date" value={student.admission_date} icon={Calendar} />
                        <DetailItem label="Regulation" value={student.regulation} icon={Award} />
                        <DetailItem label="Student Type" value={student.stud_type} icon={Info} />
                    </div>

                    <div className="section-title">Personal Information</div>
                    <div className="student-details-grid">
                        <DetailItem label="Gender" value={student.gender} icon={User} />
                        <DetailItem label="Date of Birth" value={student.dob} icon={Calendar} />
                        <DetailItem label="Aadhar No" value={student.adhar_no} icon={CreditCard} />
                        <DetailItem label="Caste" value={student.caste} icon={Info} />
                        <DetailItem label="Scholar Status" value={student.scholar_status} icon={ Award} />
                    </div>

                    <div className="section-title">Contact Information</div>
                    <div className="student-details-grid">
                        <DetailItem label="Email" value={student.email} icon={Mail} />
                        <DetailItem label="Mobile" value={student.phone} icon={Phone} />
                        <DetailItem label="Father's Name" value={student.fatherName} icon={User} />
                        <DetailItem label="Parent Mobile 1" value={student.parent_mobile1} icon={Phone} />
                        <DetailItem label="Parent Mobile 2" value={student.parent_mobile2} icon={Phone} />
                        <DetailItem label="City/Village" value={student.city_village} icon={MapPin} />
                        <DetailItem label="Mandal" value={student.mandal_name} icon={MapPin} />
                        <DetailItem label="District" value={student.district} icon={MapPin} />
                        <div className="detail-row col-span-1 md:col-span-2">
                             <div className="detail-label flex items-center gap-2">
                                <MapPin size={14} className="text-gray-400" />
                                Address
                            </div>
                            <div className="detail-value whitespace-pre-line">{student.address}</div>
                        </div>
                    </div>

                    <div className="section-title">Other Details</div>
                        <div className="student-details-grid">
                            <DetailItem label="Fee Status" value={student.fee_status} icon={Info} />
                            <DetailItem label="Reg. Status" value={student.registration_status} icon={Info} />
                            <DetailItem label="Previous College" value={student.previous_college} icon={Info} />
                            <DetailItem label="Certificates" value={student.certificates_status} icon={Info} />
                            <DetailItem label="Remarks" value={student.remarks} icon={Info} />
                        </div>
                    </>
                    ) : (
                        <div className="p-8">
                            <ExamCellFieldsSection studentId={student.id} isVerified={student.exam_cell_verified} />
                        </div>
                    )}
                </div>

                <div className="student-modal-footer">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleVerify} 
                            disabled={verifying}
                            className={`btn ${student.exam_cell_verified ? 'btn-danger' : 'btn-success'} py-2 px-6 shadow-sm`}
                        >
                            {verifying ? 'Updating...' : (student.exam_cell_verified ? 'Unverify Student' : 'Verify Student')}
                        </button>
                        <button onClick={onClose} className="btn-secondary py-2 px-8">Close Profile</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StudentManagement = () => {
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
    const [availableBatches, setAvailableBatches] = useState([]);

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleToggleVerification = async (student) => {
        try {
            const newStatus = !student.exam_cell_verified;
            const res = await api.put(`/students/${student.id}/verify`, { verified: newStatus });
            if (res.data.success) {
                toast.success(newStatus ? 'Student verified' : 'Verification removed');
                handleSearch(); // Refresh list
            }
        } catch (error) {
            console.error("Verification toggle error:", error);
            toast.error('Failed to update verification status');
        }
    };
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

    useEffect(() => {
        setAvailableBatches(institutionData.batches);
    }, [filters.branch, institutionData.batches]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            if (name === 'college') { newFilters.program = ''; newFilters.branch = ''; newFilters.batch = ''; }
            if (name === 'program') { newFilters.branch = ''; newFilters.batch = ''; }
            if (name === 'branch') { newFilters.batch = ''; }
            return newFilters;
        });
    };

    const handleSearch = async () => {
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

    return (
        <div className="p-6 anim-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-primary-900" style={{ fontFamily: 'Times New Roman' }}>Student Management</h1>
                    <p className="text-gray-500 mt-1">Search and view student directory records.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="filter-section">
                    <div className="filter-grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
                        <div className="w-full">
                            <label className="filter-label">Batch</label>
                            <select name="batch" value={filters.batch} onChange={handleFilterChange} className="filter-input w-full">
                                <option value="">All Batches</option>
                                {availableBatches?.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="w-full">
                            <label className="filter-label">College</label>
                            <select name="college" value={filters.college} onChange={handleFilterChange} className="filter-input w-full">
                                <option value="">All Colleges</option>
                                {institutionData.colleges?.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="w-full">
                            <label className="filter-label">Program</label>
                            <select name="program" value={filters.program} onChange={handleFilterChange} className="filter-input w-full" disabled={!filters.college && institutionData.courses.length > 0}>
                                <option value="">All Programs</option>
                                {availablePrograms?.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="w-full">
                            <label className="filter-label">Branch</label>
                            <select name="branch" value={filters.branch} onChange={handleFilterChange} className="filter-input w-full" disabled={!filters.program && institutionData.branches.length > 0}>
                                <option value="">All Branches</option>
                                {availableBranches?.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="w-full">
                            <label className="filter-label">Year</label>
                            <select name="year" value={filters.year} onChange={handleFilterChange} className="filter-input w-full">
                                <option value="">All Years</option>
                                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                            </select>
                        </div>
                        <div className="w-full">
                            <label className="filter-label">Semester</label>
                            <select name="sem" value={filters.sem} onChange={handleFilterChange} className="filter-input w-full">
                                <option value="">All Sems</option>
                                {[1,2].map(s => <option key={s} value={s}>Sem {s}</option>)}
                            </select>
                        </div>
                        <div className="w-full lg:col-span-1">
                            <label className="filter-label">Search</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    name="search"
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                    placeholder="Name or PIN..."
                                    className="filter-input w-full pl-10"
                                />
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <div className="w-full">
                            <label className="filter-label">Action</label>
                            <button onClick={handleSearch} className="btn-primary filter-btn px-0 shadow-sm text-sm w-full" disabled={loading}>
                                <Filter size={16} /> Apply
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4 border-b">PIN No</th>
                                <th className="px-6 py-4 border-b">Photo</th>
                                <th className="px-6 py-4 border-b">Student Name</th>
                                <th className="px-6 py-4 border-b">Branch</th>
                                <th className="px-6 py-4 border-b">Year/Sem</th>
                                <th className="px-6 py-4 border-b">Status</th>
                                <th className="px-6 py-4 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-16 text-gray-500">Loading students...</td></tr>
                            ) : students.length > 0 ? (
                                students.map(student => (
                                    <tr key={student.id} className="border-b border-gray-100 last:border-0 hover:bg-primary-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-primary-700">{student.rollNo || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                                {student.student_photo ? (
                                                    <img src={student.student_photo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <User size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{student.name || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{student.branch || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{student.year || '-'} / {student.sem || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                                                student.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {student.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => handleToggleVerification(student)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition-all border ${
                                                        student.exam_cell_verified 
                                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                                        : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                                                    }`}
                                                    title={student.exam_cell_verified ? "Unverify Student" : "Verify Student"}
                                                >
                                                    {student.exam_cell_verified ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                                    {student.exam_cell_verified ? 'Verified' : 'Verify'}
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedStudent(student)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md font-bold text-[10px] uppercase tracking-wider transition-colors border border-primary-100"
                                                    title="View Full Profile"
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-24 text-gray-500">
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

            {/* Student Details Modal */}
            <StudentDetailsModal 
                student={selectedStudent} 
                onClose={() => setSelectedStudent(null)} 
                onRefresh={handleSearch}
            />
        </div>
    );
};

export default StudentManagement;
