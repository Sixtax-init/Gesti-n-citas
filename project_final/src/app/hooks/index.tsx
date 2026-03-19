// ─── useAppointmentWizard ────────────────────────────────
// Encapsula todo el estado del wizard de nueva cita del alumno

import { useState, useEffect } from "react";
import { useStore } from "../../context/StoreContext";
import { useAuth } from "../../context/AuthContext";

export function useAppointmentWizard() {
    const { user } = useAuth();
    const { createAppointment, getSpecialists, getAvailableSlots, getAvailableDays } = useStore();

    const [show, setShow] = useState(false);
    const [step, setStep] = useState(1);
    const [selDept, setSelDept] = useState<string | null>(null);
    const [selSpecId, setSelSpecId] = useState<string | null>(null);
    const [selDate, setSelDate] = useState<Date | null>(null);
    const [selSlot, setSelSlot] = useState<string | null>(null);
    const [selReason, setSelReason] = useState("");
    const [selModality, setSelModality] = useState("Presencial");
    const [confidentialityAccepted, setConfidentialityAccepted] = useState(false);
    const [availDates, setAvailDates] = useState<Date[]>([]);
    const [slotsForDate, setSlotsForDate] = useState<string[]>([]);

    const reset = () => {
        setStep(1); setSelDept(null); setSelSpecId(null); setSelDate(null);
        setSelSlot(null); setSelReason(""); setSelModality("Presencial");
        setConfidentialityAccepted(false);
    };

    useEffect(() => {
        if (!selSpecId) { setAvailDates([]); return; }
        const now = new Date();
        getAvailableDays(selSpecId, now.getFullYear(), now.getMonth()).then(setAvailDates);
    }, [selSpecId]);

    useEffect(() => {
        if (!selDate || !selSpecId) { setSlotsForDate([]); return; }
        getAvailableSlots(selSpecId, selDate.toISOString().split("T")[0]).then(setSlotsForDate);
    }, [selDate, selSpecId]);

    const confirm = () => {
        createAppointment({
            studentId: user!.id,
            studentName: user!.name,
            specialistId: selSpecId!,
            department: selDept!,
            motivo: selReason,
            modality: selModality,
            preferredDate: selDate!.toISOString().split("T")[0],
            preferredTime: selSlot!,
        });
        setStep(4);
    };

    const deptSpecialists = selDept ? getSpecialists(selDept) : [];
    const selSpec = deptSpecialists.find(s => s.id === selSpecId);

    return {
        show, setShow, step, setStep,
        selDept, setSelDept, selSpecId, setSelSpecId,
        selDate, setSelDate, selSlot, setSelSlot,
        selReason, setSelReason, selModality, setSelModality,
        confidentialityAccepted, setConfidentialityAccepted,
        availDates, slotsForDate,
        deptSpecialists, selSpec,
        reset, confirm,
    };
}

// ─── useReschedule ───────────────────────────────────────
// Encapsula el estado del modal de reagendamiento (alumno y especialista)

export function useReschedule(role: "student" | "specialist") {
    const { rescheduleAppointment, getAvailableDays, getAvailableSlots, getAppointments } = useStore();
    const { user } = useAuth();

    const [show, setShow] = useState(false);
    const [apptId, setApptId] = useState<string | null>(null);
    const [date, setDate] = useState<Date | null>(null);
    const [slot, setSlot] = useState<string | null>(null);
    const [availDates, setAvailDates] = useState<Date[]>([]);
    const [slots, setSlots] = useState<string[]>([]);
    const [selModality, setSelModality] = useState("Presencial");

    const appointments = getAppointments(
        role === "student" ? { studentId: user?.id } : { specialistId: user?.id }
    );

    useEffect(() => {
        if (!apptId) { setAvailDates([]); return; }
        const appt = appointments.find(a => a.id === apptId);
        if (!appt) return;
        const now = new Date();
        getAvailableDays(appt.specialistId, now.getFullYear(), now.getMonth()).then(setAvailDates);
    }, [apptId]);

    useEffect(() => {
        if (!date || !apptId) { setSlots([]); return; }
        const appt = appointments.find(a => a.id === apptId);
        if (!appt) return;
        getAvailableSlots(appt.specialistId, date.toISOString().split("T")[0]).then(setSlots);
    }, [date, apptId]);

    const open = (id: string) => {
        setApptId(id); setDate(null); setSlot(null); setShow(true);
    };

    const confirm = () => {
        if (!apptId || !date || !slot) return;
        rescheduleAppointment(apptId, date.toISOString().split("T")[0], slot, role, selModality);
        setShow(false); setApptId(null); setDate(null); setSlot(null);
    };

    return {
        show, setShow, apptId, date, setDate, slot, setSlot,
        availDates, slots, selModality, setSelModality,
        open, confirm,
    };
}

// ─── useCancelAppointment ────────────────────────────────
// Encapsula la lógica del modal de cancelación del alumno

export function useCancelAppointment() {
    const { updateAppointmentStatus } = useStore();

    const [show, setShow] = useState(false);
    const [apptId, setApptId] = useState<string | null>(null);
    const [reason, setReason] = useState("");

    const open = (id: string) => { setApptId(id); setReason(""); setShow(true); };
    const close = () => setShow(false);

    const confirm = () => {
        if (!apptId) return;
        updateAppointmentStatus(apptId, "Cancelada", reason, true);
        setShow(false); setApptId(null); setReason("");
    };

    return { show, open, close, apptId, reason, setReason, confirm };
}

// ─── useActionModal ──────────────────────────────────────
// Modal genérico de cambio de estado (especialista / admin)

import type { Appointment } from "../../types";

export function useActionModal() {
    const { updateAppointmentStatus } = useStore();

    const [appt, setAppt] = useState<Appointment | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [notes, setNotes] = useState("");

    const open = (a: Appointment, s: string) => { setAppt(a); setStatus(s); setNotes(""); };
    const close = () => { setAppt(null); setStatus(null); };

    const confirm = (notifyStudent = false) => {
        if (!appt || !status) return;
        updateAppointmentStatus(appt.id, status, notes || undefined, notifyStudent);
        close();
    };

    return { appt, status, notes, setNotes, open, close, confirm };
}
