
import {
    demoDoctors,
    demoPatients,
    demoAppointments,
    demoStaff,
    demoSchedules,
    demoDoctorExceptions,
} from "./demoData";

const STORAGE_KEY = "clinic_management_demo_v1";

const initialData = {
    doctors: demoDoctors,
    patients: demoPatients,
    appointments: demoAppointments,
    staff: demoStaff,
    schedules: demoSchedules,
    doctorExceptions: demoDoctorExceptions || [],
    messages: [],
};

const INACTIVE_APPOINTMENT_STATUSES = ["Cancelled"];

function clone(data) {
    return JSON.parse(JSON.stringify(data));
}

function readData() {
    if (typeof window === "undefined") return null;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error("Unable to read demo data:", error);
    }

    return null;
}

function writeData(data) {
    if (typeof window === "undefined") return false;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        window.dispatchEvent(
            new Event("clinic-data-updated")
        );

        return true;
    } catch (error) {
        console.error("Unable to save demo data:", error);
        return false;
    }
}

/*
 * Initialize storage.
 *
 * Existing localStorage data is preserved.
 * Missing collections are added from initialData.
 */
function initialize() {
    if (typeof window === "undefined") return;

    const stored = readData();

    if (!stored) {
        writeData(clone(initialData));
        return;
    }

    let changed = false;

    Object.entries(initialData).forEach(([key, value]) => {
        if (!Array.isArray(stored[key])) {
            stored[key] = clone(value);
            changed = true;
        }
    });

    if (changed) {
        writeData(stored);
    }
}

initialize();

function getData() {
    const stored = readData();

    if (!stored) {
        return clone(initialData);
    }

    const data = {
        ...clone(initialData),
        ...stored,
    };

    Object.keys(initialData).forEach((key) => {
        if (!Array.isArray(data[key])) {
            data[key] = clone(initialData[key]);
        }
    });

    return data;
}

function getCollection(collection) {
    return getData()[collection] || [];
}

function saveCollection(collection, items) {
    const data = getData();
    data[collection] = items;

    return writeData(data);
}

function generateId(prefix, items) {
    const numbers = items
        .map((item) => Number(item.id?.replace(prefix, "")))
        .filter(Number.isFinite);

    const next = Math.max(0, ...numbers) + 1;

    return `${prefix}${String(next).padStart(3, "0")}`;
}

function timeToMinutes(time) {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
        return null;
    }

    const [hours, minutes] = time.split(":").map(Number);

    if (
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    return hours * 60 + minutes;
}

function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(
        remainingMinutes
    ).padStart(2, "0")}`;
}

function intervalsOverlap(startA, endA, startB, endB) {
    return startA < endB && startB < endA;
}

function getWeekday(dateString) {
    const date = new Date(`${dateString}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toLocaleDateString("en-US", {
        weekday: "long",
    });
}

function isValidDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || "")) {
        return false;
    }

    const date = new Date(`${dateString}T12:00:00`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === dateString
    );
}

function getTodayString() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDoctorSchedule(doctorId, date) {
    const schedules = getCollection("schedules");

    const schedule = schedules.find(
        (item) => item.doctorId === doctorId
    );

    if (!schedule) return [];

    const weekday = getWeekday(date);

    if (!weekday) return [];

    const day = schedule.weekly?.[weekday];

    if (!day?.enabled || !Array.isArray(day.shifts)) {
        return [];
    }

    return day.shifts;
}

function getApprovedExceptions(doctorId, date) {
    return getCollection("doctorExceptions").filter(
        (item) =>
            item.doctorId === doctorId &&
            item.date === date &&
            item.status !== "Cancelled" &&
            item.status !== "Rejected"
    );
}

/*
 * Resolve a doctor's working hours for a particular date.
 *
 * Regular weekly schedule is the default.
 * A full-day leave blocks the whole day.
 * Partial-day leave removes the specified interval.
 * An override replaces the regular schedule for that date.
 */
