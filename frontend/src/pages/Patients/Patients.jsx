import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  Phone,
  MapPin,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  UserRound,
} from "lucide-react";

import { demoStore } from "../../data/demoStore";
import "./Patients.css";

const emptyPatient = {
  name: "",
  dob: "",
  gender: "",
  phone: "",
  address: "",
  bloodGroup: "",
};

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyPatient);

  const loadPatients = () => {
    setPatients(demoStore.getAll("patients"));
  };

  useEffect(() => {
    loadPatients();
    return demoStore.subscribe(loadPatients);
  }, []);

  const filteredPatients = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return patients;

    return patients.filter((patient) =>
      [patient.id, patient.name, patient.phone, patient.address].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [patients, search]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyPatient);
    setShowModal(true);
  };

  const openEditModal = (patient) => {
    setEditingId(patient.id);
    setForm({
      name: patient.name || "",
      dob: patient.dob || "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      address: patient.address || "",
      bloodGroup: patient.bloodGroup || "",
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      alert("Name and phone number are required.");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      alert("Enter a valid 10-digit phone number.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      registeredAt: editingId
        ? demoStore.getById("patients", editingId)?.registeredAt
        : new Date().toISOString().split("T")[0],
    };

    const result = editingId
      ? demoStore.update("patients", editingId, payload)
      : demoStore.add("patients", payload, "PAT");

    if (!result) {
      alert("Unable to save patient. Please try again.");
      return;
    }

    setShowModal(false);
    setForm(emptyPatient);
    setEditingId(null);
    loadPatients();
  };

  const handleDelete = (patient) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${patient.name}?`,
    );

    if (!confirmed) return;

    demoStore.delete("patients", patient.id);
    loadPatients();
  };

  const calculateAge = (dob) => {
    if (!dob) return "—";

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 0 ? `${age} yrs` : "—";
  };

  return (
    <div className="patients-page">
      <div className="patients-header">
        <div>
          <span className="patients-eyebrow">MANAGEMENT</span>
          <h1>Patients</h1>
          <p>Manage patient information and records.</p>
        </div>

        <button className="patient-add-btn" onClick={openAddModal}>
          <Plus size={18} />
          Add Patient
        </button>
      </div>

      <div className="patients-stats">
        <div className="patient-stat-card">
          <div className="patient-stat-icon blue">
            <Users size={21} />
          </div>
          <div>
            <span>Total Patients</span>
            <strong>{patients.length}</strong>
          </div>
        </div>

        <div className="patient-stat-card">
          <div className="patient-stat-icon green">
            <UserRound size={21} />
          </div>
          <div>
            <span>New This Month</span>
            <strong>
              {
                patients.filter((patient) => {
                  if (!patient.registeredAt) return false;

                  const date = new Date(patient.registeredAt);
                  const now = new Date();

                  return (
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </strong>
          </div>
        </div>

        <div className="patient-stat-card">
          <div className="patient-stat-icon purple">
            <CalendarDays size={21} />
          </div>
          <div>
            <span>Returning Patients</span>
            <strong>
              {(() => {
                const appointments = demoStore.getAll("appointments");

                const visitedPatientIds = new Set(
                  appointments
                    .filter((appointment) => appointment.status === "Completed")
                    .map((appointment) => appointment.patientId),
                );

                return visitedPatientIds.size;
              })()}
            </strong>
          </div>
        </div>
      </div>

      <div className="patients-content">
        <div className="patients-toolbar">
          <div>
            <h2>All Patients</h2>
            <p>{filteredPatients.length} records found</p>
          </div>

          <div className="patient-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="patients-table-wrapper">
          <table className="patients-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Patient ID</th>
                <th>Age / Gender</th>
                <th>Contact</th>
                <th>Blood Group</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <div className="patient-name-cell">
                      <div className="patient-avatar">
                        {patient.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <strong>{patient.name}</strong>
                        <span>{patient.address || "No address"}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="patient-id">{patient.id}</span>
                  </td>

                  <td>
                    <div className="patient-age-gender">
                      <strong>{calculateAge(patient.dob)}</strong>
                      <span>{patient.gender || "—"}</span>
                    </div>
                  </td>

                  <td>
                    <div className="patient-contact">
                      <Phone size={14} />
                      {patient.phone}
                    </div>
                  </td>

                  <td>
                    <span className="blood-group">
                      {patient.bloodGroup || "—"}
                    </span>
                  </td>

                  <td>{patient.registeredAt || "—"}</td>

                  <td>
                    <div className="patient-actions">
                      <button
                        title="Edit patient"
                        onClick={() => openEditModal(patient)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="delete"
                        title="Delete patient"
                        onClick={() => handleDelete(patient)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="patients-empty">
                      <Users size={32} />
                      <strong>No patients found</strong>
                      <span>Try another search or add a patient.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          className="patient-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="patient-modal">
            <div className="patient-modal-header">
              <div>
                <span className="patients-eyebrow">PATIENT MANAGEMENT</span>
                <h2>{editingId ? "Edit Patient" : "Register Patient"}</h2>
              </div>

              <button
                className="patient-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="patient-form-grid">
                <label>
                  Full Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </label>

                <label>
                  Date of Birth
                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Gender
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  Phone Number *
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength="10"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    required
                  />
                </label>

                <label>
                  Blood Group
                  <select
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={handleChange}
                  >
                    <option value="">Select blood group</option>
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                      (group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="patient-full-width">
                  Address
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter residential address"
                    rows="3"
                  />
                </label>
              </div>

              <div className="patient-form-footer">
                <button
                  type="button"
                  className="patient-cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="patient-save-btn">
                  {editingId ? "Save Changes" : "Register Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
