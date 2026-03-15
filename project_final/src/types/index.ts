import React from 'react';

export interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  available: boolean;
  week?: number; // 0: current, 1: next, undefined: both
  specificDate?: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: string;
  matricula?: string;
  carrera?: string;
  semestre?: number;
  edad?: number;
  genero?: string;
  department?: string;
}

export interface Specialist {
  id: string;
  userId: string;
  name: string;
  department: string;
  email: string;
  active: boolean;
  shift?: string;
  schedule: ScheduleSlot[];
}

export interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  specialistId: string;
  specialistName: string;
  department: string;
  date: string;
  time: string;
  status: string;
  modality: string;
  motivo: string;
  notes?: string;
  createdAt: string;
}

export interface AppEvent {
  id: string;
  title: string;
  description: string;
  department: string;
  date: string;
  time: string;
  type: string;
  imageUrl?: string;
  registrationUrl?: string;
}

export interface Resource {
  id: string;
  department: string;
  type: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface AppointmentFilters {
  studentId?: string;
  specialistId?: string;
  department?: string;
  status?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: string;
}

export interface StoreContextType {
  users: User[];
  specialistsLoaded: boolean;
  getUserById: (id: string) => User | null;
  loginUser: (email: string, password: string) => User | null;
  specialists: Specialist[];
  getSpecialists: (dept?: string) => Specialist[];
  getSpecialistById: (id: string) => Specialist | null;
  addSpecialist: (data: any) => Promise<void>;
  updateSpecialist: (id: string, data: any) => Promise<void>;
  removeSpecialist: (id: string) => Promise<void>;
  appointments: Appointment[];
  getAppointments: (filters?: AppointmentFilters) => Appointment[];
  createAppointment: (req: { studentId: string; studentName?: string; specialistId: string; department: string; motivo: string; modality: string; preferredDate: string; preferredTime: string }) => Appointment;
  updateAppointmentStatus: (id: string, status: string, notes?: string, byStudent?: boolean) => void;
  rescheduleAppointment: (id: string, newDate: string, newTime: string, byRole?: 'specialist' | 'student', modality?: string) => void;
  getAvailableSlots: (specialistId: string, dateStr: string) => Promise<string[]>;
  getAvailableDays: (specialistId: string, year: number, month: number) => Promise<Date[]>;
  addScheduleSlot: (specialistId: string, slot: Omit<ScheduleSlot, "id">) => void;
  removeScheduleSlot: (specialistId: string, slotId: string) => void;
  events: AppEvent[];
  addEvent: (ev: Omit<AppEvent, "id">, file?: File) => Promise<void>;
  resources: Resource[];
  addResource: (r: Omit<Resource, "id">, file?: File) => Promise<void>;
  getStats: () => { 
    summary: { total: number; pendientes: number; confirmadas: number; completadas: number; canceladas: number; byDept: Record<string, number> };
    charts: {
      monthly: any[];
      motivos: any[];
      modalidad: any[];
      carrera: any[];
    }
  };
  notifications: Record<string, AppNotification[]>;
  addNotification: (userId: string, notif: Omit<AppNotification, "id" | "time" | "read">) => void;
  markNotificationsRead: (userId: string) => void;
  deleteUser: (id: string) => Promise<void>;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: Partial<User>) => Promise<boolean>;
  logout: () => void;
}
