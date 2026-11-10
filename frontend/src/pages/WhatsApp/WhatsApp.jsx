import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  MessageSquare,
  Send,
  Search,
  Clock,
  CheckCircle2,
  CalendarDays,
  Phone,
  ExternalLink,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  Users,
  FileText,
  RotateCcw,
} from "lucide-react";

import { demoStore } from "../../data/demoStore";
import "./WhatsApp.css";

const MESSAGE_TYPES = [
  "Appointment Confirmation",
  "Appointment Reminder",
  "Appointment Rescheduled",
  "Appointment Cancelled",
  "Follow-up Reminder",
  "General Message",
];

const getToday = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";

  const [hours, minutes] = value.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours > 23 ||
    minutes > 59
  ) {
    return value;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizePhone = (phone) => {
  let number = String(phone || "").replace(/\D/g, "");

  if (number.startsWith("0") && number.length === 11) {
    number = number.slice(1);
  }

  if (number.length === 10) {
    number = `91${number}`;
  }

  return number;
};

const isValidPhone = (phone) => {
  const number = normalizePhone(phone);

  return number.length >= 10 && number.length <= 15;
};

const createTemplate = ({ type, patient, appointment }) => {
  const name = patient?.name || "Patient";
  const doctor = appointment?.doctorName || "our doctor";
  const date = formatDate(appointment?.date);
  const time = formatTime(appointment?.time);

  switch (type) {
    case "Appointment Confirmation":
      return `Hello ${name},

Your appointment has been confirmed.

Doctor: ${doctor}
Date: ${date}
Time: ${time}

Please arrive 10 minutes before your scheduled appointment.

Thank you!`;

    case "Appointment Reminder":
      return `Hello ${name},

This is a friendly reminder about your upcoming appointment.

Doctor: ${doctor}
Date: ${date}
Time: ${time}

We look forward to seeing you.

Thank you!`;

    case "Appointment Rescheduled":
      return `Hello ${name},

Your appointment has been rescheduled.

Doctor: ${doctor}
New Date: ${date}
New Time: ${time}

Please contact the clinic if you have any questions.

Thank you!`;

    case "Appointment Cancelled":
      return `Hello ${name},

Your appointment with ${doctor} on ${date} at ${time} has been cancelled.

Please contact the clinic if you would like to schedule another appointment.

Thank you.`;

    case "Follow-up Reminder":
      return `Hello ${name},

We hope you are doing well.

This is a reminder from the clinic regarding your follow-up consultation.

Please contact the clinic to schedule your follow-up appointment.

Thank you!`;

    default:
      return `Hello ${name},

Thank you for contacting our clinic.

Please let us know how we can assist you.

Thank you!`;
  }
};

const WhatsApp = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);

  const [activeTab, setActiveTab] = useState("compose");

  const [patientId, setPatientId] = useState("");
  const [appointmentId, setAppointmentId] = useState("");

  const [messageType, setMessageType] = useState("Appointment Confirmation");

  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [notice, setNotice] = useState(null);

  const refreshData = () => {
    setPatients(demoStore.getAll("patients") || []);
    setAppointments(demoStore.getAll("appointments") || []);

    const allMessages = demoStore.getAll("messages") || [];

    setMessages(
      [...allMessages].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      ),
    );
  };

  useEffect(() => {
    refreshData();

    return demoStore.subscribe(refreshData);
  }, []);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === patientId) || null,
    [patients, patientId],
  );

  const selectedAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment.id === appointmentId) ||
      null,
    [appointments, appointmentId],
  );

  const patientAppointments = useMemo(() => {
    return appointments.filter(
      (appointment) =>
        appointment.patientId === patientId &&
        appointment.status !== "Cancelled",
    );
  }, [appointments, patientId]);

  const upcomingAppointments = useMemo(() => {
    const today = getToday();

    return appointments
      .filter(
        (appointment) =>
          appointment.status === "Scheduled" && appointment.date >= today,
      )
      .sort((a, b) =>
        `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
      );
  }, [appointments]);

  /*
   * A reminder is considered existing only when it matches
   * the appointment's CURRENT date and time.
   *
   * This allows a new reminder after rescheduling.
   */
  const reminderCandidates = useMemo(() => {
    return upcomingAppointments.filter((appointment) => {
      return !messages.some((item) => {
        const sameAppointment = item.appointmentId === appointment.id;

        const sameSchedule =
          item.appointmentDate === appointment.date &&
          item.appointmentTime === appointment.time;

        const isReminder = item.type === "Appointment Reminder";

        const isNotFailed = item.status !== "Failed";

        return sameAppointment && sameSchedule && isReminder && isNotFailed;
      });
    });
  }, [upcomingAppointments, messages]);

  const stats = useMemo(() => {
    return {
      total: messages.length,

      prepared: messages.filter((item) => item.status === "Prepared").length,

      opened: messages.filter((item) => item.status === "Opened").length,

      sent: messages.filter((item) => item.status === "Sent").length,

      failed: messages.filter((item) => item.status === "Failed").length,
    };
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((item) => {
      const searchText = [
        item.patientName,
        item.phone,
        item.type,
        item.message,
        item.id,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase().trim());

      const matchesStatus =
        filterStatus === "All" || item.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [messages, search, filterStatus]);

  const showNotice = (text, type = "success") => {
    setNotice({ text, type });
  };

  const selectPatient = (id) => {
    setPatientId(id);
    setAppointmentId("");
    setMessage("");
    setNotice(null);
  };

  const selectAppointment = (id) => {
    setAppointmentId(id);

    const appointment = appointments.find((item) => item.id === id);

    if (appointment && selectedPatient) {
      setMessage(
        createTemplate({
          type: messageType,
          patient: selectedPatient,
          appointment,
        }),
      );
    }
  };

  const changeMessageType = (type) => {
    setMessageType(type);

    if (selectedPatient) {
      setMessage(
        createTemplate({
          type,
          patient: selectedPatient,
          appointment: selectedAppointment,
        }),
      );
    }
  };

  const generateTemplate = () => {
    if (!selectedPatient) {
      showNotice("Please select a patient first.", "error");
      return;
    }

    setMessage(
      createTemplate({
        type: messageType,
        patient: selectedPatient,
        appointment: selectedAppointment,
      }),
    );
  };

  const resetComposer = () => {
    setPatientId("");
    setAppointmentId("");
    setMessageType("Appointment Confirmation");
    setMessage("");
    setNotice(null);
  };

  /*
   * Save a message without claiming that it was sent.
   */
  const saveMessage = () => {
    if (!selectedPatient) {
      showNotice("Please select a patient.", "error");
      return null;
    }

    if (!isValidPhone(selectedPatient.phone)) {
      showNotice("The selected patient's phone number is invalid.", "error");
      return null;
    }

    if (!message.trim()) {
      showNotice("Please enter a message.", "error");
      return null;
    }

    const now = new Date().toISOString();

    const record = demoStore.add(
      "messages",
      {
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        phone: selectedPatient.phone,

        appointmentId: selectedAppointment?.id || null,

        // Snapshot of the appointment when this message was created.
        appointmentDate: selectedAppointment?.date || null,
        appointmentTime: selectedAppointment?.time || null,

        type: messageType,
        message: message.trim(),

        channel: "WhatsApp",
        status: "Prepared",

        createdAt: now,
        updatedAt: now,

        openedAt: null,
        sentAt: null,
      },
      "MSG",
    );

    if (!record) {
      showNotice("Unable to save the message.", "error");
      return null;
    }

    refreshData();

    return record;
  };

  const handlePrepare = () => {
    const record = saveMessage();

    if (!record) return;

    showNotice("Message saved successfully.");
    setActiveTab("history");
  };

  const openWhatsApp = (record, isNew = false) => {
    const phone = normalizePhone(record.phone);

    if (!isValidPhone(record.phone)) {
      showNotice("Invalid phone number.", "error");
      return;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(
      record.message,
    )}`;

    const newWindow = window.open(url, "_blank");

    if (!newWindow) {
      showNotice(
        "Pop-up blocked. Please allow pop-ups and try again.",
        "error",
      );
      return;
    }

    try {
      newWindow.opener = null;
    } catch {
      // The WhatsApp tab may already have navigated.
    }

    demoStore.update("messages", record.id, {
      status: "Opened",
      openedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    refreshData();

    showNotice(
      isNew
        ? "WhatsApp opened. Send the message manually."
        : "WhatsApp reopened. Confirm sending in WhatsApp.",
    );
  };

  const handleOpenWhatsApp = () => {
    const record = saveMessage();

    if (!record) return;

    openWhatsApp(record, true);
    setActiveTab("history");
  };

  const updateStatus = (record, status) => {
    const now = new Date().toISOString();

    const updated = demoStore.update("messages", record.id, {
      status,
      updatedAt: now,
      ...(status === "Sent" ? { sentAt: now } : {}),
    });

    if (!updated) {
      showNotice("Unable to update message status.", "error");
      return;
    }

    refreshData();

    if (status === "Sent") {
      showNotice("Marked as sent. This is a manual confirmation.");
    } else {
      showNotice("Message marked as failed.", "error");
    }
  };

  const prepareReminder = (appointment) => {
    const patient = patients.find((item) => item.id === appointment.patientId);

    if (!patient) {
      showNotice("Patient not found.", "error");
      return;
    }

    setPatientId(patient.id);
    setAppointmentId(appointment.id);
    setMessageType("Appointment Reminder");

    setMessage(
      createTemplate({
        type: "Appointment Reminder",
        patient,
        appointment,
      }),
    );

    setActiveTab("compose");
    setNotice(null);
  };

  const retryMessage = (record) => {
    const patient = patients.find((item) => item.id === record.patientId);

    if (!patient) {
      showNotice("Patient not found.", "error");
      return;
    }

    setPatientId(patient.id);

    const appointment = appointments.find(
      (item) => item.id === record.appointmentId,
    );

    setAppointmentId(appointment?.id || "");
    setMessageType(record.type);
    setMessage(record.message);

    setActiveTab("compose");
    setNotice(null);
  };

  return (
    <div className="whatsapp-page">
      {/* Header */}

      <div className="whatsapp-header">
        <div className="whatsapp-heading">
          <div className="whatsapp-heading-icon">
            <MessageCircle size={25} />
          </div>

          <div>
            <h1>WhatsApp Messaging</h1>
            <p>Manage patient communication and appointment reminders.</p>
          </div>
        </div>

        <button className="wa-refresh-btn" onClick={refreshData}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Statistics */}

      <div className="wa-stats-grid">
        <div className="wa-stat-card">
          <div className="wa-stat-icon blue">
            <MessageSquare size={21} />
          </div>
          <div>
            <span>Total Messages</span>
            <h2>{stats.total}</h2>
          </div>
        </div>

        <div className="wa-stat-card">
          <div className="wa-stat-icon orange">
            <Clock size={21} />
          </div>
          <div>
            <span>Prepared</span>
            <h2>{stats.prepared}</h2>
          </div>
        </div>

        <div className="wa-stat-card">
          <div className="wa-stat-icon purple">
            <ExternalLink size={21} />
          </div>
          <div>
            <span>WhatsApp Opened</span>
            <h2>{stats.opened}</h2>
          </div>
        </div>

        <div className="wa-stat-card">
          <div className="wa-stat-icon green">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Marked Sent</span>
            <h2>{stats.sent}</h2>
          </div>
        </div>
      </div>

      {/* Tabs */}

      <div className="wa-tabs">
        <button
          className={activeTab === "compose" ? "active" : ""}
          onClick={() => setActiveTab("compose")}
        >
          <Plus size={17} />
          Compose
        </button>

        <button
          className={activeTab === "reminders" ? "active" : ""}
          onClick={() => setActiveTab("reminders")}
        >
          <CalendarDays size={17} />
          Appointment Reminders
          {reminderCandidates.length > 0 && (
            <span className="wa-tab-count">{reminderCandidates.length}</span>
          )}
        </button>

        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          <Clock size={17} />
          Message History
        </button>
      </div>

      {/* Notice */}

      {notice && (
        <div className={`wa-notice ${notice.type}`}>
          <AlertCircle size={17} />
          <span>{notice.text}</span>

          <button onClick={() => setNotice(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* COMPOSE */}

      {activeTab === "compose" && (
        <div className="wa-compose-layout">
          <div className="wa-panel">
            <div className="wa-panel-header">
              <div>
                <h2>Compose Message</h2>
                <p>Create and prepare a WhatsApp message.</p>
              </div>
            </div>

            <div className="wa-form">
              <div className="wa-form-group">
                <label>Select Patient *</label>

                <select
                  value={patientId}
                  onChange={(e) => selectPatient(e.target.value)}
                >
                  <option value="">Choose a patient</option>

                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} — {patient.phone}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPatient && (
                <div className="wa-patient-info">
                  <div className="wa-patient-avatar">
                    {selectedPatient.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="wa-patient-details">
                    <strong>{selectedPatient.name}</strong>
                    <span>
                      <Phone size={13} />
                      {selectedPatient.phone}
                    </span>
                  </div>

                  <span className="wa-patient-id">{selectedPatient.id}</span>
                </div>
              )}

              <div className="wa-form-group">
                <label>Appointment (Optional)</label>

                <select
                  value={appointmentId}
                  onChange={(e) => selectAppointment(e.target.value)}
                  disabled={!selectedPatient}
                >
                  <option value="">Select an appointment</option>

                  {patientAppointments.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      {formatDate(appointment.date)} —{" "}
                      {formatTime(appointment.time)} — {appointment.doctorName}{" "}
                      ({appointment.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="wa-form-group">
                <label>Message Type *</label>

                <select
                  value={messageType}
                  onChange={(e) => changeMessageType(e.target.value)}
                >
                  {MESSAGE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wa-template-row">
                <button
                  type="button"
                  className="wa-template-btn"
                  onClick={generateTemplate}
                >
                  <FileText size={15} />
                  Generate Template
                </button>
              </div>

              <div className="wa-form-group">
                <label>Message *</label>

                <textarea
                  rows={10}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your WhatsApp message..."
                />

                <div className="wa-character-count">
                  {message.length} characters
                </div>
              </div>

              <div className="wa-form-actions">
                <button className="wa-secondary-btn" onClick={resetComposer}>
                  Clear
                </button>

                <button className="wa-secondary-btn" onClick={handlePrepare}>
                  Save Draft
                </button>

                <button className="wa-primary-btn" onClick={handleOpenWhatsApp}>
                  <Send size={16} />
                  Open WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* PREVIEW */}

          <div className="wa-preview-panel">
            <div className="wa-preview-heading">
              <MessageCircle size={19} />
              <h3>Message Preview</h3>
            </div>

            <div className="wa-phone-preview">
              <div className="wa-phone-top">
                <div className="wa-preview-avatar">
                  {selectedPatient?.name?.charAt(0) || "?"}
                </div>

                <div>
                  <strong>{selectedPatient?.name || "Patient"}</strong>

                  <span>{selectedPatient?.phone || "Phone number"}</span>
                </div>
              </div>

              <div className="wa-chat-background">
                <div className="wa-message-bubble">
                  {message || "Your message preview will appear here..."}

                  <span className="wa-preview-time">
                    {new Date().toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="wa-preview-footer">WhatsApp message preview</div>
            </div>

            <div className="wa-preview-note">
              <AlertCircle size={16} />
              <span>
                The message is not sent automatically. You must press Send
                inside WhatsApp.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REMINDERS */}

      {activeTab === "reminders" && (
        <div className="wa-panel">
          <div className="wa-panel-header">
            <div>
              <h2>Upcoming Appointment Reminders</h2>
              <p>
                Appointments that do not yet have a prepared reminder for their
                current schedule.
              </p>
            </div>
          </div>

          {reminderCandidates.length === 0 ? (
            <div className="wa-empty-state">
              <CalendarDays size={35} />
              <h3>No pending reminders</h3>
              <p>
                There are no upcoming appointments requiring a new reminder.
              </p>
            </div>
          ) : (
            <div className="wa-table-wrapper">
              <table className="wa-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Phone</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {reminderCandidates.map((appointment) => {
                    const patient = patients.find(
                      (item) => item.id === appointment.patientId,
                    );

                    return (
                      <tr key={appointment.id}>
                        <td>
                          <strong>{appointment.patientName}</strong>
                          <span className="wa-cell-sub">{appointment.id}</span>
                        </td>

                        <td>{appointment.doctorName}</td>

                        <td>{formatDate(appointment.date)}</td>

                        <td>{formatTime(appointment.time)}</td>

                        <td>{patient?.phone || "Unavailable"}</td>

                        <td>
                          <button
                            className="wa-small-primary"
                            disabled={!patient}
                            onClick={() => prepareReminder(appointment)}
                          >
                            <MessageCircle size={15} />
                            Prepare
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}

      {activeTab === "history" && (
        <div className="wa-panel">
          <div className="wa-panel-header wa-history-header">
            <div>
              <h2>Message History</h2>
              <p>All messages prepared through the clinic.</p>
            </div>

            <button className="wa-refresh-btn" onClick={refreshData}>
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          <div className="wa-history-filters">
            <div className="wa-search">
              <Search size={17} />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient or message..."
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Prepared">Prepared</option>
              <option value="Opened">Opened</option>
              <option value="Sent">Sent</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {filteredMessages.length === 0 ? (
            <div className="wa-empty-state">
              <MessageSquare size={35} />
              <h3>No messages found</h3>
              <p>Messages you create will appear here.</p>
            </div>
          ) : (
            <div className="wa-table-wrapper">
              <table className="wa-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Message Type</th>
                    <th>Message</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMessages.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.patientName}</strong>

                        <span className="wa-cell-sub">{item.phone}</span>
                      </td>

                      <td>{item.type}</td>

                      <td>
                        <div className="wa-message-preview-cell">
                          {item.message}
                        </div>
                      </td>

                      <td>{formatDateTime(item.createdAt)}</td>

                      <td>
                        <span
                          className={`wa-status ${String(item.status).toLowerCase()}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <div className="wa-history-actions">
                          {item.status !== "Sent" && (
                            <button
                              title="Confirm manually that message was sent"
                              className="wa-action-sent"
                              onClick={() => updateStatus(item, "Sent")}
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}

                          {item.status !== "Failed" &&
                            item.status !== "Sent" && (
                              <button
                                title="Mark failed"
                                className="wa-action-failed"
                                onClick={() => updateStatus(item, "Failed")}
                              >
                                <X size={16} />
                              </button>
                            )}

                          {item.status === "Failed" && (
                            <button
                              title="Retry message"
                              className="wa-action-open"
                              onClick={() => retryMessage(item)}
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}

                          <button
                            title="Open WhatsApp"
                            className="wa-action-open"
                            onClick={() => openWhatsApp(item)}
                          >
                            <ExternalLink size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatsApp;
