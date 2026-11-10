
const today = new Date();

const dateOffset = (days) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
};

const createDay = (shifts = []) => ({
    enabled: shifts.length > 0,
    shifts,
});

export const demoDoctors = [
    {
        id: "DOC001",
        name: "Dr. Arindam Sen",
        specialization: "Cardiology",
        qualification: "MBBS, MD (Cardiology)",
        experience: 15,
        phone: "9876543210",
        consultationFee: 800,
        status: "Active",
    },
    {
        id: "DOC002",
        name: "Dr. Priya Sharma",
        specialization: "Dermatology",
        qualification: "MBBS, MD (Dermatology)",
        experience: 10,
        phone: "9876543211",
        consultationFee: 600,
        status: "Active",
    },
    {
        id: "DOC003",
        name: "Dr. Rahul Mukherjee",
        specialization: "Orthopedics",
        qualification: "MBBS, MS (Orthopedics)",
        experience: 12,
        phone: "9876543212",
        consultationFee: 700,
        status: "Active",
    },
    {
        id: "DOC004",
        name: "Dr. Sneha Das",
        specialization: "Pediatrics",
        qualification: "MBBS, MD (Pediatrics)",
        experience: 8,
        phone: "9876543213",
        consultationFee: 500,
        status: "Active",
    },
    {
        id: "DOC005",
        name: "Dr. Souvik Roy",
        specialization: "General Medicine",
        qualification: "MBBS, MD (Medicine)",
        experience: 18,
        phone: "9876543214",
        consultationFee: 500,
        status: "Active",
    },
];

export const demoPatients = [
    {
        id: "PAT001",
        name: "Rahul Das",
        dob: "1995-04-12",
        gender: "Male",
        phone: "9000000001",
        address: "Salt Lake, Kolkata",
        bloodGroup: "B+",
        registeredAt: dateOffset(-20),
    },
    {
        id: "PAT002",
        name: "Ananya Roy",
        dob: "1988-09-23",
        gender: "Female",
        phone: "9000000002",
        address: "New Town, Kolkata",
        bloodGroup: "O+",
        registeredAt: dateOffset(-15),
    },
    {
        id: "PAT003",
        name: "Sourav Ghosh",
        dob: "2001-01-15",
        gender: "Male",
        phone: "9000000003",
        address: "Dum Dum, Kolkata",
        bloodGroup: "A+",
        registeredAt: dateOffset(-10),
    },
    {
        id: "PAT004",
        name: "Riya Banerjee",
        dob: "1992-06-30",
        gender: "Female",
        phone: "9000000004",
        address: "Howrah, West Bengal",
        bloodGroup: "AB+",
        registeredAt: dateOffset(-7),
    },
    {
        id: "PAT005",
        name: "Amit Kumar",
        dob: "1978-11-08",
        gender: "Male",
        phone: "9000000005",
        address: "Park Street, Kolkata",
        bloodGroup: "O-",
        registeredAt: dateOffset(-3),
    },
];

export const demoAppointments = [
    {
        id: "APT001",
        patientId: "PAT001",
        patientName: "Rahul Das",
        doctorId: "DOC001",
        doctorName: "Dr. Arindam Sen",
        date: dateOffset(0),
        time: "09:00",
        duration: 30,
        type: "Consultation",
        status: "Completed",
        fee: 800,
    },
    {
        id: "APT002",
        patientId: "PAT002",
        patientName: "Ananya Roy",
        doctorId: "DOC002",
        doctorName: "Dr. Priya Sharma",
        date: dateOffset(0),
        time: "10:00",
        duration: 20,
        type: "Follow-up",
        status: "Scheduled",
        fee: 600,
    },
    {
        id: "APT003",
        patientId: "PAT003",
        patientName: "Sourav Ghosh",
        doctorId: "DOC003",
        doctorName: "Dr. Rahul Mukherjee",
        date: dateOffset(0),
        time: "11:00",
        duration: 30,
        type: "Consultation",
        status: "Scheduled",
        fee: 700,
    },
    {
        id: "APT004",
        patientId: "PAT004",
        patientName: "Riya Banerjee",
        doctorId: "DOC004",
        doctorName: "Dr. Sneha Das",
        date: dateOffset(0),
        time: "12:00",
        duration: 20,
        type: "Consultation",
        status: "Scheduled",
        fee: 500,
    },
    {
        id: "APT005",
        patientId: "PAT005",
        patientName: "Amit Kumar",
        doctorId: "DOC005",
        doctorName: "Dr. Souvik Roy",
        date: dateOffset(1),
        time: "09:30",
        duration: 30,
        type: "Consultation",
        status: "Scheduled",
        fee: 500,
    },
];