function getEffectiveSchedule(doctorId, date) {
    const exceptions = getApprovedExceptions(doctorId, date);

    const override = exceptions.find(
        (item) => item.type === "override"
    );

    let shifts = override
        ? Array.isArray(override.shifts) && override.shifts.length
            ? override.shifts
            : override.startTime && override.endTime
                ? [{
                    startTime: override.startTime,
                    endTime: override.endTime,
                    slotDuration: override.slotDuration || 30,
                }]
                : []
        : getDoctorSchedule(doctorId, date);

    shifts = shifts
        .map((shift) => ({
            startTime: shift.startTime,
            endTime: shift.endTime,
            slotDuration: Number(shift.slotDuration) || 30,
        }))
        .filter((shift) => {
            const start = timeToMinutes(shift.startTime);
            const end = timeToMinutes(shift.endTime);

            return (
                start !== null &&
                end !== null &&
                end > start &&
                shift.slotDuration > 0
            );
        });

    const leaveExceptions = exceptions.filter(
        (item) => item.type === "leave"
    );

    const fullDayLeave = leaveExceptions.some(
        (item) => !item.startTime || !item.endTime
    );

    if (fullDayLeave) {
        return [];
    }

    return shifts;
}

function getBookedAppointments(
    doctorId,
    date,
    excludeAppointmentId = null
) {
    return getCollection("appointments").filter((appointment) => {
        if (appointment.doctorId !== doctorId) return false;
        if (appointment.date !== date) return false;

        if (appointment.id === excludeAppointmentId) {
            return false;
        }

        return !INACTIVE_APPOINTMENT_STATUSES.includes(
            appointment.status
        );
    });
}

/*
 * Check whether a requested appointment slot is valid.
 */
function checkSlotAvailability({
    doctorId,
    date,
    time,
    duration = 30,
    excludeAppointmentId = null,
}) {
    if (!doctorId || !isValidDate(date)) {
        return {
            available: false,
            reason: "Invalid doctor or date.",
        };
    }

    if (date < getTodayString()) {
        return {
            available: false,
            reason: "Appointments cannot be booked in the past.",
        };
    }

    const doctor = getCollection("doctors").find(
        (item) => item.id === doctorId
    );

    if (!doctor || doctor.status !== "Active") {
        return {
            available: false,
            reason: "Doctor is not active.",
        };
    }

    const start = timeToMinutes(time);
    const appointmentDuration = Number(duration);

    if (
        start === null ||
        !Number.isFinite(appointmentDuration) ||
        appointmentDuration <= 0
    ) {
        return {
            available: false,
            reason: "Invalid appointment time or duration.",
        };
    }

    const end = start + appointmentDuration;

    if (end > 1440) {
        return {
            available: false,
            reason: "Appointment cannot extend beyond midnight.",
        };
    }

    const exceptions = getApprovedExceptions(doctorId, date);

    const fullDayLeave = exceptions.some(
        (item) =>
            item.type === "leave" &&
            (!item.startTime || !item.endTime)
    );

    if (fullDayLeave) {
        return {
            available: false,
            reason: "Doctor is on leave on this date.",
        };
    }

    const shifts = getEffectiveSchedule(doctorId, date);

    const fitsWorkingHours = shifts.some((shift) => {
        const shiftStart = timeToMinutes(shift.startTime);
        const shiftEnd = timeToMinutes(shift.endTime);

        return (
            shiftStart !== null &&
            shiftEnd !== null &&
            start >= shiftStart &&
            end <= shiftEnd
        );
    });

    if (!fitsWorkingHours) {
        return {
            available: false,
            reason: "Selected time is outside the doctor's working hours.",
        };
    }

    const partialLeave = exceptions.filter(
        (item) =>
            item.type === "leave" &&
            item.startTime &&
            item.endTime
    );

    const overlapsLeave = partialLeave.some((leave) => {
        const leaveStart = timeToMinutes(leave.startTime);
        const leaveEnd = timeToMinutes(leave.endTime);

        return (
            leaveStart !== null &&
            leaveEnd !== null &&
            intervalsOverlap(start, end, leaveStart, leaveEnd)
        );
    });

    if (overlapsLeave) {
        return {
            available: false,
            reason: "Doctor is unavailable during this time.",
        };
    }

    const appointments = getBookedAppointments(
        doctorId,
        date,
        excludeAppointmentId
    );

    const overlapsAppointment = appointments.some((appointment) => {
        const appointmentStart = timeToMinutes(appointment.time);

        if (appointmentStart === null) return false;

        const appointmentEnd =
            appointmentStart + Number(appointment.duration || 30);

        return intervalsOverlap(
            start,
            end,
            appointmentStart,
            appointmentEnd
        );
    });

    if (overlapsAppointment) {
        return {
            available: false,
            reason: "This time slot is already booked.",
        };
    }

    return {
        available: true,
        reason: null,
    };
}

