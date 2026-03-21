import { useState, useCallback } from "react";
import { API, authHeaders } from "../lib/api";
import type { User } from "../types";
import { toast } from "sonner";

export function useUsersStore() {
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = useCallback(async (headers: Record<string, string>) => {
    const res = await fetch(`${API}/users?t=${Date.now()}`, { headers });
    if (!res.ok) return;
    setUsers(await res.json());
  }, []);

  const getUserById = useCallback(
    (id: string): User | null => users.find(u => u.id === id) ?? null,
    [users]
  );

  const deleteUser = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API}/users/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error(await res.text());
      setUsers(p => p.filter(u => u.id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("No se pudo eliminar el usuario.");
    }
  }, []);

  return { users, setUsers, loadUsers, getUserById, deleteUser };
}
