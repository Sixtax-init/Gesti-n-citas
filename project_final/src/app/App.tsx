import { useState, useCallback, createContext, useContext, useEffect, useRef, useMemo } from "react";
import { Toaster, toast } from "sonner";
import {
  Brain, GraduationCap, Apple, CalendarCheck, Clock, CheckCircle2, XCircle,
  Bell, LogOut, X, UserPlus, FileText, AlertTriangle, Megaphone, RefreshCw,
  Clock3, TrendingUp, Mail, Phone, MapPin, Calendar, Info, Ticket, ExternalLink,
  Video, Image as ImageIcon, Users, Plus, LayoutDashboard, Settings,
  PieChart as PieIcon, Trash2, Filter, BookOpen, Pencil,
  ChevronLeft, ChevronRight, Download, CalendarDays, BarChart3, ShieldCheck, Menu, Tag, Search, Maximize2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

import {
  User, Specialist, Appointment, AppEvent, Resource, AppNotification,
  StoreContextType, AuthContextType
} from "../types";
import {
  DEPT_CONFIG, DEPT_REASONS, DAY_NAMES, DAYS_FULL, STATUS_BADGE_CONFIG, CAREERS
} from "../constants";
import {
  SEED_USERS, SEED_SPECIALISTS, SEED_APPOINTMENTS, SEED_EVENTS, SEED_RESOURCES,
  CHART_MONTHLY, CHART_MOTIVOS, CHART_MODALIDAD, CHART_CARRERA, PIE_COLORS,
  ROLE_NOTIFICATIONS as NOTIFICATIONS
} from "../data/mockData";
import { useStore } from "../context/StoreContext";
import { useAuth } from "../context/AuthContext";

const API_BASE = 'http://localhost:3000';

function NotifIcon({ type }: { type: string }) {
  const props = { className: "w-4 h-4" };
  switch (type) {
    case "confirmed": return <CheckCircle2 {...props} style={{ color: "#16A34A" }} />;
    case "reminder": return <Clock {...props} style={{ color: "#EA580C" }} />;
    case "event": return <Megaphone {...props} style={{ color: "#2563EB" }} />;
    case "reschedule": return <RefreshCw {...props} style={{ color: "#8b5cf6" }} />;
    case "new_user": return <UserPlus {...props} style={{ color: "#16A34A" }} />;
    case "report": return <FileText {...props} style={{ color: "#2563EB" }} />;
    case "cancelled": return <AlertTriangle {...props} style={{ color: "#dc2626" }} />;
    default: return <CalendarCheck {...props} style={{ color: "#64748b" }} />;
  }
}

// ─────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { bg: string, text: string, border: string, dot: string }> = {
    Pendiente: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    Confirmada: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
    Completada: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    Cancelada: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  };
  const v = variants[status] || variants.Pendiente;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${v.bg} ${v.text} ${v.border}`} style={{ fontSize: "0.75rem", fontWeight: 500 }}>
      <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
      {status}
    </span>
  );
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-pink-600",
    "from-violet-500 to-purple-600",
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  const gradient = colors[colorIndex];

  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div className={`shrink-0 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-medium shadow-sm ${sizes[size]}`}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, gradient, sub }: { label: string; value: string | number; icon: React.ElementType; gradient: string; sub?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br ${gradient}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-white/80 font-medium tracking-wide mb-1" style={{ fontSize: "0.85rem" }}>{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {sub && <p className="text-white/70 mt-1" style={{ fontSize: "0.75rem" }}>{sub}</p>}
        </div>
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function Btn({ children, variant = "primary", size = "md", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "emerald" | "rose" | "outline" | "ghost" | "teal", size?: "sm" | "md" | "lg" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border border-transparent",
    emerald: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border border-transparent",
    rose: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm border border-transparent",
    teal: "bg-teal-600 text-white hover:bg-teal-700 shadow-sm border border-transparent",
    outline: "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent",
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className} `} {...props}>{children}</button>;
}