/*
 * Generate available appointment slots for a doctor.
 *
 * Example:
 * demoStore.getAvailableSlots({
 *     doctorId: "DOC001",
 *     date: "2026-11-16",
 *     duration: 30,
 * });
 */

function getAvailableSlots({
    doctorId,
    date,
    duration = 30,
    excludeAppointmentId = null,
}) {
    if (!doctorId || !isValidDate(date)) {
        return [];
    }

    const doctor = getCollection("doctors").find(
        (item) => item.id === doctorId
    );

    if (!doctor || doctor.status !== "Active") {
        return [];
    }

    if (date < getTodayString()) {
        return [];
    }

    const requestedDuration = Number(duration) || 30;

    const exceptions = getApprovedExceptions(doctorId, date);

    // Full-day leave means no available slots.
    if (
        exceptions.some(
            (item) =>
                item.type === "leave" &&
                (!item.startTime || !item.endTime)
        )
    ) {
        return [];
    }

    const shifts = getEffectiveSchedule(doctorId, date);
    const slots = [];

    shifts.forEach((shift) => {
        const shiftStart = timeToMinutes(shift.startTime);
        const shiftEnd = timeToMinutes(shift.endTime);

        if (shiftStart === null || shiftEnd === null) {
            return;
        }

        const step = Number(shift.slotDuration) || 30;

        for (
            let current = shiftStart;
            current + requestedDuration <= shiftEnd;
            current += step
        ) {
            const time = minutesToTime(current);

            const result = checkSlotAvailability({
                doctorId,
                date,
                time,
                duration: requestedDuration,
                excludeAppointmentId,
            });

            if (result.available) {
                slots.push({
                    time,
                    duration: requestedDuration,
                });
            }
        }
    });

    return slots;
}


function createAppointmentRecord(record) {
    const now = new Date().toISOString();

    return {
        ...record,
        id: record.id || null,
        originalDate: record.originalDate || null,
        originalTime: record.originalTime || null,
        rescheduledFrom: record.rescheduledFrom || null,
        cancellationReason: record.cancellationReason || null,
        history: record.history || [],
        createdAt: record.createdAt || now,
        updatedAt: now,
    };
}

function validateAppointment(record, excludeAppointmentId = null) {
    if (!record.patientId || !record.doctorId) {
        return {
            valid: false,
            reason: "Select a patient and doctor.",
        };
    }

    const patient = getCollection("patients").find(
        (item) => item.id === record.patientId
    );

    if (!patient) {
        return {
            valid: false,
            reason: "Selected patient does not exist.",
        };
    }

    if (!record.date || !record.time) {
        return {
            valid: false,
            reason: "Select an appointment date and time.",
        };
    }

    return checkSlotAvailability({
        doctorId: record.doctorId,
        date: record.date,
        time: record.time,
        duration: record.duration || 30,
        excludeAppointmentId,
    });
}

