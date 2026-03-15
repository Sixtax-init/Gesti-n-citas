import React, { useState, useCallback, createContext, useContext } from "react";
import { StoreContextType, AppNotification, Specialist, Appointment, AppEvent, Resource, AppointmentFilters } from "../types";

const API = 'http://localhost:3000/api';

export const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [notifications, setNotifications] = useState<Record<string, AppNotification[]>>({});
  const [specialistsLoaded, setSpecialistsLoaded] = useState(false);

  // ── Initial data fetch from backend ──
  React.useEffect(() => {
    fetch(`${API}/specialists`)
      .then(res => res.json())
      .then(data => {
        // Prisma returns `schedules` (relation name), frontend type expects `schedule`
        const mapped = data.map((s: any) => ({ ...s, schedule: s.schedules ?? [] }));
        setSpecialists(mapped);
        setSpecialistsLoaded(true);
      })
      .catch(() => setSpecialistsLoaded(true));

    fetch(`${API}/appointments`)
      .then(res => res.json())
      .then(setAppointments)
      .catch(console.error);

    fetch(`${API}/events`)
      .then(res => res.json())
      .then(setEvents)
      .catch(console.error);

    fetch(`${API}/resources`)
      .then(res => res.json())
      .then(setResources)
      .catch(console.error);

    fetch(`${API}/users?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        console.log("DEBUG: Usuarios cargados desde API:", data);
        setUsers(data);
      })
      .catch(err => {
        console.error("DEBUG: Error cargando usuarios:", err);
      });
  }, []);

  const addNotification = useCallback((userId: string, notif: Omit<AppNotification, "id" | "time" | "read">) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `n${Date.now()}`,
      time: "Ahora",
      read: false
    };
    setNotifications(p => ({
      ...p,
      [userId]: [newNotif, ...(p[userId] || [])]
    }));
  }, []);

  const markNotificationsRead = useCallback((userId: string) => {
    setNotifications(p => ({
      ...p,
      [userId]: (p[userId] || []).map(n => ({ ...n, read: true }))
    }));
  }, []);

  // ── auth ──
  const loginUser = useCallback((email: string, password: string) => users.find(u => u.email === email && u.password === password) || null, [users]);
  const getUserById = useCallback((id: string) => users.find(u => u.id === id) || null, [users]);

  // ── specialists ──
  const getSpecialists = useCallback((dept?: string) => dept ? specialists.filter(s => s.department === dept) : [...specialists], [specialists]);
  const getSpecialistById = useCallback((id: string) => specialists.find(s => s.id === id) || null, [specialists]);
  
  const addSpecialist = useCallback(async (data: any) => {
    try {
      const res = await fetch(`${API}/specialists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const newSpec = await res.json();
        setSpecialists(p => [...p, { ...newSpec, schedule: newSpec.schedules ?? [] }]);
        // Refresh users list too since a new user was created
        fetch(`${API}/users`).then(r => r.json()).then(setUsers);
      }
    } catch (error) { console.error('Error adding specialist:', error); }
  }, []);

  const updateSpecialist = useCallback(async (id: string, data: any) => {
    try {
      const res = await fetch(`${API}/specialists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated = await res.json();
        setSpecialists(p => p.map(s => s.id === id ? { ...updated, schedule: updated.schedules ?? [] } : s));
        fetch(`${API}/users`).then(r => r.json()).then(setUsers);
      }
    } catch (error) { console.error('Error updating specialist:', error); }
  }, []);

  const removeSpecialist = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API}/specialists/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSpecialists(p => p.filter(s => s.id !== id));
        fetch(`${API}/users`).then(r => r.json()).then(setUsers);
      }
    } catch (error) { console.error('Error removing specialist:', error); }
  }, []);

  // ── appointments ──
  const getAppointments = useCallback((filters: AppointmentFilters = {}) => {
    let r = [...appointments];
    if (filters.studentId) r = r.filter(a => a.studentId === filters.studentId);
    if (filters.specialistId) r = r.filter(a => a.specialistId === filters.specialistId);
    if (filters.department) r = r.filter(a => a.department === filters.department);
    if (filters.status) r = r.filter(a => a.status === filters.status);
    return r.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [appointments]);

  const createAppointment = useCallback((req: { studentId: string; specialistId: string; department: string; motivo: string; modality: string; preferredDate: string; preferredTime: string; studentName?: string }) => {
    const spec = specialists.find(s => s.id === req.specialistId);
    const student = users.find(u => u.id === req.studentId);

    const payload = {
      studentId: req.studentId,
      studentName: req.studentName || student?.name || "Alumno",
      specialistId: req.specialistId,
      specialistName: spec?.name || "Especialista",
      department: req.department,
      date: req.preferredDate,
      time: req.preferredTime,
      modality: req.modality,
      motivo: req.motivo
    };

    fetch(`${API}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(newAppt => setAppointments(p => [newAppt, ...p.filter(a => !a.id.startsWith('temp-'))]))
    .catch(console.error);

    // Optimistic return
    return { ...payload, id: `temp-${Date.now()}`, status: 'Pendiente', createdAt: new Date().toISOString() } as Appointment;
  }, [specialists, users]);

  const updateAppointmentStatus = useCallback((id: string, status: string, notes?: string, byStudent?: boolean) => {
    setAppointments(p => {
      const appt = p.find(a => a.id === id);
      if (appt && status === "Cancelada") {
        if (!byStudent) {
          addNotification(appt.studentId, {
            title: "Cita Cancelada",
            message: `El especialista ${appt.specialistName} ha cancelado la cita de ${appt.department} del ${new Date(appt.date + "T12:00:00").toLocaleDateString()} a las ${appt.time}.`,
            type: "cancelled"
          });
        } else {
          addNotification(appt.specialistId, {
            title: "Cita Cancelada por Alumno",
            message: `El alumno ${appt.studentName} ha cancelado la cita del ${new Date(appt.date + "T12:00:00").toLocaleDateString()} a las ${appt.time}. Motivo: ${notes || 'Sin especificar'}`,
            type: "cancelled"
          });
        }
      }
      return p.map(a => a.id === id ? { ...a, status, ...(notes ? { notes } : {}) } : a);
    });
    fetch(`${API}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    }).catch(console.error);
  }, [addNotification]);

  const rescheduleAppointment = useCallback((id: string, newDate: string, newTime: string, byRole?: 'specialist' | 'student', modality?: string) => {
    setAppointments(p => {
      const appt = p.find(a => a.id === id);
      if (appt) {
        const newModality = modality || appt.modality;
        const modalityChanged = modality && modality !== appt.modality;
        if (byRole === 'specialist') {
          addNotification(appt.studentId, {
            title: "Cita Reagendada",
            message: `Tu cita con ${appt.specialistName} ha sido reagendada para el ${new Date(newDate + "T12:00:00").toLocaleDateString()} a las ${newTime}.`,
            type: "reschedule"
          });
        } else if (byRole === 'student') {
          addNotification(appt.specialistId, {
            title: "Cita Reagendada por Alumno",
            message: `El alumno ${appt.studentName} ha reagendado su cita para el ${new Date(newDate + "T12:00:00").toLocaleDateString()} a las ${newTime}.${modalityChanged ? ` La modalidad cambió a ${newModality}.` : ''}`,
            type: "reschedule"
          });
        }
      }
      return p.map(a => a.id === id ? { ...a, date: newDate, time: newTime, status: "Pendiente", ...(modality && { modality }) } : a);
    });
    fetch(`${API}/appointments/${id}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate, time: newTime, modality })
    }).catch(console.error);
  }, [addNotification]);

  // ── available slots (fetched from backend which checks DB) ──
  const getAvailableSlots = useCallback(async (specialistId: string, dateStr: string) => {
    try {
      const res = await fetch(`${API}/specialists/${specialistId}/available-slots?date=${dateStr}`);
      if (res.ok) return await res.json();
      return [];
    } catch { return []; }
  }, []);

  const getAvailableDays = useCallback(async (specialistId: string, year: number, month: number) => {
    const spec = specialists.find(s => s.id === specialistId);
    if (!spec) return [];
    const activeDows = [...new Set(spec.schedule.filter((s: any) => s.available).map((s: any) => s.dayOfWeek))];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayChecks: { date: Date; promise: Promise<string[]> }[] = [];

    for (let m = 0; m < 2; m++) {
      const targetMonth = month + m;
      const targetYear = targetMonth > 11 ? year + 1 : year;
      const normalizedMonth = targetMonth % 12;
      for (let d = new Date(targetYear, normalizedMonth, 1), end = new Date(targetYear, normalizedMonth + 1, 0); d <= end; d.setDate(d.getDate() + 1)) {
        if (d < today) continue;
        if (activeDows.includes(d.getDay())) {
          const ds = d.toISOString().split("T")[0];
          dayChecks.push({ date: new Date(d), promise: getAvailableSlots(specialistId, ds) });
        }
      }
    }

    const days: Date[] = [];
    for (const check of dayChecks) {
      const slots = await check.promise;
      if (slots.length > 0) days.push(check.date);
    }
    return days;
  }, [specialists, getAvailableSlots]);

  // ── schedule management (persist to backend) ──
  const addScheduleSlot = useCallback((specialistId: string, slot: Omit<any, "id">) => {
    fetch(`${API}/specialists/${specialistId}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slot)
    })
    .then(res => res.json())
    .then(newSlot => {
      setSpecialists(p => p.map(s => s.id === specialistId
        ? { ...s, schedule: [...s.schedule, newSlot] }
        : s
      ));
    })
    .catch(console.error);
  }, []);

  const removeScheduleSlot = useCallback((specialistId: string, slotId: string) => {
    // Optimistic update
    setSpecialists(p => p.map(s => s.id === specialistId ? { ...s, schedule: s.schedule.filter(sl => sl.id !== slotId) } : s));
    fetch(`${API}/specialists/${specialistId}/schedules/${slotId}`, { method: 'DELETE' }).catch(console.error);
  }, []);

  // ── events (persist to backend) ──
  const addEvent = useCallback((ev: Omit<AppEvent, "id">) => {
    fetch(`${API}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ev)
    })
    .then(res => res.json())
    .then(newEv => setEvents(p => [newEv, ...p]))
    .catch(console.error);
  }, []);

  // ── resources (persist to backend) ──
  const addResource = useCallback((r: Omit<Resource, "id">) => {
    fetch(`${API}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r)
    })
    .then(res => res.json())
    .then(newRes => setResources(p => [...p, newRes]))
    .catch(console.error);
  }, []);

  // ── stats ──
  const getStats = useCallback(() => ({
    total: appointments.length,
    pendientes: appointments.filter(a => a.status === "Pendiente").length,
    confirmadas: appointments.filter(a => a.status === "Confirmada").length,
    completadas: appointments.filter(a => a.status === "Completada").length,
    canceladas: appointments.filter(a => a.status === "Cancelada").length,
    byDept: {
      Psicología: appointments.filter(a => a.department === "Psicología").length,
      Tutorías: appointments.filter(a => a.department === "Tutorías").length,
      Nutrición: appointments.filter(a => a.department === "Nutrición").length
    },
  }), [appointments]);

  const deleteUser = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API}/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(p => p.filter(u => u.id !== id));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }, []);

  return (
    <StoreContext.Provider value={{
      users, specialistsLoaded, loginUser, getUserById, specialists, getSpecialists, getSpecialistById, addSpecialist,
      appointments, getAppointments, createAppointment, updateAppointmentStatus, rescheduleAppointment,
      getAvailableSlots, getAvailableDays, addScheduleSlot, removeScheduleSlot, events, addEvent,
      resources, addResource, getStats, notifications, addNotification, markNotificationsRead, deleteUser,
      updateSpecialist, removeSpecialist
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = (): StoreContextType => {
  const c = useContext(StoreContext);
  if (!c) throw new Error("useStore must be inside StoreProvider");
  return c;
};
