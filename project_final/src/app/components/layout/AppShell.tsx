import { useState } from "react";
import { CalendarCheck, Bell, LogOut, X, Menu, Trash2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useStore } from "../../../context/StoreContext";
import { Avatar, NotifIcon } from "../ui";

interface SidebarTab {
    key: string;
    label: string;
    icon: React.ElementType;
}

interface SidebarConfig {
    tabs: SidebarTab[];
    active: string;
    onSelect: (k: string) => void;
    badges?: Record<string, number>;
}

interface AppShellProps {
    children: React.ReactNode;
    sidebar?: SidebarConfig;
}

const ROLE_LABELS: Record<string, string> = {
    alumno: "Alumno",
    especialista: "Especialista",
    admin: "Administrador",
};

export function AppShell({ children, sidebar }: AppShellProps) {
    const { user, logout } = useAuth();
    const { notifications, markNotificationsRead, deleteNotification, clearAllNotifications } = useStore();

    const [showNotif, setShowNotif] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!user) return null;

    const roleLabel = ROLE_LABELS[user.role] ?? user.role;
    const notifs = notifications[user.id] ?? [];
    const unread = notifs.filter(n => !n.read).length;

    const handleToggleNotif = () => {
        if (!showNotif && unread > 0) markNotificationsRead(user.id);
        setShowNotif(v => !v);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">

            {/* ── Sidebar desktop ── */}
            {sidebar && (
                <aside className="hidden md:flex w-64 bg-slate-900 flex-col shrink-0 sticky top-0 h-screen">
                    <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                            <CalendarCheck className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm tracking-tight leading-none">Sistema de Citas</p>
                            <p className="text-slate-400 text-[0.6rem] font-medium uppercase tracking-wider mt-0.5">Institucional</p>
                        </div>
                    </div>
                    <nav className="p-4 space-y-1.5 overflow-y-auto flex-1">
                        {sidebar.tabs.map(t => {
                            const isActive = sidebar.active === t.key;
                            const badge = sidebar.badges?.[t.key];
                            return (
                                <button key={t.key} onClick={() => sidebar.onSelect(t.key)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer group ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                                    <t.icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                                    <span className="font-medium text-sm">{t.label}</span>
                                    {badge !== undefined && badge > 0 && (
                                        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? "bg-white text-blue-600" : "bg-blue-500/30 text-white"}`}>
                                            {badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </aside>
            )}

            {/* ── Sidebar mobile overlay ── */}
            {sidebar && sidebarOpen && (
                <>
                    <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
                    <aside className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900 z-50 flex flex-col md:hidden">
                        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <CalendarCheck className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-white font-bold text-sm">Sistema de Citas</p>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white p-2 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <nav className="p-4 space-y-1.5 overflow-y-auto flex-1">
                            {sidebar.tabs.map(t => {
                                const isActive = sidebar.active === t.key;
                                const badge = sidebar.badges?.[t.key];
                                return (
                                    <button key={t.key} onClick={() => { sidebar.onSelect(t.key); setSidebarOpen(false); }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer group ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                                        <t.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                                        <span className="font-medium text-sm">{t.label}</span>
                                        {badge !== undefined && badge > 0 && (
                                            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? "bg-white text-blue-600" : "bg-blue-500/30 text-white"}`}>
                                                {badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>
                </>
            )}

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">

                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 sm:px-6 shrink-0 z-30">

                    {/* Left */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {sidebar ? (
                            <button onClick={() => setSidebarOpen(true)}
                                className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors shrink-0">
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

                    {/* Right */}
                    <div className="flex items-center gap-2 sm:gap-6">

                        {/* ── Bell ── */}
                        <div className="relative">
                            <button onClick={handleToggleNotif}
                                className="relative p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                                <Bell className="w-5 h-5" />
                                {unread > 0 && (
                                    <span className="absolute top-1.5 right-1.5 min-w-[1rem] h-4 px-1 bg-rose-500 border-2 border-white text-white rounded-full flex items-center justify-center text-[0.55rem] font-black animate-pulse">
                                        {unread > 9 ? "9+" : unread}
                                    </span>
                                )}
                            </button>

                            {/* ── Panel ── */}
                            {showNotif && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                                    <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">

                                        {/* Panel header */}
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                            <div>
                                                <h4 className="text-slate-900 font-semibold text-sm">Notificaciones</h4>
                                                <p className="text-slate-500 text-xs font-medium">
                                                    {notifs.length === 0
                                                        ? "Sin notificaciones"
                                                        : unread > 0 ? `${unread} sin leer` : "Todo al día"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {/* Clear all */}
                                                {notifs.length > 0 && (
                                                    <button
                                                        onClick={() => clearAllNotifications(user.id)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Eliminar todas">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Limpiar todo
                                                    </button>
                                                )}
                                                <button onClick={() => setShowNotif(false)}
                                                    className="text-slate-400 hover:text-slate-900 cursor-pointer p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors ml-1">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* List */}
                                        <div className="overflow-y-auto max-h-[28rem] select-none">
                                            {notifs.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                                                        <Bell className="w-6 h-6 text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-500 font-medium text-sm">Sin notificaciones</p>
                                                    <p className="text-slate-400 text-xs mt-1">Aquí aparecerán tus alertas y avisos</p>
                                                </div>
                                            ) : (
                                                notifs.map(n => (
                                                    <div key={n.id}
                                                        className={`group px-5 py-4 border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}>
                                                        <div className="flex items-start gap-3">
                                                            <div className="mt-0.5 shrink-0">
                                                                <NotifIcon type={n.type} />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    <p className={`text-sm truncate ${!n.read ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                                                                        {n.title}
                                                                    </p>
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        {!n.read && (
                                                                            <span className="w-2 h-2 bg-blue-600 rounded-full" />
                                                                        )}
                                                                        {/* Delete single */}
                                                                        <button
                                                                            onClick={() => deleteNotification(user.id, n.id)}
                                                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                                                                            title="Eliminar">
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-slate-500 text-xs leading-relaxed">{n.message}</p>
                                                                <p className="text-slate-400 text-[0.65rem] font-medium mt-1.5 uppercase tracking-wider">{n.time}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                        {/* User chip */}
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-slate-900 font-semibold text-sm leading-tight">{user.name}</p>
                                <p className="text-slate-500 text-xs font-medium">
                                    {roleLabel}{user.department ? ` - ${user.department}` : ""}
                                </p>
                            </div>
                            <Avatar name={user.name} size="md" />
                            <button onClick={logout}
                                className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-1"
                                title="Cerrar sesión">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
