import React, { useState, useCallback, createContext, useContext } from "react";
import { StoreContextType, AppNotification, Specialist, Appointment, AppEvent, Resource, AppointmentFilters } from "../types";
import { SEED_NOTIFICATIONS } from "../data/mockData";

export const API_BASE = 'http://localhost:3000';
const API = `${API_BASE}/api`;

/**
 * Converts a relative upload path (/uploads/...) returned by the backend
 * into a full absolute URL. External URLs (http/https) are returned as-is.
 */
export function getImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  return url;
}

export const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [notifications, setNotifications] = useState<Record<string, AppNotification[]>>(SEED_NOTIFICATIONS);
  const [specialistsLoaded, setSpecialistsLoaded] = useState(false);

  // ── Initial data fetch from backend ──
  const fetchAll = React.useCallback(async () => {
    try {
      const [specsRes, apptsRes, eventsRes, resourcesRes, usersRes] = await Promise.all([
        fetch(`${API}/specialists`),
        fetch(`${API}/appointments`),
        fetch(`${API}/events`),
        fetch(`${API}/resources`),
        fetch(`${API}/users?t=${Date.now()}`),
      ]);

      if (specsRes.ok) {
        const data = await specsRes.json();
        const mapped = data.map((s: any) => ({ ...s, schedule: s.schedules ?? [] }));
        setSpecialists(mapped);
        setSpecialistsLoaded(true);
      }

      if (apptsRes.ok) {
        const appts = await apptsRes.json();
        // Sync names from the latest users/specialists data to keep them fresh
        setAppointments(appts);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.map((e: any) => ({ ...e, imageUrl: getImageUrl(e.imageUrl) })));
      }

      if (resourcesRes.ok) {
        const data = await resourcesRes.json();
        setResources(data.map((r: any) => ({
          ...r,
          imageUrl: getImageUrl(r.imageUrl),
          fileUrl: getImageUrl(r.fileUrl),
        })));
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error en fetchAll:", err);
      setSpecialistsLoaded(true);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Polling cada 30 segundos ──
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchAll();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Refetch al volver a la pestaña (visibilitychange) ──
  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchAll();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchAll]);

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

  const deleteNotification = useCallback((userId: string, notifId: string) => {
    setNotifications(p => ({
      ...p,
      [userId]: (p[userId] || []).filter(n => n.id !== notifId)
    }));
  }, []);

  const clearAllNotifications = useCallback((userId: string) => {
    setNotifications(p => ({ ...p, [userId]: [] }));
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

    // Always resolve names from the latest users/specialists state
    // so name changes in the DB are reflected without recreating appointments
    r = r.map(appt => {
      const student = users.find(u => u.id === appt.studentId);
      const specialist = specialists.find(s => s.id === appt.specialistId);
      return {
        ...appt,
        studentName: student?.name ?? appt.studentName,
        specialistName: specialist?.name ?? appt.specialistName,
      };
    });

    return r.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [appointments, users, specialists]);

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

    // Días de la semana con horarios recurrentes
    const recurringDows = [...new Set(spec.schedule.filter((s: any) => s.available && s.specificDate === null).map((s: any) => s.dayOfWeek))];
    // Fechas específicas con horarios únicos
    const specificDates = [...new Set(spec.schedule.filter((s: any) => s.available && s.specificDate !== null).map((s: any) => s.specificDate))];

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayChecks: { date: Date; promise: Promise<string[]> }[] = [];

    for (let m = 0; m < 2; m++) {
      const targetMonth = month + m;
      const targetYear = targetMonth > 11 ? year + 1 : year;
      const normalizedMonth = targetMonth % 12;
      for (let d = new Date(targetYear, normalizedMonth, 1), end = new Date(targetYear, normalizedMonth + 1, 0); d <= end; d.setDate(d.getDate() + 1)) {
        if (d < today) continue;
        const ds = d.toISOString().split("T")[0];

        // Candidato si tiene horario recurrente para ese día de la semana O si tiene una fecha específica exacta
        if (recurringDows.includes(d.getDay()) || specificDates.includes(ds)) {
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
  const addEvent = useCallback(async (ev: Omit<AppEvent, "id">, file?: File) => {
    try {
      const formData = new FormData();
      Object.entries(ev).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value as string);
      });
      if (file) formData.append('image', file);

      const res = await fetch(`${API}/events`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newEv = await res.json();
        setEvents(p => [{ ...newEv, imageUrl: getImageUrl(newEv.imageUrl) }, ...p]);
      }
    } catch (error) { console.error('Error adding event:', error); }
  }, []);

  // ── resources (persist to backend) ──
  const addResource = useCallback(async (r: Omit<Resource, "id">, file?: File) => {
    try {
      const formData = new FormData();
      Object.entries(r).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value as string);
      });
      if (file) formData.append('file', file);

      const res = await fetch(`${API}/resources`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newRes = await res.json();
        setResources(p => [...p, {
          ...newRes,
          imageUrl: getImageUrl(newRes.imageUrl),
          fileUrl: getImageUrl(newRes.fileUrl),
        }]);
      }
    } catch (error) { console.error('Error adding resource:', error); }
  }, []);

  const [realStats, setRealStats] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/stats`);
      if (res.ok) {
        const data = await res.json();
        setRealStats(data);
      }
    } catch (error) { console.error('Error fetching real stats:', error); }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [appointments, fetchStats]);

  // ── stats ──
  const getStats = useCallback(() => {
    if (realStats) return realStats;

    // Fallback while loading or if error
    return {
      summary: {
        total: appointments.length,
        pendientes: appointments.filter(a => a.status === "Pendiente").length,
        confirmadas: appointments.filter(a => a.status === "Confirmada").length,
        completadas: appointments.filter(a => a.status === "Completada").length,
        canceladas: appointments.filter(a => a.status === "Cancelada").length,
        byDept: {
          Psicología: appointments.filter(a => a.department === "Psicología").length,
          Tutorías: appointments.filter(a => a.department === "Tutorías").length,
          Nutrición: appointments.filter(a => a.department === "Nutrición").length
        }
      },
      charts: {
        monthly: [],
        motivos: [],
        modalidad: [],
        carrera: []
      }
    };
  }, [appointments, realStats]);

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
      resources, addResource, getStats, notifications, addNotification, markNotificationsRead,
      deleteNotification, clearAllNotifications, deleteUser,
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
