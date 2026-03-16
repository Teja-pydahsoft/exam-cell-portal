import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Search, Edit, Trash2, BookOpen, FlaskConical, Presentation, X, Users, UserPlus } from 'lucide-react';
import './Subjects.css';
import '../admin/Faculty.css';

const Subjects = () => {
    // All data
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [regulations, setRegulations] = useState([]);
    const [institutionData, setInstitutionData] = useState({ courses: [], branches: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalStep, setModalStep] = useState(1);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    // Faculty Assignment State
    const [showFacultyModal, setShowFacultyModal] = useState(false);
    const [selectedFacultySubject, setSelectedFacultySubject] = useState(null);
    const [hrmsEmployees, setHrmsEmployees] = useState([]);
    const [assignedFaculties, setAssignedFaculties] = useState([]);
    const [assignmentBatch, setAssignmentBatch] = useState('');
    const [assignmentEmployeeId, setAssignmentEmployeeId] = useState('');
    const [facultyLoading, setFacultyLoading] = useState(false);
    
    // Bulk Upload state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // Page-level filter state
    const [filter, setFilter] = useState({
        regulation_id: '',
        branch_id: '',
        year_of_study: '',
        semester_number: ''
    });

    // Modal form state
    const [form, setForm] = useState({
        regulation_id: '',
        branch_id: '',
        year_of_study: '',
        semester_number: '',
        name: '',
        code: '',
        subject_type: 'theory',
        units: '',
        experiments_count: '',
        credits: '',
        // Extended fields
        subject_order: '',
        short_name: '',
        is_elective: 0,
        elective_name: '',
        is_replacement: 0,
        internal_max_marks: '',
        external_max_marks: '',
        sub_type: 0,
        is_running_regulation: 1,
        is_common_subject: 0,
        exam_code: ''
    });

    // Derived data from selected regulation
    const activeRegulation = regulations.find(r => String(r.id) === String(filter.regulation_id)) || null;
    const formRegulation = regulations.find(r => String(r.id) === String(form.regulation_id)) || null;

    const totalYears = activeRegulation?.total_years || 4;
    const semsPerYear = activeRegulation?.semesters_per_year || 2;
    const totalSems = totalYears * semsPerYear;

    const formTotalYears = formRegulation?.total_years || 4;
    const formSemsPerYear = formRegulation?.semesters_per_year || 2;
    const formTotalSems = formTotalYears * formSemsPerYear;

    // Branches filtered by regulation's course
    const pageBranches = institutionData.branches.filter(b =>
        activeRegulation ? String(b.course_id) === String(activeRegulation.course_id) : false
    );
    const formBranches = institutionData.branches.filter(b =>
        formRegulation ? String(b.course_id) === String(formRegulation.course_id) : false
    );

    // Employee Search State
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

    useEffect(() => {
        fetchRegulations();
        fetchInstitutionData();
    }, []);

    useEffect(() => {
        if (showFacultyModal) {
            fetchHrmsEmployees('');
        }
    }, [showFacultyModal]);

    const fetchHrmsEmployees = async (searchQuery = '') => {
        try {
            const resp = await api.get(`/hrms/employees?q=${encodeURIComponent(searchQuery)}`);
            if (resp.data.success) {
                setHrmsEmployees(resp.data.data);
                // Also reset selected employee if searching newly
                if (searchQuery) {
                    setAssignmentEmployeeId('');
                }
            }
        } catch (err) { console.error('Failed to fetch HRMS employees:', err); }
    };

    const handleEmployeeSearch = (e) => {
        e.preventDefault();
        fetchHrmsEmployees(employeeSearchQuery);
    };

    useEffect(() => {
        if (filter.regulation_id) fetchSubjects();
        else setSubjects([]);
    }, [filter]);

    const fetchInstitutionData = async () => {
        try {
            const resp = await api.get('/institution/details');
            if (resp.data.success) {
                const { courses, branches } = resp.data.data;
                setInstitutionData({ courses: courses || [], branches: branches || [] });
            }
        } catch (err) { console.error(err); }
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
        } catch (err) { console.error(err); }
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
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
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

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'regulation_id') { next.branch_id = ''; next.year_of_study = ''; next.semester_number = ''; }
            return next;
        });
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setEditingId(null);
        setForm({
            regulation_id: filter.regulation_id || '',
            branch_id: filter.branch_id || '',
            year_of_study: filter.year_of_study || '',
            semester_number: filter.semester_number || '',
            name: '', code: '', subject_type: 'theory',
            units: '', experiments_count: '', credits: '',
            subject_order: '', short_name: '', is_elective: 0, elective_name: '',
            is_replacement: 0, internal_max_marks: '', external_max_marks: '',
            sub_type: 0, is_running_regulation: 1, is_common_subject: 0, exam_code: ''
        });
        setModalStep(1);
        setShowModal(true);
    };

    const openEditModal = (subject) => {
        setIsEditing(true);
        setEditingId(subject.id);
        setForm({
            regulation_id: String(subject.regulation_id),
            branch_id: subject.branch_id ? String(subject.branch_id) : '',
            year_of_study: String(subject.year_of_study),
            semester_number: String(subject.semester_number),
            name: subject.name || '',
            code: subject.code || '',
            subject_type: subject.subject_type || 'theory',
            units: subject.units || '',
            experiments_count: subject.experiments_count || '',
            credits: subject.credits || '',
            subject_order: subject.subject_order || '',
            short_name: subject.short_name || '',
            is_elective: subject.is_elective || 0,
            elective_name: subject.elective_name || '',
            is_replacement: subject.is_replacement || 0,
            internal_max_marks: subject.internal_max_marks || '',
            external_max_marks: subject.external_max_marks || '',
            sub_type: subject.sub_type || 0,
            is_running_regulation: subject.is_running_regulation ?? 1,
            is_common_subject: subject.is_common_subject || 0,
            exam_code: subject.exam_code || ''
        });
        setModalStep(1);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                regulation_id: form.regulation_id,
                branch_id: form.branch_id || null,
                year_of_study: form.year_of_study,
                semester_number: form.semester_number,
                name: form.name,
                code: form.code,
                subject_type: form.subject_type,
                units: form.subject_type === 'theory' ? (form.units || null) : null,
                experiments_count: form.subject_type === 'lab' ? (form.experiments_count || null) : null,
                credits: form.credits || null,
                subject_order: form.subject_order || null,
                short_name: form.short_name || null,
                is_elective: form.is_elective,
                elective_name: form.is_elective ? form.elective_name : null,
                is_replacement: form.is_replacement,
                internal_max_marks: form.internal_max_marks || null,
                external_max_marks: form.external_max_marks || null,
                sub_type: form.sub_type,
                is_running_regulation: form.is_running_regulation,
                is_common_subject: form.is_common_subject,
                exam_code: form.exam_code || null
            };
            if (isEditing) {
                await api.put(`/subjects/${editingId}`, payload);
            } else {
                await api.post('/subjects', payload);
            }
            setShowModal(false);
            fetchSubjects();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save subject');
        } finally { setSaving(false); }
    };

    const handleDelete = async (subject) => {
        if (!window.confirm(`Delete "${subject.name}"?`)) return;
        try {
            await api.delete(`/subjects/${subject.id}`);
            fetchSubjects();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete subject');
        }
    };

    // Faculty Assignment Functions
    const openFacultyModal = (subject) => {
        setSelectedFacultySubject(subject);
        setAssignmentBatch('');
        setAssignmentEmployeeId('');
        setShowFacultyModal(true);
        fetchAssignedFaculties(subject.id, '');
    };

    const fetchAssignedFaculties = async (subjectId, batch) => {
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

    const handleBatchChangeForFaculty = (e) => {
        const newBatch = e.target.value;
        setAssignmentBatch(newBatch);
        if (selectedFacultySubject) {
            fetchAssignedFaculties(selectedFacultySubject.id, newBatch);
        }
    };

    const handleAssignFaculty = async (e) => {
        e.preventDefault();
        if (!assignmentEmployeeId) return alert('Please select an employee');
        setSaving(true);
        try {
            const payload = {
                employee_id: assignmentEmployeeId,
                subject_id: selectedFacultySubject.id,
                batch: assignmentBatch || null
            };
            await api.post('/faculty-subjects', payload);
            setAssignmentEmployeeId('');
            fetchAssignedFaculties(selectedFacultySubject.id, assignmentBatch);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to assign faculty (Workload constraint likely violated)');
        } finally {
            setSaving(false);
        }
    };

    const handleUnassignFaculty = async (assignmentId) => {
        if (!window.confirm('Remove this faculty assignment?')) return;
        setFacultyLoading(true);
        try {
            await api.delete(`/faculty-subjects/${assignmentId}`);
            fetchAssignedFaculties(selectedFacultySubject.id, assignmentBatch);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to unassign');
            setFacultyLoading(false);
        }
    };

    const filtered = subjects.filter(s =>
        !searchTerm ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.short_name && s.short_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleDownloadTemplate = async () => {
        try {
            const resp = await api.get('/subjects/template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'subject_upload_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { alert('Failed to download template'); }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return alert('Please select a file');
        
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('regulation_id', filter.regulation_id);
            formData.append('branch_id', filter.branch_id);
            formData.append('year_of_study', filter.year_of_study);
            formData.append('semester_number', filter.semester_number);

            const resp = await api.post('/subjects/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (resp.data.success) {
                alert(resp.data.message);
                setShowUploadModal(false);
                setSelectedFile(null);
                fetchSubjects();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // Group by Branch → "Year X — Sem Y"
    const grouped = filtered.reduce((acc, subj) => {
        const branchKey = subj.branch_name || 'General (No Branch)';
        const semKey = `Year ${subj.year_of_study} — Sem ${subj.semester_number}`;
        if (!acc[branchKey]) acc[branchKey] = {};
        if (!acc[branchKey][semKey]) acc[branchKey][semKey] = [];
        acc[branchKey][semKey].push(subj);
        return acc;
    }, {});

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title font-display" style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Subject Directory</h1>
                    <p className="page-subtitle" style={{ color: '#6b7280', marginTop: '4px' }}>Manage curriculum subjects across branches and semesters.</p>
                </div>
                {filter.regulation_id && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-outline" onClick={() => setShowUploadModal(true)} style={{ whiteSpace: 'nowrap' }}>
                            <BookOpen size={16} /> Bulk Import
                        </button>
                        <button className="btn btn-primary" onClick={openCreateModal} style={{ whiteSpace: 'nowrap' }}>
                            <Plus size={16} /> Add Subject
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', alignItems: 'center', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Regulation</label>
                    <select
                        name="regulation_id"
                        value={filter.regulation_id}
                        onChange={handleFilterChange}
                        className="form-select"
                        style={{ width: '100%' }}
                    >
                        <option value="">Select Regulation</option>
                        {regulations.map(r => (
                            <option key={r.id} value={r.id}>{r.name} — {r.course_name} ({r.college_name})</option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: '1 1 180px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Branch</label>
                    <select
                        name="branch_id"
                        value={filter.branch_id}
                        onChange={handleFilterChange}
                        className="form-select"
                        style={{ width: '100%' }}
                        disabled={!filter.regulation_id || pageBranches.length === 0}
                    >
                        <option value="">All Branches</option>
                        {pageBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                <div style={{ flex: '0 1 120px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Year</label>
                    <select
                        name="year_of_study"
                        value={filter.year_of_study}
                        onChange={handleFilterChange}
                        className="form-select"
                        style={{ width: '100%' }}
                        disabled={!filter.regulation_id}
                    >
                        <option value="">All</option>
                        {Array.from({ length: totalYears }, (_, i) => i + 1).map(y => (
                            <option key={y} value={y}>Year {y}</option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: '0 1 120px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Semester</label>
                    <select
                        name="semester_number"
                        value={filter.semester_number}
                        onChange={handleFilterChange}
                        className="form-select"
                        style={{ width: '100%' }}
                        disabled={!filter.regulation_id}
                    >
                        <option value="">All</option>
                        {Array.from({ length: totalSems }, (_, i) => i + 1).map(s => (
                            <option key={s} value={s}>Sem {s}</option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: '2 1 250px', marginLeft: 'auto' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Search</label>
                    <div className="search-box" style={{ width: '100%', margin: 0 }}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>
            </div>

            {/* Active Regulation Badge */}
            {activeRegulation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '10px 16px', background: 'var(--primary-50)', borderRadius: '10px', border: '1px solid var(--primary-100)' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary-700)', padding: '2px 10px', background: 'var(--primary-100)', borderRadius: '20px' }}>
                        {activeRegulation.name}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--primary-600)' }}>
                        {activeRegulation.course_name} · {activeRegulation.college_name}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--gray-500)' }}>
                        {subjects.length} subjects
                    </span>
                </div>
            )}

            {/* Content */}
            {!filter.regulation_id ? (
                <div className="empty-state">
                    <BookOpen size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
                    <h3>Select a Regulation</h3>
                    <p>Choose a regulation above to view and manage its subjects.</p>
                </div>
            ) : loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-400)' }}>Loading subjects...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <BookOpen size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
                    <h3>No Subjects Found</h3>
                    <p>{searchTerm ? 'No subjects match your search.' : 'Add the first subject to this regulation.'}</p>
                    {!searchTerm && <button className="btn btn-primary" onClick={openCreateModal}><Plus size={16} /> Add Subject</button>}
                </div>
            ) : (
                Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([branchName, semGroups]) => (
                    <div key={branchName} style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-500)', display: 'inline-block' }}></span>
                            {branchName}
                        </h2>
                        {Object.entries(semGroups).sort(([a], [b]) => a.localeCompare(b)).map(([semKey, semSubjects]) => (
                            <div key={semKey} style={{ marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{semKey}</h3>
                                <div className="subjects-grid">
                                    {semSubjects.map(subject => (
                                        <div key={subject.id} className="subject-card anim-fade-in-up">
                                            <div className="subject-header">
                                                <div>
                                                    <h3 className="subject-title">{subject.name}</h3>
                                                    {subject.code && <span className="subject-code">{subject.code}</span>}
                                                </div>
                                                <div className="subject-actions">
                                                    <button className="action-btn" title="Manage Faculty" onClick={() => openFacultyModal(subject)}>
                                                        <Users size={16} />
                                                    </button>
                                                    <button className="action-btn edit" title="Edit Subject" onClick={() => openEditModal(subject)}>
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="action-btn delete" title="Delete Subject" onClick={() => handleDelete(subject)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="subject-details">
                                                <span className={`subject-badge ${subject.subject_type === 'lab' ? 'badge-lab' : 'badge-theory'}`}>
                                                    {subject.subject_type === 'lab' ? (
                                                        <><FlaskConical size={12} style={{marginRight: '4px'}}/> LAB</>
                                                    ) : (
                                                        <><Presentation size={12} style={{marginRight: '4px'}}/> THEORY</>
                                                    )}
                                                </span>
                                                {subject.credits && (
                                                    <div className="detail-item">
                                                        <BookOpen size={14} />
                                                        <span>{subject.credits} Credits</span>
                                                    </div>
                                                )}
                                                {subject.subject_type === 'theory' && subject.units && (
                                                    <div className="detail-item">
                                                        <Presentation size={14} />
                                                        <span>{subject.units} Units</span>
                                                    </div>
                                                )}
                                                {subject.subject_type === 'lab' && subject.experiments_count && (
                                                    <div className="detail-item">
                                                        <FlaskConical size={14} />
                                                        <span>{subject.experiments_count} Exps</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="subject-footer">
                                                <span className="branch-name">{branchName === 'General (No Branch)' ? 'General Core' : branchName}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ))
            )}

            {/* Add/Edit Subject Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSave}>
                            <div className="modal-header">
                                <h3 className="modal-title font-display">
                                    {isEditing ? 'Edit Subject' : 'Add New Subject'} — Step {modalStep}/2
                                </h3>
                                <button type="button" className="modal-close" onClick={() => setShowModal(false)}><X size={24} /></button>
                            </div>

                            <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                                {modalStep === 1 ? (
                                    <div>
                                        <div className="form-group">
                                            <label className="form-label">Regulation *</label>
                                            <select name="regulation_id" value={form.regulation_id} onChange={handleFormChange} className="form-select" required>
                                                <option value="">Select Regulation</option>
                                                {regulations.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name} — {r.course_name} ({r.college_name})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Branch</label>
                                            <select name="branch_id" value={form.branch_id} onChange={handleFormChange} className="form-select" disabled={!form.regulation_id}>
                                                <option value="">General / No Branch</option>
                                                {formBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Year of Study *</label>
                                                <select name="year_of_study" value={form.year_of_study} onChange={handleFormChange} className="form-select" required disabled={!form.regulation_id}>
                                                    <option value="">Select Year</option>
                                                    {Array.from({ length: formTotalYears }, (_, i) => i + 1).map(y => (
                                                        <option key={y} value={y}>Year {y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Semester *</label>
                                                <select name="semester_number" value={form.semester_number} onChange={handleFormChange} className="form-select" required disabled={!form.regulation_id}>
                                                    <option value="">Select Semester</option>
                                                    {Array.from({ length: formTotalSems }, (_, i) => i + 1).map(s => (
                                                        <option key={s} value={s}>Sem {s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="form-group">
                                            <label className="form-label">Subject Name *</label>
                                            <input type="text" name="name" value={form.name} onChange={handleFormChange} className="form-input" placeholder="e.g. Engineering Mathematics" required />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Subject Code</label>
                                                <input type="text" name="code" value={form.code} onChange={handleFormChange} className="form-input" placeholder="e.g. CS101" />
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Type *</label>
                                                <select name="subject_type" value={form.subject_type} onChange={handleFormChange} className="form-select" required>
                                                    <option value="theory">Theory</option>
                                                    <option value="lab">Laboratory</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Credits</label>
                                                <input type="number" step="0.5" name="credits" value={form.credits} onChange={handleFormChange} className="form-input" />
                                            </div>
                                            {form.subject_type === 'theory' ? (
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label className="form-label">Units</label>
                                                    <input type="number" name="units" value={form.units} onChange={handleFormChange} className="form-input" />
                                                </div>
                                            ) : (
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label className="form-label">Experiments</label>
                                                    <input type="number" name="experiments_count" value={form.experiments_count} onChange={handleFormChange} className="form-input" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-group" style={{ marginTop: '12px' }}>
                                            <label className="form-label">Sub Type *</label>
                                            <select name="sub_type" value={form.sub_type} onChange={handleFormChange} className="form-select" required>
                                                <option value="0">Theory</option>
                                                <option value="1">Laboratory</option>
                                                <option value="2">Dr</option>
                                                <option value="3">Pr</option>
                                                <option value="4">Others</option>
                                                <option value="5">Skill Oriented Course</option>
                                                <option value="6">Integrated</option>
                                                <option value="7">Audit</option>
                                                <option value="8">Mandatory</option>
                                                <option value="9">Community Service Project</option>
                                                <option value="10">Internship</option>
                                                <option value="11">Mini Project</option>
                                                <option value="12">Semester</option>
                                            </select>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Subject Order</label>
                                                <input type="number" name="subject_order" value={form.subject_order} onChange={handleFormChange} className="form-input" />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Short Name</label>
                                                <input type="text" name="short_name" value={form.short_name} onChange={handleFormChange} className="form-input" />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Running Regulation</label>
                                                <select name="is_running_regulation" value={form.is_running_regulation} onChange={handleFormChange} className="form-select">
                                                    <option value="1">Yes</option>
                                                    <option value="0">No</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Common Subject</label>
                                                <select name="is_common_subject" value={form.is_common_subject} onChange={handleFormChange} className="form-select">
                                                    <option value="0">No</option>
                                                    <option value="1">Yes</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Internal Max</label>
                                                <input type="number" name="internal_max_marks" value={form.internal_max_marks} onChange={handleFormChange} className="form-input" />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">External Max</label>
                                                <input type="number" name="external_max_marks" value={form.external_max_marks} onChange={handleFormChange} className="form-input" />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Elective</label>
                                                <select name="is_elective" value={form.is_elective} onChange={handleFormChange} className="form-select">
                                                    <option value="0">No</option>
                                                    <option value="1">Yes</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Is Replacement</label>
                                                <select name="is_replacement" value={form.is_replacement} onChange={handleFormChange} className="form-select">
                                                    <option value="0">No</option>
                                                    <option value="1">Yes</option>
                                                </select>
                                            </div>
                                        </div>

                                        {form.is_elective === "1" && (
                                            <div className="form-group">
                                                <label className="form-label">Elective Name</label>
                                                <input type="text" name="elective_name" value={form.elective_name} onChange={handleFormChange} className="form-input" />
                                            </div>
                                        )}

                                        <div className="form-group">
                                            <label className="form-label">Exam Code</label>
                                            <input type="text" name="exam_code" value={form.exam_code} onChange={handleFormChange} className="form-input" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => modalStep === 1 ? setShowModal(false) : setModalStep(1)}>
                                    {modalStep === 1 ? 'Cancel' : 'Back'}
                                </button>
                                {modalStep === 1 ? (
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => setModalStep(2)}
                                        disabled={!form.regulation_id || !form.year_of_study || !form.semester_number}
                                    >
                                        Next Step
                                    </button>
                                ) : (
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Subject'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Bulk Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title font-display">Bulk Import Subjects</h3>
                            <button type="button" className="modal-close" onClick={() => setShowUploadModal(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="info-alert" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#0369a1' }}>
                                <p><strong>Note:</strong> Subjects will be imported for the currently filtered Regulation, Year, and Semester.</p>
                                <p style={{ marginTop: '8px' }}>
                                    Regulation: <strong>{activeRegulation?.name}</strong><br />
                                    Branch: <strong>{pageBranches.find(b => String(b.id) === String(filter.branch_id))?.name || 'All Branches'}</strong><br />
                                    Year: <strong>{filter.year_of_study || 'N/A'}</strong>, Sem: <strong>{filter.semester_number || 'N/A'}</strong>
                                </p>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Step 1: Download Template</h4>
                                <button className="btn btn-outline w-full" onClick={handleDownloadTemplate}>
                                    Download CSV Template
                                </button>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Step 2: Upload Filled Template</h4>
                                <div style={{ border: '2px dashed #e5e7eb', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                                    <input 
                                        type="file" 
                                        accept=".csv" 
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                        style={{ display: 'none' }}
                                        id="csv-upload"
                                    />
                                    <label htmlFor="csv-upload" style={{ cursor: 'pointer' }}>
                                        <div style={{ color: '#6b7280', marginBottom: '12px' }}>
                                            {selectedFile ? selectedFile.name : 'Click to select or drag CSV file'}
                                        </div>
                                        <div className="btn btn-outline" style={{ display: 'inline-flex' }}>Browse Files</div>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setShowUploadModal(false)}>Cancel</button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleFileUpload} 
                                disabled={uploading || !selectedFile || !filter.regulation_id || !filter.year_of_study || !filter.semester_number}
                            >
                                {uploading ? 'Uploading...' : 'Upload & Process'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Faculty Assignment Modal */}
            {showFacultyModal && selectedFacultySubject && (
                <div className="modal-overlay" onClick={() => setShowFacultyModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title font-display">Manage Faculty</h3>
                                <p className="text-sm text-gray-500 mt-1">{selectedFacultySubject.name} ({selectedFacultySubject.code || 'No Code'})</p>
                            </div>
                            <button type="button" className="modal-close" onClick={() => setShowFacultyModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Assign New Faculty</h4>
                                
                                <form onSubmit={handleEmployeeSearch} className="mb-4 flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search HRMS ID or Name..."
                                            value={employeeSearchQuery}
                                            onChange={e => setEmployeeSearchQuery(e.target.value)}
                                            className="form-input pl-9 text-sm w-full py-2"
                                            style={{ height: '36px' }}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-outline" style={{ height: '36px', padding: '0 12px' }}>
                                        Search
                                    </button>
                                </form>

                                <form onSubmit={handleAssignFaculty} className="flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        <div className="flex-[1]">
                                            <label className="block text-xs text-gray-500 mb-1">Batch (Optional)</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 2022" 
                                                value={assignmentBatch}
                                                onChange={handleBatchChangeForFaculty}
                                                className="form-input text-sm py-1.5"
                                            />
                                        </div>
                                        <div className="flex-[2]">
                                            <label className="block text-xs text-gray-500 mb-1">Select HRMS Employee *</label>
                                            <select 
                                                value={assignmentEmployeeId}
                                                onChange={e => setAssignmentEmployeeId(e.target.value)}
                                                className="form-select text-sm py-1.5"
                                                required
                                                disabled={hrmsEmployees.length === 0}
                                            >
                                                <option value="">-- {hrmsEmployees.length === 0 ? "No employees found" : "Choose Employee"} --</option>
                                                {hrmsEmployees.map(emp => (
                                                    <option key={emp._id} value={emp._id}>
                                                        {emp.employee_name} {emp.emp_no ? `(${emp.emp_no})` : ''} - {emp.department || 'N/A'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary w-full justify-center mt-2" disabled={saving || !assignmentEmployeeId}>
                                        <UserPlus size={16} /> {saving ? 'Assigning...' : 'Assign Faculty'}
                                    </button>
                                </form>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                                    <span>Current Assignments {assignmentBatch ? `(Batch: ${assignmentBatch})` : '(All)'}</span>
                                    <span className="text-xs font-normal text-gray-400">{assignedFaculties.length} total</span>
                                </h4>
                                
                                {facultyLoading ? (
                                    <div className="text-center py-4 text-sm text-gray-400">Loading assignments...</div>
                                ) : assignedFaculties.length === 0 ? (
                                    <div className="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-200 text-sm text-gray-500">
                                        No faculty assigned to this subject/batch yet.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {assignedFaculties.map((assignment) => (
                                            <div key={assignment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors bg-white shadow-sm">
                                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                        {assignment.employee_name ? assignment.employee_name.substring(0, 2).toUpperCase() : 'NA'}
                                                    </div>
                                                    <div>
                                                        <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>
                                                            {assignment.employee_name || 'Unknown Faculty'}
                                                        </h5>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '12px', color: '#6b7280' }}>
                                                            {assignment.emp_no ? <span className="font-mono text-[11px] bg-gray-100 px-1 rounded">{assignment.emp_no}</span> : null}
                                                            <span>•</span>
                                                            <span>{assignment.department || 'No Dept'}</span>
                                                        </div>
                                                        {assignment.batch && (
                                                            <div style={{ marginTop: '6px' }}>
                                                                <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', background: '#eff6ff', color: '#2563eb', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                                                                    Batch: {assignment.batch}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleUnassignFaculty(assignment.id)}
                                                    className="icon-btn danger p-2 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Remove Assignment"
                                                >
                                                    <Trash2 size={16} className="text-red-500" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subjects;