export const demoStaff = [
    {
        id: "USR001",
        name: "Admin User",
        email: "admin@clinicdemo.com",
        role: "Super Admin",
        status: "Active",
    },
    {
        id: "USR002",
        name: "Priyanka Das",
        email: "reception1@clinicdemo.com",
        role: "Receptionist",
        status: "Active",
    },
    {
        id: "USR003",
        name: "Rohan Sen",
        email: "reception2@clinicdemo.com",
        role: "Receptionist",
        status: "Active",
    },
];

export const demoSchedules = [
    {
        id: "SCH001",
        doctorId: "DOC001",
        weekly: {
            Monday: createDay([
                { startTime: "09:00", endTime: "13:00", slotDuration: 30 },
                { startTime: "17:00", endTime: "20:00", slotDuration: 30 },
            ]),
            Tuesday: createDay(),
            Wednesday: createDay([
                { startTime: "09:00", endTime: "14:00", slotDuration: 30 },
            ]),
            Thursday: createDay(),
            Friday: createDay([
                { startTime: "10:00", endTime: "14:00", slotDuration: 30 },
                { startTime: "17:00", endTime: "19:00", slotDuration: 30 },
            ]),
            Saturday: createDay([
                { startTime: "09:00", endTime: "12:00", slotDuration: 30 },
            ]),
            Sunday: createDay(),
        },
    },
    {
        id: "SCH002",
        doctorId: "DOC002",
        weekly: {
            Monday: createDay([
                { startTime: "10:00", endTime: "16:00", slotDuration: 20 },
            ]),
            Tuesday: createDay([
                { startTime: "16:00", endTime: "20:00", slotDuration: 20 },
            ]),
            Wednesday: createDay(),
            Thursday: createDay([
                { startTime: "10:00", endTime: "16:00", slotDuration: 20 },
            ]),
            Friday: createDay(),
            Saturday: createDay([
                { startTime: "10:00", endTime: "14:00", slotDuration: 20 },
            ]),
            Sunday: createDay(),
        },
    },
    {
        id: "SCH003",
        doctorId: "DOC003",
        weekly: {
            Monday: createDay(),
            Tuesday: createDay([
                { startTime: "09:00", endTime: "13:00", slotDuration: 30 },
            ]),
            Wednesday: createDay(),
            Thursday: createDay([
                { startTime: "10:00", endTime: "14:00", slotDuration: 30 },
            ]),
            Friday: createDay([
                { startTime: "09:00", endTime: "12:00", slotDuration: 30 },
            ]),
            Saturday: createDay([
                { startTime: "09:00", endTime: "13:00", slotDuration: 30 },
            ]),
            Sunday: createDay(),
        },
    },
    {
        id: "SCH004",
        doctorId: "DOC004",
        weekly: {
            Monday: createDay([
                { startTime: "11:00", endTime: "17:00", slotDuration: 20 },
            ]),
            Tuesday: createDay(),
            Wednesday: createDay([
                { startTime: "09:00", endTime: "13:00", slotDuration: 20 },
            ]),
            Thursday: createDay(),
            Friday: createDay([
                { startTime: "11:00", endTime: "17:00", slotDuration: 20 },
            ]),
            Saturday: createDay([
                { startTime: "10:00", endTime: "14:00", slotDuration: 20 },
            ]),
            Sunday: createDay(),
        },
    },
    {
        id: "SCH005",
        doctorId: "DOC005",
        weekly: {
            Monday: createDay(),
            Tuesday: createDay([
                { startTime: "09:00", endTime: "15:00", slotDuration: 30 },
            ]),
            Wednesday: createDay([
                { startTime: "10:00", endTime: "14:00", slotDuration: 30 },
            ]),
            Thursday: createDay(),
            Friday: createDay([
                { startTime: "09:00", endTime: "13:00", slotDuration: 30 },
                { startTime: "17:00", endTime: "20:00", slotDuration: 30 },
            ]),
            Saturday: createDay(),
            Sunday: createDay(),
        },
    },
];
