import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Trash2, Save, Undo, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

const GradeSystem = () => {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchingGrades, setFetchingGrades] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [passPercentage, setPassPercentage] = useState('');

    // New state for context selection
    const [regulations, setRegulations] = useState([]);
    const [batches, setBatches] = useState([]);
    
    const [filter, setFilter] = useState({
        course_id: '',
        regulation_id: '',
        batch: '',
        subject_type: 'Theory' // default
    });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchRegulations();
            setLoading(false);
        };
        init();
        // eslint-disable-next-line
    }, []);

    // Also fetch grades automatically when all 4 filters are selected
    useEffect(() => {
        if (filter.course_id && filter.regulation_id && filter.batch && filter.subject_type) {
            fetchGrades();
        } else {
            setGrades([]);
            setPassPercentage('');
        }
    }, [filter.course_id, filter.regulation_id, filter.batch, filter.subject_type]);

    const fetchRegulations = async () => {
        try {
            const resp = await api.get('/regulations');
            if (resp.data.success) {
                setRegulations(resp.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch regulations', err);
        }
    };

    const fetchBatches = async (regId) => {
        try {
            const resp = await api.get(`/regulations/${regId}/batches`);
            if (resp.data.success) {
                setBatches(resp.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch batches', err);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setStatus({ type: '', message: '' });
        
        setFilter(prev => {
            const next = { ...prev, [name]: value };
            
            // Cascading resets
            if (name === 'course_id') {
                next.regulation_id = '';
                next.batch = '';
                setBatches([]);
            }
            if (name === 'regulation_id') {
                next.batch = '';
                if (value) {
                    // Extract the course_id if user selected regulation first
                    const reg = regulations.find(r => String(r.id) === String(value));
                    if (reg && reg.course_id) {
                        next.course_id = String(reg.course_id);
                    }
                    fetchBatches(value);
                } else {
                    setBatches([]);
                }
            }
            return next;
        });
    };

    const fetchGrades = async () => {
        setFetchingGrades(true);
        setStatus({ type: '', message: '' });
        try {
            const params = new URLSearchParams(filter);
            const resp = await api.get(`/regulations/grades?${params.toString()}`);
            if (resp.data.success) {
                const fetchedData = resp.data.data;
                // Backwards compatibility with endpoints before we added pass_percentage
                if (Array.isArray(fetchedData)) {
                    setGrades(fetchedData);
                    setPassPercentage('');
                } else {
                    setGrades(fetchedData.grades || []);
                    setPassPercentage(fetchedData.pass_percentage || '');
                }
            }
        } catch (err) {
            console.error('Failed to fetch grades', err);
            setStatus({ type: 'error', message: 'Failed to load grading system' });
        } finally {
            setFetchingGrades(false);
        }
    };

    const addGradeRow = () => {
        setGrades([...grades, { grade_name: '', min_percentage: '', points: '' }]);
    };

    const removeGradeRow = (index) => {
        setGrades(grades.filter((_, i) => i !== index));
    };

    const updateGradeField = (index, field, value) => {
        const newGrades = [...grades];
        newGrades[index][field] = value;
        setGrades(newGrades);
    };

    const handleSave = async () => {
        // Validation
        if (!filter.course_id || !filter.regulation_id || !filter.batch || !filter.subject_type) {
            setStatus({ type: 'error', message: 'Please select Course, Regulation, Batch, and Subject Type before saving.' });
            return;
        }

        const isValid = grades.every(g => g.grade_name && g.min_percentage !== '');
        if (!isValid) {
            setStatus({ type: 'error', message: 'Please fill in all Grade Name and Min % fields' });
            return;
        }

        if (passPercentage === '') {
            setStatus({ type: 'error', message: 'Please set the Minimum Pass Percentage for this scope.' });
            return;
        }

        setSaving(true);
        setStatus({ type: '', message: '' });
        try {
            const payload = {
                ...filter,
                grades,
                pass_percentage: passPercentage
            };
            const resp = await api.post('/regulations/grades', payload);
            if (resp.data.success) {
                setStatus({ type: 'success', message: 'Grading scheme saved successfully!' });
                fetchGrades();
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to save grading system' });
        } finally {
            setSaving(false);
        }
    };

    // Derived unique courses from loaded regulations
    const uniqueCourses = [...new Map(regulations.map(item => [item.course_id, { id: item.course_id, name: item.course_name }])).values()].filter(c => c.id);
    const visibleRegulations = filter.course_id 
        ? regulations.filter(r => String(r.course_id) === String(filter.course_id))
        : regulations;

    if (loading) return (
        <div className="h-screen flex items-center justify-center">
             <div className="w-12 h-12 border-4 border-primary-900/10 border-t-primary-900 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="w-full h-full p-6 md:p-8 mx-auto anim-fade-in flex flex-col items-start justify-start text-left">
            <div className="flex flex-row items-center justify-between gap-6 mb-8 w-full">
                <div className="text-left w-full">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight text-left">Grade System Mapping</h1>
                    <p className="text-gray-500 mt-1 font-medium text-left">Define specific grading schemes for combinations of course, regulation, batch, and subject type.</p>
                </div>
                
                <div className="flex items-center gap-3 flex-shrink-0">
                    <button 
                        onClick={() => { if(filter.course_id) fetchGrades(); }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm shadow-sm"
                        disabled={loading || saving || !filter.regulation_id}
                    >
                        <Undo size={16} /> Refresh
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-900 text-accent-500 rounded-xl hover:bg-black transition-all font-bold text-sm shadow-lg shadow-black/10"
                        disabled={loading || saving || !filter.regulation_id || !filter.batch}
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin"></div>
                        ) : <Save size={16} />} 
                        {saving ? 'Saving...' : 'Save Scheme'}
                    </button>
                </div>
            </div>

            <div className="flex flex-row items-stretch gap-8 w-full flex-1 min-h-0">
                {/* Left Column: Context Selectors */}
                <div className="w-[320px] flex-shrink-0">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col text-left">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4 text-left">Select Context Scope</h3>
                        <div className="flex flex-col gap-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">Regulation</label>
                                <select 
                                    name="regulation_id" 
                                    value={filter.regulation_id} 
                                    onChange={handleFilterChange}
                                    className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-semibold"
                                    disabled={!filter.course_id && visibleRegulations.length === 0}
                                >
                                    <option value="">Select Regulation</option>
                                    {visibleRegulations.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.college_name})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">Course</label>
                                <select 
                                    name="course_id" 
                                    value={filter.course_id} 
                                    onChange={handleFilterChange}
                                    className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-semibold"
                                >
                                    <option value="">All Courses</option>
                                    {uniqueCourses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">Batch</label>
                                <select 
                                    name="batch" 
                                    value={filter.batch} 
                                    onChange={handleFilterChange}
                                    className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-semibold"
                                    disabled={!filter.regulation_id || batches.length === 0}
                                >
                                    <option value="">Select Batch</option>
                                    {batches.map(b => (
                                        <option key={b.id || b.batch} value={b.batch}>{b.batch}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">Subject Type</label>
                                <select 
                                    name="subject_type" 
                                    value={filter.subject_type} 
                                    onChange={handleFilterChange}
                                    className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-semibold"
                                >
                                    <option value="Theory">Theory</option>
                                    <option value="Laboratory">Laboratory</option>
                                    <option value="Dr">Dr</option>
                                    <option value="Pr">Pr</option>
                                    <option value="Others">Others</option>
                                    <option value="Skill Oriented Course">Skill Oriented Course</option>
                                    <option value="Integrated">Integrated</option>
                                    <option value="Audit">Audit</option>
                                    <option value="Mandatory">Mandatory</option>
                                    <option value="Community Service Project">Community Service Project</option>
                                    <option value="Internship">Internship</option>
                                    <option value="Mini Project">Mini Project</option>
                                    <option value="Semester">Semester</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Grade Table */}
                <div className="flex-1 min-w-0 flex flex-col">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex-1 flex flex-col">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-accent-100 text-accent-700 rounded-xl">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Configure Thresholds</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Any marks greater than or equal to the Min % threshold get this grade.</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={addGradeRow}
                                disabled={!filter.course_id || !filter.regulation_id || !filter.batch}
                                className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-all shadow-sm ${(!filter.regulation_id || !filter.batch) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-primary-900 bg-accent-500 hover:bg-accent-600'}`}
                            >
                                <Plus size={16} /> Add Grade
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {status.message && (
                                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 anim-fade-in ${
                                    status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    <span className="text-sm font-semibold">{status.message}</span>
                                </div>
                            )}

                            {!filter.course_id || !filter.regulation_id || !filter.batch ? (
                                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center px-10">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5">
                                        <BookOpen className="text-gray-300" size={36} />
                                    </div>
                                    <h3 className="text-gray-900 font-bold text-lg mb-2">Context Required</h3>
                                    <p className="text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">Grades are mapped to specific contexts natively. Please configure the scope on the left by selecting the Regulation, Course, Batch, and Subject Type to view or edit the grades.</p>
                                </div>
                            ) : fetchingGrades ? (
                                <div className="h-full min-h-[300px] flex items-center justify-center">
                                    <div className="w-10 h-10 border-4 border-primary-900/10 border-t-primary-900 rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {/* Pass Percentage Block */}
                                    <div className="flex items-center gap-4 bg-primary-50/50 p-5 rounded-2xl border border-primary-100/50">
                                        <div className="flex flex-col">
                                            <label className="text-xs font-black text-primary-900 uppercase tracking-widest mb-1">Pass Percentage</label>
                                            <p className="text-[11px] text-primary-600/80 font-bold">Minimum percentage required to pass this subject type.</p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-2">
                                            <span className="text-sm font-bold text-primary-400 bg-white w-10 h-10 flex items-center justify-center rounded-xl border border-primary-100 shadow-sm">≥</span>
                                            <input 
                                                type="number"
                                                value={passPercentage}
                                                onChange={(e) => setPassPercentage(e.target.value)}
                                                placeholder="40"
                                                className="w-24 h-10 px-4 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold shadow-sm text-primary-900"
                                            />
                                        </div>
                                    </div>

                                    {grades.length === 0 ? (
                                        <div className="h-48 flex flex-col items-center justify-center text-center px-10 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                                            <h3 className="text-gray-900 font-bold text-sm mb-2">No Grades Defined</h3>
                                            <p className="text-gray-400 text-xs max-w-sm mb-4 leading-relaxed">You haven't added any specific grade thresholds.</p>
                                            <button onClick={addGradeRow} className="text-accent-700 font-bold text-xs bg-accent-50 px-6 py-2 rounded-lg hover:bg-accent-100 transition-colors">Add Grade Threshold</button>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr>
                                                        <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest pb-5 px-3">Grade Name</th>
                                                        <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest pb-5 px-3">Min Threshold %</th>
                                                        <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest pb-5 px-3">Grade Points</th>
                                                        <th className="w-16 pb-5"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50/80">
                                                    {grades.map((row, idx) => (
                                                        <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                                            <td className="py-4 px-3">
                                                                <input 
                                                                    type="text" 
                                                                    value={row.grade_name} 
                                                                    onChange={(e) => updateGradeField(idx, 'grade_name', e.target.value)}
                                                                    placeholder="e.g. A+"
                                                                    className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold shadow-sm"
                                                                />
                                                            </td>
                                                            <td className="py-4 px-3">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-sm font-bold text-gray-400 bg-gray-50/50 w-8 h-11 flex items-center justify-center rounded-lg border border-transparent">≥</span>
                                                                    <input 
                                                                        type="number" 
                                                                        value={row.min_percentage} 
                                                                        onChange={(e) => updateGradeField(idx, 'min_percentage', e.target.value)}
                                                                        placeholder="90"
                                                                        className="w-28 h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-semibold shadow-sm"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-3">
                                                                <input 
                                                                    type="number" 
                                                                    step="0.1"
                                                                    value={row.points} 
                                                                    onChange={(e) => updateGradeField(idx, 'points', e.target.value)}
                                                                    placeholder="10.0"
                                                                    className="w-28 h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-semibold text-primary-600 shadow-sm"
                                                                />
                                                            </td>
                                                            <td className="py-4 px-3 text-right">
                                                                <button 
                                                                    onClick={() => removeGradeRow(idx)}
                                                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .anim-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e5e7eb;
                    border-radius: 10px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default GradeSystem;