function Card({ children, className = "", hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${hover ? "transition-all duration-300 hover:shadow-md hover:border-slate-300" : ""} ${className}`}>
      {children}
    </div>
  );
}

function TabNav({ tabs, active, onSelect }: { tabs: { key: string; label: string; icon?: React.ElementType; badge?: number }[]; active: string; onSelect: (k: string) => void }) {
  return (
    <div className="inline-flex bg-slate-100 p-1 rounded-xl mb-4 overflow-x-auto">
      {tabs.map(t => {
        const isActive = active === t.key;
        return (
          <button key={t.key} onClick={() => onSelect(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${isActive ? "bg-white shadow-sm text-slate-900 font-medium" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
            style={{ fontSize: "0.85rem" }}>
            {t.icon && <t.icon className={`w-4 h-4 ${isActive ? "text-blue-600" : ""}`} />}
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`ml-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold ${isActive ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"}`}>
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Tabs({ tabs, defaultTab, children }: { tabs: { key: string; label: string }[]; defaultTab?: string; children: (active: string) => React.ReactNode }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.key);
  return (
    <div>
      <TabNav tabs={tabs} active={active} onSelect={setActive} />
      {children(active)}
    </div>
  );
}

function Modal({ open, onClose, title, subtitle, children, maxWidth = "max-w-xl" }: { open: boolean; onClose: () => void; title: string; subtitle?: React.ReactNode; children: React.ReactNode; maxWidth?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function MiniCalendar({ selectedDate, onSelect, availableDates = null, highlightedDates = null }: { selectedDate: Date | null; onSelect: (d: Date) => void; availableDates?: Date[] | null; highlightedDates?: Date[] | null }) {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const isSameDay = (a: Date | null, b: Date | null) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const isAvailable = (d: Date) => {
    if (!availableDates) return true;
    return availableDates.some(av => isSameDay(av, d));
  };
  const isHighlighted = (d: Date) => highlightedDates && highlightedDates.some(h => isSameDay(h, d));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="select-none bg-white p-4 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
        <span className="text-slate-900 font-medium text-sm capitalize">{new Date(year, month).toLocaleDateString("es-MX", { month: "long", year: "numeric" })}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map(d => <div key={d} className="text-center text-slate-400 font-medium text-xs">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isPast = d < today;
          const avail = !isPast && isAvailable(d);
          const hilit = isHighlighted(d);
          const sel = isSameDay(d, selectedDate);
          let cls = "w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ";
          if (sel) cls += "bg-blue-600 text-white shadow-sm shadow-blue-200 ";
          else if (hilit) cls += "bg-blue-50 text-blue-700 border border-blue-200/50 ";
          else if (isPast) cls += "text-slate-300 cursor-not-allowed ";
          else if (avail) cls += "text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer ";
          else cls += "text-slate-300 cursor-not-allowed ";
          return (
            <button key={i} className={cls} disabled={isPast || !avail} onClick={() => avail && onSelect(d)}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LOGIN FORM
// ─────────────────────────────────────────────
function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (!ok) toast.error("Credenciales incorrectas.");
  };

  const demoLogin = async (em: string, pw: string) => {
    setEmail(em); setPassword(pw); setLoading(true);
    await login(em, pw); setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden font-sans">
      {/* Left panel */}
      <div className="hidden lg:flex w-[52%] flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-teal-700">
        {/* Decorative background blobs & dots */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-5" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <CalendarCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-tight">Sistema de Citas</h1>
              <p className="text-teal-200 text-sm font-medium tracking-wide">PLATAFORMA INSTITUCIONAL</p>
            </div>
          </div>

          <h2 className="text-4xl text-white font-bold leading-tight mb-6 max-w-lg">
            Gestión inteligente para tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-300">bienestar integral</span>.
          </h2>

          <div className="space-y-4 max-w-sm mt-12">
            {[
              { name: "Psicología", icon: Brain, gradient: "from-blue-500 to-blue-700" },
              { name: "Tutorías", icon: GraduationCap, gradient: "from-emerald-500 to-teal-600" },
              { name: "Nutrición", icon: Apple, gradient: "from-amber-500 to-orange-500" }
            ].map((d) => (
              <div key={d.name} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${d.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                  <d.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-medium">{d.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics row */}
        <div className="relative z-10 grid grid-cols-3 gap-6 pt-10 border-t border-white/10 mt-12">
          <div><p className="text-3xl font-bold text-white mb-1">500+</p><p className="text-white/60 text-xs font-medium uppercase tracking-wider">Alumnos</p></div>
          <div><p className="text-3xl font-bold text-white mb-1">3</p><p className="text-white/60 text-xs font-medium uppercase tracking-wider">Departamentos</p></div>
          <div><p className="text-3xl font-bold text-white mb-1">98%</p><p className="text-white/60 text-xs font-medium uppercase tracking-wider">Satisfacción</p></div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
            <div className="text-center mb-6 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Iniciar Sesión</h2>
              <p className="text-slate-500 mt-2 text-sm">Ingresa con tus credenciales institucionales</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5 opacity-100">
                <label className="text-sm font-semibold text-slate-700 ml-1">Correo institucional</label>
                <div className={`relative transition-all duration-300 rounded-xl border-2 ${focusedInput === 'email' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className={`transition - colors duration - 300 ${focusedInput === 'email' ? 'text-blue-600' : 'text-slate-400'} `}>@</span>
                  </div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocusedInput('email')} onBlur={() => setFocusedInput(null)} placeholder="usuario@instituto.edu.mx" required
                    className="w-full pl-10 pr-4 py-3 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm font-medium" />
                </div>
              </div>

              <div className="space-y-1.5 opacity-100">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                </div>
                <div className={`relative transition-all duration-300 rounded-xl border-2 ${focusedInput === 'password' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-lg leading-none transition-colors duration-300 flex items-center justify-center font-bold text-slate-400 group-focus-within:text-blue-600" style={{ color: focusedInput === 'password' ? '#2563EB' : '#94a3b8' }}>*</span>
                  </div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocusedInput('password')} onBlur={() => setFocusedInput(null)} placeholder="••••••••" required
                    className="w-full pl-10 pr-4 py-3 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm font-medium tracking-widest" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3.5 mt-4 bg-gradient-to-r from-blue-700 to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-lg cursor-pointer flex justify-center items-center">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Ingresar"}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-8">
              <p className="text-xs font-semibold text-slate-400 text-center uppercase tracking-wider mb-4">Cuentas de acceso rápido</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { role: "Alumno", email: "alumno@instituto.edu.mx", pass: "alumno123", color: "blue" },
                  { role: "Especialista", email: "psicologo@instituto.edu.mx", pass: "esp123", color: "emerald" },
                  { role: "Admin", email: "admin@instituto.edu.mx", pass: "admin123", color: "slate" }
                ].map(c => (
                  <button key={c.role} onClick={() => demoLogin(c.email, c.pass)} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group cursor-pointer text-left">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[0.65rem] sm:text-xs font-bold uppercase tracking-wide bg-${c.color}-100 text-${c.color}-700`}>{c.role}</span>
                      <span className="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate max-w-[120px] sm:max-w-none">{c.email}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center mt-8 text-slate-500 text-sm">
            ¿No tienes cuenta?{" "}
            <button onClick={onSwitchToRegister} className="text-blue-600 font-semibold hover:text-blue-700 underline underline-offset-4 cursor-pointer">Registrarse</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// REGISTER FORM
// ─────────────────────────────────────────────
function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({ name: "", email: "", carrera: "", semestre: "", edad: "", matricula: "", genero: "Masculino", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Las contraseñas no coinciden"); return; }
    setLoading(true);
    await register({ name: form.name, email: form.email, password: form.password, carrera: form.carrera, semestre: form.semestre ? parseInt(form.semestre) : undefined, edad: form.edad ? parseInt(form.edad) : undefined, matricula: form.matricula, genero: form.genero });
    setLoading(false);
    toast.success("¡Registro exitoso! Bienvenido(a).");
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all text-sm font-medium";

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden font-sans">
      <div className="hidden lg:flex w-[52%] flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-700">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-5" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <CalendarCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-tight">Sistema de Citas</h1>
              <p className="text-emerald-200 text-sm font-medium tracking-wide">NUEVA CUENTA</p>
            </div>
          </div>

          <h2 className="text-4xl text-white font-bold leading-tight mb-8">
            Empieza a cuidar de ti.
          </h2>

          <div className="space-y-6">
            {[
              { title: "Seguro y Privado", desc: "Información tratada con total confidencialidad institucional.", icon: ShieldCheck },
              { title: "Rápido y Accesible", desc: "Agenda citas en segundos para cualquier departamento.", icon: Clock },
              { title: "Personalizado", desc: "Accede a recursos específicos para tu carrera y semestre.", icon: Users },
              { title: "Historial Completo", desc: "Lleva el control de todas tus asistencias y evaluaciones.", icon: FileText }
            ].map(f => (
              <div key={f.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-0.5">{f.title}</h4>
                  <p className="text-white/60 text-sm max-w-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center py-8 px-4 sm:px-8 relative overflow-y-auto">
        <div className="w-full max-w-xl mx-auto my-auto">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Crear Cuenta</h2>
              <p className="text-slate-500 mt-2 text-sm">Completa tus datos para registrarte</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sección 1: Datos Personales (Blue) */}
              <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-2"><UserPlus className="w-3.5 h-3.5" /> Datos Personales</h3>
                <div>
                  <label className="block mb-1.5 text-slate-700 text-sm font-semibold ml-1">Nombre completo</label>
                  <input type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Tu nombre completo" required className={`${inputCls} border-blue-200 focus:border-blue-600 focus:bg-white`} />
                </div>
                <div>
                  <label className="block mb-1.5 text-slate-700 text-sm font-semibold ml-1">Correo institucional</label>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="usuario@instituto.edu.mx" required className={`${inputCls} border-blue-200 focus:border-blue-600 focus:bg-white`} />
                </div>
              </div>

              {/* Sección 2: Datos Académicos (Emerald) */}
              <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5" /> Datos Académicos y Demográficos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-slate-700 text-sm font-semibold ml-1">Carrera</label>
                    <select 
                      value={form.carrera} 
                      onChange={e => set("carrera", e.target.value)} 
                      required
                      className={`${inputCls} border-emerald-200 focus:border-emerald-600 focus:bg-white appearance-none cursor-pointer`}
                    >
                      <option value="" disabled>Selecciona tu carrera</option>
                      {CAREERS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-700 text-sm font-semibold ml-1">Número de control</label>
                    <input type="text" value={form.matricula} onChange={e => set("matricula", e.target.value)} placeholder="Ej. 20210001" className={`${inputCls} border-emerald-200 focus:border-emerald-600 focus:bg-white`} />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-700 text-sm font-semibold ml-1">Semestre</label>
                    <input type="number" value={form.semestre} onChange={e => set("semestre", e.target.value)} placeholder="Ej. 5" min="1" max="12" className={`${inputCls} border-emerald-200 focus:border-emerald-600 focus:bg-white`} />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-700 text-sm font-semibold ml-1">Edad</label>
                    <input type="number" value={form.edad} onChange={e => set("edad", e.target.value)} placeholder="Ej. 21" min="15" max="60" className={`${inputCls} border-emerald-200 focus:border-emerald-600 focus:bg-white`} />
                  </div>
                </div>
                <div className="pt-2">
                  <label className="block mb-2 text-slate-700 text-sm font-semibold ml-1">Género</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["Masculino", "Femenino"].map(g => (
                      <button key={g} type="button" onClick={() => set("genero", g)}
                        className={`py-2.5 rounded-xl border-2 font-medium transition-all active:scale-[0.98] cursor-pointer ${form.genero === g ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "border-emerald-200 bg-white text-slate-600 hover:border-emerald-300"}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sección 3: Seguridad (Violet) */}
              <div className="bg-violet-50/50 border border-violet-100 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-violet-800 uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Seguridad</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-slate-700 text-sm font-semibold ml-1">Contraseña</label>
                    <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} className={`${inputCls} border-violet-200 focus:border-violet-600 focus:bg-white`} />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-700 text-sm font-semibold ml-1">Confirmar</label>
                    <input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="Repite contraseña" required minLength={6} className={`${inputCls} border-violet-200 focus:border-violet-600 focus:bg-white`} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 mt-6 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all text-base cursor-pointer">
                {loading ? "Registrando..." : "Registrarse y Entrar"}
              </button>
            </form>

            <p className="text-center mt-8 text-slate-500 text-sm">
              ¿Ya tienes cuenta?{" "}
              <button onClick={onSwitchToLogin} className="text-emerald-600 font-semibold hover:text-emerald-700 underline underline-offset-4 cursor-pointer">Iniciar sesión</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────
interface SidebarProps {
  tabs: { key: string; label: string; icon: React.ElementType }[];
  active: string;
  onSelect: (key: string) => void;
  badges?: Record<string, number>;
}

function AppShell({ children, sidebar, role, userName, userEmail, userDept }: { children: React.ReactNode; sidebar?: SidebarProps; role?: string; userName?: string; userEmail?: string; userDept?: string }) {
  const { user, logout } = useAuth();
  const { notifications, markNotificationsRead } = useStore();
  const [showNotif, setShowNotif] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (!user) return null;

  const notifs = notifications[user.id] || [];
  const unread = notifs.filter(n => !n.read).length;
  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const roleLabel = { alumno: "Alumno", especialista: "Especialista", admin: "Administrador" }[user.role];

  const handleToggleNotif = () => {
    if (!showNotif && unread > 0) {
      markNotificationsRead(user.id);
    }
    setShowNotif(!showNotif);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar - only rendered if sidebar prop is provided */}
      {sidebar && (
        <>
          {/* Mobile backdrop */}
          {sidebarOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

          {/* Sidebar container */}
          <aside className={`fixed md:sticky top-0 left-0 z-50 h-[100dvh] w-64 bg-gradient-to-b from-slate-900 to-blue-900 shadow-2xl transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
            {/* Logo area */}
            <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10 shrink-0 bg-black/10">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-400/30 shadow-inner">
                <CalendarCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-white font-bold tracking-wide">Sistema Citas</span>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1.5 overflow-y-auto h-[calc(100vh-4rem)]">
              {sidebar.tabs.map(t => {
                const isActive = sidebar.active === t.key;
                const badge = sidebar.badges?.[t.key];
                return (
                  <button key={t.key} onClick={() => { sidebar.onSelect(t.key); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer group ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                    <t.icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                    <span className="font-medium text-sm">{t.label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? "bg-white text-blue-600" : "bg-blue-500/30 text-white"}`}>{badge}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 sm:px-6 shrink-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3">
            {sidebar ? (
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors shrink-0">
                <Menu className="w-6 h-6" />
              </button>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                  <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="hidden xs:block">
                  <p className="text-slate-900 font-bold text-xs sm:text-sm tracking-tight leading-none">Sistema de Citas</p>
                  <p className="text-slate-500 text-[0.6rem] sm:text-xs font-medium uppercase tracking-wider mt-0.5">Institucional</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            {/* Notifications */}
            <div className="relative">
              <button onClick={handleToggleNotif} className="relative p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                <Bell className="w-5 h-5" />
                {unread > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 border-2 border-white text-transparent rounded-full flex items-center justify-center animate-pulse" />}
              </button>
              {showNotif && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                  <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                      <div>
                        <h4 className="text-slate-900 font-semibold text-sm">Notificaciones</h4>
                        <p className="text-slate-500 text-xs font-medium">{unread > 0 ? `${unread} sin leer` : "Todo al día"}</p>
                      </div>
                      <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="overflow-y-auto max-h-80 select-none">
                      {notifs.map(n => (
                        <div key={n.id} className={`px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-default ${!n.read ? "bg-blue-50/50" : ""}`}>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0"><NotifIcon type={n.type} /></div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className={`text-sm truncate ${!n.read ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>{n.title}</p>
                                {!n.read && <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />}
                              </div>
                              <p className="text-slate-500 text-xs leading-relaxed">{n.message}</p>
                              <p className="text-slate-400 text-[0.65rem] font-medium mt-1.5 uppercase tracking-wider">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Chip */}
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-slate-900 font-semibold text-sm leading-tight">{user.name}</p>
                <p className="text-slate-500 text-xs font-medium">{roleLabel}{user.department ? ` - ${user.department} ` : ""}</p>
              </div>
              <Avatar name={user.name} size="md" />
              <button onClick={logout} className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-1" title="Cerrar sesión">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STUDENT DASHBOARD
// ─────────────────────────────────────────────
function StudentDashboard() {
  const { user } = useAuth();
  const { getAppointments, updateAppointmentStatus, createAppointment, rescheduleAppointment, getSpecialists, getAvailableSlots, getAvailableDays, events, resources, getStats } = useStore();
  const resourcesRef = useRef<HTMLDivElement>(null);
  const [activeApptTab, setActiveApptTab] = useState("proximas");
  const [activeResTab, setActiveResTab] = useState("Psicología");
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [showResources, setShowResources] = useState(false);

  // ── new appointment wizard ──
  const [showCita, setShowCita] = useState(false);
  const [step, setStep] = useState(1);
  const [selDept, setSelDept] = useState<string | null>(null);
  const [selSpecId, setSelSpecId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<{ title: string; type: string; date: string; time: string; department: string; description: string; imageUrl?: string }>({ title: "", type: "taller", date: "", time: "", department: "Psicología", description: "", imageUrl: "" });
  const [selDate, setSelDate] = useState<Date | null>(null);
  const [selSlot, setSelSlot] = useState<string | null>(null);
  const [selReason, setSelReason] = useState("");
  const [selModality, setSelModality] = useState("Presencial");
  const [confidentialityAccepted, setConfidentialityAccepted] = useState(false);

  // ── reschedule ──
  const [showResch, setShowResch] = useState(false);
  const [reschedApptId, setReschedApptId] = useState<string | null>(null);
  const [reschedDate, setReschedDate] = useState<Date | null>(null);
  const [reschedSlot, setReschedSlot] = useState<string | null>(null);

  // ── image preview ──
  const [previewImg, setPreviewImg] = useState<{ url: string; title: string } | null>(null);

  // ── conference info ──
  const [showConfModal, setShowConfModal] = useState(false);
  const [selConf, setSelConf] = useState<AppEvent | null>(null);

  // ── cancel logic ──
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelApptId, setCancelApptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");


  const appointments = getAppointments({ studentId: user?.id });
  const proximas = appointments.filter(a => a.status === "Pendiente" || a.status === "Confirmada");
  const { summary: { pendientes, confirmadas, completadas } } = getStats();
  const historial = appointments.filter(a => a.status === "Completada" || a.status === "Cancelada");

  const stats = [
    { label: "Pendientes", value: appointments.filter(a => a.status === "Pendiente").length, icon: Clock, bg: "bg-gradient-to-br from-[#EA580C] to-[#f97316]" },
    { label: "Confirmadas", value: appointments.filter(a => a.status === "Confirmada").length, icon: CheckCircle2, bg: "bg-gradient-to-br from-[#16A34A] to-[#22c55e]" },
    { label: "Completadas", value: appointments.filter(a => a.status === "Completada").length, icon: CalendarCheck, bg: "bg-gradient-to-br from-[#2563EB] to-[#3b82f6]" },
  ];

  // Banner Auto-rotation
  useEffect(() => {
    if (events.length <= 1) return;
    const t = setInterval(() => {
      setActiveBannerIndex(prev => (prev + 1) % events.length);
    }, 5000);
    return () => clearInterval(t);
  }, [events.length]);

  const resetCita = () => { setStep(1); setSelDept(null); setSelSpecId(null); setSelDate(null); setSelSlot(null); setSelReason(""); setSelModality("Presencial"); setConfidentialityAccepted(false); };

  const [availDates, setAvailDates] = useState<Date[]>([]);
  const [slotsForDate, setSlotsForDate] = useState<string[]>([]);
  const [reschedAvailDates, setReschedAvailDates] = useState<Date[]>([]);
  const [reschedSlotsForDate, setReschedSlotsForDate] = useState<string[]>([]);

  useEffect(() => {
    if (!selSpecId) { setAvailDates([]); return; }
    const now = new Date();
    getAvailableDays(selSpecId, now.getFullYear(), now.getMonth()).then(setAvailDates);
  }, [selSpecId, getAvailableDays]);

  useEffect(() => {
    if (!selDate || !selSpecId) { setSlotsForDate([]); return; }
    getAvailableSlots(selSpecId, selDate.toISOString().split("T")[0]).then(setSlotsForDate);
  }, [selDate, selSpecId, getAvailableSlots]);

  useEffect(() => {
    if (!reschedApptId) { setReschedAvailDates([]); return; }
    const appt = appointments.find(a => a.id === reschedApptId);
    if (!appt) { setReschedAvailDates([]); return; }
    const now = new Date();
    getAvailableDays(appt.specialistId, now.getFullYear(), now.getMonth()).then(setReschedAvailDates);
  }, [reschedApptId, appointments, getAvailableDays]);

  useEffect(() => {
    if (!reschedDate || !reschedApptId) { setReschedSlotsForDate([]); return; }
    const appt = appointments.find(a => a.id === reschedApptId);
    if (!appt) { setReschedSlotsForDate([]); return; }
    getAvailableSlots(appt.specialistId, reschedDate.toISOString().split("T")[0]).then(setReschedSlotsForDate);
  }, [reschedDate, reschedApptId, appointments, getAvailableSlots]);

  const deptSpecialists = selDept ? getSpecialists(selDept) : [];
  const selSpec = deptSpecialists.find(s => s.id === selSpecId);

  const handleConfirmCita = () => {
    createAppointment({ studentId: user!.id, studentName: user!.name, specialistId: selSpecId!, department: selDept!, motivo: selReason, modality: selModality, preferredDate: selDate!.toISOString().split("T")[0], preferredTime: selSlot! });
    setStep(4);
  };

  const handleConfirmResch = () => {
    rescheduleAppointment(reschedApptId!, reschedDate!.toISOString().split("T")[0], reschedSlot!, 'student', selModality);
    toast.success("Cita reagendada exitosamente");
    setShowResch(false); setReschedApptId(null); setReschedDate(null); setReschedSlot(null);
  };

  const eventTypeBadge = (t: string) => t === "conferencia" ? "bg-[#ede9fe] text-[#7c3aed]" : "bg-[#dbeafe] text-[#2563EB]";

  if (!user) return null;
  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto w-full pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido(a), <span className="text-blue-600">{user.name?.split(" ")[0]}</span></h1>
            <p className="text-slate-500 mt-1 font-medium">{user.carrera || "Estudiante"} <span className="mx-2 text-slate-300">•</span> Semestre {user.semestre || "—"} <span className="mx-2 text-slate-300">•</span> No. Control: {user.matricula || "—"}</p>
          </div>
          <div className="flex items-center gap-3">
            <Btn variant="outline" onClick={() => setShowResources(true)} size="lg" className="border-slate-200 text-slate-600 hover:bg-slate-50">
              <BookOpen className="w-5 h-5" /> Mis Recursos
            </Btn>
            <Btn onClick={() => { setShowCita(true); resetCita(); }} size="lg" className="shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30">
              <CalendarCheck className="w-5 h-5" /> Solicitar Cita
            </Btn>
          </div>
        </div>

        {/* Premium Banner Carousel */}
        <div className="relative bg-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-xl shadow-blue-900/10 border border-slate-100 group aspect-[1/1] sm:aspect-[21/9] lg:aspect-[3/1]">
          <div
            className="flex h-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activeBannerIndex * 100}%)` }}
          >
            {events.map((ev, i) => (
              <div key={ev.id} className="relative w-full h-full shrink-0 overflow-hidden">
                <img
                  src={ev.imageUrl}
                  alt={ev.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 sm:p-12 text-center">
                  <div className="max-w-4xl space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 duration-1000 delay-300">
                    <div className="flex justify-center gap-2 mb-1 sm:mb-2">
                      <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[0.6rem] sm:text-[0.7rem] font-black uppercase tracking-[0.2em] shadow-lg ${ev.type === "conferencia" ? "bg-violet-600 text-white" : "bg-blue-600 text-white"}`}>
                        {ev.type}
                      </span>
                      <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[0.6rem] sm:text-[0.7rem] font-black uppercase tracking-[0.2em] border border-white/20">
                        {ev.department}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-2xl uppercase italic tracking-tighter">
                      {ev.title}
                    </h2>
                    <p className="text-white/90 text-xs sm:text-base md:text-lg lg:text-xl font-medium line-clamp-2 max-w-2xl mx-auto drop-shadow-md hidden sm:block">
                      {ev.description}
                    </p>
                    <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                      <Btn onClick={() => {
                        if (ev.type === 'taller' && ev.registrationUrl) {
                          window.open(ev.registrationUrl, '_blank');
                        } else if (ev.type === 'conferencia') {
                          setSelConf(ev);
                          setShowConfModal(true);
                        } else {
                          toast.success("¡Registrado en el evento!");
                        }
                      }} size="lg" className="bg-slate-900 text-white hover:bg-black border-0 shadow-2xl px-8 py-3 sm:px-12 sm:py-4 uppercase italic font-black tracking-tighter text-sm sm:text-lg transform hover:scale-105 transition-transform active:scale-95">
                        {ev.type === 'conferencia' ? 'Más información' : '¡Registrarme Ahora!'}
                      </Btn>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-white/70 text-[0.6rem] sm:text-xs font-black uppercase italic tracking-[0.3em] pt-2 sm:pt-4 border-t border-white/10 w-fit mx-auto">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" /> {new Date(ev.date).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
            {events.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveBannerIndex(i)}
                className={`w-3 h-3 rounded-full transition-all duration-300 border-2 ${i === activeBannerIndex ? "bg-white border-white w-8" : "bg-white/20 border-white/40 hover:bg-white/40 group-hover:scale-110"}`}
              />
            ))}
          </div>

          {/* Arrows */}
          <button
            onClick={() => setActiveBannerIndex(prev => (prev - 1 + events.length) % events.length)}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10 opacity-0 group-hover:opacity-100 hidden sm:block"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveBannerIndex(prev => (prev + 1) % events.length)}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10 opacity-0 group-hover:opacity-100 hidden sm:block"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map(s => (
            <StatCard key={s.label} label={s.label.toUpperCase()} value={s.value} icon={s.icon} gradient={s.bg} />
          ))}
        </div>

        {/* Appointments tabs */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Mis Citas</h3>
          <TabNav
            tabs={[{ key: "proximas", label: `Próximas(${proximas.length})` }, { key: "historial", label: `Historial(${historial.length})` }]}
            active={activeApptTab}
            onSelect={setActiveApptTab}
          />
          <div className="mt-6 space-y-4">
            {activeApptTab === "proximas" && (proximas.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><CalendarCheck className="w-8 h-8 text-slate-300" /></div>
                <p className="text-slate-500 font-medium">No tienes citas próximas</p>
              </div>
            ) : proximas.map(appt => {
              const dconf = DEPT_CONFIG[appt.department] || DEPT_CONFIG["Psicología"];
              return (
                <div key={appt.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className={`w-16 h-16 ${dconf.bg} rounded-2xl flex items-center justify-center shrink-0 hidden sm:flex`}>
                      <dconf.icon className="w-8 h-8" style={{ color: dconf.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                        <div className="flex items-center gap-3">
                          <p className="text-slate-900 font-bold text-lg">{appt.department}</p>
                          <StatusBadge status={appt.status} />
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${appt.modality === 'Virtual' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>{appt.modality}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 font-medium">{new Date(appt.date + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} a las {appt.time}</p>
                      <div className="flex items-center gap-3 mt-4">
                        <Avatar name={appt.specialistName} size="sm" />
                        <p className="text-slate-700 text-sm">Especialista: <span className="font-semibold text-slate-900">{appt.specialistName}</span></p>
                      </div>
                      {appt.motivo && <p className="text-slate-500 mt-3 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 italic">Motivo: {appt.motivo}</p>}
                      {appt.modality === "Virtual" && (
                        <div className="mt-3 flex items-start gap-3 p-4 bg-teal-50/50 border border-teal-100 rounded-xl">
                          <Info className="w-5 h-5 text-teal-600 shrink-0" />
                          <p className="text-teal-900 text-sm font-medium leading-relaxed">Esta sesión es virtual. Recibirás el enlace de conexión en tu correo institucional previo a la cita.</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 md:items-end shrink-0 border-t border-slate-100 md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                      <Btn variant="outline" className="w-full md:w-auto" onClick={() => { setReschedApptId(appt.id); setReschedDate(null); setReschedSlot(null); setShowResch(true); }}>
                        <RefreshCw className="w-4 h-4" /> Reagendar
                      </Btn>
                      <Btn variant="ghost" className="w-full md:w-auto text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100" onClick={() => {
                        const apptDate = new Date(appt.date + "T" + appt.time);
                        const now = new Date();
                        const diff = apptDate.getTime() - now.getTime();
                        if (diff < 24 * 60 * 60 * 1000) {
                          return toast.error("Las citas solo pueden cancelarse con al menos 24 horas de anticipación.");
                        }
                        setCancelApptId(appt.id);
                        setCancelReason("");
                        setShowCancelModal(true);
                      }}>
                        <XCircle className="w-4 h-4" /> Cancelar
                      </Btn>
                    </div>
                  </div>
                </div>
              );
            }))}
            {activeApptTab === "historial" && (historial.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><XCircle className="w-8 h-8 text-slate-300" /></div>
                <p className="text-slate-500 font-medium">No tienes citas en el historial</p>
              </div>
            ) : historial.map(appt => {
              const dconf = DEPT_CONFIG[appt.department] || DEPT_CONFIG["Psicología"];
              return (
                <div key={appt.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 ${dconf.bg} rounded-xl flex items-center justify-center shrink-0`}>
                      <dconf.icon className="w-6 h-6" style={{ color: dconf.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-slate-900 font-bold">{appt.department}</p>
                        <StatusBadge status={appt.status} />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">{new Date(appt.date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })} <span className="mx-1">•</span> {appt.time} <span className="mx-1">•</span> {appt.specialistName}</p>
                      {appt.notes && <p className={`italic text-xs mt-1 ${appt.status === "Cancelada" ? "text-rose-500 font-medium" : "text-slate-400"}`}>{appt.status === "Cancelada" ? "Motivo de cancelación: " : "Notas: "}{appt.notes}</p>}
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>



        {/* ── RESOURCES MODAL ── */}
        <Modal open={showResources} onClose={() => setShowResources(false)} title="Materiales y Recursos Educativos" subtitle="Explora contenido de apoyo por departamento" maxWidth="max-w-5xl">
          <div className="space-y-6">
            <TabNav
              tabs={Object.keys(DEPT_CONFIG).map(d => ({ key: d, label: d }))}
              active={activeResTab}
              onSelect={setActiveResTab}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 min-h-[400px]">
              {resources.filter(r => r.department === activeResTab).map(item => (
                <div key={item.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded-md ${item.type === 'video' ? 'bg-rose-100' : item.type === 'link' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                        {item.type === "video" && <Video className="w-3.5 h-3.5 text-rose-600" />}
                        {item.type === "link" && <ExternalLink className="w-3.5 h-3.5 text-blue-600" />}
                        {item.type === "image" && <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[0.65rem]">{item.type === "image" ? "Imagen" : item.type === "video" ? "Video" : "Enlace"}</span>
                    </div>
                    <p className="text-slate-900 font-bold leading-tight mb-2">{item.title}</p>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">{item.description}</p>
                    <div className="mt-4 pt-4 border-t border-slate-50">
                      <Btn variant="outline" className="w-full text-blue-600 border-blue-100 hover:bg-blue-50" onClick={() => {
                        const resourceLink = item.fileUrl || item.url;
                        if (item.type === "image") {
                          setPreviewImg({ url: resourceLink !== "#" ? resourceLink : (item.imageUrl || ""), title: item.title });
                        } else if (resourceLink && resourceLink !== "#") {
                          window.open(resourceLink, '_blank');
                        } else {
                          toast.error("Este recurso no tiene un archivo o enlace válido.");
                        }
                      }}>
                        {item.type === "image" ? <Maximize2 className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />} {item.type === "image" ? "Ver Imagen" : "Acceder al recurso"}
                      </Btn>
                    </div>
                  </div>
                </div>
              ))}
              {resources.filter(r => r.department === activeResTab).length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                  <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-medium">No hay recursos disponibles para este departamento actualmente.</p>
                </div>
              )}
            </div>
          </div>
        </Modal>

        {/* ── NEW APPOINTMENT MODAL ── */}
        <Modal open={showCita} onClose={() => { setShowCita(false); resetCita(); }} title="Solicitar Nueva Cita"
          subtitle={["", "Paso 1: Selecciona el departamento de atención", "Paso 2: Especialista, motivo y modalidad de sesión", "Paso 3: Fecha, horario y términos", "¡Cita solicitada exitosamente!"][step]}
          maxWidth="max-w-4xl">

          {/* Step indicator */}
          {step < 4 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-sm ${s === step ? "bg-blue-600 text-white scale-110 ring-4 ring-blue-100" : s < step ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </div>
                  {s < 3 && <div className={`w-12 sm:w-20 h-1 rounded-full transition-all duration-300 ${s < step ? "bg-emerald-500" : "bg-slate-100"}`} />}
                </div>
              ))}
            </div>
          )}

          <div className="min-h-[300px]">
            {/* Step 1: Department */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {Object.entries(DEPT_CONFIG).map(([name, cfg]) => (
                  <button key={name} onClick={() => { setSelDept(name); setSelSpecId(null); setSelReason(""); setStep(2); }}
                    className={`w-full flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left group
                  ${selDept === name ? "border-blue-600 bg-blue-50/50 shadow-md" : "border-slate-100 hover:border-blue-300 hover:bg-slate-50"}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${cfg.bg}`}>
                      <cfg.icon className="w-7 h-7" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <h4 className="text-slate-900 font-bold text-lg">{name}</h4>
                      <p className="text-slate-500 text-sm font-medium mt-1">{getSpecialists(name).length} especialista(s) disponible(s)</p>
                    </div>
                    <div className={`ml-auto w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${selDept === name ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200"}`}>
                      <ChevronRight className={`w-4 h-4 ${selDept === name ? "text-white" : "text-transparent"}`} />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Specialist + reason + modality */}
            {step === 2 && selDept && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block text-slate-900 font-bold text-sm"><Users className="w-4 h-4 inline mr-1.5 text-blue-600" />Especialista preferido</label>
                    <div className="space-y-6">
                      {["Matutino", "Vespertino"].map(shift => {
                        const specsInShift = deptSpecialists.filter(s => (s.shift || "Matutino") === shift);
                        if (specsInShift.length === 0) return null;
                        
                        return (
                          <div key={shift} className="space-y-3">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${shift === 'Matutino' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                              Turno {shift}
                            </h5>
                            <div className="space-y-2">
                              {specsInShift.map(sp => (
                                <button key={sp.id} onClick={() => setSelSpecId(sp.id)}
                                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${selSpecId === sp.id ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"}`}>
                                  <Avatar name={sp.name} size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-slate-900 font-semibold text-sm truncate">{sp.name}</p>
                                    <p className="text-slate-500 text-xs truncate">{sp.email}</p>
                                  </div>
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selSpecId === sp.id ? "border-blue-600" : "border-slate-200"}`}>
                                    {selSpecId === sp.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="block text-slate-900 font-bold text-sm">Motivo de la consulta</label>
                      <div className="space-y-2">
                        {(DEPT_REASONS[selDept] || []).map(r => (
                          <button key={r} onClick={() => setSelReason(r)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer text-sm font-medium ${selReason === r ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50"}`}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-slate-900 font-bold text-sm">Modalidad de la sesión</label>
                      <div className="grid grid-cols-2 gap-3">
                        {["Presencial", "Virtual"].map(m => (
                          <button key={m} onClick={() => setSelModality(m)}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all cursor-pointer font-bold text-sm ${selModality === m ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 text-slate-500 hover:border-slate-300"}`}>
                            {m === "Virtual" ? <Video className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Btn variant="outline" onClick={() => setStep(1)} className="flex-1">Atrás</Btn>
                  <Btn onClick={() => { setSelDate(null); setSelSlot(null); setStep(3); }} disabled={!selSpecId || !selReason} className="flex-1">
                    Continuar
                  </Btn>
                </div>
              </div>
            )}

            {/* Step 3: Calendar + slots + Confidentiality */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-slate-900 font-bold text-sm mb-3">1. Selecciona una fecha</h4>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <MiniCalendar selectedDate={selDate} onSelect={d => { setSelDate(d); setSelSlot(null); }} availableDates={availDates} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-bold text-sm mb-3">2. Elige un horario</h4>
                    <div className="min-h-[220px]">
                      {selDate && slotsForDate.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {slotsForDate.map(slot => (
                            <button key={slot} onClick={() => setSelSlot(slot)}
                              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer font-bold text-sm shadow-sm
                            ${selSlot === slot ? "border-blue-600 bg-blue-600 text-white" : "border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50"}`}>
                              <Clock className="w-4 h-4" />{slot}
                            </button>
                          ))}
                        </div>
                      ) : selDate ? (
                        <div className="flex flex-col items-center justify-center h-full text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                          <Clock className="w-10 h-10 text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">No hay horarios disponibles este día.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                          <CalendarCheck className="w-10 h-10 text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">Haz clic en un día marcado en el calendario</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Confidentiality Alert */}
                <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${confidentialityAccepted ? "border-emerald-500 bg-emerald-50/50" : "border-amber-400 bg-amber-50"}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${confidentialityAccepted ? "bg-emerald-100" : "bg-amber-100"}`}>
                      <ShieldCheck className={`w-6 h-6 ${confidentialityAccepted ? "text-emerald-600" : "text-amber-600"}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-slate-900 font-bold text-sm mb-1">Aviso de Confidencialidad Institucional</h4>
                      <p className="text-slate-600 text-sm leading-relaxed mb-4">
                        Toda la información compartida durante la consulta es estrictamente <strong className="text-slate-900">confidencial</strong>.
                        Los datos serán tratados de acuerdo con nuestras políticas de privacidad y solo serán utilizados con fines de atención profesional.
                      </p>
                      <label className="flex items-center gap-3 cursor-pointer group w-max">
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${confidentialityAccepted ? "bg-emerald-500 border-emerald-500" : "border-slate-300 group-hover:border-slate-400"}`}>
                          {confidentialityAccepted && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <input type="checkbox" checked={confidentialityAccepted} onChange={e => setConfidentialityAccepted(e.target.checked)} className="sr-only" />
                        <span className="text-slate-900 font-bold text-sm select-none group-hover:text-emerald-700 transition-colors">Acepto los términos de confidencialidad</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-slate-100">
                  <Btn variant="outline" onClick={() => setStep(2)} className="flex-1">Atrás</Btn>
                  <Btn onClick={handleConfirmCita} disabled={!selSlot || !selDate || !confidentialityAccepted} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 border-0">
                    Confirmar cita
                  </Btn>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20" />
                  <div className="relative w-full h-full bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">¡Cita Programada!</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Tu solicitud ha sido registrada exitosamente. Un especialista la revisará en breve.</p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-sm mx-auto text-left space-y-3 mb-8">
                  <div className="flex items-center gap-3"><CalendarCheck className="w-5 h-5 text-slate-400" /><p className="text-slate-700 font-medium text-sm">{selDate?.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })} a las {selSlot}</p></div>
                  <div className="flex items-center gap-3"><Users className="w-5 h-5 text-slate-400" /><p className="text-slate-700 font-medium text-sm">{selSpec?.name} <span className="text-slate-400">({selDept})</span></p></div>
                  <div className="flex items-center gap-3"><Info className="w-5 h-5 text-slate-400" /><p className="text-slate-700 font-medium text-sm">{selModality}</p></div>
                </div>

                <Btn onClick={() => setShowCita(false)} className="px-10">Cerrar y volver al inicio</Btn>
              </div>
            )}
          </div>
        </Modal>

        {/* ── RESCHEDULE MODAL ── */}
        <Modal open={showResch} onClose={() => setShowResch(false)} title="Reagendar Cita" subtitle="Selecciona una nueva fecha y horario disponible" maxWidth="max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <MiniCalendar selectedDate={reschedDate} onSelect={d => { setReschedDate(d); setReschedSlot(null); }} availableDates={reschedAvailDates} />
            </div>
            <div className="flex flex-col">
              <h4 className="text-slate-900 font-bold text-sm mb-4">{reschedDate ? `Horarios — ${reschedDate.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "long" })} ` : "Horarios disponibles"}</h4>
              {reschedDate && reschedSlotsForDate.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {reschedSlotsForDate.map((slot: string) => (
                    <button key={slot} onClick={() => setReschedSlot(slot)}
                      className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 transition-all cursor-pointer font-bold text-sm shadow-sm ${reschedSlot === slot ? "border-blue-600 bg-blue-600 text-white" : "border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50"}`}>
                      <Clock className="w-4 h-4" />{slot}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 mb-6">
                  <Clock className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium text-center text-sm">{reschedDate ? "Sin horarios disponibles" : "Selecciona una fecha en el calendario"}</p>
                </div>
              )}
              <div className="space-y-3 mb-6">
                <label className="block text-slate-900 font-bold text-sm">Modalidad de la sesión</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Presencial", "Virtual"].map(m => (
                    <button key={m} type="button" onClick={() => setSelModality(m)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all cursor-pointer font-bold text-sm ${selModality === m ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 text-slate-500 hover:border-slate-300"}`}>
                      {m === "Virtual" ? <Video className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-auto">
                <Btn onClick={handleConfirmResch} disabled={!reschedSlot} className="w-full">Confirmar nuevo horario</Btn>
              </div>
            </div>
          </div>
        </Modal>

        {/* ── IMAGE PREVIEW ── */}
        <Modal open={!!previewImg} onClose={() => setPreviewImg(null)} title={previewImg?.title || "Vista Previa"} maxWidth="max-w-4xl">
          {previewImg && <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center p-2"><img src={previewImg.url} alt={previewImg.title} className="w-full max-h-[75vh] object-contain rounded-xl shadow-inner" /></div>}
        </Modal>

        {/* ── CONFERENCE INFO MODAL ── */}
        <Modal open={showConfModal} onClose={() => setShowConfModal(false)} title="Información de la Conferencia" subtitle="Detalles y objetivos del evento" maxWidth="max-w-2xl">
          {selConf && (
            <div className="space-y-6">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <img src={selConf.imageUrl} alt={selConf.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 bg-violet-600 text-white text-[0.6rem] font-black uppercase tracking-wider rounded-full shadow-md">Conferencia</span>
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-900 text-[0.6rem] font-black uppercase tracking-wider rounded-full shadow-sm border border-slate-200">{selConf.department}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight leading-tight">{selConf.title}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Fecha</p>
                      <p className="text-sm font-bold text-slate-700">{new Date(selConf.date + "T12:00:00").toLocaleDateString("es-MX", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Hora</p>
                      <p className="text-sm font-bold text-slate-700">{selConf.time || "Por confirmar"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <h4 className="text-blue-900 text-xs font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Descripción Completa
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {selConf.description}
                  </p>
                </div>

                <div className="pt-4">
                  <Btn onClick={() => { setShowConfModal(false); toast.success("¡Interés registrado! Te enviaremos un recordatorio."); }} className="w-full bg-slate-900 text-white hover:bg-black font-black uppercase italic tracking-widest py-4 rounded-2xl shadow-xl">
                    ¡Registrarme Ahora!
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>

      {/* ── CANCEL MODAL ── */}
      <Modal open={showCancelModal} onClose={() => setShowCancelModal(false)} title="¿Deseas cancelar tu cita?" subtitle="Te recomendamos reagendar para no perder tu seguimiento.">
        <div className="space-y-6 mt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm">Si tienes un inconveniente con el horario, puedes elegir uno nuevo. Si cancelas definitivamente, tendrás que solicitar una nueva cita desde cero.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-slate-700 font-bold text-sm">Motivo de cancelación (requerido para cancelar definitivamente)</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Ej. Problemas de salud, choque con clases..."
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none text-sm"
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
            <Btn variant="ghost" onClick={() => setShowCancelModal(false)} className="flex-1">Volver</Btn>
            <Btn
              variant="outline"
              onClick={() => {
                setShowCancelModal(false);
                setReschedApptId(cancelApptId);
                setReschedDate(null);
                setReschedSlot(null);
                setShowResch(true);
              }}
              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50">
              <RefreshCw className="w-4 h-4" /> Mejor Reagendar
            </Btn>
            <Btn
              className="flex-1 bg-rose-600 hover:bg-rose-700"
              disabled={cancelReason.trim().length < 5}
              onClick={() => {
                if (cancelApptId) {
                  updateAppointmentStatus(cancelApptId, "Cancelada", cancelReason, true);
                  toast.success("Cita cancelada correctamente.");
                  setShowCancelModal(false);
                }
              }}>
              Cancelar Cita
            </Btn>
          </div>
        </div>
      </Modal>

    </AppShell>
  );
}

// ─────────────────────────────────────────────
// SPECIALIST DASHBOARD
// ─────────────────────────────────────────────
function SpecialistDashboard() {
  const { user } = useAuth();
  const { specialists, specialistsLoaded, getAppointments, updateAppointmentStatus, addScheduleSlot, removeScheduleSlot, addEvent, addResource, rescheduleAppointment, getAvailableDays, getAvailableSlots } = useStore();
  const spec = specialists.find(s => s.userId === user?.id);
  const dept = (user?.department || "Psicología");

  const [activeTab, setActiveTab] = useState("calendar");

  const allAppts = spec ? getAppointments({ specialistId: spec.id }) : [];
  const pendientes = allAppts.filter(a => a.status === "Pendiente");
  const confirmadas = allAppts.filter(a => a.status === "Confirmada");
  const completadas = allAppts.filter(a => a.status === "Completada");
  const totalPatients = new Set(allAppts.map(a => a.studentName)).size;

  // Calendar
  const [selDate, setSelDate] = useState(new Date());
  const [activeListTab, setActiveListTab] = useState("pending");
  const apptDates = [...new Set(allAppts.filter(a => a.status !== "Cancelada").map(a => a.date))].map(d => new Date(d + "T12:00:00"));
  const dayAppts = allAppts.filter(a => a.date === selDate.toISOString().split("T")[0] && a.status !== "Cancelada");

  // Action modal
  const [actionAppt, setActionAppt] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState("");

  const handleAction = (appt: Appointment, type: string) => { setActionAppt(appt); setActionType(type); setActionNotes(""); };
  const confirmAction = () => {
    const statusMap: Record<string, string> = { confirm: "Confirmada", complete: "Completada", cancel: "Cancelada" };
    updateAppointmentStatus(actionAppt!.id, statusMap[actionType!], actionNotes || undefined);
    toast.success(actionType === "confirm" ? "Cita confirmada" : actionType === "complete" ? "Cita completada" : "Cita cancelada");
    setActionAppt(null); setActionType(null);
  };

  // Reschedule state
  const [showResch, setShowResch] = useState(false);
  const [reschedApptId, setReschedApptId] = useState<string | null>(null);
  const [selReschedDate, setSelReschedDate] = useState<Date | null>(null);
  const [selReschedSlot, setSelReschedSlot] = useState<string | null>(null);

  const openReschedule = (appt: Appointment) => {
    setReschedApptId(appt.id);
    setSelReschedDate(null);
    setSelReschedSlot(null);
    setShowResch(true);
  };

  const handleRescheduleConfirm = () => {
    if (!reschedApptId || !selReschedDate || !selReschedSlot) return;
    rescheduleAppointment(reschedApptId, selReschedDate.toISOString().split("T")[0], selReschedSlot, 'specialist');
    toast.success("Cita reagendada exitosamente");
    setShowResch(false);
  };

  const [reschedDates, setReschedDates] = useState<Date[]>([]);
  const [reschedSlots, setReschedSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!spec) { setReschedDates([]); return; }
    getAvailableDays(spec.id, new Date().getFullYear(), new Date().getMonth()).then(setReschedDates);
  }, [spec, getAvailableDays]);

  useEffect(() => {
    if (!selReschedDate || !spec) { setReschedSlots([]); return; }
    getAvailableSlots(spec.id, selReschedDate.toISOString().split("T")[0]).then(setReschedSlots);
  }, [selReschedDate, spec, getAvailableSlots]);

  // Schedule management
  const [showAddSched, setShowAddSched] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [newDay, setNewDay] = useState<number | string>(1);
  const [newWeek, setNewWeek] = useState<number | string>("both");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("13:00");
  const [selectedBaseDate, setSelectedBaseDate] = useState<string | undefined>(undefined);

  const openEditSlot = (slot: any) => {
    setEditingSlotId(slot.id);
    setNewDay(slot.dayOfWeek);
    setNewWeek(slot.week === null || slot.week === undefined ? "both" : slot.week);
    setNewStart(slot.startTime);
    setNewEnd(slot.endTime);
    setSelectedBaseDate(slot.specificDate || undefined);
    setShowAddSched(true);
  };

  const handleOpenAddSlot = (day: number, week: number, dateStr: string) => {
    setEditingSlotId(null);
    setNewDay(day);
    setNewWeek("date"); // Nueva opción para "Solo este día"
    setNewStart("09:00");
    setNewEnd("13:00");
    setSelectedBaseDate(dateStr);
    setShowAddSched(true);
  };

  const isPastDay = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const handleAddSched = () => {
    if (!spec) return;

    const dayInt = parseInt(String(newDay));
    const isSpecificDate = newWeek === "date";
    const weekVal = (newWeek === "both" || newWeek === "date") ? undefined : parseInt(String(newWeek));

    // Validar solapamiento
    const hasOverlap = spec.schedule.some(s => {
      // Ignorar el mismo slot si estamos editando
      if (editingSlotId && s.id === editingSlotId) return false;

      const sameDay = s.dayOfWeek === dayInt;
      // Prisma returns null if field is not set, while frontend uses undefined or 'both'
      const sWeek = s.week === null ? undefined : s.week;
      const weekConflict = sWeek === undefined || weekVal === undefined || sWeek === weekVal;
      const dateConflict = isSpecificDate ? s.specificDate === selectedBaseDate : (s.specificDate === null || s.specificDate === undefined);
      const timeOverlap = newStart < s.endTime && newEnd > s.startTime;

      return sameDay && weekConflict && dateConflict && timeOverlap;
    });

    if (hasOverlap) {
      toast.error("Ya existe un horario que se solapa con este rango para el día y semana seleccionados.");
      return;
    }

    if (editingSlotId) {
      removeScheduleSlot(spec.id, editingSlotId);
    }

    addScheduleSlot(spec.id, {
      dayOfWeek: dayInt,
      startTime: newStart,
      endTime: newEnd,
      available: true,
      week: weekVal,
      specificDate: isSpecificDate ? selectedBaseDate : undefined
    });
    setShowAddSched(false);
    setEditingSlotId(null);
    toast.success(editingSlotId ? "Horario actualizado exitosamente" : "Horario agregado exitosamente.");
  };

  // Content form
  const [ctitle, setCtitle] = useState(""), [cdesc, setCdesc] = useState(""), [ctype, setCtype] = useState("video"), [curl, setCurl] = useState(""), [cimgUrl, setCimgUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handlePublishContent = () => {
    if (!ctitle) { toast.error("El título es obligatorio"); return; }

    let finalFileUrl = undefined;
    if (selectedFile) {
      finalFileUrl = URL.createObjectURL(selectedFile);
    }

    addResource({
      department: dept,
      type: ctype,
      title: ctitle,
      description: cdesc,
      url: curl || "#",
      imageUrl: cimgUrl || undefined,
      fileUrl: finalFileUrl,
      fileName: selectedFile?.name
    });

    toast.success("Contenido publicado exitosamente");
    setCtitle(""); setCdesc(""); setCurl(""); setCimgUrl(""); setSelectedFile(null);
  };

  // Event form
  const [evTitle, setEvTitle] = useState(""), [evDesc, setEvDesc] = useState(""), [evDate, setEvDate] = useState(""), [evTime, setEvTime] = useState(""), [evType, setEvType] = useState("taller"), [evImg, setEvImg] = useState("");
  const [selectedEventImg, setSelectedEventImg] = useState<File | null>(null);
  const [evRegUrl, setEvRegUrl] = useState("");

  const handlePublishEvent = () => {
    if (!evTitle || !evDate) { toast.error("Título y fecha son obligatorios"); return; }

    let finalImg = evImg || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80";
    if (selectedEventImg) {
      finalImg = URL.createObjectURL(selectedEventImg);
    }

    addEvent({
      title: evTitle,
      description: evDesc,
      department: dept,
      date: evDate,
      time: evTime,
      type: evType,
      imageUrl: finalImg,
      registrationUrl: evType === "taller" ? evRegUrl : undefined
    });

    toast.success("Evento publicado exitosamente");
    setEvTitle(""); setEvDesc(""); setEvDate(""); setEvTime(""); setEvImg(""); setEvRegUrl(""); setSelectedEventImg(null);
  };

  if (!specialistsLoaded) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Cargando perfil...</p>
    </div>
  );

  if (!user || !spec) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Users className="w-8 h-8 text-slate-400" /></div>
      <p className="text-slate-500 font-medium">No se encontró perfil de especialista.</p>
      <p className="text-slate-400 text-sm mt-1">Verifica que tu usuario esté vinculado a un especialista en la base de datos.</p>
    </div>
  );

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50/50 hover:bg-slate-50 transition-colors shadow-sm text-slate-700 text-sm";

  const statsData = [
    { label: "Pendientes", value: pendientes.length, icon: Clock, gradient: "from-amber-500 to-amber-600 shadow-amber-500/20" },
    { label: "Confirmadas", value: confirmadas.length, icon: CalendarCheck, gradient: "from-blue-600 to-indigo-600 shadow-blue-600/20" },
    { label: "Completadas", value: completadas.length, icon: CheckCircle2, gradient: "from-emerald-500 to-emerald-600 shadow-emerald-500/20" },
    { label: "Pacientes", value: totalPatients, icon: Users, gradient: "from-violet-500 to-violet-600 shadow-violet-500/20" },
  ];

  const sidebarTabs = [
    { key: "calendar", label: "Mi Calendario", icon: CalendarDays },
    { key: "schedules", label: "Mis Horarios", icon: Clock },
    { key: "content", label: "Publicar Contenido", icon: FileText },
    { key: "event", label: "Publicar Evento", icon: Megaphone }
  ];

  return (
    <AppShell sidebar={{ tabs: sidebarTabs, active: activeTab, onSelect: setActiveTab, badges: { calendar: pendientes.length } }}>
      <div className="space-y-8 max-w-7xl mx-auto w-full pb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de {dept}</h1>
          <p className="text-slate-500 mt-1 font-medium">{spec.name} — Gestión de citas y agenda</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* ─── Calendar Tab ─── */}
          {activeTab === "calendar" && (
            <div className="p-6">
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 h-full">
                    <div className="flex items-center gap-3 mb-4"><div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><CalendarDays className="w-4 h-4 text-blue-600" /></div><h3 className="text-slate-900 font-bold">Mi Calendario</h3></div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2"><MiniCalendar selectedDate={selDate} onSelect={setSelDate} highlightedDates={apptDates} /></div>
                    <div className="flex items-center gap-6 mt-4 justify-center">
                      <span className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300" /> Con citas</span>
                      <span className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="w-3 h-3 rounded-full bg-blue-600" /> Seleccionado</span>
                    </div>
                    {/* Schedule summary */}
                    <div className="w-full mt-6 border-t border-slate-200 pt-5">
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3">Horario de Atención Habitual</p>
                      <div className="flex flex-wrap gap-2">
                        {spec.schedule.map(sl => (
                          <span key={sl.id} className="px-3 py-1 bg-white border border-slate-200 rounded-md text-slate-600 text-xs font-semibold shadow-sm">{DAY_NAMES[sl.dayOfWeek]} {sl.startTime}-{sl.endTime}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 flex flex-col rounded-2xl border border-slate-200 p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center"><Clock className="w-4 h-4 text-teal-600" /></div>
                      <div>
                        <h3 className="text-slate-900 font-bold leading-tight">{selDate ? `Agenda del día` : "Selecciona una fecha"}</h3>
                        <p className="text-slate-500 text-xs font-medium mt-0.5">{selDate?.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}</p>
                      </div>
                    </div>
                    {dayAppts.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                        <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">No tienes citas programadas para este día.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-2 overflow-y-auto max-h-[500px] pr-1">
                        {dayAppts.sort((a, b) => a.time.localeCompare(b.time)).map(appt => (
                          <div key={appt.id} className="flex flex-col xl:flex-row xl:items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-700 shrink-0">
                              <span className="text-sm font-black">{appt.time.split(':')[0]}</span>
                              <span className="text-[0.65rem] font-bold text-slate-400 -mt-1">{appt.time.split(':')[1]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1"><p className="text-slate-900 font-bold truncate">{appt.studentName}</p><StatusBadge status={appt.status} /></div>
                              <p className="text-slate-500 text-xs font-medium truncate flex items-center gap-1.5"><Tag className="w-3 h-3" /> {appt.motivo} <span className="text-slate-300 mx-1">•</span> {appt.modality}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              {appt.status === "Pendiente" && <>
                                <Btn size="sm" onClick={() => handleAction(appt, "confirm")} className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20">Confirmar</Btn>
                                <Btn size="sm" variant="outline" onClick={() => openReschedule(appt)} className="text-blue-600 border-blue-100 hover:bg-blue-50">Reagendar</Btn>
                                <Btn size="sm" variant="outline" onClick={() => handleAction(appt, "cancel")} className="text-rose-600 hover:bg-rose-50 hover:border-rose-200 px-2"><XCircle className="w-4 h-4" /></Btn>
                              </>}
                              {appt.status === "Confirmada" && <>
                                <Btn size="sm" onClick={() => handleAction(appt, "complete")} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20">Completar</Btn>
                                <Btn size="sm" variant="outline" onClick={() => openReschedule(appt)} className="text-blue-600 border-blue-100 hover:bg-blue-50">Reagendar</Btn>
                                <Btn size="sm" variant="outline" onClick={() => handleAction(appt, "cancel")} className="text-rose-600 hover:bg-rose-50 hover:border-rose-200 px-2"><XCircle className="w-4 h-4" /></Btn>
                              </>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Appointment list tabs */}
              <div className="mt-8 border-t border-slate-100 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Listado de Citas</h3>
                  <TabNav
                    tabs={[{ key: "pending", label: `Pendientes(${pendientes.length})` }, { key: "confirmed", label: `Confirmadas(${confirmadas.length})` }, { key: "history", label: `Historial(${completadas.length})` }]}
                    active={activeListTab}
                    onSelect={setActiveListTab}
                  />
                </div>

                {(() => {
                  const list = activeListTab === "pending" ? pendientes : activeListTab === "confirmed" ? confirmadas : completadas;
                  return list.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 text-center">
                      <CalendarCheck className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-slate-500 font-medium tracking-tight">No hay citas en esta categoría.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {list.map(appt => (
                        <div key={appt.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                          <div className="flex items-center gap-4">
                            <Avatar name={appt.studentName} />
                            <div>
                              <p className="text-slate-900 font-bold">{appt.studentName}</p>
                              <p className="text-slate-500 text-sm font-medium mt-0.5">{new Date(appt.date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long" })} <span className="mx-1 text-slate-300">•</span> {appt.time} <span className="mx-1 text-slate-300">•</span> {appt.modality}</p>
                              {appt.motivo && <p className="text-slate-400 text-xs italic mt-1.5 flex items-center gap-1"><Tag className="w-3 h-3" /> {appt.motivo}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={appt.status} />
                            {(appt.status === "Pendiente" || appt.status === "Confirmada") && (
                              <>
                                {appt.status === "Pendiente" && <Btn size="sm" onClick={() => handleAction(appt, "confirm")} className="bg-blue-600">Confirmar</Btn>}
                                {appt.status === "Confirmada" && <Btn size="sm" onClick={() => handleAction(appt, "complete")} className="bg-emerald-600">Completar</Btn>}
                                <Btn size="sm" variant="outline" onClick={() => openReschedule(appt)} className="text-blue-600">Reagendar</Btn>
                                <Btn size="sm" variant="ghost" onClick={() => handleAction(appt, "cancel")} className="text-rose-600 hover:bg-rose-50"><XCircle className="w-4 h-4" /></Btn>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ─── Schedules Tab ─── */}
          {activeTab === "schedules" && (
            <div className="p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Mis Horarios de Atención</h3>
                  <p className="text-slate-500 font-medium mt-1">Hoy es <span className="text-blue-600 font-bold">{new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span></p>
                  <p className="text-rose-500 text-xs font-bold mt-2 uppercase tracking-tight flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Se recomienda dar de alta horarios con 1 semana de anticipación.</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 border border-blue-100 rounded-2xl animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-blue-800 text-sm font-bold leading-tight">Haz clic en un día del calendario <br/><span className="text-blue-600 font-black uppercase text-[10px] tracking-widest">Para agregar un Horario</span></p>
                </div>
              </div>

              {[0, 1].map(weekOffset => {
                const today = new Date();
                // Si es domingo (0), el lunes actual es mañana. Si no, calcular el lunes de esta semana.
                const dayShift = today.getDay() === 0 ? 1 : 1 - today.getDay();
                const mondayOfCurrentWeek = new Date(today);
                mondayOfCurrentWeek.setDate(today.getDate() + dayShift + (weekOffset * 7));

                return (
                  <div key={weekOffset} className={weekOffset === 1 ? "mt-8" : ""}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-2 h-2 rounded-full ${weekOffset === 0 ? "bg-blue-600" : "bg-indigo-500"}`} />
                      <h4 className="text-slate-700 font-bold text-sm uppercase tracking-wider">{weekOffset === 0 ? "Semana Actual" : "Próxima Semana"}</h4>
                      <span className="text-slate-400 text-xs font-medium">
                        {new Date(mondayOfCurrentWeek).toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "")} — {(() => { const fri = new Date(mondayOfCurrentWeek); fri.setDate(fri.getDate() + 4); return fri.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", ""); })()}
                      </span>
                    </div>
                    <div className="flex overflow-x-auto md:grid md:grid-cols-5 gap-3 sm:gap-4 pb-4 md:pb-0 scroll-smooth no-scrollbar snap-x">
                      {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((day, i) => {
                        const dow = i + 1;
                        const dateObj = new Date(mondayOfCurrentWeek);
                        dateObj.setDate(mondayOfCurrentWeek.getDate() + i);
                        const isoDate = dateObj.toISOString().split("T")[0];
                        const daySlots = spec.schedule.filter(s => 
                          (s.specificDate === isoDate) || 
                          (s.specificDate === null && s.dayOfWeek === dow && (s.week === undefined || s.week === null || s.week === weekOffset))
                        );
                        const dateStr = `${dateObj.getDate()} ${dateObj.toLocaleDateString("es-MX", { month: "short" })}`.replace(".", "");
                        const isPast = dateObj < new Date(new Date().setHours(0, 0, 0, 0));

                        return (
                          <div 
                            key={`${weekOffset}-${day}`} 
                            onClick={() => !isPast && handleOpenAddSlot(dow, weekOffset, isoDate)}
                            className={`bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 min-h-[140px] sm:min-h-[160px] shadow-sm flex-shrink-0 w-[210px] sm:w-[240px] md:w-auto snap-start transition-all ${isPast ? "opacity-40" : "cursor-pointer hover:border-blue-400 hover:ring-4 hover:ring-blue-400/5 hover:bg-white"}`}
                          >
                            <div className="flex flex-col mb-3 sm:mb-4">
                              <p className="text-slate-900 font-bold uppercase tracking-wider text-[0.6rem] sm:text-xs">{day}</p>
                              <p className="text-indigo-600 font-black text-[0.55rem] sm:text-[0.65rem] uppercase">{dateStr}</p>
                            </div>
                            {daySlots.length > 0 ? (
                              <div className="space-y-1.5 sm:space-y-2">
                                {daySlots.map(s => (
                                  <div key={s.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 shadow-sm group">
                                    <span className="text-slate-700 font-bold text-[0.7rem] sm:text-sm tracking-tighter">{s.startTime}-{s.endTime}</span>
                                    {!isPast && (
                                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); openEditSlot(s); }} className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg p-1 transition-colors cursor-pointer"><Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); removeScheduleSlot(spec.id, s.id); toast.success("Horario eliminado exitosamente."); }} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center py-2">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 mb-1" />
                                <p className="text-slate-400 font-medium text-[0.6rem] sm:text-xs">Sin atención</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <Modal open={showAddSched} onClose={() => { setShowAddSched(false); setEditingSlotId(null); }} title={editingSlotId ? "Editar Horario" : "Agregar Horario"} subtitle={editingSlotId ? "Modifica los parámetros de este bloque de atención" : (
                <div className="flex items-center gap-2 text-blue-600 font-bold text-sm mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>{DAYS_FULL[Number(newDay)]} • {newWeek === "both" ? "Ambas Semanas" : newWeek === 0 ? "Semana Actual" : "Próxima Semana"}</span>
                </div>
              )} maxWidth="max-w-md">
                <div className="space-y-5">
                  {(editingSlotId) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-slate-900 font-bold text-sm">Día</label>
                        <select value={newDay} onChange={e => setNewDay(e.target.value)} className={inputCls}>
                          {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{DAYS_FULL[d]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-slate-900 font-bold text-sm">Semana</label>
                        <select value={newWeek} onChange={e => setNewWeek(e.target.value)} className={inputCls}>
                          <option value="date">Solo este día ({selectedBaseDate})</option>
                          <option value="both">Recursivo: Ambas Semanas</option>
                          <option value="0">Recursivo: Semana Actual</option>
                          <option value="1">Recursivo: Próxima Semana</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block mb-2 text-slate-900 font-bold text-sm">Hora de Inicio</label><input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className={inputCls} /></div>
                    <div><label className="block mb-2 text-slate-900 font-bold text-sm">Hora de Fin</label><input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className={inputCls} /></div>
                  </div>
                  <Btn onClick={handleAddSched} className="w-full bg-blue-600 text-white shadow-blue-600/20" size="lg">{editingSlotId ? "Guardar cambios" : "Guardar bloque de atención"}</Btn>
                </div>
              </Modal>
            </div>
          )}

          {/* ─── Publish Content Tab ─── */}
          {activeTab === "content" && (
            <div className="p-8">
              <div className="w-full">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Publicar Material Educativo</h3>
                <p className="text-slate-500 font-medium mb-8">Comparte recursos, videos o enlaces útiles para los estudiantes de la facultad. Aparecerá en la sección de Recursos del dashboard estudiantil.</p>

                <div className="space-y-5 bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div><label className="block mb-2 text-slate-900 font-bold text-sm">Título del material <span className="text-rose-500">*</span></label><input type="text" value={ctitle} onChange={e => setCtitle(e.target.value)} placeholder="Ej. Guía para el manejo de ansiedad" className={inputCls} /></div>

                  <div><label className="block mb-2 text-slate-900 font-bold text-sm">Descripción breve</label><textarea value={cdesc} onChange={e => setCdesc(e.target.value)} placeholder="Explica brevemente de qué trata este recurso..." className={inputCls + " resize-none"} rows={3} /></div>

                  <div>
                    <label className="block mb-2 text-slate-900 font-bold text-sm">Tipo de recurso</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ key: "video", label: "Video", icon: Video, color: "rose" }, { key: "image", label: "Imagen / Infografía", icon: ImageIcon, color: "emerald" }, { key: "link", label: "Enlace Externo", icon: ExternalLink, color: "blue" }].map(t => (
                        <button key={t.key} onClick={() => setCtype(t.key)} className={`flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-2xl transition-all cursor-pointer ${ctype === t.key ? `border-${t.color}-500 bg-${t.color}-50 shadow-sm` : "border-slate-200 bg-white hover:border-slate-300"} `}>
                          <t.icon className={`w-6 h-6 ${ctype === t.key ? `text-${t.color}-600` : "text-slate-400"} `} />
                          <span className={`text-xs font-bold ${ctype === t.key ? `text-${t.color}-700` : "text-slate-500"} `}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div><label className="block mb-2 text-slate-900 font-bold text-sm">URL o Enlace del recurso {ctype !== "image" && <span className="text-rose-500">*</span>}</label><input type="url" value={curl} onChange={e => setCurl(e.target.value)} placeholder="https://..." className={inputCls} /></div>

                  <div>
                    <label className="block mb-2 text-slate-900 font-bold text-sm">Archivo adjunto </label>
                    <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 transition-colors group relative cursor-pointer">
                      <input
                        type="file"
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-700">{selectedFile ? selectedFile.name : "Subir archivo (PDF, DOCX, etc.)"}</p>
                        <p className="text-xs text-slate-400">{selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "Cualquier formato permitido"}</p>
                      </div>
                    </div>
                  </div>

                  {ctype === "image" && null}

                  <div className="pt-4"><Btn onClick={handlePublishContent} size="lg" className="w-full bg-blue-600 shadow-blue-600/20"><FileText className="w-5 h-5 mr-2" /> Publicar Material</Btn></div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Publish Event Tab ─── */}
          {activeTab === "event" && (
            <div className="p-8">
              <div className="w-full">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Publicar Evento o Taller</h3>
                <p className="text-slate-500 font-medium mb-8">Crea un banner interactivo que se mostrará en el carrusel principal de todos los estudiantes.</p>

                <div className="space-y-5 bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div>
                    <label className="block mb-2 text-slate-900 font-bold text-sm">Formato del evento</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["taller", "conferencia"].map(t => (
                        <button key={t} onClick={() => setEvType(t)} className={`py-3 rounded-xl border-2 transition-all cursor-pointer capitalize font-bold text-sm ${evType === t ? "border-violet-600 bg-violet-50 text-violet-700 shadow-sm" : "border-slate-200 bg-white text-slate-500"} `}>{t}</button>
                      ))}
                    </div>
                  </div>

                  <div><label className="block mb-2 text-slate-900 font-bold text-sm">Título del evento <span className="text-rose-500">*</span></label><input type="text" value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="Ej. Taller de Organización de Tiempo" className={inputCls} /></div>

                  <div><label className="block mb-2 text-slate-900 font-bold text-sm">Descripción</label><textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="¿De qué trata el evento?..." className={inputCls + " resize-none"} rows={3} /></div>

                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block mb-2 text-slate-900 font-bold text-sm">Fecha <span className="text-rose-500">*</span></label><input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className={inputCls} /></div>
                    <div><label className="block mb-2 text-slate-900 font-bold text-sm">Hora (opcional)</label><input type="time" value={evTime} onChange={e => setEvTime(e.target.value)} className={inputCls} /></div>
                  </div>

                  <div>
                    <label className="block mb-2 text-slate-900 font-bold text-sm">Imagen de Portada <span className="text-rose-500">*</span></label>
                    <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-violet-400 transition-colors group relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedEventImg(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-100">
                        {selectedEventImg ? <img src={URL.createObjectURL(selectedEventImg)} className="w-full h-full object-cover" /> : (evImg ? <img src={evImg} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-slate-400" />)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-700">{selectedEventImg ? selectedEventImg.name : "Subir imagen de portada"}</p>
                        <p className="text-xs text-slate-400">Formatos: JPG, PNG. Recomendado: 800x400px</p>
                        {evImg && !selectedEventImg && <p className="text-[10px] text-blue-500 mt-1 truncate max-w-[200px]">{evImg}</p>}
                      </div>
                      <Plus className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors" />
                    </div>
                  </div>

                  {evType === "taller" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block mb-2 text-slate-900 font-bold text-sm">Enlace de Registro (Google Forms) <span className="text-rose-500">*</span></label>
                      <input type="url" value={evRegUrl} onChange={e => setEvRegUrl(e.target.value)} placeholder="https://forms.gle/..." className={inputCls} />
                    </div>
                  )}

                  <div className="pt-4"><Btn onClick={handlePublishEvent} size="lg" className="w-full bg-violet-600 text-white shadow-violet-600/20"><Megaphone className="w-5 h-5 mr-2" /> Publicar Evento</Btn></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action modal */}
        <Modal open={!!actionAppt && !!actionType} onClose={() => { setActionAppt(null); setActionType(null); }} title={actionType === "confirm" ? "Confirmar Cita" : actionType === "complete" ? "Completar Cita" : "Cancelar Cita"} subtitle={actionAppt ? `${actionAppt.studentName} — ${actionAppt.date} a las ${actionAppt.time} ` : ""} maxWidth="max-w-md">
          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-slate-900 font-bold text-sm tracking-tight">Observaciones (opcional)</label>
              <textarea value={actionNotes} onChange={e => setActionNotes(e.target.value)} placeholder="Agregar algún comentario para el archivo..." className="w-full px-4 py-3 rounded-xl border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-slate-700 bg-slate-50/50 hover:bg-slate-50 text-sm" rows={3} />
            </div>
            <div className="flex gap-3">
              <Btn variant="outline" onClick={() => { setActionAppt(null); setActionType(null); }} className="flex-1 text-slate-500">Cancelar</Btn>
              <Btn onClick={confirmAction} className={`flex - 1 text - white border - 0 shadow - lg ${actionType === "cancel" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"} `}>
                {actionType === "confirm" ? "Confirmar Cita" : actionType === "complete" ? "Finalizar Cita" : "Confirmar Cancelación"}
              </Btn>
            </div>
          </div>
        </Modal>
      </div>

      <Modal open={showResch} onClose={() => setShowResch(false)} title="Reagendar Cita" subtitle="Propón una nueva fecha y hora para el alumno">
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-700">Selecciona uno de tus horarios disponibles para mover esta cita. El alumno recibirá una notificación.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-700 font-bold text-sm mb-3">Nueva Fecha</label>
              <MiniCalendar selectedDate={selReschedDate} onSelect={setSelReschedDate} availableDates={reschedDates} />
            </div>
            <div>
              <label className="block text-slate-700 font-bold text-sm mb-3">Horarios Disponibles</label>
              {!selReschedDate ? (
                <div className="h-48 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">Selecciona un día</p>
                </div>
              ) : reschedSlots.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Clock className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">No hay horarios disponibles</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {reschedSlots.map(t => (
                    <button key={t} onClick={() => setSelReschedSlot(t)}
                      className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${selReschedSlot === t ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200" : "border-slate-100 bg-white text-slate-600 hover:border-blue-200"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <Btn variant="ghost" onClick={() => setShowResch(false)} className="flex-1">Cancelar</Btn>
            <Btn onClick={handleRescheduleConfirm} disabled={!selReschedSlot} className="flex-2 bg-blue-600">Confirmar Reagendamiento</Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

// ─────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────
function AdminDashboard() {
  const { user } = useAuth();
  const { getAppointments, updateAppointmentStatus, getStats, specialists, addSpecialist, updateSpecialist, removeSpecialist, events, addEvent, addResource, users, deleteUser } = useStore();

  const [activeTab, setActiveTab] = useState("citas");
  const [deptFilter, setDeptFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  // Action
  const [actionAppt, setActionAppt] = useState<Appointment | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState("");

  // New specialist
  const [newName, setNewName] = useState(""), [newDept, setNewDept] = useState("Psicología"), [newEmail, setNewEmail] = useState(""), [newPass, setNewPass] = useState(""), [newSched, setNewSched] = useState(""), [newShift, setNewShift] = useState("Matutino");
  const [editingSpec, setEditingSpec] = useState<Specialist | null>(null);
  const [editPass, setEditPass] = useState("");

  // New event
  const [evTitle, setEvTitle] = useState(""), [evDesc, setEvDesc] = useState(""), [evDept, setEvDept] = useState("Psicología"), [evDate, setEvDate] = useState(""), [evTime, setEvTime] = useState(""), [evType, setEvType] = useState("taller"), [evImg, setEvImg] = useState(""), [evRegUrl, setEvRegUrl] = useState("");

  // New content (Resource)
  const [ctitle, setCtitle] = useState(""), [cdesc, setCdesc] = useState(""), [ctype, setCtype] = useState("video"), [curl, setCurl] = useState(""), [cimgUrl, setCimgUrl] = useState(""), [cdept, setCdept] = useState("Psicología");

  // Chart refs for PDF
  const chartMonthlyRef = useRef<HTMLDivElement>(null);
  const chartMotivosRef = useRef<HTMLDivElement>(null);
  const chartModalidadRef = useRef<HTMLDivElement>(null);
  const chartCarreraRef = useRef<HTMLDivElement>(null);

  const fullStats = getStats();
  const summary = fullStats.summary;
  const charts = fullStats.charts;

  const allAppts = getAppointments();
  const filteredAppts = allAppts.filter(a => {
    if (deptFilter !== "Todos" && a.department !== deptFilter) return false;
    if (statusFilter !== "Todos" && a.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!a.studentName.toLowerCase().includes(q) && !a.specialistName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const confirmAction = () => {
    updateAppointmentStatus(actionAppt!.id, actionStatus!, actionNotes || undefined, false);
    toast.success(`Cita actualizada a: ${actionStatus} `);
    setActionAppt(null); setActionStatus(null);
  };

  const handleAddSpec = async () => {
    if (!newName || !newEmail || !newPass) { toast.error("Nombre, correo y contraseña son obligatorios"); return; }
    await addSpecialist({ name: newName, department: newDept, email: newEmail, password: newPass, shift: newShift });
    toast.success(`${newName} registrado correctamente`);
    setNewName(""); setNewEmail(""); setNewPass(""); setNewSched("");
  };

  const handleUpdateSpec = async () => {
    if (!editingSpec) return;
    await updateSpecialist(editingSpec.id, {
      name: editingSpec.name,
      department: editingSpec.department,
      email: editingSpec.email,
      active: editingSpec.active,
      ...(editPass && { password: editPass })
    });
    toast.success("Especialista actualizado");
    setEditingSpec(null);
    setEditPass("");
  };

  const [selectedEventImg, setSelectedEventImg] = useState<File | null>(null);

  const handlePublishEvent = () => {
    if (!evTitle || !evDate) { toast.error("Título y fecha son obligatorios"); return; }

    let finalImg = evImg || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80";
    if (selectedEventImg) {
      finalImg = URL.createObjectURL(selectedEventImg);
    }

    addEvent({
      title: evTitle,
      description: evDesc,
      department: evDept,
      date: evDate,
      time: evTime,
      type: evType,
      imageUrl: evImg || undefined,
      registrationUrl: evType === "taller" ? evRegUrl : undefined
    }, selectedEventImg || undefined);

    toast.success("Evento publicado exitosamente");
    setEvTitle(""); setEvDesc(""); setEvDate(""); setEvTime(""); setEvImg(""); setEvRegUrl(""); setSelectedEventImg(null);
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handlePublishContent = () => {
    if (!ctitle) { toast.error("Título es obligatorio"); return; }

    let finalFileUrl = undefined;
    if (selectedFile) {
      finalFileUrl = URL.createObjectURL(selectedFile);
    }

    addResource({
      title: ctitle,
      description: cdesc,
      type: ctype,
      url: curl || "#",
      imageUrl: cimgUrl || undefined,
      department: cdept
    }, selectedFile || undefined);

    toast.success("Material educativo publicado");
    setCtitle(""); setCdesc(""); setCurl(""); setCimgUrl(""); setSelectedFile(null);
  };

  const generatePDFReport = async (deptReport: string) => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString("es-MX");
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("Sistema de Gestión de Citas", 105, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text(`Reporte Institucional: ${deptReport}`, 105, 23, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha de generación: ${today}`, 105, 29, { align: "center" });
    
    // Line separator
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 35, 190, 35);

    // Filter data
    const list = deptReport === "Reporte Global" 
      ? allAppts 
      : allAppts.filter(a => a.department === deptReport);

    const statsDetail = {
      total: list.length,
      confirmadas: list.filter(a => a.status === "Confirmada").length,
      completadas: list.filter(a => a.status === "Completada").length,
      pendientes: list.filter(a => a.status === "Pendiente").length,
      canceladas: list.filter(a => a.status === "Cancelada").length,
    };

    // Calculate detailed stats for the filtered list
    const motivosMap: Record<string, number> = {};
    const carreraMap: Record<string, number> = {};
    const modalidadMap: Record<string, number> = { "Presencial": 0, "Virtual": 0 };

    list.forEach(a => {
      // Motivos
      const m = a.motivo || "Consulta General";
      motivosMap[m] = (motivosMap[m] || 0) + 1;
      
      // Modalidad
      if (a.modality === "Virtual") modalidadMap["Virtual"]++;
      else modalidadMap["Presencial"]++;
    });

    // For careers, we need to map via users if available, or just skip if not easy.
    // Since we have users loaded in StoreContext, we can try to map studentId to career.
    list.forEach(a => {
      const student = users.find(u => u.id === a.studentId);
      const c = student?.carrera || "No especificada";
      carreraMap[c] = (carreraMap[c] || 0) + 1;
    });

    const topMotivos = Object.entries(motivosMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const careerStats = Object.entries(carreraMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    // Summary table
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Resumen General", 20, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [["Métrica", "Cantidad"]],
      body: [
        ["Total de Citas", statsDetail.total],
        ["Confirmadas", statsDetail.confirmadas],
        ["Completadas", statsDetail.completadas],
        ["Pendientes", statsDetail.pendientes],
        ["Canceladas", statsDetail.canceladas],
      ],
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    // Detailed Stats Tables (Replacing visual charts if capture fails or providing extra data)
    doc.text("Desglose Estadístico", 20, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [["Motivos más frecuentes", "Citas"]],
      body: topMotivos,
      theme: "striped",
      headStyles: { fillColor: [71, 85, 105] },
      margin: { left: 20, right: 105 }
    });

    autoTable(doc, {
      startY: currentY,
      head: [["Modalidad", "Citas"]],
      body: Object.entries(modalidadMap),
      theme: "striped",
      headStyles: { fillColor: [71, 85, 105] },
      margin: { left: 110, right: 20 }
    });

    currentY = Math.max((doc as any).lastAutoTable.finalY, currentY) + 15;

    // Charts inclusion
    const addChartToDoc = async (ref: React.RefObject<HTMLDivElement | null>, title: string, y: number) => {
      if (ref.current) {
        try {
          const canvas = await html2canvas(ref.current, { scale: 2 });
          const imgData = canvas.toDataURL("image/png");
          // Check if we need a new page
          if (y + 100 > 280) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(12);
          doc.setTextColor(30, 41, 59);
          doc.text(title, 20, y);
          doc.addImage(imgData, "PNG", 20, y + 5, 170, 85);
          return y + 100;
        } catch (e) { 
          console.error("Error capturing chart", e); 
          return y; 
        }
      }
      return y;
    };

    doc.addPage();
    doc.setFontSize(14);
    doc.text("Análisis Visual", 105, 15, { align: "center" });
    currentY = 25;

    // We use the hidden chart container refs
    currentY = await addChartToDoc(chartMonthlyRef, "Tendencias Mensuales", currentY);
    currentY = await addChartToDoc(chartMotivosRef, "Distribución de Motivos", currentY);
    
    currentY = await addChartToDoc(chartModalidadRef, "Modalidad de Atención", currentY);
    currentY = await addChartToDoc(chartCarreraRef, "Distribución por Carrera", currentY);

    doc.addPage();
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Desglose Detallado de Citas", 20, 15);
    
    autoTable(doc, {
      startY: 20,
      head: [["Alumno", "Especialista", "Fecha", "Hora", "Estado"]],
      body: list.slice(0, 100).map(a => [
        a.studentName,
        a.specialistName,
        a.date,
        a.time,
        a.status
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 41, 59] },
      margin: { left: 20, right: 20 }
    });

    if (list.length > 100) {
      doc.setFontSize(8);
      doc.text(`* Mostrando los primeros 100 registros de ${list.length} totales.`, 20, (doc as any).lastAutoTable.finalY + 10);
    }

    doc.save(`reporte_${deptReport.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    toast.success("Reporte generado con éxito.");
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50/50 hover:bg-slate-50 transition-colors shadow-sm text-slate-700 text-sm";

  const sidebarTabs = [
    { key: "citas", label: "Gestión de Citas", icon: CalendarDays },
    { key: "especialistas", label: "Especialistas", icon: Users },
    { key: "estudiantes", label: "Estudiantes", icon: Users },
    { key: "estadisticas", label: "Estadísticas", icon: BarChart3 },
    { key: "reportes", label: "Reportes", icon: FileText },
    { key: "contenido", label: "Publicar Contenido", icon: FileText },
    { key: "eventos", label: "Publicar Evento", icon: Megaphone }
  ];



  const adminStats = [
    { label: "Total Institucional", value: summary.total, icon: BarChart3, gradient: "from-slate-700 to-slate-900 shadow-slate-900/20" },
    { label: "Pendientes Global", value: summary.pendientes, icon: Clock, gradient: "from-amber-500 to-amber-600 shadow-amber-500/20" },
    { label: "Confirmadas", value: summary.confirmadas, icon: CalendarCheck, gradient: "from-blue-600 to-indigo-600 shadow-blue-600/20" },
    { label: "Completadas", value: summary.completadas, icon: CheckCircle2, gradient: "from-emerald-500 to-emerald-600 shadow-emerald-500/20" },
    { label: "Canceladas / Faltas", value: summary.canceladas, icon: XCircle, gradient: "from-rose-500 to-rose-600 shadow-rose-500/20" }
  ];

  return (
    <AppShell sidebar={{ tabs: sidebarTabs, active: activeTab, onSelect: setActiveTab, badges: { citas: summary.pendientes } }} role="admin" userName={user?.name} userEmail={user?.email} userDept="Administración Central">
      <div className="space-y-8 max-w-7xl mx-auto w-full pb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Administración</h1>
          <p className="text-slate-500 mt-1 font-medium">Control global del sistema de citas institucionales y personal</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {adminStats.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Dept cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(DEPT_CONFIG).map(([name, cfg]) => (
            <div key={name} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between group hover:shadow-md hover:border-blue-200 transition-all cursor-default">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${cfg.bg} rounded-xl flex items-center justify-center`}><cfg.icon className="w-5 h-5" style={{ color: cfg.color }} /></div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{name}</p>
                  <p className="text-slate-900 text-2xl font-black mt-0.5 leading-none">{summary.byDept[name]} <span className="text-slate-400 font-medium text-sm">citas</span></p>
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
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
                  <p className="text-slate-500 font-medium text-sm mt-1">Busca y filtra citas de todas las facultades</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar alumno o especialista..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="flex-1 sm:flex-none px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20">
                      <option>Todos</option><option>Psicología</option><option>Tutorías</option><option>Nutrición</option>
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="flex-1 sm:flex-none px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20">
                      <option>Todos</option><option>Pendiente</option><option>Confirmada</option><option>Completada</option><option>Cancelada</option>
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
                    {filteredAppts.map(cita => (
                      <tr key={cita.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-slate-900 font-bold text-sm tracking-tight">{cita.studentName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                            {cita.department}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-700 font-medium text-sm">{cita.specialistName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-900 font-bold text-sm">{new Date(cita.date + "T12:00:00").toLocaleDateString("es-MX", { day: 'numeric', month: 'short' })}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium text-sm">{cita.time}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium text-sm capitalize">{cita.modality}</td>
                        <td className="px-6 py-4"><StatusBadge status={cita.status} /></td>
                      </tr>
                    ))}
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Gestión de Especialistas</h3>
                  <p className="text-slate-500 font-medium mt-1">{specialists.length} especialistas registrados en el sistema.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Specialist List */}
                <div className="space-y-3">
                  <h4 className="text-slate-900 font-bold mb-4 uppercase tracking-wider text-xs">Directorio Activo</h4>
                  {specialists.map(esp => {
                    const conf = DEPT_CONFIG[esp.department];
                    return (
                      <div key={esp.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex sm:items-center gap-4 group">
                        <Avatar name={esp.name} />
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 font-bold truncate tracking-tight text-lg">{esp.name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-500 text-xs font-bold">
                              {conf && <conf.icon className="w-3 h-3" style={{ color: conf.color }} />} {esp.department}
                            </span>
                            <span className="text-slate-400 text-xs">•</span>
                            <span className="text-slate-500 text-xs font-medium truncate">{esp.email}</span>
                          </div>
                          {esp.shift && (
                            <div className="flex items-center gap-1 mt-2">
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1">
                                <Clock3 className="w-2.5 h-2.5" /> {esp.shift}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full ${esp.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'} font-bold text-[0.65rem] uppercase tracking-wider shrink-0 border`}>
                          {esp.active ? 'Activo' : 'Inactivo'}
                        </span>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingSpec(esp)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`¿Eliminar a ${esp.name}?`)) {
                                removeSpecialist(esp.id);
                                toast.success("Especialista eliminado");
                              }
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Specialist Form */}
                <div>
                  <h4 className="text-slate-900 font-bold mb-4 uppercase tracking-wider text-xs flex items-center gap-2"><Plus className="w-4 h-4 text-blue-600" /> Nuevo Registro</h4>
                  <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                    <div><label className="block mb-2 text-slate-900 font-bold text-sm">Nombre completo <span className="text-rose-500">*</span></label><input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Dra. Ana López" className={inputCls} /></div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block mb-2 text-slate-900 font-bold text-sm">Departamento</label><select value={newDept} onChange={e => setNewDept(e.target.value)} className={inputCls}><option>Psicología</option><option>Tutorías</option><option>Nutrición</option></select></div>
                      <div><label className="block mb-2 text-slate-900 font-bold text-sm">Correo institucional <span className="text-rose-500">*</span></label><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="correo@instituto.edu.mx" className={inputCls} /></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block mb-2 text-slate-900 font-bold text-sm">Contraseña temporal</label><input type="text" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Contraseña inicial" className={inputCls} /></div>
                      <div>
                        <label className="block mb-2 text-slate-900 font-bold text-sm">Turno de Atención</label>
                        <select value={newShift} onChange={e => setNewShift(e.target.value)} className={inputCls}>
                          <option value="Matutino">Turno Matutino</option>
                          <option value="Vespertino">Turno Vespertino</option>
                        </select>
                      </div>
                    </div>
                    <div><label className="block mb-2 text-slate-900 font-bold text-sm">Horarios presenciales (opcional)</label><input type="text" value={newSched} onChange={e => setNewSched(e.target.value)} placeholder="Ej. Lun-Vie 09:00-14:00" className={inputCls} /></div>

                    <div className="pt-2"><Btn onClick={handleAddSpec} size="lg" className="w-full bg-blue-600 text-white shadow-blue-600/20"><Plus className="w-5 h-5 mr-2" /> Registrar Especialista</Btn></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Estadísticas Tab ─── */}
          {activeTab === "estadisticas" && (
            <div className="p-8 bg-slate-50/50 min-h-full">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Análisis de Datos</h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Trends */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h4 className="text-slate-900 font-bold mb-6 text-lg">Citas por Mes y Facultad</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={charts.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="Psicología" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="Tutorías" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="Nutrición" fill="#EA580C" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top Reasons */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h4 className="text-slate-900 font-bold mb-6 text-lg">Motivos Frecuentes</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={charts.motivos} cx="50%" cy="50%" outerRadius={100} innerRadius={60} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}% `} labelLine={{ stroke: '#cbd5e1' }}>
                          {charts.motivos.map((_, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Modality */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h4 className="text-slate-900 font-bold mb-6 text-lg">Modalidad de Atención</h4>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={charts.modalidad} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}% `} labelLine={false}>
                          <Cell fill="#3b82f6" /><Cell fill="#10b981" />
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* By Career */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h4 className="text-slate-900 font-bold mb-6 text-lg">Distribución por Carrera</h4>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={charts.carrera} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }} axisLine={false} tickLine={false} width={120} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Reportes Tab ─── */}
          {activeTab === "reportes" && (
            <div className="p-8">
              <div className="max-w-4xl mx-auto text-center mb-12 mt-4">
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><FileText className="w-8 h-8 text-violet-600" /></div>
                <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Generación de Reportes</h3>
                <p className="text-slate-500 text-lg">Exporta los datos en formato PDF segmentados por departamento o genera un reporte global. Incluyen estadísticas de motivos, género, carreras y retención.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[{ label: "Psicología", icon: Brain, color: "blue", gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20" },
                { label: "Tutorías", icon: GraduationCap, color: "emerald", gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20" },
                { label: "Nutrición", icon: Apple, color: "rose", gradient: "from-rose-500 to-orange-500", shadow: "shadow-rose-500/20" },
                { label: "Reporte Global", icon: FileText, color: "violet", gradient: "from-violet-600 to-purple-700", shadow: "shadow-violet-600/20" }
                ].map(r => (
                  <div key={r.label} className="bg-white border border-slate-200 rounded-3xl p-6 text-center hover:shadow-xl transition-all group flex flex-col h-full cursor-default">
                    <div className={`w-16 h-16 bg-gradient-to-br ${r.gradient} ${r.shadow} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform`}><r.icon className="w-8 h-8 text-white" /></div>
                    <h4 className="text-slate-900 font-bold text-lg mb-2">{r.label}</h4>
                    <p className="text-slate-500 text-xs font-medium mb-6 flex-1">Datos consolidados del mes en curso, demografía y efectividad.</p>
                    <Btn onClick={() => generatePDFReport(r.label)} variant="outline" className={`w-full text-${r.color}-600 hover:bg-${r.color}-50 hover:border-${r.color}-200`}><Download className="w-4 h-4 mr-2" /> PDF Export</Btn>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Contenido Tab ─── */}
          {activeTab === "contenido" && (
            <div className="p-8">
              <div className="w-full">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Publicar Material Educativo</h3>
                <p className="text-slate-500 font-medium mb-8">Como administrador, puedes publicar recursos para cualquier departamento.</p>

                <div className="space-y-5 bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block mb-2 text-slate-900 font-bold text-sm">Título del material <span className="text-rose-500">*</span></label><input type="text" value={ctitle} onChange={e => setCtitle(e.target.value)} placeholder="Ej. Guía para el manejo de ansiedad" className={inputCls} /></div>
                    <div>
                      <label className="block mb-2 text-slate-900 font-bold text-sm">Departamento del recurso</label>
                      <select value={cdept} onChange={e => setCdept(e.target.value)} className={inputCls}>
                        <option>Psicología</option><option>Tutorías</option><option>Nutrición</option>
                      </select>
                    </div>
                  </div>

                  <div><label className="block mb-2 text-slate-900 font-bold text-sm">Descripción breve</label><textarea value={cdesc} onChange={e => setCdesc(e.target.value)} placeholder="Explica brevemente de qué trata este recurso..." className={inputCls + " resize-none"} rows={2} /></div>

                  <div>
                    <label className="block mb-2 text-slate-900 font-bold text-sm">Tipo de recurso</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ key: "video", label: "Video", icon: Video, color: "rose" }, { key: "image", label: "Imagen", icon: ImageIcon, color: "emerald" }, { key: "link", label: "Enlace", icon: ExternalLink, color: "blue" }].map(t => (
                        <button key={t.key} onClick={() => setCtype(t.key)} className={`flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-2xl transition-all cursor-pointer ${ctype === t.key ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                          <t.icon className={`w-6 h-6 ${ctype === t.key ? "text-blue-600" : "text-slate-400"}`} />
                          <span className={`text-xs font-bold ${ctype === t.key ? "text-blue-700" : "text-slate-500"}`}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div><label className="block mb-2 text-slate-900 font-bold text-sm">URL o Enlace del recurso {ctype !== "image" && <span className="text-rose-500">*</span>}</label><input type="url" value={curl} onChange={e => setCurl(e.target.value)} placeholder="https://..." className={inputCls} /></div>

                  <div>
                    <label className="block mb-2 text-slate-900 font-bold text-sm">Archivo adjunto (Opcional)</label>
                    <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 transition-colors group relative cursor-pointer">
                      <input
                        type="file"
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-700">{selectedFile ? selectedFile.name : "Subir archivo (PDF, DOCX, etc.)"}</p>
                        <p className="text-xs text-slate-400">{selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "Cualquier formato permitido"}</p>
                      </div>
                    </div>
                  </div>

                  {ctype === "image" && null}

                  <div className="pt-4"><Btn onClick={handlePublishContent} size="lg" className="w-full bg-blue-600 shadow-blue-600/20"><FileText className="w-5 h-5 mr-2" /> Publicar Material</Btn></div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "eventos" && (
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Difusión Institucional</h3>
                  <p className="text-slate-500 font-medium mb-8">Publica eventos, conferencias y talleres. Aparecerán en el carrusel principal de todos los estudiantes.</p>

                  <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                    <div>
                      <label className="block mb-2 text-slate-900 font-bold text-sm">Formato del evento</label>
                      <div className="grid grid-cols-2 gap-3">{["taller", "conferencia"].map(t => <button key={t} onClick={() => setEvType(t)} className={`py - 3 rounded - xl border - 2 transition - all cursor - pointer capitalize font - bold text - sm ${evType === t ? "border-violet-600 bg-violet-50 text-violet-700 shadow-sm" : "border-slate-200 bg-white text-slate-500"} `}>{t}</button>)}</div>
                    </div>
                    <div><label className="block mb-2 text-slate-900 font-bold text-sm">Título del evento <span className="text-rose-500">*</span></label><input type="text" value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="Ej. Taller de Organización de Tiempo" className={inputCls} /></div>
                    <div><label className="block mb-2 text-slate-900 font-bold text-sm">Descripción global</label><textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="¿De qué trata este evento?..." className={inputCls + " resize-none"} rows={3} /></div>
                    <div>
                      <label className="block mb-2 text-slate-900 font-bold text-sm">Departamento organizador</label>
                      <select value={evDept} onChange={e => setEvDept(e.target.value)} className={inputCls}><option>Psicología</option><option>Tutorías</option><option>Nutrición</option><option value="General">General (Todas las áreas)</option></select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block mb-2 text-slate-900 font-bold text-sm">Fecha programada <span className="text-rose-500">*</span></label><input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className={inputCls} /></div>
                      <div><label className="block mb-2 text-slate-900 font-bold text-sm">Hora de inicio</label><input type="time" value={evTime} onChange={e => setEvTime(e.target.value)} className={inputCls} /></div>
                    </div>
                    <div>
                      <label className="block mb-2 text-slate-900 font-bold text-sm">Imagen de Portada <span className="text-rose-500">*</span></label>
                      <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-violet-400 transition-colors group relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedEventImg(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-100">
                          {selectedEventImg ? <img src={URL.createObjectURL(selectedEventImg)} className="w-full h-full object-cover" /> : (evImg ? <img src={evImg} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-slate-400" />)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-700">{selectedEventImg ? selectedEventImg.name : "Subir imagen de portada"}</p>
                          <p className="text-xs text-slate-400">Formatos: JPG, PNG. Recomendado: 800x400px</p>
                          {evImg && !selectedEventImg && <p className="text-[10px] text-blue-500 mt-1 truncate max-w-[200px]">{evImg}</p>}
                        </div>
                        <Plus className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors" />
                      </div>
                    </div>
                    {evType === "taller" && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block mb-2 text-slate-900 font-bold text-sm">Enlace de Registro (Google Forms) <span className="text-rose-500">*</span></label>
                        <input type="url" value={evRegUrl} onChange={e => setEvRegUrl(e.target.value)} placeholder="https://forms.gle/..." className={inputCls} />
                      </div>
                    )}
                    <div className="pt-2"><Btn onClick={handlePublishEvent} size="lg" className="w-full bg-violet-600 text-white shadow-violet-600/20"><Megaphone className="w-5 h-5 mr-2" /> Difundir Evento</Btn></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div> Eventos Activos ({events.length})</h3>
                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                    {events.map(ev => (
                      <div key={ev.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {ev.imageUrl && <div className="h-32 bg-slate-100 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                          <img 
                            src={ev.imageUrl.startsWith('http') ? ev.imageUrl : `${API_BASE}${ev.imageUrl}`} 
                            alt={ev.title} 
                            className="w-full h-full object-cover relative z-0" 
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).style.display = "none" }} 
                          />
                          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                            <span className={`px - 2 py - 0.5 rounded - md font - bold text - [0.65rem] uppercase tracking - wider shadow - sm ${ev.type === "conferencia" ? "bg-violet-500 text-white" : "bg-blue-500 text-white"} `}>{ev.type === "conferencia" ? "Conferencia" : "Taller"}</span>
                            <span className="px-2 py-0.5 rounded-md font-bold text-[0.65rem] uppercase tracking-wider bg-black/40 text-white backdrop-blur-md">{ev.department}</span>
                          </div>
                        </div>}
                        <div className="p-4">
                          <p className="text-slate-900 font-bold text-base leading-tight">{ev.title}</p>
                          <p className="text-slate-500 text-xs mt-2 font-medium flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {new Date(ev.date + "T12:00:00").toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} {ev.time ? ` • ${ev.time} ` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Estudiantes Tab ─── */}
          {activeTab === "estudiantes" && (
            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Gestión de Estudiantes</h3>
                  <p className="text-slate-500 font-medium mt-1">{users.filter((u: any) => u.role === 'alumno').length} estudiantes registrados.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      {["Nombre", "Matrícula", "Carrera", "Semestre", "Email", "Acciones"].map(h => (
                        <th key={h} className="px-6 py-4 text-slate-500 font-bold tracking-wider uppercase text-[0.65rem]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.filter((u: any) => u.role === 'alumno').map((est: any) => (
                      <tr key={est.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-slate-900 font-bold text-sm tracking-tight">{est.name}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium text-sm">{est.matricula || "N/A"}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-[0.65rem] font-bold uppercase">{est.carrera || "General"}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium text-sm">{est.semestre || "—"}°</td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-medium">{est.email}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => {
                              if (confirm(`¿Seguro que deseas eliminar al estudiante ${est.name}? Esta acción no se puede deshacer.`)) {
                                deleteUser(est.id);
                                toast.success("Estudiante eliminado correctamente");
                              }
                            }}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.filter((u: any) => u.role === 'alumno').length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="w-12 h-12 text-slate-300 mb-4" />
                    <h4 className="text-slate-900 font-bold">No hay estudiantes</h4>
                    <p className="text-slate-500 font-medium text-sm">No se encontraron registros de alumnos en la base de datos.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden container for PDF chart capture */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '1200px', pointerEvents: 'none' }}>
        <div ref={chartMonthlyRef} style={{ background: 'white', padding: '40px', width: '1000px' }}>
          <h4 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Citas por Mes y Facultad</h4>
          <div style={{ width: '900px', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="Psicología" fill="#2563EB" />
                <Bar dataKey="Tutorías" fill="#16A34A" />
                <Bar dataKey="Nutrición" fill="#EA580C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div ref={chartMotivosRef} style={{ background: 'white', padding: '40px', width: '1000px' }}>
          <h4 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Motivos Frecuentes</h4>
          <div style={{ width: '900px', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.motivos} cx="50%" cy="50%" outerRadius={150} innerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}% `}>
                  {charts.motivos.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div ref={chartModalidadRef} style={{ background: 'white', padding: '40px', width: '1000px' }}>
          <h4 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Modalidad de Atención</h4>
          <div style={{ width: '900px', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.modalidad} cx="50%" cy="50%" innerRadius={100} outerRadius={150} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}% `}>
                  <Cell fill="#3b82f6" /><Cell fill="#10b981" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div ref={chartCarreraRef} style={{ background: 'white', padding: '40px', width: '1000px' }}>
          <h4 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Distribución por Carrera</h4>
          <div style={{ width: '900px', height: '500px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.carrera} layout="vertical" margin={{ top: 0, right: 50, left: 50, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modal: Editar Especialista */}
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
            <input type="text" value={editPass} onChange={e => setEditPass(e.target.value)} placeholder="Dejar vacío para mantener actual" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-slate-700 font-bold text-xs uppercase text-blue-600">Turno</label>
              <select value={editingSpec?.shift || "Matutino"} onChange={e => setEditingSpec(p => p ? { ...p, shift: e.target.value } : null)} className={inputCls}>
                <option value="Matutino">Turno Matutino</option>
                <option value="Vespertino">Turno Vespertino</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-slate-700 font-bold text-xs uppercase">Cuenta Activa</label>
              <div className="flex items-center gap-2 h-[46px]">
                <input 
                  type="checkbox" 
                  id="spec-active" 
                  checked={editingSpec?.active || false} 
                  onChange={e => setEditingSpec(p => p ? { ...p, active: e.target.checked } : null)} 
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                />
                <label htmlFor="spec-active" className="text-sm font-bold text-slate-600">Habilitado</label>
              </div>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <Btn variant="ghost" onClick={() => setEditingSpec(null)} className="flex-1">Cancelar</Btn>
            <Btn onClick={handleUpdateSpec} className="flex-2 bg-blue-600 shadow-blue-600/20">Guardar Cambios</Btn>
          </div>
        </div>
      </Modal>

      {/* Action modal */}
      <Modal open={!!actionAppt && !!actionStatus} onClose={() => { setActionAppt(null); setActionStatus(null); }} title={`Cambiar estado a: ${actionStatus} `} subtitle={actionAppt ? `${actionAppt.studentName} — ${actionAppt.date} a las ${actionAppt.time} ` : ""} maxWidth="max-w-md">
        <div className="space-y-5">
          <div>
            <label className="block mb-2 text-slate-900 font-bold text-sm">Observaciones (opcional)</label>
            <textarea value={actionNotes} onChange={e => setActionNotes(e.target.value)} placeholder="Agregar algún comentario para el archivo..." className="w-full px-4 py-3 rounded-xl border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-slate-700 bg-slate-50/50 hover:bg-slate-50" rows={3} />
          </div>
          <div className="flex gap-3">
            <Btn variant="outline" onClick={() => { setActionAppt(null); setActionStatus(null); }} className="flex-1 text-slate-500">Cancelar Operación</Btn>
            <Btn onClick={confirmAction} className={`flex - 1 text - white border - 0 shadow - lg ${actionStatus === "Cancelada" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"} `}>Confirmar Estado</Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

// ─────────────────────────────────────────────
// APP ROUTER
// ─────────────────────────────────────────────
function AppRouter() {
  const { user, isAuthenticated, loading } = useAuth();
  const [view, setView] = useState("login");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Iniciando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (view === "register") return <RegisterForm onSwitchToLogin={() => setView("login")} />;
    return <LoginForm onSwitchToRegister={() => setView("register")} />;
  }

  return (
    <>
      {user.role === "alumno" && <StudentDashboard />}
      {user.role === "especialista" && <SpecialistDashboard />}
      {user.role === "admin" && <AdminDashboard />}
    </>
  );
}

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </>
  );
}
