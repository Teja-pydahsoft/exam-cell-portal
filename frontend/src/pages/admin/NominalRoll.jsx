import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import { Search, Filter, Printer, Download, Users, User, FileText, ChevronRight, GraduationCap, FileDown, FileSpreadsheet, FileBox } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, AlignmentType, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const NominalRoll = () => {
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
            console.error("Fetch nominal roll error:", error);
            toast.error('Failed to fetch nominal roll data');
        } finally {
            setLoading(false);
        }
    };

    const genderStats = useMemo(() => {
        const male = students.filter(s => s.gender?.toLowerCase() === 'male' || s.gender?.toLowerCase() === 'm').length;
        const female = students.filter(s => s.gender?.toLowerCase() === 'female' || s.gender?.toLowerCase() === 'f').length;
        return { male, female, total: students.length };
    }, [students]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        if (students.length === 0) {
            toast.error("No data to export");
            return;
        }

        const data = students.map((s, i) => ({
            "S.No": i + 1,
            "Hall Ticket": s.rollNo,
            "Admission No": s.admission_no || s.admission_number || '-',
            "Student Name": s.name,
            "Father Name": s.fatherName || '-',
            "Gender": s.gender || '-',
            "DOB": s.dob || '-',
            "Parent Mobile": s.parent_mobile1 || '-',
            "Admission Date": s.admission_date || '-',
            "Caste": s.caste || '-',
            "Category": s.scholar_status || s.caste || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Nominal Roll");
        XLSX.writeFile(wb, `Nominal_Roll_${filters.batch || 'Export'}.xlsx`);
    };

    const handleExportWord = async () => {
        if (students.length === 0) {
            toast.error("No data to export");
            return;
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: { orientation: "landscape" }
                    }
                },
                children: [
                    new Paragraph({
                        text: "NOMINAL ROLL REPORT",
                        heading: "Heading1",
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Batch: ${filters.batch || 'All'}`, bold: true }),
                            new TextRun({ text: ` | Year: ${filters.year || 'All'} | Sem: ${filters.sem || 'All'}`, bold: true }),
                        ],
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({ text: "" }),
                    new DocxTable({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new DocxTableRow({
                                children: [
                                    "S.No", "Hall Ticket", "Adm. No", "Name", "Father Name", "Gender", "DOB", "Mobile", "Adm. Date", "Caste", "Category"
                                ].map(text => new DocxTableCell({
                                    children: [new Paragraph({ text, bold: true, size: 18 })],
                                    shading: { fill: "f3f4f6" }
                                }))
                            }),
                            ...students.map((s, i) => new DocxTableRow({
                                children: [
                                    String(i + 1), 
                                    s.rollNo || '-', 
                                    s.admission_no || s.admission_number || '-', 
                                    s.name || '-', 
                                    s.fatherName || '-', 
                                    s.gender || '-', 
                                    s.dob || '-', 
                                    s.parent_mobile1 || '-', 
                                    s.admission_date || '-', 
                                    s.caste || '-', 
                                    s.scholar_status || s.caste || '-'
                                ].map(text => new DocxTableCell({
                                    children: [new Paragraph({ text: String(text || '-'), size: 16 })]
                                }))
                            }))
                        ]
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Nominal_Roll_${filters.batch || 'Export'}.docx`);
    };

    const handleExportPDF = () => {
        if (students.length === 0) {
            toast.error("No data to export");
            return;
        }

        const doc = new jsPDF('landscape');
        doc.text("NOMINAL ROLL REPORT", 14, 15);
        doc.setFontSize(10);
        doc.text(`Batch: ${filters.batch || 'All'} | Year: ${filters.year || 'All'} | Sem: ${filters.sem || 'All'}`, 14, 22);

        const tableColumn = ["S.No", "Hall Ticket", "Adm. No", "Name", "Father Name", "Gender", "DOB", "Mobile", "Adm. Date", "Caste", "Category"];
        const tableRows = students.map((s, i) => [
            i + 1,
            s.rollNo || '-',
            s.admission_no || s.admission_number || '-',
            s.name || '-',
            s.fatherName || '-',
            s.gender || '-',
            s.dob || '-',
            s.parent_mobile1 || '-',
            s.admission_date || '-',
            s.caste || '-',
            s.scholar_status || s.caste || '-'
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [48, 65, 81], textColor: [255, 255, 255] }
        });

        doc.save(`Nominal_Roll_${filters.batch || 'Export'}.pdf`);
    };

    return (
        <div className="nominal-roll-page p-2 anim-fade-in print:p-0">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .print-header { display: block !important; margin-bottom: 20px; text-align: center; }
                    table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #000 !important; font-size: 10px !important; }
                    th, td { border: 1px solid #000 !important; padding: 4px !important; }
                    .main-content { padding: 0 !important; margin: 0 !important; }
                }
                .print-header { display: none; }
            `}</style>

            <div className="flex justify-between items-end mb-4 no-print gap-6">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-primary-900" style={{ fontFamily: 'Times New Roman' }}>Nominal Roll</h1>
                    <p className="text-[11px] text-gray-500 mt-0.5">Generate and view student nominal roll reports.</p>
                </div>
                
                {/* Side Aligned Stats */}
                <div className="flex gap-4 items-center bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 border-r border-gray-100 pr-4">
                        <Users size={16} className="text-blue-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-gray-400 leading-none mb-0.5">Total</span>
                            <span className="text-sm font-black text-gray-900 leading-none">{genderStats.total}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 border-r border-gray-100 pr-4">
                        <User size={16} className="text-indigo-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-gray-400 leading-none mb-0.5">Male</span>
                            <span className="text-sm font-black text-indigo-700 leading-none">{genderStats.male}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                        <User size={16} className="text-pink-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-gray-400 leading-none mb-0.5">Female</span>
                            <span className="text-sm font-black text-pink-700 leading-none">{genderStats.female}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2 py-1.5 px-3 text-[10px] border-green-100 hover:border-green-200 text-green-700 bg-green-50/30">
                        <FileSpreadsheet size={14} /> Excel
                    </button>
                    <button onClick={handleExportWord} className="btn-secondary flex items-center gap-2 py-1.5 px-3 text-[10px] border-blue-100 hover:border-blue-200 text-blue-700 bg-blue-50/30">
                        <FileBox size={14} /> Word
                    </button>
                    <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2 py-1.5 px-3 text-[10px] border-red-100 hover:border-red-200 text-red-700 bg-red-50/30">
                        <FileDown size={14} /> PDF
                    </button>
                    <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 py-1.5 px-3 text-[10px] border-gray-100 hover:border-gray-200 text-gray-700">
                        <Printer size={14} /> Print
                    </button>
                </div>
            </div>

            {/* Filters Section - Single Compact Row */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4 no-print">
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

            {/* Print Header */}
            <div className="print-header">
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>NOMINAL ROLL REPORT</h1>
                <p>Batch: {filters.batch} | Year: {filters.year || 'All'} | Sem: {filters.sem || 'All'}</p>
                <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                    Total Students: {genderStats.total} (Male: {genderStats.male}, Female: {genderStats.female})
                </div>
            </div>



            {/* Nominal Roll Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] whitespace-nowrap">
                        <thead className="bg-[#f8fafc] text-[#64748b] uppercase text-[9px] font-black tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="px-3 py-2">S.No</th>
                                <th className="px-3 py-2">Hall Ticket</th>
                                <th className="px-3 py-2">Adm. No</th>
                                <th className="px-3 py-2">Student Name</th>
                                <th className="px-3 py-2">Father Name</th>
                                <th className="px-3 py-2">Gender</th>
                                <th className="px-3 py-2">DOB</th>
                                <th className="px-3 py-2">Parent Mobile</th>
                                <th className="px-3 py-2">Adm. Date</th>
                                <th className="px-3 py-2">Caste</th>
                                <th className="px-3 py-2">Category</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="11" className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-[2px] border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                                            <p className="text-[11px] text-gray-500 font-medium">Fetching nominal roll data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : students.length > 0 ? (
                                students.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                                        <td className="px-3 py-2 text-gray-400 font-medium">{index + 1}</td>
                                        <td className="px-3 py-2 font-bold text-gray-900 border-l border-gray-50">{student.rollNo}</td>
                                        <td className="px-3 py-2 text-gray-600">{student.admission_no || student.admission_number || '-'}</td>
                                        <td className="px-3 py-2">
                                            <span className="font-bold text-gray-900 capitalize italic" style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}>{student.name?.toLowerCase()}</span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 capitalize italic" style={{ fontFamily: 'Times New Roman' }}>{student.fatherName?.toLowerCase() || '-'}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                student.gender?.toLowerCase() === 'female' || student.gender?.toLowerCase() === 'f'
                                                ? 'bg-pink-50 text-pink-700'
                                                : 'bg-blue-50 text-blue-700'
                                            }`}>
                                                {student.gender || '-'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">{student.dob || '-'}</td>
                                        <td className="px-3 py-2 text-gray-600">{student.parent_mobile1 || '-'}</td>
                                        <td className="px-3 py-2 text-gray-600">{student.admission_date || '-'}</td>
                                        <td className="px-3 py-2">
                                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                                                {student.caste || '-'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">{student.scholar_status || student.caste || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="11" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                                <GraduationCap size={48} />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-bold text-lg">No students to display</p>
                                                <p className="text-gray-500 text-sm">Please select filters and click Apply to generate the nominal roll.</p>
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

export default NominalRoll;
