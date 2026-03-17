import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Search, Users, UserPlus, Trash2, BookOpen, FlaskConical, Presentation, X, Filter, ChevronRight, GraduationCap } from 'lucide-react';

const FacultyAssignment = () => {
    // Data state
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [regulations, setRegulations] = useState([]);
    const [institutionData, setInstitutionData] = useState({ courses: [], branches: [], batches: [] });
    const [hrmsEmployees, setHrmsEmployees] = useState([]);
    const [assignedFaculties, setAssignedFaculties] = useState([]);
    const [regulationBatches, setRegulationBatches] = useState([]);
    const [facultyLoading, setFacultyLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Filter state
    const [filter, setFilter] = useState({
        regulation_id: '',
        branch_id: '',
        year_of_study: '',
        semester_number: ''
    });

    // Assignment flow state
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
    const [selectedBatches, setSelectedBatches] = useState([]); // Multiple batches
    const [assignmentEmployeeId, setAssignmentEmployeeId] = useState('');

    useEffect(() => {
        fetchRegulations();
        fetchInstitutionData();
    }, []);

    useEffect(() => {
        if (filter.regulation_id) {
            fetchSubjects();
            fetchRegulationBatches(filter.regulation_id);
        } else {
            setSubjects([]);
            setRegulationBatches([]);
        }
    }, [filter.regulation_id, filter.branch_id, filter.year_of_study, filter.semester_number]);

    const fetchRegulationBatches = async (regulationId) => {
        try {
            const resp = await api.get(`/regulations/${regulationId}/batches`);
            if (resp.data.success) {
                // Map to unique batch names (since API returns objects)
                const batchNames = [...new Set((resp.data.data || []).map(b => b.batch))];
                setRegulationBatches(batchNames);
            }
        } catch (err) { console.error('Failed to fetch regulation batches:', err); }
    };

    const fetchRegulations = async () => {
        try {
            const resp = await api.get('/regulations');
            if (resp.data.success) {
                setRegulations(resp.data.data);
                if (resp.data.data.length > 0) {
                    setFilter(prev => ({ ...prev, regulation_id: String(resp.data.data[0].id) }));
                }
            }
        } catch (err) { console.error('Failed to fetch regulations:', err); }
    };

    const fetchInstitutionData = async () => {
        try {
            const resp = await api.get('/institution/details');
            if (resp.data.success) {
                const { courses, branches, batches } = resp.data.data;
                setInstitutionData({ 
                    courses: courses || [], 
                    branches: branches || [], 
                    batches: batches || [] 
                });
            }
        } catch (err) { console.error('Failed to fetch institution data:', err); }
    };

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.regulation_id) params.set('regulation_id', filter.regulation_id);
            if (filter.branch_id) params.set('branch_id', filter.branch_id);
            if (filter.year_of_study) params.set('year_of_study', filter.year_of_study);
            if (filter.semester_number) params.set('semester_number', filter.semester_number);
            const resp = await api.get(`/subjects?${params}`);
            if (resp.data.success) setSubjects(resp.data.data);
        } catch (err) { console.error('Failed to fetch subjects:', err); }
        finally { setLoading(false); }
    };

    const fetchHrmsEmployees = async (searchQuery = '') => {
        try {
            const resp = await api.get(`/hrms/employees?q=${encodeURIComponent(searchQuery)}`);
            if (resp.data.success) {
                setHrmsEmployees(resp.data.data);
            }
        } catch (err) { console.error('Failed to fetch HRMS employees:', err); }
    };

    const fetchAssignedFaculties = async (subjectId, batch = '') => {
        setFacultyLoading(true);
        try {
            const params = new URLSearchParams({ subject_id: subjectId });
            if (batch) params.set('batch', batch);
            const resp = await api.get(`/faculty-subjects?${params}`);
            if (resp.data.success) {
                setAssignedFaculties(resp.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch assigned faculty:', err);
        } finally {
            setFacultyLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'regulation_id') { next.branch_id = ''; next.year_of_study = ''; next.semester_number = ''; }
            if (name === 'branch_id') { next.year_of_study = ''; next.semester_number = ''; }
            return next;
        });
    };

    const handleSubjectSelect = (subject) => {
        setSelectedSubject(subject);
        setSelectedBatches([]);
        setAssignmentEmployeeId('');
        setEmployeeSearchQuery('');
        setHrmsEmployees([]);
        fetchAssignedFaculties(subject.id);
    };

    const handleEmployeeSearch = (e) => {
        e.preventDefault();
        fetchHrmsEmployees(employeeSearchQuery);
    };

    const handleAssignFaculty = async (e) => {
        e.preventDefault();
        if (!assignmentEmployeeId) return alert('Please select an employee');
        if (selectedBatches.length === 0) return alert('Please select at least one batch');
        
        setSaving(true);
        const errors = [];
        
        try {
            // Assign for each selected batch
            for (const batch of selectedBatches) {
                try {
                    const payload = {
                        employee_id: assignmentEmployeeId,
                        subject_id: selectedSubject.id,
                        batch: batch || null
                    };
                    await api.post('/faculty-subjects', payload);
                } catch (err) {
                    const msg = err.response?.data?.message || `Failed for ${batch}`;
                    errors.push(`${batch}: ${msg}`);
                }
            }
            
            if (errors.length > 0) {
                alert(`Some assignments failed:\n${errors.join('\n')}`);
            }
            
            setAssignmentEmployeeId('');
            setSelectedBatches([]);
            fetchAssignedFaculties(selectedSubject.id);
        } catch (err) {
            alert('An unexpected error occurred during assignment');
        } finally {
            setSaving(false);
        }
    };

    const handleUnassignFaculty = async (assignmentId) => {
        if (!window.confirm('Remove this faculty assignment?')) return;
        setFacultyLoading(true);
        try {
            await api.delete(`/faculty-subjects/${assignmentId}`);
            fetchAssignedFaculties(selectedSubject.id);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to unassign');
        } finally {
            setFacultyLoading(false);
        }
    };

    // Derived data
    const activeRegulation = regulations.find(r => String(r.id) === String(filter.regulation_id)) || null;
    const totalYears = activeRegulation?.total_years || 4;
    const semsPerYear = activeRegulation?.semesters_per_year || 2;
    const totalSems = totalYears * semsPerYear;
    const pageBranches = institutionData.branches.filter(b =>
        activeRegulation ? String(b.course_id) === String(activeRegulation.course_id) : false
    );

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 100px)' }}>
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title font-display" style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Faculty Assignment</h1>
                    <p className="page-subtitle" style={{ color: '#6b7280', marginTop: '4px' }}>Assign faculty to subjects based on Regulation, Branch, and Semester.</p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', alignItems: 'center', background: '#fff', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <div style={{ flex: '1 1 240px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.025em' }}>Regulation</label>
                    <select
                        name="regulation_id"
                        value={filter.regulation_id}
                        onChange={handleFilterChange}
                        className="form-select"
                        style={{ width: '100%', height: '42px', borderRadius: '10px', fontSize: '14px' }}
                    >
                        <option value="">Select Regulation</option>
                        {regulations.map(r => (
                            <option key={r.id} value={r.id}>{r.name} — {r.course_name} ({r.college_name})</option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.025em' }}>Branch</label>
                    <select
                        name="branch_id"
                        value={filter.branch_id}
                        onChange={handleFilterChange}
                        className="form-select"
                        style={{ width: '100%', height: '42px', borderRadius: '10px', fontSize: '14px' }}
                        disabled={!filter.regulation_id || pageBranches.length === 0}
                    >
                        <option value="">All Branches</option>
                        {pageBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                <div style={{ flex: '0 1 140px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.025em' }}>Year</label>
                    <select
                        name="year_of_study"
                        value={filter.year_of_study}
                        onChange={handleFilterChange}
                        className="form-select"
                        style={{ width: '100%', height: '42px', borderRadius: '10px', fontSize: '14px' }}
                        disabled={!filter.regulation_id}
                    >
                        <option value="">All Years</option>
                        {Array.from({ length: totalYears }, (_, i) => i + 1).map(y => (
                            <option key={y} value={y}>Year {y}</option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: '0 1 140px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.025em' }}>Semester</label>
                    <select
                        name="semester_number"
                        value={filter.semester_number}
                        onChange={handleFilterChange}
                        className="form-select"
                        style={{ width: '100%', height: '42px', borderRadius: '10px', fontSize: '14px' }}
                        disabled={!filter.regulation_id}
                    >
                        <option value="">All Sems</option>
                        {Array.from({ length: totalSems }, (_, i) => i + 1).map(s => (
                            <option key={s} value={s}>Sem {s}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: '24px', flex: 1, height: 'calc(100vh - 280px)' }}>
                {/* Subjects Table */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOpen size={18} className="text-primary-600" />
                            Listed Subjects
                        </h3>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', padding: '4px 12px', borderRadius: '20px', background: '#f3f4f6' }}>
                            {subjects.length} Subjects found
                        </span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', letterSpacing: '0.05em' }}>Code</th>
                                    <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', letterSpacing: '0.05em' }}>Subject Name</th>
                                    <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', letterSpacing: '0.05em' }}>Type</th>
                                    <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', letterSpacing: '0.05em' }}>Status</th>
                                    <th style={{ textAlign: 'center', padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', letterSpacing: '0.05em' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                            <span>Loading subjects...</span>
                                        </div>
                                    </td></tr>
                                ) : subjects.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '80px 24px', color: '#9ca3af' }}>
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 bg-gray-50 rounded-full">
                                                <Filter size={32} className="opacity-20" />
                                            </div>
                                            <h3>No subjects found for selection.</h3>
                                            <p className="text-sm">Try adjusting your filters or selecting a different regulation.</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    subjects.map(subject => (
                                        <tr key={subject.id} 
                                            onClick={() => handleSubjectSelect(subject)}
                                            style={{ cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', borderBottom: '1px solid #f3f4f6', background: selectedSubject?.id === subject.id ? '#eff6ff' : 'transparent' }}
                                            className="hover:bg-gray-50 group"
                                        >
                                            <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{subject.code || 'N/A'}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                                {subject.name}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${subject.subject_type === 'lab' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                                    {subject.subject_type === 'lab' ? <FlaskConical size={12} /> : <Presentation size={12} />}
                                                    {subject.subject_type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                                                {subject.assigned_count > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md">
                                                        <Users size={10} /> ASSIGNED ({subject.assigned_count})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-md">
                                                        <Filter size={10} /> PENDING
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <div className={`p-2 rounded-lg transition-all ${selectedSubject?.id === subject.id ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600'}`}>
                                                    <ChevronRight size={18} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Assignment Management Sidebar */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                    {selectedSubject ? (
                        <>
                            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', background: '#111827', color: '#fff', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                                    <button onClick={() => setSelectedSubject(null)} style={{ padding: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }} className="hover:bg-white/20">
                                        <X size={16} />
                                    </button>
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Now Assigning For</span>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{selectedSubject.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                                    <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.15)', px: '8px', py: '2px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>{selectedSubject.code || 'NO CODE'}</span>
                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></span>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{selectedSubject.year_of_study} Year • Sem {selectedSubject.semester_number}</span>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="custom-scrollbar">
                                {/* Assignment Section */}
                                <div style={{ marginBottom: '32px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <UserPlus size={16} className="text-primary-600" />
                                        New Faculty Assignment
                                    </h4>
                                    
                                    <form onSubmit={handleEmployeeSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                            <input 
                                                type="text" 
                                                placeholder="Search ID or Name..." 
                                                value={employeeSearchQuery}
                                                onChange={e => setEmployeeSearchQuery(e.target.value)}
                                                className="form-input" 
                                                style={{ paddingLeft: '40px', height: '42px', fontSize: '14px', background: '#fff' }}
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 16px' }}>Search</button>
                                    </form>

                                    <form onSubmit={handleAssignFaculty}>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>Select HRMS Employee *</label>
                                            <select 
                                                value={assignmentEmployeeId}
                                                onChange={e => setAssignmentEmployeeId(e.target.value)}
                                                className="form-select" 
                                                style={{ width: '100%', height: '42px', fontSize: '14px', background: '#fff', padding: '0 12px' }}
                                                required
                                                disabled={hrmsEmployees.length === 0}
                                            >
                                                <option value="">-- {hrmsEmployees.length === 0 ? "Search above first" : "Choose Employee"} --</option>
                                                {hrmsEmployees.map(emp => (
                                                    <option key={emp._id} value={emp._id}>
                                                        {emp.employee_name} ({emp.emp_no})
                                                        {emp.department || emp.designation ? ` - ${[emp.department, emp.designation].filter(Boolean).join(' / ')}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Target Batches *</label>
                                                {regulationBatches.length > 0 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setSelectedBatches(selectedBatches.length === regulationBatches.length ? [] : [...regulationBatches])}
                                                        style={{ fontSize: '11px', color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                                                    >
                                                        {selectedBatches.length === regulationBatches.length ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '120px', overflowY: 'auto', padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }} className="custom-scrollbar">
                                                {regulationBatches.length === 0 ? (
                                                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>No batches found for this regulation.</span>
                                                ) : (
                                                    regulationBatches.map(batch => {
                                                        const isSelected = selectedBatches.includes(batch);
                                                        return (
                                                            <button
                                                                key={batch}
                                                                type="button"
                                                                onClick={() => setSelectedBatches(prev => isSelected ? prev.filter(b => b !== batch) : [...prev, batch])}
                                                                style={{
                                                                    padding: '4px 12px',
                                                                    borderRadius: '20px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.15s',
                                                                    border: `1px solid ${isSelected ? 'var(--primary-600)' : '#e5e7eb'}`,
                                                                    background: isSelected ? 'var(--primary-50)' : 'white',
                                                                    color: isSelected ? 'var(--primary-700)' : '#6b7280'
                                                                }}
                                                            >
                                                                {batch}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary w-full" 
                                            style={{ height: '46px', fontSize: '15px', fontWeight: 600, boxShadow: '0 4px 6px -1px var(--primary-200)' }}
                                            disabled={saving || !assignmentEmployeeId}
                                        >
                                            <UserPlus size={18} />
                                            {saving ? 'Assigning...' : 'Complete Assignment'}
                                        </button>
                                    </form>
                                </div>

                                {/* List Section */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#374151', margin: 0 }}>Current Assignments</h4>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-600)', background: 'var(--primary-50)', padding: '2px 10px', borderRadius: '12px' }}>{assignedFaculties.length}</span>
                                    </div>

                                    {facultyLoading ? (
                                        <div style={{ textAlign: 'center', padding: '32px' }}>
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                                            <p style={{ color: '#9ca3af', fontSize: '13px' }}>Refreshing assignments...</p>
                                        </div>
                                    ) : assignedFaculties.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                                            <div className="bg-white p-3 rounded-full shadow-sm inline-block mb-3">
                                                <Users size={24} style={{ color: '#d1d5db' }} />
                                            </div>
                                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, fontWeight: 500 }}>No faculty assigned yet.</p>
                                            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Assignments for this subject across all batches will appear here.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {(() => {
                                                const grouped = assignedFaculties.reduce((acc, curr) => {
                                                    const key = String(curr.employee_id);
                                                    if (!acc[key]) {
                                                        acc[key] = { ...curr, assignments: [{ id: curr.id, batch: curr.batch }] };
                                                    } else {
                                                        acc[key].assignments.push({ id: curr.id, batch: curr.batch });
                                                    }
                                                    return acc;
                                                }, {});
                                                
                                                return Object.values(grouped).map(empGroup => (
                                                    <div key={empGroup.employee_id} className="assignment-item" style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '14px', background: '#fff' }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)', color: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, border: '1px solid #d1d5db' }}>
                                                                    {empGroup.employee_name?.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div style={{ minWidth: 0 }}>
                                                                    <h5 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#111827' }}>{empGroup.employee_name}</h5>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, background: '#f3f4f6', px: '6px', py: '1px', borderRadius: '4px' }}>ID: {empGroup.emp_no}</span>
                                                                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>•</span>
                                                                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>{empGroup.department}</span>
                                                                    </div>
                                                                    {empGroup.designation && (
                                                                        <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500, marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                            {empGroup.designation}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => {
                                                                    if(window.confirm(`Remove all ${empGroup.assignments.length} assignments for ${empGroup.employee_name}?`)) {
                                                                        empGroup.assignments.forEach(a => handleUnassignFaculty(a.id));
                                                                    }
                                                                }} 
                                                                style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                                                                title="Remove all assignments"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', background: '#f9fafb', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
                                                            {empGroup.assignments.map(a => (
                                                                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--primary-700)', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                                                    {a.batch || 'General'}
                                                                    <button 
                                                                        onClick={() => handleUnassignFaculty(a.id)}
                                                                        style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                                                                        className="hover:text-red-500"
                                                                    >
                                                                        <X size={10} strokeWidth={3} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', textAlign: 'center', background: 'linear-gradient(to bottom, #fff, #f9fafb)' }}>
                            <div style={{ marginBottom: '24px', position: 'relative' }}>
                                <div style={{ width: '120px', height: '120px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <GraduationCap size={48} className="text-primary-300" />
                                </div>
                                <div style={{ position: 'absolute', bottom: '0', right: '0', background: '#fff', padding: '8px', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                    <UserPlus size={20} className="text-primary-600" />
                                </div>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 12px 0' }}>Select a Subject</h3>
                            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, maxWidth: '280px' }}>
                                Choose a subject from the list to manage its faculty assignments. You can assign different faculty for specific batches.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
                .assignment-item:hover { border-color: var(--primary-200) !important; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); transform: translateY(-1px); }
            `}</style>
        </div>
    );
};

export default FacultyAssignment;
