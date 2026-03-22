import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import {
    CalendarCheck, Clock, CheckCircle2, Users, TrendingUp,
    BarChart3, Plus, Pencil, XCircle, Search, Download,
    Clock3, FileText, Megaphone, Brain, GraduationCap, Apple,
    Video, ExternalLink, Image as ImageIcon, CalendarDays, Trash2,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../../context/AuthContext";
import { useStore } from "../../../context/StoreContext";
import { AppShell } from "../../components/layout/AppShell";
import { Btn, StatCard, Avatar, StatusBadge, Modal, inputCls } from "../../components/ui";
import { DEPT_CONFIG } from "../../../constants";
import { PIE_COLORS } from "../../../data/mockData";
import { useActionModal } from "../../hooks";
import type { Appointment, Specialist } from "../../../types";

// ─── Download chart via SVG serialisation (no html2canvas, no oklch issues) ───
async function downloadChartAsImage(
    ref: React.RefObject<HTMLDivElement | null>,
    filename: string
) {
    if (!ref.current) { toast.error("No hay datos para esta gráfica"); return; }

    const svgEl = ref.current.querySelector("svg");
    if (!svgEl) { toast.error("No se encontró la gráfica"); return; }

    try {
        // Clone and inline computed styles so colours render correctly
        const clone = svgEl.cloneNode(true) as SVGElement;
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

        // Replace any oklch colors with safe hex equivalents inside the clone
        const allEls = clone.querySelectorAll("*");
        allEls.forEach(el => {
            const htmlEl = el as HTMLElement;
            ["fill", "stroke", "color"].forEach(attr => {
                const val = htmlEl.getAttribute(attr);
                if (val && val.includes("oklch")) htmlEl.setAttribute(attr, "#64748b");
            });
        });

        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(clone);
        const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        // Draw SVG onto canvas then export PNG
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const scale = 2; // retina
            canvas.width = svgEl.clientWidth * scale;
            canvas.height = svgEl.clientHeight * scale;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            const link = document.createElement("a");
            link.download = `${filename.replace(/\s+/g, "_").toLowerCase()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            toast.success("Gráfica descargada");
        };
        img.onerror = () => { URL.revokeObjectURL(url); toast.error("Error al exportar la gráfica"); };
        img.src = url;
    } catch {
        toast.error("Error al exportar la gráfica");
    }
}

// ─── PDF report (pure jsPDF + autoTable, no canvas capture) ──────────────────
function generatePDFReport(deptReport: string, allAppts: Appointment[]) {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString("es-MX");

    const drawHeader = (title: string) => {
        doc.setFontSize(22); doc.setTextColor(30, 41, 59);
        doc.text("Sistema de Gestión de Citas", 105, 15, { align: "center" });
        doc.setFontSize(14);
        doc.text(title, 105, 23, { align: "center" });
        doc.setFontSize(10); doc.setTextColor(100, 116, 139);
        doc.text(`Fecha de generación: ${today}`, 105, 29, { align: "center" });
        doc.setDrawColor(226, 232, 240);
        doc.line(20, 35, 190, 35);
    };

    const getDeptStats = (list: Appointment[]) => {
        const motivosMap: Record<string, number> = {};
        const modalidadMap: Record<string, number> = { Presencial: 0, Virtual: 0 };
        list.forEach(a => {
            const m = a.motivo || "Consulta General";
            motivosMap[m] = (motivosMap[m] || 0) + 1;
            if (a.modality === "Virtual") modalidadMap.Virtual++; else modalidadMap.Presencial++;
        });
        return {
            total: list.length,
            confirmadas: list.filter(a => a.status === "Confirmada").length,
            completadas: list.filter(a => a.status === "Completada").length,
            pendientes: list.filter(a => a.status === "Pendiente").length,
            canceladas: list.filter(a => a.status === "Cancelada").length,
            topMotivos: Object.entries(motivosMap).sort(([, a], [, b]) => b - a).slice(0, 5),
            modalidad: Object.entries(modalidadMap),
        };
    };

    const addStatsPage = (dept: string, list: Appointment[], isFirst: boolean, pageTitle?: string) => {
        if (!isFirst) doc.addPage();
        drawHeader(pageTitle ?? `Reporte de Atención — ${dept}`);
        const stats = getDeptStats(list);

        doc.setFontSize(12); doc.setTextColor(30, 41, 59);
        doc.text("Resumen de Actividad", 20, 45);
        autoTable(doc, {
            startY: 50,
            head: [["Métrica", "Cantidad"]],
            body: [
                ["Total de Citas", stats.total],
                ["Confirmadas", stats.confirmadas],
                ["Completadas", stats.completadas],
                ["Pendientes", stats.pendientes],
                ["Canceladas", stats.canceladas],
            ],
            theme: "grid",
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 20, right: 20 },
        });

        const currentY = (doc as any).lastAutoTable.finalY + 15;
        doc.text("Distribución de Motivos y Modalidad", 20, currentY);

        autoTable(doc, {
            startY: currentY + 5,
            head: [["Motivos más frecuentes", "Citas"]],
            body: stats.topMotivos,
            theme: "striped",
            headStyles: { fillColor: [71, 85, 105] },
            margin: { left: 20, right: 105 },
        });
        autoTable(doc, {
            startY: currentY + 5,
            head: [["Modalidad", "Citas"]],
            body: stats.modalidad,
            theme: "striped",
            headStyles: { fillColor: [71, 85, 105] },
            margin: { left: 110, right: 20 },
        });

        doc.setFontSize(10); doc.setTextColor(100, 116, 139);
        doc.text(
            "* Las gráficas están disponibles para descarga en la sección de Estadísticas.",
            20, (doc as any).lastAutoTable.finalY + 15
        );
    };

    if (deptReport === "Reporte Global") {
        const depts = ["Psicología", "Tutorías", "Nutrición"];
        depts.forEach((dept, i) => {
            addStatsPage(dept, allAppts.filter(a => a.department === dept), i === 0);
        });

        // Global summary page
        doc.addPage();
        drawHeader("Resumen Institucional Consolidado");
        doc.setFontSize(12); doc.setTextColor(30, 41, 59);
        doc.text("Estadísticas Globales Comparativas", 20, 45);
        autoTable(doc, {
            startY: 50,
            head: [["Departamento", "Total Citas", "Completadas", "Pendientes"]],
            body: depts.map(d => {
                const dl = allAppts.filter(a => a.department === d);
                return [d, dl.length, dl.filter(a => a.status === "Completada").length, dl.filter(a => a.status === "Pendiente").length];
            }),
            theme: "grid",
            headStyles: { fillColor: [30, 41, 59] },
            margin: { left: 20, right: 20 },
        });
    } else {
        addStatsPage(
            deptReport,
            allAppts.filter(a => a.department === deptReport),
            true,
            `Informe de Atención — ${deptReport}`
        );
    }

    // Detailed breakdown (last page)
    doc.addPage();
    doc.setFontSize(12); doc.setTextColor(30, 41, 59);
    doc.text("Desglose Detallado de Citas", 20, 15);
    const finalList = deptReport === "Reporte Global" ? allAppts : allAppts.filter(a => a.department === deptReport);
    autoTable(doc, {
        startY: 20,
        head: [["Alumno", "Departamento", "Especialista", "Fecha", "Hora", "Estado", "Motivo", "Modalidad"]],
        body: finalList.slice(0, 100).map(a => [
            a.studentName,
            a.department,
            a.specialistName,
            new Date(a.date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }),
            a.time,
            a.status,
            a.motivo || "—",
            a.modality || "—",
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [30, 41, 59], fontSize: 7 },
        margin: { left: 10, right: 10 },
        columnStyles: {
            0: { cellWidth: 30 },
            2: { cellWidth: 30 },
            6: { cellWidth: 35 },
        },
    });
    if (finalList.length > 100) {
        doc.setFontSize(8);
        doc.text(`* Mostrando los primeros 100 registros de ${finalList.length} totales.`, 20, (doc as any).lastAutoTable.finalY + 10);
    }

    doc.save(`reporte_${deptReport.replace(/\s+/g, "_").toLowerCase()}.pdf`);
    toast.success("Reporte generado con éxito.");
}

// ─── Component ───────────────────────────────────────────
export function AdminDashboard() {
    const { user } = useAuth();
    const {
        getAppointments, updateAppointmentStatus, getStats,
        specialists, addSpecialist, updateSpecialist, removeSpecialist,
        events, addEvent, deleteEvent, resources, addResource, deleteResource, users, deleteUser,
    } = useStore();

    const [activeTab, setActiveTab] = useState("citas");
    const [deptFilter, setDeptFilter] = useState("Todos");
    const [statusFilter, setStatusFilter] = useState("Todos");
    const [searchTerm, setSearchTerm] = useState("");
    const [statsView, setStatsView] = useState("Global");

    const action = useActionModal();

    // Specialist form
    const [newName, setNewName] = useState("");
    const [newDept, setNewDept] = useState("Psicología");
    const [newEmail, setNewEmail] = useState("");
    const [newPass, setNewPass] = useState("");
    const [newSched, setNewSched] = useState("");
    const [newShift, setNewShift] = useState("Matutino");
    const [editingSpec, setEditingSpec] = useState<Specialist | null>(null);
    const [editPass, setEditPass] = useState("");

    // Content/Event dept tabs (for viewing published material)
    const [contentDeptTab, setContentDeptTab] = useState("Psicología");
    const [eventsDeptTab, setEventsDeptTab] = useState("Todos");

    // Event form
    const [evTitle, setEvTitle] = useState("");
    const [evDesc, setEvDesc] = useState("");
    const [evDept, setEvDept] = useState("Psicología");
    const [evDate, setEvDate] = useState("");
    const [evTime, setEvTime] = useState("");
    const [evType, setEvType] = useState("taller");
    const [evImg, setEvImg] = useState("");
    const [evRegUrl, setEvRegUrl] = useState("");
    const [selectedEventImg, setSelectedEventImg] = useState<File | null>(null);

    // Content form
    const [ctitle, setCtitle] = useState("");
    const [cdesc, setCdesc] = useState("");
    const [ctype, setCtype] = useState("video");
    const [curl, setCurl] = useState("");
    const [cimgUrl, setCimgUrl] = useState("");
    const [cdept, setCdept] = useState("Psicología");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Chart refs (used for downloadChartAsImage)
    const chartGlobal = { monthly: useRef<HTMLDivElement>(null), motivos: useRef<HTMLDivElement>(null), modalidad: useRef<HTMLDivElement>(null), carrera: useRef<HTMLDivElement>(null) };
    const chartPsicologia = { monthly: useRef<HTMLDivElement>(null), motivos: useRef<HTMLDivElement>(null), modalidad: useRef<HTMLDivElement>(null), carrera: useRef<HTMLDivElement>(null) };
    const chartTutorias = { monthly: useRef<HTMLDivElement>(null), motivos: useRef<HTMLDivElement>(null), modalidad: useRef<HTMLDivElement>(null), carrera: useRef<HTMLDivElement>(null) };
    const chartNutricion = { monthly: useRef<HTMLDivElement>(null), motivos: useRef<HTMLDivElement>(null), modalidad: useRef<HTMLDivElement>(null), carrera: useRef<HTMLDivElement>(null) };

    const deptRefs: Record<string, typeof chartGlobal> = {
        Global: chartGlobal,
        "Psicología": chartPsicologia,
        "Tutorías": chartTutorias,
        "Nutrición": chartNutricion,
    };

    // Data
    const fullStats = getStats();
    const summary = fullStats.summary;
    const charts = fullStats.charts;
    const allAppts = getAppointments();

    const todayMidnightAdmin = new Date(); todayMidnightAdmin.setHours(0, 0, 0, 0);
    const sinCerrarCount = allAppts.filter(a =>
        (a.status === "Pendiente" || a.status === "Confirmada") &&
        new Date(a.date + "T12:00:00") < todayMidnightAdmin
    ).length;

    const deptChartData = useMemo(() => {
        const depts = ["Psicología", "Tutorías", "Nutrición"];
        const result: Record<string, any> = {};
        depts.forEach(d => {
            const dAppts = allAppts.filter(a => a.department === d);
            const monMap: Record<string, any> = {};
            dAppts.forEach(a => {
                const mon = new Date(a.date + "T12:00:00").toLocaleString("es-MX", { month: "short" });
                if (!monMap[mon]) monMap[mon] = { month: mon, [d]: 0 };
                monMap[mon][d]++;
            });
            const motMap: Record<string, number> = {};
            const modMap: Record<string, number> = { Presencial: 0, Virtual: 0 };
            const carMap: Record<string, number> = {};
            dAppts.forEach(a => {
                const m = a.motivo || "Consulta General";
                motMap[m] = (motMap[m] || 0) + 1;
                if (a.modality === "Virtual") modMap.Virtual++; else modMap.Presencial++;
                const student = users.find((u: any) => u.id === a.studentId);
                const c = student?.carrera || "No especificada";
                carMap[c] = (carMap[c] || 0) + 1;
            });
            result[d] = {
                monthly: Object.values(monMap),
                motivos: Object.entries(motMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8),
                modalidad: Object.entries(modMap).map(([name, value]) => ({ name, value })),
                carrera: Object.entries(carMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8),
            };
        });
        return result;
    }, [allAppts, users]);

    const filteredAppts = allAppts.filter(a => {
        if (deptFilter !== "Todos" && a.department !== deptFilter) return false;
        if (statusFilter === "Sin cerrar") {
            const apptD = new Date(a.date + "T12:00:00");
            if (!((a.status === "Pendiente" || a.status === "Confirmada") && apptD < todayMidnightAdmin)) return false;
        } else if (statusFilter !== "Todos" && a.status !== statusFilter) return false;
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            if (!a.studentName.toLowerCase().includes(q) && !a.specialistName.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const handleAddSpec = async () => {
        if (!newName || !newEmail || !newPass) { toast.error("Nombre, correo y contraseña son obligatorios"); return; }
        await addSpecialist({ name: newName, department: newDept, email: newEmail, password: newPass, shift: newShift });
        toast.success(`${newName} registrado correctamente`);
        setNewName(""); setNewEmail(""); setNewPass(""); setNewSched("");
    };

    const handleUpdateSpec = async () => {
        if (!editingSpec) return;
        await updateSpecialist(editingSpec.id, {
            name: editingSpec.name, department: editingSpec.department,
            email: editingSpec.email, active: editingSpec.active,
            ...(editPass && { password: editPass }),
        });
        toast.success("Especialista actualizado");
        setEditingSpec(null); setEditPass("");
    };

    const handlePublishEvent = () => {
        if (!evTitle || !evDate) { toast.error("Título y fecha son obligatorios"); return; }
        const finalImg = selectedEventImg ? URL.createObjectURL(selectedEventImg) : (evImg || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80");
        addEvent({
            title: evTitle, description: evDesc, department: evDept,
            date: evDate, time: evTime, type: evType,
            imageUrl: finalImg,
            registrationUrl: evType === "taller" ? evRegUrl : undefined,
        }, selectedEventImg || undefined);
        toast.success("Evento publicado exitosamente");
        setEvTitle(""); setEvDesc(""); setEvDate(""); setEvTime(""); setEvImg(""); setEvRegUrl(""); setSelectedEventImg(null);
    };

    const handlePublishContent = () => {
        if (!ctitle) { toast.error("El título es obligatorio"); return; }
        if (ctype !== "image" && !curl && !selectedFile) {
            toast.error("Agrega un enlace o sube un archivo"); return;
        }
        addResource({
            title: ctitle, description: cdesc, type: ctype,
            url: curl || "#", imageUrl: cimgUrl || undefined, department: cdept,
        }, selectedFile || undefined);
        toast.success("Material educativo publicado");
        setCtitle(""); setCdesc(""); setCurl(""); setCimgUrl(""); setSelectedFile(null);
    };

    const adminStats = [
        { label: "Total Institucional", value: summary.total, icon: BarChart3, gradient: "from-slate-700 to-slate-900" },
        { label: "Pendientes Global", value: summary.pendientes, icon: Clock, gradient: "from-amber-500 to-amber-600" },
        { label: "Confirmadas", value: summary.confirmadas, icon: CalendarCheck, gradient: "from-blue-600 to-indigo-600" },
        { label: "Completadas", value: summary.completadas, icon: CheckCircle2, gradient: "from-emerald-500 to-emerald-600" },
        { label: "Canceladas / Faltas", value: summary.canceladas, icon: XCircle, gradient: "from-rose-500 to-rose-600" },
    ];

    const sidebarTabs = [
        { key: "citas", label: "Gestión de Citas", icon: CalendarDays },
        { key: "especialistas", label: "Especialistas", icon: Users },
        { key: "estudiantes", label: "Estudiantes", icon: Users },
        { key: "estadisticas", label: "Estadísticas", icon: BarChart3 },
        { key: "reportes", label: "Reportes", icon: FileText },
        { key: "contenido", label: "Publicar Contenido", icon: FileText },
        { key: "eventos", label: "Publicar Evento", icon: Megaphone },
    ];

    return (
        <AppShell sidebar={{ tabs: sidebarTabs, active: activeTab, onSelect: setActiveTab, badges: { citas: summary.pendientes + sinCerrarCount } }}>
            <div className="space-y-8 max-w-7xl mx-auto w-full pb-12">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Administración</h1>
                    <p className="text-slate-500 mt-1 font-medium">Control global del sistema de citas institucionales y personal</p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {adminStats.map(s => <StatCard key={s.label} {...s} />)}
                </div>

                {/* Dept cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.entries(DEPT_CONFIG).map(([name, cfg]) => (
                        <div key={name} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between hover:shadow-md hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${cfg.bg} rounded-xl flex items-center justify-center`}>
                                    <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{name}</p>
                                    <p className="text-slate-900 text-2xl font-black mt-0.5 leading-none">
                                        {summary.byDept?.[name] ?? 0} <span className="text-slate-400 font-medium text-sm">citas</span>
                                    </p>
                                </div>
                            </div>
                            <TrendingUp className="w-5 h-5 text-slate-300" />
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">

                    {/* ─── Citas Tab ─── */}
                    {activeTab === "citas" && (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Registro Global de Citas</h3>
                                    <p className="text-slate-500 font-medium text-sm mt-1">Busca y filtra citas de todos los departamentos</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input type="text" placeholder="Buscar alumno o especialista..." value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                                    </div>
                                    <div className="flex gap-2">
                                        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20">
                                            <option>Todos</option><option>Psicología</option><option>Tutorías</option><option>Nutrición</option>
                                        </select>
                                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20">
                                            <option>Todos</option><option>Pendiente</option><option>Confirmada</option><option>Completada</option><option>Cancelada</option><option>Sin cerrar</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto min-h-[300px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/50">
                                            {["Alumno", "Departamento", "Especialista", "Fecha", "Hora", "Modalidad", "Estado"].map(h => (
                                                <th key={h} className="px-6 py-4 text-slate-500 font-bold tracking-wider uppercase text-[0.65rem]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredAppts.map(cita => {
                                            const citaDate = new Date(cita.date + "T12:00:00");
                                            const isSinCerrar = (cita.status === "Pendiente" || cita.status === "Confirmada") && citaDate < todayMidnightAdmin;
                                            const isSesionTardia = cita.status === "Completada" && cita.updatedAt && cita.updatedAt.split("T")[0] > cita.date;
                                            return (
                                            <tr key={cita.id} className={`hover:bg-slate-50/80 transition-colors ${isSinCerrar ? "bg-amber-50/40" : ""}`}>
                                                <td className="px-6 py-4"><p className="text-slate-900 font-bold text-sm">{cita.studentName}</p></td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">{cita.department}</span>
                                                </td>
                                                <td className="px-6 py-4"><p className="text-slate-700 font-medium text-sm">{cita.specialistName}</p></td>
                                                <td className="px-6 py-4"><p className="text-slate-900 font-bold text-sm">{citaDate.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</p></td>
                                                <td className="px-6 py-4 text-slate-500 font-medium text-sm">{cita.time}</td>
                                                <td className="px-6 py-4 text-slate-500 font-medium text-sm capitalize">{cita.modality}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <StatusBadge status={cita.status} />
                                                        {isSinCerrar && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                                Sin cerrar
                                                            </span>
                                                        )}
                                                        {isSesionTardia && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                                Sesión tardía
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filteredAppts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <CalendarCheck className="w-12 h-12 text-slate-300 mb-4" />
                                        <h4 className="text-slate-900 font-bold mb-1">Sin resultados</h4>
                                        <p className="text-slate-500 font-medium text-sm">No hay citas que coincidan con los filtros seleccionados.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── Especialistas Tab ─── */}
                    {activeTab === "especialistas" && (
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">Gestión de Especialistas</h3>
                                    <p className="text-slate-500 font-medium mt-1">{specialists.length} especialistas registrados en el sistema.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* List */}
                                <div className="space-y-3">
                                    <h4 className="text-slate-900 font-bold mb-4 uppercase tracking-wider text-xs">Directorio Activo</h4>
                                    {specialists.map((esp: Specialist) => {
                                        const conf = DEPT_CONFIG[esp.department];
                                        return (
                                            <div key={esp.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group">
                                                <Avatar name={esp.name} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-slate-900 font-bold truncate tracking-tight">{esp.name}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-500 text-xs font-bold">
                                                            {conf && <conf.icon className="w-3 h-3" style={{ color: conf.color }} />} {esp.department}
                                                        </span>
                                                        <span className="text-slate-400 text-xs">•</span>
                                                        <span className="text-slate-500 text-xs font-medium truncate">{esp.email}</span>
                                                    </div>
                                                    {esp.shift && (
                                                        <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                                            <Clock3 className="w-2.5 h-2.5" /> {esp.shift}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-[0.65rem] uppercase tracking-wider shrink-0 border ${esp.active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                                                    {esp.active ? "Activo" : "Inactivo"}
                                                </span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingSpec(esp)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"><Pencil className="w-4 h-4" /></button>
                                                    <button onClick={() => { if (confirm(`¿Eliminar a ${esp.name}?`)) { removeSpecialist(esp.id); toast.success("Especialista eliminado"); } }}
                                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"><XCircle className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Add form */}
                                <div>
                                    <h4 className="text-slate-900 font-bold mb-4 uppercase tracking-wider text-xs flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-blue-600" /> Nuevo Registro
                                    </h4>
                                    <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                                        <div>
                                            <label className="block mb-2 text-slate-900 font-bold text-sm">Nombre completo <span className="text-rose-500">*</span></label>
                                            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Dra. Ana López" className={inputCls} />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-slate-900 font-bold text-sm">Departamento</label>
                                                <select value={newDept} onChange={e => setNewDept(e.target.value)} className={inputCls}>
                                                    <option>Psicología</option><option>Tutorías</option><option>Nutrición</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-slate-900 font-bold text-sm">Correo institucional <span className="text-rose-500">*</span></label>
                                                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="correo@instituto.edu.mx" className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-slate-900 font-bold text-sm">Contraseña temporal</label>
                                                <input type="text" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Contraseña inicial" className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-slate-900 font-bold text-sm">Turno de Atención</label>
                                                <select value={newShift} onChange={e => setNewShift(e.target.value)} className={inputCls}>
                                                    <option value="Matutino">Turno Matutino</option>
                                                    <option value="Vespertino">Turno Vespertino</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-slate-900 font-bold text-sm">Horarios presenciales (opcional)</label>
                                            <input type="text" value={newSched} onChange={e => setNewSched(e.target.value)} placeholder="Ej. Lun-Vie 09:00-14:00" className={inputCls} />
                                        </div>
                                        <Btn onClick={handleAddSpec} size="lg" className="w-full"><Plus className="w-5 h-5 mr-2" /> Registrar Especialista</Btn>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Estudiantes Tab ─── */}
                    {activeTab === "estudiantes" && (
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Alumnos Registrados</h3>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                                <table className="w-full min-w-[640px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            {["Alumno", "Carrera", "Semestre", "Matrícula", "Correo", "Acción"].map(h => (
                                                <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {users.filter((u: any) => u.role === "alumno").map((u: any) => (
                                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar name={u.name} size="sm" />
                                                        <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-700 text-sm">{u.carrera || "—"}</td>
                                                <td className="px-6 py-4 text-slate-700 text-sm">{u.semestre || "—"}</td>
                                                <td className="px-6 py-4 text-slate-700 text-sm font-mono">{u.matricula || "—"}</td>
                                                <td className="px-6 py-4 text-slate-500 text-sm">{u.email}</td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => { if (confirm(`¿Eliminar a ${u.name}?`)) { deleteUser(u.id); toast.success("Alumno eliminado"); } }}
                                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ─── Estadísticas Tab ─── */}
                    {activeTab === "estadisticas" && (
                        <div className="p-8 bg-slate-50/50 min-h-full">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Análisis de Datos e Impacto</h3>
                                    <p className="text-slate-500 font-medium">Visualiza y exporta las métricas de atención institucional</p>
                                </div>
                                <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                                    {["Global", "Psicología", "Tutorías", "Nutrición"].map(v => (
                                        <button key={v} onClick={() => setStatsView(v)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${statsView === v ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}>
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {(() => {
                                    const isGlobal = statsView === "Global";
                                    const data = isGlobal ? charts : deptChartData[statsView];
                                    const refs = deptRefs[statsView];
                                    if (!data || !refs) return null;

                                    return (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Monthly */}
                                                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <h4 className="text-slate-900 font-bold text-lg">Citas por Mes{isGlobal ? " y Departamento" : ""}</h4>
                                                        <button onClick={() => downloadChartAsImage(refs.monthly, `Tendencias_${statsView}`)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer" title="Descargar como imagen">
                                                            <Download className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    <div ref={refs.monthly}>
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart data={data.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={10} />
                                                                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                                                <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                                                                {isGlobal ? (
                                                                    <>
                                                                        <Bar dataKey="Psicología" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                                        <Bar dataKey="Tutorías" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                                        <Bar dataKey="Nutrición" fill="#EA580C" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                                    </>
                                                                ) : (
                                                                    <Bar dataKey={statsView} fill={statsView === "Psicología" ? "#2563EB" : statsView === "Tutorías" ? "#16A34A" : "#EA580C"} radius={[4, 4, 0, 0]} maxBarSize={50} />
                                                                )}
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                {/* Motivos */}
                                                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <h4 className="text-slate-900 font-bold text-lg">Motivos Frecuentes</h4>
                                                        <button onClick={() => downloadChartAsImage(refs.motivos, `Motivos_${statsView}`)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer" title="Descargar como imagen">
                                                            <Download className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    <div ref={refs.motivos}>
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <PieChart>
                                                                <Pie data={data.motivos} cx="50%" cy="50%" outerRadius={100} innerRadius={60} dataKey="value" stroke="none"
                                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "#cbd5e1" }}>
                                                                    {data.motivos.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                                </Pie>
                                                                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Modalidad */}
                                                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <h4 className="text-slate-900 font-bold text-lg">Modalidad de Atención</h4>
                                                        <button onClick={() => downloadChartAsImage(refs.modalidad, `Modalidad_${statsView}`)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer" title="Descargar como imagen">
                                                            <Download className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    <div ref={refs.modalidad}>
                                                        <ResponsiveContainer width="100%" height={260}>
                                                            <PieChart>
                                                                <Pie data={data.modalidad} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" stroke="none"
                                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                                                    <Cell fill="#3b82f6" /><Cell fill="#10b981" />
                                                                </Pie>
                                                                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                {/* Por Carrera */}
                                                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <h4 className="text-slate-900 font-bold text-lg">Distribución por Carrera</h4>
                                                        <button onClick={() => downloadChartAsImage(refs.carrera, `Carreras_${statsView}`)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer" title="Descargar como imagen">
                                                            <Download className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    <div ref={refs.carrera}>
                                                        <ResponsiveContainer width="100%" height={320}>
                                                            <BarChart data={data.carrera} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                                                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#475569", fontWeight: 500 }} axisLine={false} tickLine={false} width={100} interval={0} />
                                                                <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                                                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={24} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* ─── Reportes Tab ─── */}
                    {activeTab === "reportes" && (
                        <div className="p-8">
                            <div className="max-w-4xl mx-auto text-center mb-12 mt-4">
                                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <FileText className="w-8 h-8 text-violet-600" />
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Generación de Reportes</h3>
                                <p className="text-slate-500 text-lg">Exporta los datos en formato PDF segmentados por departamento o genera un reporte global.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: "Psicología", icon: Brain, color: "blue", gradient: "from-blue-500 to-indigo-600" },
                                    { label: "Tutorías", icon: GraduationCap, color: "emerald", gradient: "from-emerald-500 to-teal-600" },
                                    { label: "Nutrición", icon: Apple, color: "rose", gradient: "from-rose-500 to-orange-500" },
                                    { label: "Reporte Global", icon: FileText, color: "violet", gradient: "from-violet-600 to-purple-700" },
                                ].map(r => (
                                    <div key={r.label} className="bg-white border border-slate-200 rounded-3xl p-6 text-center hover:shadow-xl transition-all flex flex-col h-full">
                                        <div className={`w-16 h-16 bg-gradient-to-br ${r.gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                                            <r.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <h4 className="text-slate-900 font-bold text-lg mb-2">{r.label}</h4>
                                        <p className="text-slate-500 text-xs font-medium mb-6 flex-1">Datos consolidados, demografía y efectividad.</p>
                                        <Btn onClick={() => generatePDFReport(r.label, allAppts)} variant="outline" className="w-full">
                                            <Download className="w-4 h-4 mr-2" /> PDF Export
                                        </Btn>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ─── Contenido Tab ─── */}
                    {activeTab === "contenido" && (
                        <div className="p-8">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            {/* ── Form ── */}
                            <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Publicar Material Educativo</h3>
                            <p className="text-slate-500 font-medium mb-6">Como administrador, puedes publicar recursos para cualquier departamento.</p>
                            <div className="space-y-5 bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm">

                                {/* Title + dept */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 text-slate-900 font-bold text-sm">Título del material <span className="text-rose-500">*</span></label>
                                        <input type="text" value={ctitle} onChange={e => setCtitle(e.target.value)} placeholder="Ej. Guía para el manejo de ansiedad" className={inputCls} />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-slate-900 font-bold text-sm">Departamento</label>
                                        <select value={cdept} onChange={e => setCdept(e.target.value)} className={inputCls}>
                                            <option>Psicología</option><option>Tutorías</option><option>Nutrición</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-2 text-slate-900 font-bold text-sm">Descripción breve</label>
                                    <textarea value={cdesc} onChange={e => setCdesc(e.target.value)} placeholder="Explica brevemente de qué trata..." className={`${inputCls} resize-none`} rows={2} />
                                </div>

                                {/* Type selector */}
                                <div>
                                    <label className="block mb-2 text-slate-900 font-bold text-sm">Tipo de recurso</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { key: "video", label: "Video", icon: Video, color: "rose" },
                                            { key: "image", label: "Imagen", icon: ImageIcon, color: "emerald" },
                                            { key: "link", label: "Enlace", icon: ExternalLink, color: "blue" },
                                        ].map(t => (
                                            <button key={t.key} onClick={() => { setCtype(t.key); setCurl(""); setSelectedFile(null); }}
                                                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-2xl cursor-pointer transition-all ${ctype === t.key ? `border-${t.color}-500 bg-${t.color}-50 shadow-sm` : "border-slate-200 bg-white hover:border-slate-300"}`}>
                                                <t.icon className={`w-6 h-6 ${ctype === t.key ? `text-${t.color}-600` : "text-slate-400"}`} />
                                                <span className={`text-xs font-bold ${ctype === t.key ? `text-${t.color}-700` : "text-slate-500"}`}>{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Image: file upload */}
                                {ctype === "image" && (
                                    <div>
                                        <label className="block mb-2 text-slate-900 font-bold text-sm">
                                            Imagen / Infografía <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative flex items-center gap-4 p-4 bg-white border-2 border-dashed border-emerald-200 rounded-2xl hover:border-emerald-400 transition-colors cursor-pointer">
                                            <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                            {selectedFile ? (
                                                <>
                                                    <img src={URL.createObjectURL(selectedFile)} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">{selectedFile.name}</p>
                                                        <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB — haz clic para cambiar</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                                                        <ImageIcon className="w-7 h-7 text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">Subir imagen o infografía</p>
                                                        <p className="text-xs text-slate-400">JPG, PNG, WEBP. Recomendado: 800×400px</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Video: URL + optional file */}
                                {ctype === "video" && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block mb-2 text-slate-900 font-bold text-sm">
                                                URL del video <span className="text-rose-500">*</span>
                                                <span className="text-slate-400 font-normal ml-2 text-xs">(YouTube, Vimeo, etc.)</span>
                                            </label>
                                            <input type="url" value={curl} onChange={e => setCurl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inputCls} />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-slate-900 font-bold text-sm">Archivo adjunto (opcional)</label>
                                            <div className="relative flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-rose-300 transition-colors cursor-pointer">
                                                <input type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                <Plus className="w-5 h-5 text-slate-400" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{selectedFile ? selectedFile.name : "Subir archivo complementario"}</p>
                                                    {selectedFile && <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Link: URL only */}
                                {ctype === "link" && (
                                    <div>
                                        <label className="block mb-2 text-slate-900 font-bold text-sm">
                                            URL del enlace <span className="text-rose-500">*</span>
                                        </label>
                                        <input type="url" value={curl} onChange={e => setCurl(e.target.value)} placeholder="https://..." className={inputCls} />
                                    </div>
                                )}

                                <Btn onClick={handlePublishContent} size="lg" className="w-full"><FileText className="w-5 h-5 mr-2" /> Publicar Material</Btn>
                            </div>{/* end form card */}
                            </div>{/* end form column */}

                            {/* ── Resource list by dept ── */}
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">Material publicado</h3>
                                {/* Dept tabs */}
                                <div className="flex gap-2 mb-4 flex-wrap">
                                    {["Psicología", "Tutorías", "Nutrición"].map(d => (
                                        <button key={d} onClick={() => setContentDeptTab(d)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all cursor-pointer ${contentDeptTab === d ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"}`}>
                                            {d}
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                    {resources.filter(r => r.department === contentDeptTab).length === 0 ? (
                                        <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm font-medium">Sin material publicado en {contentDeptTab}</p>
                                        </div>
                                    ) : (
                                        resources.filter(r => r.department === contentDeptTab).map(r => (
                                            <div key={r.id} className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                                                <div className={`p-2 rounded-lg shrink-0 ${r.type === "video" ? "bg-rose-50" : r.type === "link" ? "bg-blue-50" : "bg-emerald-50"}`}>
                                                    {r.type === "video" && <Video className="w-4 h-4 text-rose-500" />}
                                                    {r.type === "link" && <ExternalLink className="w-4 h-4 text-blue-500" />}
                                                    {r.type === "image" && <ImageIcon className="w-4 h-4 text-emerald-500" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{r.title}</p>
                                                    {r.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{r.description}</p>}
                                                    <span className="text-[0.65rem] uppercase tracking-wider font-bold text-slate-400">{r.type}</span>
                                                </div>
                                                <button onClick={() => deleteResource(r.id)} title="Eliminar"
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>{/* end resource list */}

                            </div>{/* end grid */}
                        </div>
                    )}

                    {/* ─── Eventos Tab ─── */}
                    {activeTab === "eventos" && (
                        <div className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Difusión Institucional</h3>
                                    <p className="text-slate-500 font-medium mb-8">Publica eventos, conferencias y talleres. Aparecerán en el carrusel principal de todos los estudiantes.</p>
                                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                                        <div>
                                            <label className="block mb-2 text-slate-900 font-bold text-sm">Formato del evento</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {["taller", "conferencia"].map(t => (
                                                    <button key={t} onClick={() => setEvType(t)}
                                                        className={`py-3 rounded-xl border-2 cursor-pointer capitalize font-bold text-sm transition-all ${evType === t ? "border-violet-600 bg-violet-50 text-violet-700 shadow-sm" : "border-slate-200 bg-white text-slate-500"}`}>
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-slate-900 font-bold text-sm">Título del evento <span className="text-rose-500">*</span></label>
                                            <input type="text" value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="Ej. Taller de Organización de Tiempo" className={inputCls} />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-slate-900 font-bold text-sm">Descripción global</label>
                                            <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="¿De qué trata este evento?..." className={`${inputCls} resize-none`} rows={3} />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-slate-900 font-bold text-sm">Departamento organizador</label>
                                            <select value={evDept} onChange={e => setEvDept(e.target.value)} className={inputCls}>
                                                <option>Psicología</option><option>Tutorías</option><option>Nutrición</option><option value="General">General (Todas las áreas)</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-slate-900 font-bold text-sm">Fecha programada <span className="text-rose-500">*</span></label>
                                                <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-slate-900 font-bold text-sm">Hora de inicio</label>
                                                <input type="time" value={evTime} onChange={e => setEvTime(e.target.value)} className={inputCls} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-slate-900 font-bold text-sm">Imagen de Portada <span className="text-rose-500">*</span></label>
                                            <div className="relative flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-violet-400 transition-colors cursor-pointer">
                                                <input type="file" accept="image/*" onChange={e => setSelectedEventImg(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-100">
                                                    {selectedEventImg
                                                        ? <img src={URL.createObjectURL(selectedEventImg)} className="w-full h-full object-cover" alt="" />
                                                        : (evImg ? <img src={evImg} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="w-8 h-8 text-slate-400" />)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-700">{selectedEventImg ? selectedEventImg.name : "Subir imagen de portada"}</p>
                                                    <p className="text-xs text-slate-400">Formatos: JPG, PNG. Recomendado: 800×400px</p>
                                                </div>
                                                <Plus className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors" />
                                            </div>
                                        </div>
                                        {evType === "taller" && (
                                            <div>
                                                <label className="block mb-2 text-slate-900 font-bold text-sm">Enlace de Registro (Google Forms) <span className="text-rose-500">*</span></label>
                                                <input type="url" value={evRegUrl} onChange={e => setEvRegUrl(e.target.value)} placeholder="https://forms.gle/..." className={inputCls} />
                                            </div>
                                        )}
                                        <Btn onClick={handlePublishEvent} size="lg" className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                                            <Megaphone className="w-5 h-5 mr-2" /> Difundir Evento
                                        </Btn>
                                    </div>
                                </div>

                                {/* Active events list */}
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                                        Eventos Activos ({events.length})
                                    </h3>
                                    {/* Dept filter tabs */}
                                    <div className="flex gap-2 mb-4 flex-wrap">
                                        {["Todos", "Psicología", "Tutorías", "Nutrición", "General"].map(d => (
                                            <button key={d} onClick={() => setEventsDeptTab(d)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${eventsDeptTab === d ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:border-violet-400"}`}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-4 max-h-[620px] overflow-y-auto pr-2">
                                        {events.filter(ev => eventsDeptTab === "Todos" || ev.department === eventsDeptTab).map((ev: any) => (
                                            <div key={ev.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                                {ev.imageUrl && (
                                                    <div className="h-32 bg-slate-100 overflow-hidden relative">
                                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                                                        <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover"
                                                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                                        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded-md font-bold text-[0.65rem] uppercase tracking-wider shadow-sm ${ev.type === "conferencia" ? "bg-violet-500 text-white" : "bg-blue-500 text-white"}`}>
                                                                {ev.type === "conferencia" ? "Conferencia" : "Taller"}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded-md font-bold text-[0.65rem] uppercase tracking-wider bg-black/40 text-white backdrop-blur-md">{ev.department}</span>
                                                        </div>
                                                        {/* Delete button overlaid on image */}
                                                        <button onClick={() => deleteEvent(ev.id)} title="Eliminar evento"
                                                            className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all cursor-pointer shadow">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="p-4 flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-slate-900 font-bold text-base leading-tight">{ev.title}</p>
                                                        <p className="text-slate-500 text-xs mt-2 font-medium flex items-center gap-1">
                                                            <CalendarDays className="w-3.5 h-3.5" />
                                                            {new Date(ev.date + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
                                                            {ev.time ? ` • ${ev.time}` : ""}
                                                        </p>
                                                    </div>
                                                    {!ev.imageUrl && (
                                                        <button onClick={() => deleteEvent(ev.id)} title="Eliminar evento"
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>{/* end card */}

                {/* ─── Action Modal ─── */}
                <Modal open={!!action.appt && !!action.status} onClose={action.close}
                    title={`Cambiar estado a: ${action.status}`}
                    subtitle={action.appt ? `${action.appt.studentName} — ${action.appt.date} a las ${action.appt.time}` : ""}
                    maxWidth="max-w-md">
                    <div className="space-y-5">
                        <div>
                            <label className="block mb-2 text-slate-900 font-bold text-sm">Observaciones (opcional)</label>
                            <textarea value={action.notes} onChange={e => action.setNotes(e.target.value)}
                                placeholder="Agregar comentario..." rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-slate-700 bg-slate-50/50 text-sm" />
                        </div>
                        <div className="flex gap-3">
                            <Btn variant="outline" onClick={action.close} className="flex-1">Cancelar Operación</Btn>
                            <Btn onClick={() => action.confirm(false)}
                                className={`flex-1 text-white border-0 shadow-lg ${action.status === "Cancelada" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"}`}>
                                Confirmar Estado
                            </Btn>
                        </div>
                    </div>
                </Modal>

                {/* ─── Edit Specialist Modal ─── */}
                <Modal open={!!editingSpec} onClose={() => setEditingSpec(null)} title="Editar Especialista" subtitle={editingSpec?.name} maxWidth="max-w-md">
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 text-slate-700 font-bold text-xs uppercase">Nombre</label>
                            <input type="text" value={editingSpec?.name || ""} onChange={e => setEditingSpec(p => p ? { ...p, name: e.target.value } : null)} className={inputCls} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-slate-700 font-bold text-xs uppercase">Email</label>
                                <input type="email" value={editingSpec?.email || ""} onChange={e => setEditingSpec(p => p ? { ...p, email: e.target.value } : null)} className={inputCls} />
                            </div>
                            <div>
                                <label className="block mb-1 text-slate-700 font-bold text-xs uppercase">Departamento</label>
                                <select value={editingSpec?.department || ""} onChange={e => setEditingSpec(p => p ? { ...p, department: e.target.value } : null)} className={inputCls}>
                                    <option>Psicología</option><option>Tutorías</option><option>Nutrición</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 text-slate-700 font-bold text-xs uppercase text-blue-600">Cambiar Contraseña (opcional)</label>
                            <input type="text" value={editPass} onChange={e => setEditPass(e.target.value)} placeholder="Dejar vacío para mantener" className={inputCls} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-slate-700 font-bold text-xs uppercase">Turno</label>
                                <select value={editingSpec?.shift || "Matutino"} onChange={e => setEditingSpec(p => p ? { ...p, shift: e.target.value } : null)} className={inputCls}>
                                    <option value="Matutino">Matutino</option>
                                    <option value="Vespertino">Vespertino</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-slate-700 font-bold text-xs uppercase">Activo</label>
                                <div className="flex items-center gap-2 h-[46px]">
                                    <input type="checkbox" id="spec-active" checked={editingSpec?.active || false}
                                        onChange={e => setEditingSpec(p => p ? { ...p, active: e.target.checked } : null)}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                    <label htmlFor="spec-active" className="text-sm font-bold text-slate-600">Habilitado</label>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 flex gap-3">
                            <Btn variant="ghost" onClick={() => setEditingSpec(null)} className="flex-1">Cancelar</Btn>
                            <Btn onClick={handleUpdateSpec} className="flex-1 bg-blue-600 shadow-blue-600/20">Guardar Cambios</Btn>
                        </div>
                    </div>
                </Modal>

            </div>
        </AppShell>
    );
}
