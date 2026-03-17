import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Trash2, Save, Undo, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

const GradeSystem = () => {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchingGrades, setFetchingGrades] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchGrades();
            setLoading(false);
        };
        init();
    }, []);

    const fetchGrades = async () => {
        setFetchingGrades(true);
        setStatus({ type: '', message: '' });
        try {
            const resp = await api.get('/regulations/grades-global');
            if (resp.data.success) {
                setGrades(resp.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch grades', err);
            setStatus({ type: 'error', message: 'Failed to load grading system' });
        } finally {
            setFetchingGrades(false);
        }
    };

    const addGradeRow = () => {
        setGrades([...grades, { grade_name: '', min_percentage: '', max_percentage: '', points: '' }]);
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
        // Simple validation
        const isValid = grades.every(g => g.grade_name && g.min_percentage !== '' && g.max_percentage !== '');
        if (!isValid) {
            setStatus({ type: 'error', message: 'Please fill in all Grade, Min %, and Max % fields' });
            return;
        }

        setSaving(true);
        setStatus({ type: '', message: '' });
        try {
            const resp = await api.post('/regulations/grades-global', { grades });
            if (resp.data.success) {
                setStatus({ type: 'success', message: 'Global grading system saved successfully!' });
                fetchGrades();
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to save grading system' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center">
             <div className="w-12 h-12 border-4 border-primary-900/10 border-t-primary-900 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto anim-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Institutional Grade System</h1>
                    <p className="text-gray-500 mt-1 font-medium">Define global percentage ranges and points applicable across all regulations.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchGrades}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm"
                        disabled={loading || saving}
                    >
                        <Undo size={16} /> Reset
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-900 text-accent-500 rounded-xl hover:bg-black transition-all font-bold text-sm shadow-lg shadow-black/10"
                        disabled={loading || saving}
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin"></div>
                        ) : <Save size={16} />} 
                        {saving ? 'Saving...' : 'Save Grading Scheme'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Main: Grade Table */}
                <div className="w-full">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-accent-100 text-accent-700 rounded-xl">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Grading Scheme Configuration</h2>
                                    <p className="text-xs text-gray-500 font-medium">Standard marks-to-grade mapping for the entire portal</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={addGradeRow}
                                className="flex items-center gap-2 px-4 py-2 text-primary-900 bg-accent-500 rounded-lg hover:bg-accent-600 transition-all font-bold text-xs"
                            >
                                <Plus size={14} /> Add New Range
                            </button>
                        </div>

                        <div className="flex-1 p-8">
                            {status.message && (
                                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 anim-fade-in ${
                                    status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    <span className="text-sm font-semibold">{status.message}</span>
                                </div>
                            )}

                            {fetchingGrades ? (
                                <div className="h-48 flex items-center justify-center">
                                    <div className="loading-spinner w-8 h-8 border-2 border-primary-900/10 border-t-primary-900 rounded-full animate-spin"></div>
                                </div>
                            ) : grades.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-center px-10">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <Plus className="text-gray-300" size={32} />
                                    </div>
                                    <h3 className="text-gray-900 font-bold mb-2">No Grades Defined</h3>
                                    <p className="text-gray-400 text-sm max-w-xs mb-6">Start by adding grade ranges for this curriculum regulation.</p>
                                    <button onClick={addGradeRow} className="text-accent-600 font-bold text-sm bg-accent-50 px-6 py-2 rounded-lg hover:bg-accent-100 transition-colors">Add First Grade</button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-4 px-2">Grade Name</th>
                                                <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-4 px-2">Min %</th>
                                                <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-4 px-2">Max %</th>
                                                <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-4 px-2">Grade Points</th>
                                                <th className="w-12 pb-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {grades.map((row, idx) => (
                                                <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-2">
                                                        <input 
                                                            type="text" 
                                                            value={row.grade_name} 
                                                            onChange={(e) => updateGradeField(idx, 'grade_name', e.target.value)}
                                                            placeholder="e.g. A+"
                                                            className="w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-2">
                                                        <input 
                                                            type="number" 
                                                            value={row.min_percentage} 
                                                            onChange={(e) => updateGradeField(idx, 'min_percentage', e.target.value)}
                                                            placeholder="0"
                                                            className="w-24 h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-semibold"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-2">
                                                        <input 
                                                            type="number" 
                                                            value={row.max_percentage} 
                                                            onChange={(e) => updateGradeField(idx, 'max_percentage', e.target.value)}
                                                            placeholder="100"
                                                            className="w-24 h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-semibold"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-2">
                                                        <input 
                                                            type="number" 
                                                            step="0.1"
                                                            value={row.points} 
                                                            onChange={(e) => updateGradeField(idx, 'points', e.target.value)}
                                                            placeholder="0.0"
                                                            className="w-24 h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-semibold text-primary-600"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-2">
                                                        <button 
                                                            onClick={() => removeGradeRow(idx)}
                                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
                        
                        <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-50">
                             <div className="flex items-center gap-2 text-red-400">
                                 <AlertCircle size={14} />
                                 <span className="text-[10px] font-bold uppercase tracking-wider">Ranges should be non-overlapping for accurate results</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .anim-fade-in {
                    animation: fadeIn 0.5s ease-out;
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
