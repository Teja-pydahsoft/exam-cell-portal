import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Trash2, Edit2, Settings, Info, Save, X, Type, List, Hash, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentFieldSettings = () => {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [editId, setEditId] = useState(null);
    
    const [newField, setNewField] = useState({
        label: '',
        type: 'text',
        category: 'General',
        options: ''
    });

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
        try {
            setLoading(true);
            const res = await api.get('/exam-cell/fields');
            if (res.data.success) {
                setFields(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch fields:", error);
            toast.error("Failed to load field definitions");
        } finally {
            setLoading(false);
        }
    };

    const handleAddField = async (e) => {
        e.preventDefault();
        if (!newField.label || !newField.type) {
            toast.error("Label and Type are required");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                label: newField.label,
                type: newField.type,
                category: newField.category,
                options: (newField.type === 'select' || newField.type === 'checkbox') ? newField.options.split(',').map(o => o.trim()) : null
            };

            let res;
            if (editId) {
                res = await api.put(`/exam-cell/fields/${editId}`, payload);
            } else {
                res = await api.post('/exam-cell/fields', payload);
            }
            
            if (res.data.success) {
                toast.success(editId ? "Field updated successfully" : "Field added successfully");
                closeForm();
                fetchFields();
            }
        } catch (error) {
            console.error("Failed to save field:", error);
            toast.error(error.response?.data?.message || "Failed to save field");
        } finally {
            setSaving(false);
        }
    };

    const handleEditClick = (field) => {
        let opts = '';
        if (field.field_options) {
            try {
                const parsed = JSON.parse(field.field_options);
                opts = Array.isArray(parsed) ? parsed.join(', ') : field.field_options;
            } catch (e) {
                opts = field.field_options;
            }
        }

        setNewField({
            label: field.field_label,
            type: field.field_type,
            category: field.field_category || 'General',
            options: opts
        });
        setEditId(field.id);
        setShowAddForm(true);
    };

    const closeForm = () => {
        setShowAddForm(false);
        setShowCategoryDropdown(false);
        setEditId(null);
        setNewField({ label: '', type: 'text', category: 'General', options: '' });
    };

    const handleDeleteField = async (id) => {
        if (!window.confirm("Are you sure you want to delete this field? This might affect existing student data.")) return;

        try {
            const res = await api.delete(`/exam-cell/fields/${id}`);
            if (res.data.success) {
                toast.success("Field deleted successfully");
                fetchFields();
            }
        } catch (error) {
            console.error("Failed to delete field:", error);
            toast.error("Failed to delete field");
        }
    };

    const getFieldIcon = (type) => {
        switch (type) {
            case 'text': return <Type size={18} />;
            case 'number': return <Hash size={18} />;
            case 'select': return <List size={18} />;
            case 'date': return <Calendar size={18} />;
            default: return <Info size={18} />;
        }
    };

    const getUniqueCategories = () => {
        const baseCategories = [
            'General', 
            'Personal Info', 
            'Academic Details', 
            'Previous Education', 
            'Certificates',
            'Administrative'
        ];
        
        const dbCategories = fields.map(f => f.field_category).filter(Boolean).map(c => 
            // Title case to match standard
            c.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
        );
        
        return Array.from(new Set([...baseCategories, ...dbCategories]));
    };

    return (
        <div className="p-2 anim-fade-in">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-900" style={{ fontFamily: 'Times New Roman' }}>Student Field Settings</h1>
                    <p className="text-gray-500 mt-1">Manage customizable fields for student records.</p>
                </div>
                {!showAddForm && (
                    <button 
                        onClick={() => setShowAddForm(true)}
                        className="btn btn-primary shadow-lg"
                    >
                        <Plus size={18} /> Add Custom Field
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden anim-slide-up">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                            <h2 className="text-xl font-bold text-gray-900 m-0" style={{ fontFamily: 'Times New Roman' }}>
                                {editId ? 'Edit Field Definition' : 'New Field Definition'}
                            </h2>
                            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddField} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label font-bold text-gray-700">Field Label</label>
                                <input 
                                    type="text" 
                                    className="form-input px-4 py-3" 
                                    placeholder="e.g. Scholarship ID" 
                                    value={newField.label}
                                    onChange={e => setNewField({...newField, label: e.target.value})}
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-2">The name visible in the UI for this field.</p>
                            </div>
                            <div className="form-group">
                                <label className="form-label font-bold text-gray-700">Data Type</label>
                                <select 
                                    className="form-input px-4 py-3 bg-white" 
                                    value={newField.type}
                                    onChange={e => setNewField({...newField, type: e.target.value})}
                                >
                                    <option value="text">Text Input</option>
                                    <option value="number">Number Input</option>
                                    <option value="date">Date Picker</option>
                                    <option value="select">Dropdown Menu</option>
                                    <option value="textarea">Long Text (Textarea)</option>
                                </select>
                                <p className="text-xs text-gray-400 mt-2">Defines how the user enters data for this field.</p>
                            </div>
                            <div className="form-group relative">
                                <label className="form-label font-bold text-gray-700">Field Category</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="form-input px-4 py-3 bg-white pr-10" 
                                        placeholder="e.g. Personal, Academic" 
                                        value={newField.category}
                                        onChange={e => {
                                            setNewField({...newField, category: e.target.value});
                                            setShowCategoryDropdown(true);
                                        }}
                                        onFocus={() => setShowCategoryDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </button>
                                </div>
                                {showCategoryDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-48 overflow-y-auto">
                                        {getUniqueCategories()
                                            .filter(cat => cat.toLowerCase().includes((newField.category || '').toLowerCase()))
                                            .map(cat => (
                                            <div 
                                                key={cat} 
                                                className="px-4 py-2 hover:bg-primary-50 cursor-pointer text-sm text-gray-700 font-medium"
                                                onClick={() => {
                                                    setNewField({...newField, category: cat});
                                                    setShowCategoryDropdown(false);
                                                }}
                                            >
                                                {cat}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 mt-2">Used to group fields in the student profile.</p>
                            </div>
                        </div>

                        {newField.type === 'select' && (
                            <div className="form-group mt-4 anim-fade-in">
                                <label className="form-label font-bold text-gray-700">Dropdown Options</label>
                                <textarea 
                                    className="form-input px-4 py-3 h-24" 
                                    placeholder="Option 1, Option 2, Option 3"
                                    value={newField.options}
                                    onChange={e => setNewField({...newField, options: e.target.value})}
                                    required
                                />
                                <p className="text-xs text-info-600 mt-2 flex items-center gap-1">
                                    <Info size={14} /> Enter options separated by commas.
                                </p>
                            </div>
                        )}

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                                <button 
                                    type="button" 
                                    onClick={closeForm} 
                                    className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary px-8 shadow-md"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : <><Save size={18} /> {editId ? 'Update Definition' : 'Save Definition'}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-3 py-2 border-b text-[10px]">Category</th>
                                <th className="px-3 py-2 border-b text-[10px]">Label</th>
                                <th className="px-3 py-2 border-b text-[10px]">Type</th>
                                <th className="px-3 py-2 border-b text-[10px]">Options</th>
                                <th className="px-3 py-2 border-b text-right text-[10px]">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1,2,3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-3 py-6 border-b border-gray-50">
                                            <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : fields.length > 0 ? (
                                fields.map(field => (
                                    <tr key={field.id} className="border-b border-gray-100 last:border-b-0 hover:bg-primary-50/30 transition-colors">
                                        <td className="px-3 py-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary-900">
                                                {field.field_category || 'General'}
                                            </span>
                                        </td>
                                                <td className="px-3 py-2 font-bold text-gray-900 text-xs">{field.field_label}</td>
                                                <td className="px-3 py-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                                                        {field.field_type}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    {field.field_type === 'select' && field.field_options ? (
                                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                                            {(() => {
                                                                try {
                                                                    const opts = JSON.parse(field.field_options);
                                                                    return Array.isArray(opts) ? opts.map((opt, i) => (
                                                                        <span key={i} className="text-[9px] text-accent-600 bg-accent-50 px-1.5 py-0.5 rounded border border-accent-100">
                                                                            {opt}
                                                                        </span>
                                                                    )) : <span className="text-gray-400 text-[10px] italic">Invalid options</span>;
                                                                } catch (e) {
                                                                    return <span className="text-gray-400 text-[10px] italic">Raw: {field.field_options}</span>;
                                                                }
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-[10px] italic">No extra options</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button 
                                                            onClick={() => handleEditClick(field)}
                                                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                            title="Edit Field"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteField(field.id)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Delete Field"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-24 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Settings size={28} className="text-gray-300 animate-spin-slow" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">No Custom Fields</h3>
                                        <p className="text-gray-500 max-w-xs mx-auto mt-2">Add fields to capture specialized student data.</p>
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

export default StudentFieldSettings;