export const demoStore = {
    // Get all records
    getAll(collection) {
        return getCollection(collection);
    },

    // Find a record by ID
    getById(collection, id) {
        return (
            getCollection(collection).find(
                (item) => item.id === id
            ) || null
        );
    },

    // Add a record
    add(collection, record, prefix) {
        const items = getCollection(collection);

        const newRecord = {
            ...record,
            id: record.id || generateId(prefix, items),
        };

        const success = saveCollection(collection, [
            ...items,
            newRecord,
        ]);

        return success ? newRecord : null;
    },

    // Update a record
    update(collection, id, updates) {
        const items = getCollection(collection);

        const index = items.findIndex(
            (item) => item.id === id
        );

        if (index === -1) return null;

        const updatedRecord = {
            ...items[index],
            ...updates,
            id: items[index].id,
        };

        const updatedItems = [...items];
        updatedItems[index] = updatedRecord;

        return saveCollection(collection, updatedItems)
            ? updatedRecord
            : null;
    },

    // Delete a record
    delete(collection, id) {
        const items = getCollection(collection);

        const updatedItems = items.filter(
            (item) => item.id !== id
        );

        if (updatedItems.length === items.length) {
            return false;
        }

        return saveCollection(collection, updatedItems);
    },

    // Search records
    search(collection, query, fields = ["name"]) {
        const items = getCollection(collection);
        const normalizedQuery = String(query || "")
            .toLowerCase()
            .trim();

        if (!normalizedQuery) return items;

        return items.filter((item) =>
            fields.some((field) =>
                String(item[field] ?? "")
                    .toLowerCase()
                    .includes(normalizedQuery)
            )
        );
    },

    // Get all available slots for a doctor on a date
    getAvailableSlots,

    // Check a specific appointment slot
    isSlotAvailable: checkSlotAvailability,

    // Validate an appointment before saving
    validateAppointment,

    // Book an appointment with availability validation
    bookAppointment(record) {
        const validation = validateAppointment(record);

        if (!validation.available) {
            return {
                success: false,
                reason: validation.reason,
                appointment: null,
            };
        }

        const items = getCollection("appointments");

        const newRecord = createAppointmentRecord({
            ...record,
            id: generateId("APT", items),
            status: record.status || "Scheduled",
        });

        const success = saveCollection("appointments", [
            ...items,
            newRecord,
        ]);

        return {
            success,
            reason: success ? null : "Unable to save appointment.",
            appointment: success ? newRecord : null,
        };
    },

    // Add a doctor leave or schedule override
    addDoctorException(record) {
        if (!record.doctorId || !isValidDate(record.date)) {
            return {
                success: false,
                reason: "Select a valid doctor and date.",
                exception: null,
            };
        }

        if (!["leave", "override"].includes(record.type)) {
            return {
                success: false,
                reason: "Invalid exception type.",
                exception: null,
            };
        }

        const doctor = getCollection("doctors").find(
            (item) => item.id === record.doctorId
        );

        if (!doctor) {
            return {
                success: false,
                reason: "Doctor not found.",
                exception: null,
            };
        }

        if (record.startTime || record.endTime) {
            const start = timeToMinutes(record.startTime);
            const end = timeToMinutes(record.endTime);

            if (
                start === null ||
                end === null ||
                end <= start
            ) {
                return {
                    success: false,
                    reason: "Enter a valid start and end time.",
                    exception: null,
                };
            }
        }

        if (
            record.type === "override" &&
            !(
                (Array.isArray(record.shifts) &&
                    record.shifts.length > 0) ||
                (record.startTime && record.endTime)
            )
        ) {
            return {
                success: false,
                reason: "An override needs at least one working shift.",
                exception: null,
            };
        }

        const items = getCollection("doctorExceptions");

        const newRecord = {
            ...record,
            id: record.id || generateId("EXC", items),
            status: record.status || "Approved",
            createdAt: new Date().toISOString(),
        };

        const success = saveCollection("doctorExceptions", [
            ...items,
            newRecord,
        ]);

        return {
            success,
            reason: success ? null : "Unable to save doctor exception.",
            exception: success ? newRecord : null,
        };
    },

    // Get appointments affected by a doctor's exception
    getAffectedAppointments(exceptionId) {
        const exception = getCollection("doctorExceptions").find(
            (item) => item.id === exceptionId
        );

        if (!exception) return [];

        return getCollection("appointments").filter((appointment) => {
            if (appointment.doctorId !== exception.doctorId) {
                return false;
            }

            if (appointment.date !== exception.date) {
                return false;
            }

            if (
                INACTIVE_APPOINTMENT_STATUSES.includes(
                    appointment.status
                )
            ) {
                return false;
            }

            if (exception.type === "override") {
                const shifts = Array.isArray(exception.shifts)
                    ? exception.shifts
                    : exception.startTime && exception.endTime
                        ? [{
                            startTime: exception.startTime,
                            endTime: exception.endTime,
                        }]
                        : [];

                const appointmentStart = timeToMinutes(
                    appointment.time
                );

                if (appointmentStart === null) return true;

                const appointmentEnd =
                    appointmentStart +
                    Number(appointment.duration || 30);

                return !shifts.some((shift) => {
                    const start = timeToMinutes(shift.startTime);
                    const end = timeToMinutes(shift.endTime);

                    return (
                        start !== null &&
                        end !== null &&
                        appointmentStart >= start &&
                        appointmentEnd <= end
                    );
                });
            }

            if (
                !exception.startTime ||
                !exception.endTime
            ) {
                return true;
            }

            const appointmentStart = timeToMinutes(
                appointment.time
            );

            if (appointmentStart === null) return true;

            const appointmentEnd =
                appointmentStart +
                Number(appointment.duration || 30);

            return intervalsOverlap(
                appointmentStart,
                appointmentEnd,
                timeToMinutes(exception.startTime),
                timeToMinutes(exception.endTime)
            );
        });
    },

    // Reschedule an existing appointment
    rescheduleAppointment(id, updates) {
        const items = getCollection("appointments");

        const index = items.findIndex(
            (item) => item.id === id
        );

        if (index === -1) {
            return {
                success: false,
                reason: "Appointment not found.",
                appointment: null,
            };
        }

        const current = items[index];

        if (INACTIVE_APPOINTMENT_STATUSES.includes(current.status)) {
            return {
                success: false,
                reason: "Cancelled appointments cannot be rescheduled.",
                appointment: null,
            };
        }

        const next = {
            ...current,
            ...updates,
            id: current.id,
        };

        const validation = validateAppointment(next, id);

        if (!validation.available) {
            return {
                success: false,
                reason: validation.reason,
                appointment: null,
            };
        }

        const now = new Date().toISOString();

        const historyEntry = {
            date: current.date,
            time: current.time,
            doctorId: current.doctorId,
            doctorName: current.doctorName,
            changedAt: now,
        };

        const updatedRecord = {
            ...next,
            originalDate: current.originalDate || current.date,
            originalTime: current.originalTime || current.time,
            rescheduledFrom: current.id,
            history: [
                ...(current.history || []),
                historyEntry,
            ],
            status: "Scheduled",
            updatedAt: now,
        };

        const updatedItems = [...items];
        updatedItems[index] = updatedRecord;

        const success = saveCollection(
            "appointments",
            updatedItems
        );

        return {
            success,
            reason: success ? null : "Unable to reschedule appointment.",
            appointment: success ? updatedRecord : null,
        };
    },

    // Cancel an appointment without deleting its record
    cancelAppointment(id, reason = "") {
        const items = getCollection("appointments");

        const index = items.findIndex(
            (item) => item.id === id
        );

        if (index === -1) return null;

        const current = items[index];

        if (current.status === "Cancelled") {
            return current;
        }

        const updatedRecord = {
            ...current,
            status: "Cancelled",
            cancellationReason: reason,
            updatedAt: new Date().toISOString(),
            history: [
                ...(current.history || []),
                {
                    action: "Cancelled",
                    date: current.date,
                    time: current.time,
                    changedAt: new Date().toISOString(),
                    reason,
                },
            ],
        };

        const updatedItems = [...items];
        updatedItems[index] = updatedRecord;

        return saveCollection("appointments", updatedItems)
            ? updatedRecord
            : null;
    },

    // Reset demo data
    reset() {
        return writeData(clone(initialData));
    },

    // Listen for changes
    subscribe(callback) {
        if (typeof window === "undefined") {
            return () => { };
        }

        const handler = () => callback(getData());

        window.addEventListener(
            "clinic-data-updated",
            handler
        );

        return () => {
            window.removeEventListener(
                "clinic-data-updated",
                handler
            );
        };
    },
};
