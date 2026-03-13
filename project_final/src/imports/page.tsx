"use client"

import { useState } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { RegisterForm } from "@/components/register-form"
import { AppShell } from "@/components/app-shell"
import { StudentDashboard } from "@/components/student-dashboard"
import { SpecialistDashboard } from "@/components/specialist-dashboard"
import { AdminDashboard } from "@/components/admin-dashboard"

function AppRouter() {
  const { user, isAuthenticated } = useAuth()
  const [view, setView] = useState<"login" | "register">("login")

  if (!isAuthenticated || !user) {
    if (view === "register") {
      return <RegisterForm onSwitchToLogin={() => setView("login")} />
    }
    return <LoginForm onSwitchToRegister={() => setView("register")} />
  }

  return (
    <AppShell>
      {user.role === "alumno" && <StudentDashboard />}
      {user.role === "especialista" && <SpecialistDashboard />}
      {user.role === "admin" && <AdminDashboard />}
    </AppShell>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
