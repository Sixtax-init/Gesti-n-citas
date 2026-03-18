import { useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, Brain, GraduationCap, Apple, RefreshCw, ChevronRight } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const DEPARTMENTS = [
    { name: "Psicología", icon: Brain, gradient: "from-blue-500 to-blue-700" },
    { name: "Tutorías", icon: GraduationCap, gradient: "from-emerald-500 to-teal-600" },
    { name: "Nutrición", icon: Apple, gradient: "from-amber-500 to-orange-500" },
];

const DEMO_ACCOUNTS = [
    { role: "Alumno", email: "alumno@instituto.edu.mx", pass: "alumno123", color: "blue" },
    { role: "Especialista", email: "psicologo@instituto.edu.mx", pass: "esp123", color: "emerald" },
    { role: "Admin", email: "admin@instituto.edu.mx", pass: "admin123", color: "slate" },
];

export function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const ok = await login(email, password);
        setLoading(false);
        if (!ok) toast.error("Credenciales incorrectas.");
    };

    const demoLogin = async (em: string, pw: string) => {
        setEmail(em); setPassword(pw); setLoading(true);
        await login(em, pw);
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-slate-50 relative overflow-hidden font-sans">

            {/* ── Left panel ── */}
            <div className="hidden lg:flex w-[52%] flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-teal-700">
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
                        Gestión inteligente para tu{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-300">
                            bienestar integral
                        </span>.
                    </h2>

                    <div className="space-y-4 max-w-sm mt-12">
                        {DEPARTMENTS.map(d => (
                            <div key={d.name} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${d.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                                    <d.icon className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-white font-medium">{d.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats row */}
                <div className="relative z-10 grid grid-cols-3 gap-6 pt-10 border-t border-white/10 mt-12">
                    <div><p className="text-3xl font-bold text-white mb-1">500+</p><p className="text-white/60 text-xs font-medium uppercase tracking-wider">Alumnos</p></div>
                    <div><p className="text-3xl font-bold text-white mb-1">3</p><p className="text-white/60 text-xs font-medium uppercase tracking-wider">Departamentos</p></div>
                    <div><p className="text-3xl font-bold text-white mb-1">98%</p><p className="text-white/60 text-xs font-medium uppercase tracking-wider">Satisfacción</p></div>
                </div>
            </div>

            {/* ── Right panel ── */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
                        <div className="text-center mb-6 sm:mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Iniciar Sesión</h2>
                            <p className="text-slate-500 mt-2 text-sm">Ingresa con tus credenciales institucionales</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Correo institucional</label>
                                <div className={`relative transition-all duration-300 rounded-xl border-2 ${focused === "email" ? "border-blue-600 bg-blue-50/30" : "border-slate-200 bg-slate-50"}`}>
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <span className={`transition-colors duration-300 ${focused === "email" ? "text-blue-600" : "text-slate-400"}`}>@</span>
                                    </div>
                                    <input
                                        type="email" value={email} required
                                        onChange={e => setEmail(e.target.value)}
                                        onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                                        placeholder="usuario@instituto.edu.mx"
                                        className="w-full pl-10 pr-4 py-3 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Contraseña</label>
                                <div className={`relative transition-all duration-300 rounded-xl border-2 ${focused === "password" ? "border-blue-600 bg-blue-50/30" : "border-slate-200 bg-slate-50"}`}>
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <span className="font-bold text-slate-400" style={{ color: focused === "password" ? "#2563EB" : "#94a3b8" }}>*</span>
                                    </div>
                                    <input
                                        type="password" value={password} required
                                        onChange={e => setPassword(e.target.value)}
                                        onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm font-medium tracking-widest"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="w-full py-3.5 mt-4 bg-gradient-to-r from-blue-700 to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer flex justify-center items-center"
                            >
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Ingresar"}
                            </button>
                        </form>

                        {/* Demo accounts */}
                        <div className="mt-8 border-t border-slate-100 pt-8">
                            <p className="text-xs font-semibold text-slate-400 text-center uppercase tracking-wider mb-4">Cuentas de acceso rápido</p>
                            <div className="flex flex-col gap-2.5">
                                {DEMO_ACCOUNTS.map(c => (
                                    <button
                                        key={c.role}
                                        onClick={() => demoLogin(c.email, c.pass)}
                                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group cursor-pointer text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-${c.color}-100 text-${c.color}-700`}>{c.role}</span>
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate max-w-[180px]">{c.email}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="text-center mt-8 text-slate-500 text-sm">
                        ¿No tienes cuenta?{" "}
                        <button onClick={onSwitchToRegister} className="text-blue-600 font-semibold hover:text-blue-700 underline underline-offset-4 cursor-pointer">
                            Registrarse
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
