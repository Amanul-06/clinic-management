import "./Patients.css";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  UserRound,
  Phone,
  CalendarDays,
  MapPin,
  Eye,
  Pencil,
  Trash2,
  X,
  UserPlus,
  Filter,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";

const STORAGE_KEY = "clinic_patients";

const emptyForm = {
  fullName: "",
  dob: "",
  gender: "",
  phone: "",
  address: "",
};

function loadPatients() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function generatePatientId(patients) {
  const highestId = patients.reduce((highest, patient) => {
    const number = Number(patient.patientId?.replace("PT-", "")) || 0;
    return Math.max(highest, number);
  }, 0);

  return `PT-${String(highestId + 1).padStart(4, "0")}`;
}

function calculateAge(dob) {
  if (!dob) return "—";

  const birthDate = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return "—";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());

  if (beforeBirthday) age -= 1;

  return age >= 0 ? `${age} years` : "—";
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PatientModal({ mode, patient, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(patient || emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(patient || emptyForm);
    setError("");
  }, [patient, mode]);

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.fullName.trim()) {
      setError("Please enter the patient's full name.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter a phone number.");
      return;
    }

    if (!/^[0-9+\-\s()]{7,18}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!form.gender) {
      setError("Please select the patient's gender.");
      return;
    }

    if (form.dob && new Date(`${form.dob}T00:00:00`) > new Date()) {
      setError("Date of birth cannot be in the future.");
      return;
    }

    onSave({
      ...form,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    });
  };

  if (mode === "view") {
    return (
      <div className="patient-modal-backdrop" onMouseDown={onClose}>
        <section
          className="patient-modal patient-profile-modal"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="patient-modal-header">
            <div>
              <span className="page-eyebrow">PATIENT PROFILE</span>
              <h2>Patient details</h2>
            </div>
            <button className="patient-icon-button" onClick={onClose}>
              <X size={19} />
            </button>
          </div>

          <div className="patient-profile-hero">
            <div className="patient-profile-avatar">
              {patient.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3>{patient.fullName}</h3>
              <span>{patient.patientId}</span>
            </div>
          </div>

          <div className="patient-profile-grid">
            <div className="patient-detail-item">
              <span>Phone number</span>
              <strong>{patient.phone || "—"}</strong>
            </div>
            <div className="patient-detail-item">
              <span>Date of birth</span>
              <strong>{formatDate(patient.dob)}</strong>
            </div>
            <div className="patient-detail-item">
              <span>Age</span>
              <strong>{calculateAge(patient.dob)}</strong>
            </div>
            <div className="patient-detail-item">
              <span>Gender</span>
              <strong>{patient.gender || "—"}</strong>
            </div>
            <div className="patient-detail-item full-width">
              <span>Address</span>
              <strong>{patient.address || "Not provided"}</strong>
            </div>
            <div className="patient-detail-item">
              <span>Registration date</span>
              <strong>{formatDate(patient.createdAt)}</strong>
            </div>
          </div>

          <div className="patient-profile-note">
            <ClipboardList size={18} />
            <div>
              <strong>Medical history and visits</strong>
              <p>
                Appointment history, medical records and prescriptions will
                appear here once those modules are connected.
              </p>
            </div>
          </div>

          <div className="patient-modal-footer">
            <button className="outline-button" onClick={onClose}>
              Close
            </button>
            <button
              className="primary-button"
              onClick={() => onDelete(patient)}
              style={{ background: "#dc2626" }}
            >
              <Trash2 size={15} />
              Delete patient
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="patient-modal-backdrop" onMouseDown={onClose}>
      <section
        className="patient-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="patient-modal-header">
          <div>
            <span className="page-eyebrow">
              {mode === "edit" ? "UPDATE RECORD" : "NEW REGISTRATION"}
            </span>
            <h2>{mode === "edit" ? "Edit patient" : "Register patient"}</h2>
            <p>
              {mode === "edit"
                ? "Update the patient's personal information."
                : "Enter the patient's details to create a new record."}
            </p>
          </div>
          <button className="patient-icon-button" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        {mode === "edit" && (
          <div className="patient-id-banner">
            <span>Patient ID</span>
            <strong>{patient.patientId}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="patient-form-grid">
            <div className="field-group full-width">
              <label htmlFor="patient-name">Full name *</label>
              <input
                id="patient-name"
                value={form.fullName}
                onChange={(event) =>
                  updateField("fullName", event.target.value)
                }
                placeholder="Enter patient's full name"
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="field-group">
              <label htmlFor="patient-dob">Date of birth</label>
              <input
                id="patient-dob"
                type="date"
                value={form.dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => updateField("dob", event.target.value)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="patient-gender">Gender *</label>
              <select
                id="patient-gender"
                value={form.gender}
                onChange={(event) => updateField("gender", event.target.value)}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div className="field-group full-width">
              <label htmlFor="patient-phone">Phone number *</label>
              <input
                id="patient-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="Enter phone number"
                maxLength={18}
              />
            </div>

            <div className="field-group full-width">
              <label htmlFor="patient-address">Address</label>
              <textarea
                id="patient-address"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Enter patient's address (optional)"
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          {error && <div className="patient-form-error">{error}</div>}

          <div className="patient-modal-footer">
            <button type="button" className="outline-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {mode === "edit" ? "Save changes" : "Register patient"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Patients() {
  const [patients, setPatients] = useState(loadPatients);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } catch {
      setNotice("Unable to save patient records in this browser.");
    }
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patients
      .filter((patient) => {
        const matchesSearch =
          !query ||
          patient.fullName.toLowerCase().includes(query) ||
          patient.patientId.toLowerCase().includes(query) ||
          patient.phone.toLowerCase().includes(query);

        const matchesGender =
          genderFilter === "all" || patient.gender === genderFilter;

        return matchesSearch && matchesGender;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [patients, search, genderFilter]);

  const openModal = (mode, patient = null) => {
    setSelectedPatient(patient);
    setModal(mode);
    setNotice("");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedPatient(null);
  };

  const savePatient = (form) => {
    if (modal === "edit" && selectedPatient) {
      setPatients((previous) =>
        previous.map((patient) =>
          patient.patientId === selectedPatient.patientId
            ? { ...patient, ...form }
            : patient,
        ),
      );
      setNotice("Patient details updated successfully.");
    } else {
      const newPatient = {
        ...form,
        patientId: generatePatientId(patients),
        createdAt: new Date().toISOString().slice(0, 10),
      };

      setPatients((previous) => [...previous, newPatient]);
      setNotice("Patient registered successfully.");
    }

    closeModal();
  };

  const deletePatient = (patient) => {
    const confirmed = window.confirm(
      `Delete the record for ${patient.fullName} (${patient.patientId})? This cannot be undone.`,
    );

    if (!confirmed) return;

    setPatients((previous) =>
      previous.filter((item) => item.patientId !== patient.patientId),
    );

    setNotice("Patient record deleted.");
    closeModal();
  };

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            <Users size={13} /> PATIENT MANAGEMENT
          </span>
          <h1>Patients</h1>
          <p>Register, search and manage your clinic's patient records.</p>
        </div>

        <button className="primary-button" onClick={() => openModal("create")}>
          <Plus size={17} />
          Add patient
        </button>
      </div>

      <div className="stats-grid patient-stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-title">Total Patients</span>
            <span className="stat-icon blue">
              <Users size={19} />
            </span>
          </div>
          <h2>{patients.length.toLocaleString("en-IN")}</h2>
          <p>All registered patients</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-title">New This Month</span>
            <span className="stat-icon purple">
              <UserPlus size={19} />
            </span>
          </div>
          <h2>
            {
              patients.filter((patient) => {
                const date = new Date(`${patient.createdAt}T00:00:00`);
                const today = new Date();

                return (
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear()
                );
              }).length
            }
          </h2>
          <p>Registrations this month</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-title">New Today</span>
            <span className="stat-icon green">
              <CalendarDays size={19} />
            </span>
          </div>
          <h2>
            {
              patients.filter(
                (patient) =>
                  patient.createdAt === new Date().toLocaleDateString("en-CA"),
              ).length
            }
          </h2>
          <p>Registered today</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-title">Returning Patients</span>
            <span className="stat-icon orange">
              <ClipboardList size={19} />
            </span>
          </div>
          <h2>—</h2>
          <p>Available after visit records integration</p>
        </div>
      </div>

      <section className="panel patients-panel">
        <div className="patients-toolbar">
          <div>
            <h3>Patient directory</h3>
            <p>{filteredPatients.length} patient records found</p>
          </div>

          <div className="patients-filters">
            <div className="patients-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, ID or phone..."
              />
              {search && (
                <button aria-label="Clear search" onClick={() => setSearch("")}>
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="patients-gender-filter">
              <Filter size={15} />
              <select
                value={genderFilter}
                onChange={(event) => setGenderFilter(event.target.value)}
                aria-label="Filter by gender"
              >
                <option value="all">All genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {notice && (
          <div className="patient-notice">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        )}

        <div className="table-wrapper">
          <table className="appointment-table patient-table">
            <thead>
              <tr>
                <th>PATIENT</th>
                <th>PATIENT ID</th>
                <th>PHONE</th>
                <th>AGE</th>
                <th>GENDER</th>
                <th>REGISTERED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.patientId}>
                  <td>
                    <div className="patient-cell">
                      <div className="patient-avatar">
                        {patient.fullName.charAt(0).toUpperCase()}
                      </div>
                      <strong>{patient.fullName}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="patient-id-text">{patient.patientId}</span>
                  </td>
                  <td>{patient.phone}</td>
                  <td>{calculateAge(patient.dob)}</td>
                  <td>{patient.gender}</td>
                  <td>{formatDate(patient.createdAt)}</td>
                  <td>
                    <div className="patient-row-actions">
                      <button
                        title="View patient"
                        aria-label={`View ${patient.fullName}`}
                        onClick={() => {
                          setSelectedPatient(patient);
                          setModal("view");
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        title="Edit patient"
                        aria-label={`Edit ${patient.fullName}`}
                        onClick={() => openModal("edit", patient)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        title="Delete patient"
                        aria-label={`Delete ${patient.fullName}`}
                        className="delete"
                        onClick={() => deletePatient(patient)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="patients-empty-state">
                      <div>
                        {patients.length === 0 ? (
                          <UserPlus size={25} />
                        ) : (
                          <Search size={25} />
                        )}
                      </div>
                      <strong>
                        {patients.length === 0
                          ? "No patients registered yet"
                          : "No matching patients"}
                      </strong>
                      <p>
                        {patients.length === 0
                          ? "Add your first patient to get started."
                          : "Try another search term or change the gender filter."}
                      </p>
                      {patients.length === 0 && (
                        <button
                          className="primary-button"
                          onClick={() => openModal("create")}
                        >
                          <Plus size={16} />
                          Register first patient
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="demo-notice">
        <CalendarDays size={13} />
        Patient records are currently stored in this browser only. Backend
        integration will be added later.
      </p>

      {modal && (
        <PatientModal
          mode={modal}
          patient={selectedPatient}
          onClose={closeModal}
          onSave={savePatient}
          onDelete={deletePatient}
        />
      )}
    </div>
  );
}
