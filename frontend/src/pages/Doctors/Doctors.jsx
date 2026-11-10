import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Stethoscope,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  UserRound,
  Clock3,
  PlusCircle,
  Trash,
} from "lucide-react";

import { demoStore } from "../../data/demoStore";
import "./Doctors.css";

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const emptyDoctor = {
  name: "",
  specialization: "",
  qualification: "",
  experience: "",
  phone: "",
  consultationFee: "",
  status: "Active",
};

const createShift = () => ({
  startTime: "09:00",
  endTime: "13:00",
  slotDuration: 30,
});

const createWeeklySchedule = () =>
  Object.fromEntries(
    weekdays.map((day) => [
      day,
      {
        enabled: false,
        shifts: [],
      },
    ]),
  );

function normalizeSchedule(existing) {
  const weekly = createWeeklySchedule();

  if (!existing) return weekly;

  // Support schedules created using the previous schedule format.
  if (existing.weekly) {
    weekdays.forEach((day) => {
      const savedDay = existing.weekly[day];

      if (savedDay) {
        weekly[day] = {
          enabled: Boolean(savedDay.enabled),
          shifts: Array.isArray(savedDay.shifts)
            ? savedDay.shifts.map((shift) => ({
                startTime: shift.startTime || "09:00",
                endTime: shift.endTime || "13:00",
                slotDuration: Number(shift.slotDuration) || 30,
              }))
            : [],
        };
      }
    });

    return weekly;
  }

  if (Array.isArray(existing.days)) {
    existing.days.forEach((day) => {
      if (weekly[day]) {
        weekly[day] = {
          enabled: true,
          shifts: [
            {
              startTime: existing.startTime || "09:00",
              endTime: existing.endTime || "17:00",
              slotDuration: Number(existing.slotDuration) || 30,
            },
          ],
        };
      }
    });
  }

  return weekly;
}

