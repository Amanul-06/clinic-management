import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  Pencil,
  X,
  UserRound,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  CalendarCheck,
} from "lucide-react";

import { demoStore } from "../../data/demoStore";
import "./Appointments.css";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const addDays = (date, days) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const emptyForm = {
  patientId: "",
  doctorId: "",
  date: today(),
  time: "",
  duration: 30,
  type: "Consultation",
  fee: "",
};

const emptyPatient = {
  name: "",
  dob: "",
  gender: "Male",
  phone: "",
  address: "",
  bloodGroup: "",
};

function formatDate(date) {
  if (!date) return "—";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Accepts "09:30", "9:30", or "09:30:00".
function formatTime(time) {
  if (!time || typeof time !== "string") return "—";

  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return "—";

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

// Normalize different possible slot formats returned by the store.
function normalizeSlot(slot) {
  if (typeof slot === "string") {
    return {
      time: slot,
      duration: 30,
    };
  }

  if (typeof slot === "number") {
    const hours = Math.floor(slot / 60);
    const minutes = slot % 60;

    return {
      time: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
      duration: 30,
    };
  }

  if (!slot || typeof slot !== "object") return null;

  const rawTime =
    slot.time ??
    slot.startTime ??
    slot.start ??
    slot.value ??
    slot.slotTime ??
    slot.from;

  if (typeof rawTime === "number") {
    const hours = Math.floor(rawTime / 60);
    const minutes = rawTime % 60;

    return {
      time: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
      duration: Number(slot.duration) || 30,
    };
  }

  if (!rawTime) return null;

  return {
    ...slot,
    time: String(rawTime).slice(0, 5),
    duration: Number(slot.duration) || 30,
  };
}

function getWeekday(date) {
  return weekdays[new Date(`${date}T12:00:00`).getDay()];
}

function getDateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ ...emptyForm });
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [newPatient, setNewPatient] = useState({ ...emptyPatient });

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const loadData = () => {
    setAppointments(demoStore.getAll("appointments") || []);
    setPatients(demoStore.getAll("patients") || []);
    setDoctors(demoStore.getAll("doctors") || []);
    setSchedules(demoStore.getAll("schedules") || []);
  };

  useEffect(() => {
    loadData();
    return demoStore.subscribe(loadData);
  }, []);

  const selectedPatient = patients.find(
    (patient) => patient.id === form.patientId,
  );

  const selectedDoctor = doctors.find((doctor) => doctor.id === form.doctorId);

  const doctorSchedule = schedules.find(
    (schedule) => schedule.doctorId === form.doctorId,
  );

  const minimumDate = today();
  const maximumDate = addDays(today(), 30);

  // Fetch slots from the central availability engine and normalize them.
  const availableSlots = useMemo(() => {
    if (!form.doctorId || !form.date) return [];

    const rawSlots = demoStore.getAvailableSlots({
      doctorId: form.doctorId,
      date: form.date,
      excludeAppointmentId: editingId || undefined,
    });

    if (!Array.isArray(rawSlots)) return [];

    return rawSlots
      .map(normalizeSlot)
      .filter((slot) => slot?.time)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [form.doctorId, form.date, editingId, appointments, schedules]);

  const matchingPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();

    if (!query) return [];

    return patients
      .filter(
        (patient) =>
          patient.name?.toLowerCase().includes(query) ||
          patient.phone?.includes(query) ||
          patient.id?.toLowerCase().includes(query),
      )
      .slice(0, 6);
  }, [patients, patientSearch]);

  const workingDays = useMemo(() => {
    const weekly = doctorSchedule?.weekly || {};

    return weekdays.filter(
      (day) => weekly[day]?.enabled && weekly[day]?.shifts?.length,
    );
  }, [doctorSchedule]);

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setPatientSearch("");
    setShowPatientForm(false);
    setShowPatientResults(false);
    setNewPatient({ ...emptyPatient });

    const d = new Date();
    setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));

    setShowModal(true);
  };

  const openEditModal = (appointment) => {
    if (appointment.status !== "Scheduled") {
      alert("Only scheduled appointments can be rescheduled.");
      return;
    }

    setEditingId(appointment.id);

    setForm({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date,
      time: appointment.time,
      duration: Number(appointment.duration) || 30,
      type: appointment.type || "Consultation",
      fee: appointment.fee ?? "",
    });

    const patient = patients.find((p) => p.id === appointment.patientId);

    setPatientSearch(patient?.name || appointment.patientName || "");
    setShowPatientForm(false);
    setShowPatientResults(false);

    const date = new Date(`${appointment.date}T12:00:00`);
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowPatientForm(false);
    setShowPatientResults(false);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => {
      const next = { ...previous, [name]: value };

      if (name === "doctorId") {
        const doctor = doctors.find((d) => d.id === value);
        next.fee = doctor?.consultationFee ?? "";
        next.time = "";
        next.duration = 30;
      }

      if (name === "date") {
        next.time = "";
      }

      return next;
    });
  };

  const selectPatient = (patient) => {
    setForm((previous) => ({
      ...previous,
      patientId: patient.id,
    }));

    setPatientSearch(patient.name);
    setShowPatientResults(false);
    setShowPatientForm(false);
  };

  const handleNewPatientChange = (event) => {
    const { name, value } = event.target;

    setNewPatient((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const registerPatient = (event) => {
    event.preventDefault();

    const name = newPatient.name.trim();
    const phone = newPatient.phone.trim();

    if (!name || !/^\d{10}$/.test(phone)) {
      alert("Enter the patient's name and a valid 10-digit phone number.");
      return;
    }

    const duplicate = patients.find((p) => p.phone === phone);

    if (duplicate) {
      selectPatient(duplicate);
      alert(
        `This number already belongs to ${duplicate.name}. Existing patient selected.`,
      );
      return;
    }

    const created = demoStore.add(
      "patients",
      {
        ...newPatient,
        name,
        phone,
        registeredAt: new Date().toISOString(),
      },
      "PAT",
    );

    if (!created) {
      alert("Unable to register patient.");
      return;
    }

    const updatedPatients = demoStore.getAll("patients") || [];
    const patient = updatedPatients.find((p) => p.phone === phone);

    setPatients(updatedPatients);

    if (patient) selectPatient(patient);

    setNewPatient({ ...emptyPatient });
  };

  const isWorkingDay = (day) => {
    if (!day || !form.doctorId) return false;

    const date = getDateString(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day,
    );

    const weekday = getWeekday(date);
    const weeklyConfig = doctorSchedule?.weekly?.[weekday];

    return Boolean(weeklyConfig?.enabled && weeklyConfig?.shifts?.length);
  };

  const selectDate = (date) => {
    setForm((previous) => ({
      ...previous,
      date,
      time: "",
    }));
  };

  const changeMonth = (amount) => {
    setCalendarMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + amount, 1),
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const patient = patients.find((p) => p.id === form.patientId);
    const doctor = doctors.find((d) => d.id === form.doctorId);

    if (!patient || !doctor) {
      alert("Please select a valid patient and doctor.");
      return;
    }

    if (doctor.status !== "Active") {
      alert("This doctor is inactive.");
      return;
    }

    if (!form.date || !form.time) {
      alert("Please select an appointment date and time.");
      return;
    }

    if (!editingId && form.date < minimumDate) {
      alert("You cannot book an appointment in the past.");
      return;
    }

    if (form.date > maximumDate) {
      alert("Appointments can only be booked within the next 30 days.");
      return;
    }

    const selectedSlot = availableSlots.find((slot) => slot.time === form.time);

    if (!selectedSlot) {
      alert("This slot is no longer available. Please select another time.");
      return;
    }

    const payload = {
      patientId: patient.id,
      patientName: patient.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: form.date,
      time: selectedSlot.time,
      duration: Number(selectedSlot.duration || form.duration || 30),
      type: form.type,
      status: "Scheduled",
      fee: Number(form.fee) || 0,
    };

    const result = editingId
      ? demoStore.rescheduleAppointment(editingId, payload)
      : demoStore.bookAppointment(payload);

    if (!result) {
      alert(
        "Unable to save the appointment. The slot may have just been booked or the doctor's availability may have changed.",
      );
      loadData();
      return;
    }

    closeModal();
    loadData();

    alert(
      editingId
        ? "Appointment rescheduled successfully."
        : "Appointment booked successfully.",
    );
  };

  const updateStatus = (appointment, status) => {
    if (appointment.status !== "Scheduled") return;

    if (status === "Cancelled") {
      const confirmed = window.confirm(`Cancel appointment ${appointment.id}?`);

      if (!confirmed) return;

      const reason = window.prompt("Enter cancellation reason (optional):");

      if (reason === null) return;

      const result = demoStore.cancelAppointment(appointment.id, reason.trim());

      if (!result) {
        alert("Unable to cancel appointment.");
        return;
      }
    } else {
      const result = demoStore.update("appointments", appointment.id, {
        status,
      });

      if (!result) {
        alert("Unable to update appointment.");
        return;
      }
    }

    loadData();
  };

  const filteredAppointments = useMemo(() => {
    let result = [...appointments];
    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((appointment) => {
        const patient = patients.find((p) => p.id === appointment.patientId);

        const doctor = doctors.find((d) => d.id === appointment.doctorId);

        return [
          appointment.id,
          appointment.patientName,
          appointment.patientId,
          patient?.name,
          patient?.phone,
          doctor?.name,
          doctor?.specialization,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );
      });
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (appointment) => appointment.status === statusFilter,
      );
    }

    if (dateFilter === "Today") {
      result = result.filter((appointment) => appointment.date === today());
    }

    if (dateFilter === "Upcoming") {
      result = result.filter(
        (appointment) =>
          appointment.date >= today() && appointment.status === "Scheduled",
      );
    }

    if (dateFilter === "Past") {
      result = result.filter((appointment) => appointment.date < today());
    }

    return result.sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        String(a.time || "").localeCompare(String(b.time || "")),
    );
  }, [appointments, patients, doctors, search, statusFilter, dateFilter]);

  const calendarDays = useMemo(() => {
    const first = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1,
    );

    const last = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      0,
    );

    const offset = (first.getDay() + 6) % 7;

    return [
      ...Array(offset).fill(null),
      ...Array.from({ length: last.getDate() }, (_, index) => index + 1),
    ];
  }, [calendarMonth]);

  const monthYear = `${months[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`;

  const todayAppointments = appointments.filter(
    (a) => a.date === today() && a.status !== "Cancelled",
  );

  const scheduledCount = appointments.filter(
    (a) => a.status === "Scheduled",
  ).length;

  const completedCount = appointments.filter(
    (a) => a.status === "Completed",
  ).length;

  const cancelledCount = appointments.filter(
    (a) => a.status === "Cancelled",
  ).length;

  return (
    <div className="appointments-page">
      <header className="appointments-header">
        <div>
          <span className="appointments-eyebrow">CLINIC WORKSPACE</span>
          <h1>Appointments</h1>
          <p>Manage bookings, patient visits and doctor availability.</p>
        </div>

        <button className="appointment-primary-btn" onClick={openAddModal}>
          <Plus size={18} />
          New appointment
        </button>
      </header>

      <section className="appointments-stats">
        {[
          {
            label: "Today's appointments",
            value: todayAppointments.length,
            icon: <CalendarDays />,
            color: "blue",
          },
          {
            label: "Scheduled",
            value: scheduledCount,
            icon: <Clock3 />,
            color: "purple",
          },
          {
            label: "Completed",
            value: completedCount,
            icon: <CheckCircle2 />,
            color: "green",
          },
          {
            label: "Cancelled",
            value: cancelledCount,
            icon: <XCircle />,
            color: "red",
          },
        ].map((item) => (
          <article className="appointment-stat-card" key={item.label}>
            <div className={`appointment-stat-icon ${item.color}`}>
              {item.icon}
            </div>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="appointments-content">
        <div className="appointments-toolbar">
          <div>
            <h2>All appointments</h2>
            <p>{filteredAppointments.length} records</p>
          </div>

          <div className="appointment-filters">
            <div className="appointment-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search patient, doctor or ID..."
              />
            </div>

            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            >
              <option value="All">All dates</option>
              <option value="Today">Today</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Past">Past</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="appointments-table-wrapper">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Appointment</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date & time</th>
                <th>Type</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAppointments.map((appointment) => {
                const patient = patients.find(
                  (p) => p.id === appointment.patientId,
                );

                const doctor = doctors.find(
                  (d) => d.id === appointment.doctorId,
                );

                return (
                  <tr key={appointment.id}>
                    <td>
                      <span className="appointment-id">{appointment.id}</span>
                    </td>

                    <td>
                      <div className="appointment-person">
                        <div className="appointment-avatar patient">
                          {(
                            patient?.name ||
                            appointment.patientName ||
                            "P"
                          ).charAt(0)}
                        </div>
                        <div>
                          <strong>
                            {patient?.name ||
                              appointment.patientName ||
                              "Unknown"}
                          </strong>
                          <span>{appointment.patientId}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="appointment-person">
                        <div className="appointment-avatar doctor">
                          <Stethoscope size={16} />
                        </div>
                        <div>
                          <strong>
                            {doctor?.name ||
                              appointment.doctorName ||
                              "Unknown"}
                          </strong>
                          <span>{doctor?.specialization || "—"}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="appointment-datetime">
                        <strong>{formatDate(appointment.date)}</strong>
                        <span>
                          <Clock3 size={13} />
                          {formatTime(appointment.time)}
                        </span>
                      </div>
                    </td>

                    <td>{appointment.type || "Consultation"}</td>

                    <td>
                      <span className="appointment-fee">
                        ₹{Number(appointment.fee || 0).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`appointment-status ${String(
                          appointment.status || "Scheduled",
                        ).toLowerCase()}`}
                      >
                        {appointment.status || "Scheduled"}
                      </span>
                    </td>

                    <td>
                      <div className="appointment-actions">
                        {appointment.status === "Scheduled" ? (
                          <>
                            <button
                              title="Reschedule appointment"
                              onClick={() => openEditModal(appointment)}
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              title="Mark completed"
                              className="complete-action"
                              onClick={() =>
                                updateStatus(appointment, "Completed")
                              }
                            >
                              <CheckCircle2 size={16} />
                            </button>

                            <button
                              title="Cancel appointment"
                              className="cancel-action"
                              onClick={() =>
                                updateStatus(appointment, "Cancelled")
                              }
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <span className="appointment-id">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filteredAppointments.length && (
                <tr>
                  <td colSpan="8">
                    <div className="appointments-empty">
                      <CalendarCheck size={34} />
                      <strong>No appointments found</strong>
                      <span>
                        Try another search or create a new appointment.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div
          className="appointment-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="appointment-modal appointment-modal-wide">
            <div className="appointment-modal-header">
              <div>
                <span className="appointments-eyebrow">BOOKING WORKSPACE</span>
                <h2>
                  {editingId ? "Reschedule appointment" : "Create appointment"}
                </h2>
                <p>
                  {editingId
                    ? "Choose a new date or time for this appointment."
                    : "Complete the steps below to schedule a patient visit."}
                </p>
              </div>

              <button
                type="button"
                className="appointment-modal-close"
                onClick={closeModal}
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="appointment-booking-layout">
                <div className="appointment-booking-main">
                  <section className="booking-section">
                    <div className="booking-section-title">
                      <span>01</span>
                      <div>
                        <h3>Patient details</h3>
                        <p>Find an existing patient or register a new one.</p>
                      </div>
                    </div>

                    <label className="appointment-label">
                      Search patient *
                    </label>

                    <div className="patient-search-box">
                      <Search size={18} />
                      <input
                        value={patientSearch}
                        onChange={(event) => {
                          setPatientSearch(event.target.value);
                          setForm((previous) => ({
                            ...previous,
                            patientId: "",
                          }));
                          setShowPatientResults(true);
                        }}
                        onFocus={() => setShowPatientResults(true)}
                        placeholder="Type patient name, phone or ID..."
                        autoComplete="off"
                      />

                      {patientSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setPatientSearch("");
                            setForm((previous) => ({
                              ...previous,
                              patientId: "",
                            }));
                          }}
                        >
                          <X size={16} />
                        </button>
                      )}

                      {showPatientResults && patientSearch.trim() && (
                        <div className="patient-suggestions">
                          {matchingPatients.map((patient) => (
                            <button
                              type="button"
                              key={patient.id}
                              onClick={() => selectPatient(patient)}
                            >
                              <span className="suggestion-avatar">
                                {patient.name.charAt(0).toUpperCase()}
                              </span>
                              <span className="suggestion-info">
                                <strong>{patient.name}</strong>
                                <small>
                                  {patient.phone} · {patient.id}
                                </small>
                              </span>
                              <span className="suggestion-select">Select</span>
                            </button>
                          ))}

                          {!matchingPatients.length && (
                            <p className="no-patient-match">
                              No matching patient found.
                            </p>
                          )}

                          <button
                            type="button"
                            className="register-patient-option"
                            onClick={() => {
                              setShowPatientForm(true);
                              setShowPatientResults(false);
                              setNewPatient((previous) => ({
                                ...previous,
                                name: patientSearch,
                              }));
                            }}
                          >
                            <UserPlus size={16} />
                            Register a new patient
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedPatient && (
                      <div className="selected-patient-card">
                        <div className="selected-patient-icon">
                          <UserRound />
                        </div>
                        <div className="selected-patient-details">
                          <strong>{selectedPatient.name}</strong>
                          <span>
                            {selectedPatient.phone || "No phone number"}
                          </span>
                        </div>
                        <div className="patient-id-chip">
                          {selectedPatient.id}
                        </div>
                        <CheckCircle2
                          className="patient-selected-check"
                          size={18}
                        />
                      </div>
                    )}

                    {showPatientForm && (
                      <div className="new-patient-panel">
                        <div className="new-patient-heading">
                          <div>
                            <UserPlus size={18} />
                            <strong>Register new patient</strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPatientForm(false)}
                          >
                            <X size={17} />
                          </button>
                        </div>

                        <p className="new-patient-note">
                          A unique Patient ID will be generated when you save
                          this record.
                        </p>

                        <div className="new-patient-grid">
                          <label className="appointment-label full">
                            Full name *
                            <input
                              name="name"
                              value={newPatient.name}
                              onChange={handleNewPatientChange}
                              required
                            />
                          </label>

                          <label className="appointment-label">
                            Phone number *
                            <input
                              name="phone"
                              value={newPatient.phone}
                              onChange={handleNewPatientChange}
                              maxLength={10}
                              required
                            />
                          </label>

                          <label className="appointment-label">
                            Date of birth
                            <input
                              type="date"
                              name="dob"
                              value={newPatient.dob}
                              onChange={handleNewPatientChange}
                            />
                          </label>

                          <label className="appointment-label">
                            Gender
                            <select
                              name="gender"
                              value={newPatient.gender}
                              onChange={handleNewPatientChange}
                            >
                              <option>Male</option>
                              <option>Female</option>
                              <option>Other</option>
                            </select>
                          </label>

                          <label className="appointment-label">
                            Blood group
                            <select
                              name="bloodGroup"
                              value={newPatient.bloodGroup}
                              onChange={handleNewPatientChange}
                            >
                              <option value="">Not specified</option>
                              {[
                                "A+",
                                "A-",
                                "B+",
                                "B-",
                                "AB+",
                                "AB-",
                                "O+",
                                "O-",
                              ].map((group) => (
                                <option key={group}>{group}</option>
                              ))}
                            </select>
                          </label>

                          <label className="appointment-label full">
                            Address
                            <input
                              name="address"
                              value={newPatient.address}
                              onChange={handleNewPatientChange}
                            />
                          </label>
                        </div>

                        <div className="new-patient-actions">
                          <button
                            type="button"
                            className="appointment-cancel-btn"
                            onClick={() => setShowPatientForm(false)}
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            className="appointment-primary-btn"
                            onClick={registerPatient}
                          >
                            Save patient
                          </button>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="booking-section">
                    <div className="booking-section-title">
                      <span>02</span>
                      <div>
                        <h3>Choose doctor</h3>
                        <p>Select the doctor for this consultation.</p>
                      </div>
                    </div>

                    <label className="appointment-label">Doctor *</label>

                    <select
                      className="booking-select"
                      name="doctorId"
                      value={form.doctorId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a doctor</option>
                      {doctors
                        .filter((doctor) => doctor.status === "Active")
                        .map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name} — {doctor.specialization}
                          </option>
                        ))}
                    </select>

                    {selectedDoctor && (
                      <div className="selected-doctor-card">
                        <div className="doctor-card-icon">
                          <Stethoscope />
                        </div>
                        <div>
                          <strong>{selectedDoctor.name}</strong>
                          <span>
                            {selectedDoctor.specialization} ·{" "}
                            {selectedDoctor.experience || "—"} years experience
                          </span>
                        </div>
                        <div className="doctor-fee">
                          ₹
                          {Number(
                            selectedDoctor.consultationFee || 0,
                          ).toLocaleString("en-IN")}
                          <small>Consultation</small>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="booking-section">
                    <div className="booking-section-title">
                      <span>03</span>
                      <div>
                        <h3>Date & time</h3>
                        <p>Choose a date and select an available slot.</p>
                      </div>
                    </div>

                    {!form.doctorId ? (
                      <div className="calendar-placeholder">
                        <CalendarDays size={25} />
                        <strong>Select a doctor first</strong>
                        <span>The doctor's schedule will appear here.</span>
                      </div>
                    ) : (
                      <>
                        <div className="appointment-calendar">
                          <div className="calendar-heading">
                            <div>
                              <strong>{monthYear}</strong>
                              <span>
                                {workingDays.length
                                  ? `${workingDays.join(", ")} schedule`
                                  : "No working days configured"}
                              </span>
                            </div>

                            <div className="calendar-nav">
                              <button
                                type="button"
                                onClick={() => changeMonth(-1)}
                                disabled={
                                  calendarMonth.getFullYear() ===
                                    new Date().getFullYear() &&
                                  calendarMonth.getMonth() ===
                                    new Date().getMonth()
                                }
                              >
                                <ChevronLeft />
                              </button>
                              <button
                                type="button"
                                onClick={() => changeMonth(1)}
                                disabled={
                                  getDateString(
                                    calendarMonth.getFullYear(),
                                    calendarMonth.getMonth(),
                                    1,
                                  ) > maximumDate
                                }
                              >
                                <ChevronRight />
                              </button>
                            </div>
                          </div>

                          <div className="calendar-grid">
                            {[
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                              "Sun",
                            ].map((day) => (
                              <span className="calendar-weekday" key={day}>
                                {day}
                              </span>
                            ))}

                            {calendarDays.map((day, index) => {
                              if (!day) return <span key={`blank-${index}`} />;

                              const date = getDateString(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth(),
                                day,
                              );

                              const working = isWorkingDay(day);
                              const past = date < minimumDate;
                              const beyondRange = date > maximumDate;
                              const active = form.date === date;
                              const disabled = !working || past || beyondRange;

                              return (
                                <button
                                  type="button"
                                  key={date}
                                  disabled={disabled}
                                  className={`calendar-day ${working ? "working" : ""} ${active ? "selected" : ""} ${past || beyondRange ? "past" : ""}`}
                                  onClick={() => selectDate(date)}
                                  title={
                                    disabled
                                      ? "Date unavailable"
                                      : "Doctor is scheduled"
                                  }
                                >
                                  {day}
                                  {working && <i />}
                                </button>
                              );
                            })}
                          </div>

                          <div className="calendar-legend">
                            <span>
                              <i className="legend-dot available" />
                              Doctor scheduled
                            </span>
                            <span>
                              <i className="legend-dot unavailable" />
                              Not scheduled
                            </span>
                          </div>
                        </div>

                        <div className="available-times">
                          <div className="available-times-heading">
                            <strong>Available time slots</strong>
                            <span>{formatDate(form.date)}</span>
                          </div>

                          {availableSlots.length === 0 ? (
                            <p className="slot-message">
                              No slots are available on this date. The doctor
                              may be on leave or all slots may be booked.
                            </p>
                          ) : (
                            <div className="time-slot-grid">
                              {availableSlots.map((slot) => (
                                <button
                                  type="button"
                                  key={`${slot.time}-${slot.duration}`}
                                  className={`time-slot ${form.time === slot.time ? "selected" : ""}`}
                                  onClick={() =>
                                    setForm((previous) => ({
                                      ...previous,
                                      time: slot.time,
                                      duration: slot.duration,
                                    }))
                                  }
                                >
                                  {formatTime(slot.time)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </section>

                  <section className="booking-section">
                    <div className="booking-section-title">
                      <span>04</span>
                      <div>
                        <h3>Appointment details</h3>
                        <p>Set the consultation type and fee.</p>
                      </div>
                    </div>

                    <div className="appointment-detail-grid">
                      <label className="appointment-label">
                        Appointment type
                        <select
                          name="type"
                          value={form.type}
                          onChange={handleChange}
                        >
                          <option>Consultation</option>
                          <option>Follow-up</option>
                          <option>Routine Checkup</option>
                          <option>Emergency</option>
                        </select>
                      </label>

                      <label className="appointment-label">
                        Consultation fee (₹)
                        <input
                          type="number"
                          min="0"
                          name="fee"
                          value={form.fee}
                          onChange={handleChange}
                        />
                      </label>
                    </div>
                  </section>
                </div>

                <aside className="appointment-booking-aside">
                  <div className="booking-summary-card">
                    <div className="summary-heading">
                      <CalendarCheck size={19} />
                      <strong>Booking summary</strong>
                    </div>

                    {!selectedPatient && !selectedDoctor && (
                      <div className="summary-empty">
                        <CalendarDays size={34} />
                        <span>
                          Your appointment details will appear here as you
                          complete the form.
                        </span>
                      </div>
                    )}

                    {selectedPatient && (
                      <div className="summary-line">
                        <span>Patient</span>
                        <strong>{selectedPatient.name}</strong>
                        <small>{selectedPatient.id}</small>
                      </div>
                    )}

                    {selectedDoctor && (
                      <div className="summary-line">
                        <span>Doctor</span>
                        <strong>{selectedDoctor.name}</strong>
                        <small>{selectedDoctor.specialization}</small>
                      </div>
                    )}

                    {form.date && (
                      <div className="summary-line">
                        <span>Date</span>
                        <strong>{formatDate(form.date)}</strong>
                      </div>
                    )}

                    {form.time && (
                      <div className="summary-line">
                        <span>Time</span>
                        <strong>{formatTime(form.time)}</strong>
                        <small>{form.duration} minutes</small>
                      </div>
                    )}

                    <div className="summary-line">
                      <span>Visit type</span>
                      <strong>{form.type}</strong>
                    </div>

                    <div className="summary-total">
                      <span>Consultation fee</span>
                      <strong>
                        ₹{Number(form.fee || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div className="summary-security">
                      <CheckCircle2 size={15} />
                      Availability is checked against the doctor's schedule,
                      leave and existing appointments.
                    </div>
                  </div>
                </aside>
              </div>

              <div className="appointment-form-footer">
                <button
                  type="button"
                  className="appointment-cancel-btn"
                  onClick={closeModal}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="appointment-primary-btn"
                  disabled={
                    !form.patientId ||
                    !form.doctorId ||
                    !form.date ||
                    !form.time ||
                    showPatientForm
                  }
                >
                  {editingId ? "Save rescheduling" : "Confirm appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
