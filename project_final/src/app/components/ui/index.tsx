import {
    CheckCircle2, Clock, Megaphone, RefreshCw, UserPlus, FileText,
    AlertTriangle, CalendarCheck, ChevronLeft, ChevronRight, X,
} from "lucide-react";

// ─── NotifIcon ───────────────────────────────────────────
export function NotifIcon({ type }: { type: string }) {
    const props = { className: "w-4 h-4" };
    switch (type) {
        case "confirmed": return <CheckCircle2 {...props} style={{ color: "#16A34A" }} />;
        case "reminder": return <Clock        {...props} style={{ color: "#EA580C" }} />;
        case "event": return <Megaphone    {...props} style={{ color: "#2563EB" }} />;
        case "reschedule": return <RefreshCw    {...props} style={{ color: "#8b5cf6" }} />;
        case "new_user": return <UserPlus     {...props} style={{ color: "#16A34A" }} />;
        case "report": return <FileText     {...props} style={{ color: "#2563EB" }} />;
        case "cancelled": return <AlertTriangle {...props} style={{ color: "#dc2626" }} />;
        default: return <CalendarCheck {...props} style={{ color: "#64748b" }} />;
    }
}

// ─── StatusBadge ─────────────────────────────────────────
const STATUS_VARIANTS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    Pendiente: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    Confirmada: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
    Completada: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    Cancelada: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
};

export function StatusBadge({ status }: { status: string }) {
    const v = STATUS_VARIANTS[status] ?? STATUS_VARIANTS.Pendiente;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${v.bg} ${v.text} ${v.border}`}
            style={{ fontSize: "0.75rem", fontWeight: 500 }}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
            {status}
        </span>
    );
}

// ─── Avatar ──────────────────────────────────────────────
const AVATAR_COLORS = [
    "from-blue-500 to-indigo-600",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-pink-600",
    "from-violet-500 to-purple-600",
];
const AVATAR_SIZES = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
    const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
    const gradient = AVATAR_COLORS[name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0];
    return (
        <div className={`shrink-0 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-medium shadow-sm ${AVATAR_SIZES[size]}`}>
            {initials}
        </div>
    );
}

// ─── StatCard ────────────────────────────────────────────
interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
    sub?: string;
}
export function StatCard({ label, value, icon: Icon, gradient, sub }: StatCardProps) {
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

// ─── Btn ─────────────────────────────────────────────────
type BtnVariant = "primary" | "emerald" | "rose" | "outline" | "ghost" | "teal";
type BtnSize = "sm" | "md" | "lg";

const BTN_BASE = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
const BTN_SIZES: Record<BtnSize, string> = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-base" };
const BTN_VARIANTS: Record<BtnVariant, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border border-transparent",
    emerald: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border border-transparent",
    rose: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm border border-transparent",
    teal: "bg-teal-600 text-white hover:bg-teal-700 shadow-sm border border-transparent",
    outline: "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent",
};

export function Btn({
    children, variant = "primary", size = "md", className = "", ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
    return (
        <button
            className={`${BTN_BASE} ${BTN_SIZES[size]} ${BTN_VARIANTS[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

// ─── Card ────────────────────────────────────────────────
export function Card({ children, className = "", hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
    return (
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${hover ? "transition-all duration-300 hover:shadow-md hover:border-slate-300" : ""} ${className}`}>
            {children}
        </div>
    );
}

// ─── TabNav ──────────────────────────────────────────────
interface TabNavProps {
    tabs: { key: string; label: string; icon?: React.ElementType; badge?: number }[];
    active: string;
    onSelect: (k: string) => void;
}
export function TabNav({ tabs, active, onSelect }: TabNavProps) {
    return (
        <div className="inline-flex bg-slate-100 p-1 rounded-xl mb-4 overflow-x-auto">
            {tabs.map(t => {
                const isActive = active === t.key;
                return (
                    <button
                        key={t.key}
                        onClick={() => onSelect(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${isActive ? "bg-white shadow-sm text-slate-900 font-medium" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                        style={{ fontSize: "0.85rem" }}
                    >
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

// ─── Tabs (wrapper with state) ───────────────────────────
import { useState } from "react";

export function Tabs({ tabs, defaultTab, children }: { tabs: { key: string; label: string }[]; defaultTab?: string; children: (active: string) => React.ReactNode }) {
    const [active, setActive] = useState(defaultTab || tabs[0]?.key);
    return (
        <div>
            <TabNav tabs={tabs} active={active} onSelect={setActive} />
            {children(active)}
        </div>
    );
}

// ─── Modal ───────────────────────────────────────────────
interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: React.ReactNode;
    children: React.ReactNode;
    maxWidth?: string;
}
export function Modal({ open, onClose, title, subtitle, children, maxWidth = "max-w-xl" }: ModalProps) {
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

// ─── MiniCalendar ────────────────────────────────────────
interface MiniCalendarProps {
    selectedDate: Date | null;
    onSelect: (d: Date) => void;
    availableDates?: Date[] | null;
    highlightedDates?: Date[] | null;
}

const isSameDay = (a: Date | null, b: Date | null) =>
    !!a && !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

export function MiniCalendar({ selectedDate, onSelect, availableDates = null, highlightedDates = null }: MiniCalendarProps) {
    const [viewDate, setViewDate] = useState(selectedDate || new Date());
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const isAvailable = (d: Date) => !availableDates || availableDates.some(av => isSameDay(av, d));
    const isHighlighted = (d: Date) => !!highlightedDates && highlightedDates.some(h => isSameDay(h, d));

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

    return (
        <div className="select-none bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="text-slate-900 font-medium text-sm capitalize">
                    {new Date(year, month).toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
                </span>
                <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map(d => (
                    <div key={d} className="text-center text-slate-400 font-medium text-xs">{d}</div>
                ))}
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

// ─── shared input class ──────────────────────────────────
export const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-sm font-medium";