function formatTime(time) {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getScheduleSummary(schedule) {
  if (!schedule) return "Not configured";

  const weekly = normalizeSchedule(schedule);
  const workingDays = weekdays.filter(
    (day) => weekly[day].enabled && weekly[day].shifts.length,
  );

  if (!workingDays.length) return "Not configured";

  return `${workingDays.length} working days`;
}

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [form, setForm] = useState({ ...emptyDoctor });
  const [weeklySchedule, setWeeklySchedule] = useState(createWeeklySchedule);

  const loadData = () => {
    setDoctors(demoStore.getAll("doctors"));
    setSchedules(demoStore.getAll("schedules"));
  };

  useEffect(() => {
    loadData();
    return demoStore.subscribe(loadData);
  }, []);

  const getSchedule = (doctorId) =>
    schedules.find((item) => item.doctorId === doctorId);

  const filteredDoctors = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return doctors;

    return doctors.filter((doctor) =>
      [doctor.id, doctor.name, doctor.specialization, doctor.phone].some(
        (value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
      ),
    );
  }, [doctors, search]);

  const activeCount = doctors.filter(
    (doctor) => doctor.status === "Active",
  ).length;

  const scheduledCount = doctors.filter((doctor) => {
    const saved = getSchedule(doctor.id);
    return saved && getScheduleSummary(saved) !== "Not configured";
  }).length;

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...emptyDoctor });
    setShowModal(true);
  };

  const openEditModal = (doctor) => {
    setEditingId(doctor.id);

    setForm({
      name: doctor.name || "",
      specialization: doctor.specialization || "",
      qualification: doctor.qualification || "",
      experience: doctor.experience ?? "",
      phone: doctor.phone || "",
      consultationFee: doctor.consultationFee ?? "",
      status: doctor.status || "Active",
    });

    setShowModal(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.specialization.trim()) {
      alert("Doctor name and specialization are required.");
      return;
    }

    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      alert("Enter a valid 10-digit phone number.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      specialization: form.specialization.trim(),
      experience: Number(form.experience) || 0,
      consultationFee: Number(form.consultationFee) || 0,
    };

    const result = editingId
      ? demoStore.update("doctors", editingId, payload)
      : demoStore.add("doctors", payload, "DOC");

    if (!result) {
      alert("Unable to save doctor.");
      return;
    }

    setShowModal(false);
    setForm({ ...emptyDoctor });
    loadData();
  };

  const handleDelete = (doctor) => {
    const hasAppointments = demoStore
      .getAll("appointments")
      .some(
        (appointment) =>
          appointment.doctorId === doctor.id &&
          appointment.status !== "Cancelled",
      );

    if (hasAppointments) {
      alert(
        "This doctor has appointments. Please mark the doctor inactive instead.",
      );
      return;
    }

    if (!window.confirm(`Delete ${doctor.name}?`)) return;

    demoStore.delete("doctors", doctor.id);

    const savedSchedule = getSchedule(doctor.id);

    if (savedSchedule) {
      demoStore.delete("schedules", savedSchedule.id);
    }

    loadData();
  };

  const openSchedule = (doctor) => {
    setSelectedDoctor(doctor);

    const existing = getSchedule(doctor.id);
    setWeeklySchedule(normalizeSchedule(existing));

    setShowSchedule(true);
  };

  const toggleDay = (day) => {
    setWeeklySchedule((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        enabled: !previous[day].enabled,
        shifts: !previous[day].enabled
          ? previous[day].shifts.length
            ? previous[day].shifts
            : [createShift()]
          : previous[day].shifts,
      },
    }));
  };

  const addShift = (day) => {
    setWeeklySchedule((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        enabled: true,
        shifts: [...previous[day].shifts, createShift()],
      },
    }));
  };

  const removeShift = (day, shiftIndex) => {
    setWeeklySchedule((previous) => {
      const shifts = previous[day].shifts.filter(
        (_, index) => index !== shiftIndex,
      );

      return {
        ...previous,
        [day]: {
          ...previous[day],
          shifts,
          enabled: shifts.length > 0,
        },
      };
    });
  };

  const updateShift = (day, shiftIndex, field, value) => {
    setWeeklySchedule((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        shifts: previous[day].shifts.map((shift, index) =>
          index === shiftIndex
            ? {
                ...shift,
                [field]: field === "slotDuration" ? Number(value) : value,
              }
            : shift,
        ),
      },
    }));
  };

  const validateWeeklySchedule = () => {
    let hasWorkingDay = false;

    for (const day of weekdays) {
      const daySchedule = weeklySchedule[day];

      if (!daySchedule.enabled) continue;

      if (!daySchedule.shifts.length) {
        alert(`${day}: Add at least one shift or mark this day as off.`);
        return false;
      }

      hasWorkingDay = true;

      const sortedShifts = [...daySchedule.shifts].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );

      for (let index = 0; index < sortedShifts.length; index += 1) {
        const shift = sortedShifts[index];

        if (!shift.startTime || !shift.endTime) {
          alert(`${day}: Please enter both start and end times.`);
          return false;
        }

        if (shift.startTime >= shift.endTime) {
          alert(`${day}: End time must be later than start time.`);
          return false;
        }

        if (index > 0 && sortedShifts[index - 1].endTime > shift.startTime) {
          alert(`${day}: Your shifts overlap. Please correct the timings.`);
          return false;
        }

        if (!shift.slotDuration || shift.slotDuration < 5) {
          alert(`${day}: Appointment duration must be at least 5 minutes.`);
          return false;
        }
      }
    }

    if (!hasWorkingDay) {
      alert("Configure at least one working day.");
      return false;
    }

    return true;
  };

  const saveSchedule = (event) => {
    event.preventDefault();

    if (!validateWeeklySchedule()) return;

    const existing = getSchedule(selectedDoctor.id);

    const payload = {
      doctorId: selectedDoctor.id,
      weekly: weeklySchedule,
    };

    const result = existing
      ? demoStore.update("schedules", existing.id, payload)
      : demoStore.add("schedules", payload, "SCH");

    if (!result) {
      alert("Unable to save schedule.");
      return;
    }

    setShowSchedule(false);
    loadData();
  };

  return (
    <div className="doctors-page">
      <div className="doctors-header">
        <div>
          <span className="doctors-eyebrow">CLINIC MANAGEMENT</span>
          <h1>Doctors</h1>
          <p>Manage doctors, consultation fees and weekly availability.</p>
        </div>

        <button className="doctor-primary-btn" onClick={openAddModal}>
          <Plus size={18} />
          Add Doctor
        </button>
      </div>

      <div className="doctors-stats">
        <div className="doctor-stat-card">
          <div className="doctor-stat-icon blue">
            <Stethoscope size={21} />
          </div>
          <div>
            <span>Total Doctors</span>
            <strong>{doctors.length}</strong>
          </div>
        </div>

        <div className="doctor-stat-card">
          <div className="doctor-stat-icon green">
            <UserRound size={21} />
          </div>
          <div>
            <span>Active Doctors</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="doctor-stat-card">
          <div className="doctor-stat-icon purple">
            <CalendarDays size={21} />
          </div>
          <div>
            <span>With Schedules</span>
            <strong>{scheduledCount}</strong>
          </div>
        </div>
      </div>

      <section className="doctors-content">
        <div className="doctors-toolbar">
          <div>
            <h2>All Doctors</h2>
            <p>{filteredDoctors.length} doctors found</p>
          </div>

          <div className="doctor-search">
            <Search size={18} />
            <input
              placeholder="Search doctors..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="doctors-table-wrapper">
          <table className="doctors-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>Consultation Fee</th>
                <th>Weekly Schedule</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDoctors.map((doctor) => {
                const savedSchedule = getSchedule(doctor.id);

                return (
                  <tr key={doctor.id}>
                    <td>
                      <div className="doctor-name-cell">
                        <div className="doctor-avatar">
                          {doctor.name
                            ?.replace("Dr. ", "")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>{doctor.name}</strong>
                          <span>{doctor.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="doctor-specialization">
                        {doctor.specialization}
                        <span>{doctor.qualification}</span>
                      </div>
                    </td>

                    <td>{doctor.experience} years</td>

                    <td>
                      <span className="doctor-fee">
                        ₹
                        {Number(doctor.consultationFee || 0).toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </td>

                    <td>
                      <div className="schedule-cell">
                        <span>{getScheduleSummary(savedSchedule)}</span>
                        <button
                          className="doctor-schedule-btn"
                          onClick={() => openSchedule(doctor)}
                        >
                          <CalendarDays size={14} />
                          {savedSchedule ? "Manage" : "Set schedule"}
                        </button>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`doctor-status ${
                          doctor.status === "Active" ? "active" : "inactive"
                        }`}
                      >
                        {doctor.status}
                      </span>
                    </td>

                    <td>
                      <div className="doctor-actions">
                        <button
                          title="Edit doctor"
                          onClick={() => openEditModal(doctor)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          title="Delete doctor"
                          className="delete"
                          onClick={() => handleDelete(doctor)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDoctors.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="doctors-empty">
                      <Stethoscope size={32} />
                      <strong>No doctors found</strong>
                      <span>Try another search or add a doctor.</span>
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
          className="doctor-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="doctor-modal">
            <div className="doctor-modal-header">
              <div>
                <span className="doctors-eyebrow">DOCTOR MANAGEMENT</span>
                <h2>{editingId ? "Edit Doctor" : "Add Doctor"}</h2>
              </div>

              <button
                type="button"
                className="doctor-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="doctor-form-grid">
                <label>
                  Doctor Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Dr. Full Name"
                    required
                  />
                </label>

                <label>
                  Specialization *
                  <input
                    name="specialization"
                    value={form.specialization}
                    onChange={handleChange}
                    placeholder="e.g. Cardiology"
                    required
                  />
                </label>

                <label>
                  Qualification
                  <input
                    name="qualification"
                    value={form.qualification}
                    onChange={handleChange}
                    placeholder="e.g. MBBS, MD"
                  />
                </label>

                <label>
                  Experience (years)
                  <input
                    type="number"
                    min="0"
                    name="experience"
                    value={form.experience}
                    onChange={handleChange}
                    placeholder="e.g. 10"
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    name="phone"
                    inputMode="numeric"
                    maxLength="10"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit phone number"
                  />
                </label>

                <label>
                  Consultation Fee (₹)
                  <input
                    type="number"
                    min="0"
                    name="consultationFee"
                    value={form.consultationFee}
                    onChange={handleChange}
                    placeholder="e.g. 500"
                  />
                </label>

                <label>
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <div className="doctor-form-footer">
                <button
                  type="button"
                  className="doctor-cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="doctor-primary-btn">
                  {editingId ? "Save Changes" : "Add Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSchedule && selectedDoctor && (
        <div
          className="doctor-modal-overlay schedule-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowSchedule(false);
            }
          }}
        >
          <div className="doctor-modal schedule-modal">
            <div className="doctor-modal-header">
              <div>
                <span className="doctors-eyebrow">WEEKLY AVAILABILITY</span>
                <h2>Doctor Schedule</h2>
                <p>{selectedDoctor.name}</p>
              </div>

              <button
                type="button"
                className="doctor-modal-close"
                onClick={() => setShowSchedule(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveSchedule}>
              <div className="schedule-intro">
                <CalendarDays size={20} />
                <p>
                  Set individual working hours for each day. You can add
                  multiple shifts when a doctor takes a break between
                  consultations.
                </p>
              </div>

              <div className="weekly-schedule-list">
                {weekdays.map((day) => {
                  const daySchedule = weeklySchedule[day];

                  return (
                    <section className="schedule-day-card" key={day}>
                      <div className="schedule-day-header">
                        <div className="schedule-day-name">
                          <strong>{day}</strong>
                          <span>
                            {daySchedule.enabled
                              ? `${daySchedule.shifts.length} shift(s)`
                              : "Day off"}
                          </span>
                        </div>

                        <label className="schedule-toggle">
                          <input
                            type="checkbox"
                            checked={daySchedule.enabled}
                            onChange={() => toggleDay(day)}
                          />
                          <span className="schedule-toggle-track" />
                          <span className="schedule-toggle-label">
                            {daySchedule.enabled ? "Working" : "Off"}
                          </span>
                        </label>
                      </div>

                      {daySchedule.enabled && (
                        <div className="schedule-shifts">
                          {daySchedule.shifts.map((shift, index) => (
                            <div
                              className="schedule-shift"
                              key={`${day}-${index}`}
                            >
                              <div className="schedule-shift-heading">
                                <span>
                                  <Clock3 size={15} />
                                  Shift {index + 1}
                                </span>

                                <button
                                  type="button"
                                  className="remove-shift-btn"
                                  onClick={() => removeShift(day, index)}
                                  title="Remove shift"
                                >
                                  <Trash size={15} />
                                  Remove
                                </button>
                              </div>

                              <div className="schedule-shift-fields">
                                <label>
                                  Start time
                                  <input
                                    type="time"
                                    value={shift.startTime}
                                    onChange={(event) =>
                                      updateShift(
                                        day,
                                        index,
                                        "startTime",
                                        event.target.value,
                                      )
                                    }
                                    required
                                  />
                                </label>

                                <label>
                                  End time
                                  <input
                                    type="time"
                                    value={shift.endTime}
                                    onChange={(event) =>
                                      updateShift(
                                        day,
                                        index,
                                        "endTime",
                                        event.target.value,
                                      )
                                    }
                                    required
                                  />
                                </label>

                                <label>
                                  Appointment duration
                                  <select
                                    value={shift.slotDuration}
                                    onChange={(event) =>
                                      updateShift(
                                        day,
                                        index,
                                        "slotDuration",
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <option value={15}>15 minutes</option>
                                    <option value={20}>20 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>60 minutes</option>
                                  </select>
                                </label>
                              </div>

                              <div className="shift-time-preview">
                                {formatTime(shift.startTime)} –{" "}
                                {formatTime(shift.endTime)}
                                <span>
                                  {shift.slotDuration} min appointments
                                </span>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            className="add-shift-btn"
                            onClick={() => addShift(day)}
                          >
                            <PlusCircle size={16} />
                            Add another shift
                          </button>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

              <div className="doctor-form-footer schedule-footer">
                <button
                  type="button"
                  className="doctor-cancel-btn"
                  onClick={() => setShowSchedule(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="doctor-primary-btn">
                  Save Weekly Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
