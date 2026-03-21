import { useState, useCallback } from "react";
import { API, authHeaders } from "../lib/api";
import type { AppNotification } from "../types";
import { toast } from "sonner";

export function useNotificationsStore() {
  const [notifications, setNotifications] = useState<Record<string, AppNotification[]>>({});

  const loadNotifications = useCallback(async (headers: Record<string, string>) => {
    const res = await fetch(`${API}/notifications`, { headers });
    if (!res.ok) return;
    const data: AppNotification[] = await res.json();
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setNotifications({ [payload.id]: data });
    } catch { /* ignore */ }
  }, []);

  const addNotification = useCallback((userId: string, notif: Omit<AppNotification, "id" | "time" | "read">) => {
    const optimisticId = `n${Date.now()}`;
    const newNotif: AppNotification = { ...notif, id: optimisticId, time: "Ahora", read: false };
    setNotifications(p => ({ ...p, [userId]: [newNotif, ...(p[userId] ?? [])] }));

    fetch(`${API}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ userId, title: notif.title, message: notif.message, type: notif.type }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(saved => {
        if (saved) {
          setNotifications(p => ({
            ...p,
            [userId]: (p[userId] ?? []).map(n => n.id === optimisticId ? { ...n, id: saved.id } : n),
          }));
        }
      })
      .catch(() => { /* optimistic update stands */ });
  }, []);

  const markNotificationsRead = useCallback((userId: string) => {
    setNotifications(p => ({ ...p, [userId]: (p[userId] ?? []).map(n => ({ ...n, read: true })) }));
    fetch(`${API}/notifications/read-all`, { method: "PATCH", headers: authHeaders() }).catch(() => { });
  }, []);

  const deleteNotification = useCallback((userId: string, notifId: string) => {
    setNotifications(p => ({ ...p, [userId]: (p[userId] ?? []).filter(n => n.id !== notifId) }));
    fetch(`${API}/notifications/${notifId}`, { method: "DELETE", headers: authHeaders() }).catch(() => { });
  }, []);

  const clearAllNotifications = useCallback((userId: string) => {
    setNotifications(p => ({ ...p, [userId]: [] }));
    fetch(`${API}/notifications/all`, { method: "DELETE", headers: authHeaders() }).catch(err => {
      console.error("Error clearing notifications:", err);
      toast.error("No se pudieron eliminar las notificaciones.");
    });
  }, []);

  return {
    notifications,
    loadNotifications,
    addNotification,
    markNotificationsRead,
    deleteNotification,
    clearAllNotifications,
  };
}
