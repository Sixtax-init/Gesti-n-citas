import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { LoginForm } from "./pages/auth/LoginForm";
import { RegisterForm } from "./pages/auth/RegisterForm";
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { SpecialistDashboard } from "./pages/specialist/SpecialistDashboard";
import { AdminDashboard } from "./pages/admin/AdminDashboard";

// ─── AppRouter ───────────────────────────────────────────
function AppRouter() {
  const { user, isAuthenticated, loading } = useAuth();
  const { fetchAll } = useStore();

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated]);
  const [view, setView] = useState<"login" | "register">("login");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Iniciando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return view === "register"
      ? <RegisterForm onSwitchToLogin={() => setView("login")} />
      : <LoginForm onSwitchToRegister={() => setView("register")} />;
  }

  return (
    <>
      {user.role === "alumno" && <StudentDashboard />}
      {user.role === "especialista" && <SpecialistDashboard />}
      {user.role === "admin" && <AdminDashboard />}
    </>
  );
}

// ─── Root ────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </>
  );
}
