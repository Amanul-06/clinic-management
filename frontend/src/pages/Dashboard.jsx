import {
  Activity,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plus,
  Stethoscope,
  Users,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import StatCard from "../components/StatCard";
import { useAuth } from "../context/useAuth";
import { useBranding } from "../context/useBranding";

const appointments = [
  {
    time: "09:00 AM",
    name: "Rahul Sharma",
    doctor: "Dr. Ananya Roy",
    type: "Consultation",
    status: "Checked In",
  },
  {
    time: "09:30 AM",
    name: "Priya Das",
    doctor: "Dr. Arjun Sen",
    type: "Follow-up",
    status: "Scheduled",
  },
  {
    time: "10:00 AM",
    name: "Amit Ghosh",
    doctor: "Dr. Ananya Roy",
    type: "Consultation",
    status: "In Progress",
  },
  {
    time: "10:30 AM",
    name: "Sneha Paul",
    doctor: "Dr. Arjun Sen",
    type: "Follow-up",
    status: "Scheduled",
  },
  {
    time: "11:00 AM",
    name: "Sourav Roy",
    doctor: "Dr. Ananya Roy",
    type: "Consultation",
    status: "Completed",
  },
];

const chartData = [
  { day: "Mon", appointments: 18 },
  { day: "Tue", appointments: 25 },
  { day: "Wed", appointments: 21 },
  { day: "Thu", appointments: 32 },
  { day: "Fri", appointments: 27 },
  { day: "Sat", appointments: 36 },
  { day: "Sun", appointments: 14 },
];

function formatDate() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function AppointmentTable() {
  return (
    <div className="table-wrapper">
      <table className="appointment-table">
        <thead>
          <tr>
            <th>TIME</th>
            <th>PATIENT</th>
            <th>DOCTOR</th>
            <th>VISIT TYPE</th>
            <th>STATUS</th>
          </tr>
        </thead>

        <tbody>
          {appointments.map((item) => (
            <tr key={`${item.time}-${item.name}`}>
              <td className="time-cell">{item.time}</td>
              <td>
                <div className="patient-cell">
                  <div className="patient-avatar">{item.name.charAt(0)}</div>
                  <strong>{item.name}</strong>
                </div>
              </td>
              <td>{item.doctor}</td>
              <td>{item.type}</td>
              <td>
                <span
                  className={`status-pill ${item.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { branding } = useBranding();

  const isAdmin = user?.role === "superadmin";

  const stats = isAdmin
    ? [
        {
          title: "Total Patients",
          value: "1,284",
          description: "Registered patients",
          icon: Users,
          color: "blue",
        },
        {
          title: "Today's Appointments",
          value: "42",
          description: "Across all doctors",
          icon: CalendarClock,
          color: "purple",
        },
        {
          title: "Total Doctors",
          value: "08",
          description: "Active doctors",
          icon: Stethoscope,
          color: "green",
        },
        {
          title: "Completed Visits",
          value: "28",
          description: "Today's completed visits",
          icon: CheckCircle2,
          color: "orange",
        },
      ]
    : [
        {
          title: "Today's Appointments",
          value: "42",
          description: "Scheduled for today",
          icon: CalendarClock,
          color: "blue",
        },
        {
          title: "Waiting Patients",
          value: "06",
          description: "Currently in queue",
          icon: Clock3,
          color: "purple",
        },
        {
          title: "Completed Visits",
          value: "28",
          description: "Completed today",
          icon: CheckCircle2,
          color: "green",
        },
        {
          title: "Upcoming Appointments",
          value: "14",
          description: "Remaining today",
          icon: CalendarCheck,
          color: "orange",
        },
      ];

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">
            <Activity size={15} />
            CLINIC OVERVIEW
          </div>
          <h1>Good morning, {user?.name?.split(" ")[0]} 👋</h1>
          <p>
            Here's what's happening at {branding.clinicName || "your clinic"}{" "}
            today.
          </p>
        </div>

        <div className="date-display">
          <CalendarClock size={18} />
          {formatDate()}
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel appointments-panel">
          <div className="panel-heading">
            <div>
              <h3>Today's Appointments</h3>
              <p>Your clinic's appointment schedule</p>
            </div>

            <button className="outline-button" disabled>
              View all
            </button>
          </div>

          <AppointmentTable />
        </section>

        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Appointment Overview</h3>
              <p>Weekly appointment activity</p>
            </div>
            <span className="chart-period">This week</span>
          </div>

          <div className="chart-summary">
            <h2>173</h2>
            <span>Appointments this week</span>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="appointmentGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="#EAF0F8" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="appointments"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fill="url(#appointmentGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="quick-actions panel">
        <div>
          <h3>Quick Actions</h3>
          <p>Common tasks for your clinic</p>
        </div>

        <div className="quick-action-list">
          <button disabled>
            <span>
              <Plus size={19} />
            </span>
            Register Patient
          </button>
          <button disabled>
            <span>
              <CalendarClock size={19} />
            </span>
            Book Appointment
          </button>
          <button disabled>
            <span>
              <Users size={19} />
            </span>
            View Patients
          </button>
        </div>
      </section>

      <p className="demo-notice">
        <Activity size={14} />
        Preview mode — dashboard currently displays sample data.
      </p>
    </div>
  );
}
