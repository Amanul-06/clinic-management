
import {
    demoDoctors,
    demoPatients,
    demoAppointments,
    demoStaff,
    demoSchedules,
} from "./demoData";

const STORAGE_KEY = "clinic_management_demo_v1";

const initialData = {
    doctors: demoDoctors,
    patients: demoPatients,
    appointments: demoAppointments,
    staff: demoStaff,
    schedules: demoSchedules,
};

function clone(data) {
    return JSON.parse(JSON.stringify(data));
}

function readData() {
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
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event("clinic-data-updated"));
        return true;
    } catch (error) {
        console.error("Unable to save demo data:", error);
        return false;
    }
}

function initialize() {
    if (typeof window === "undefined") return;

    if (!localStorage.getItem(STORAGE_KEY)) {
        writeData(clone(initialData));
    }
}

initialize();

function getData() {
    return readData() || clone(initialData);
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

export const demoStore = {
    // Get all records
    getAll(collection) {
        return getCollection(collection);
    },

    // Find a record
    getById(collection, id) {
        return getCollection(collection).find(
            (item) => item.id === id
        ) || null;
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
        const normalizedQuery = query.toLowerCase().trim();

        if (!normalizedQuery) return items;

        return items.filter((item) =>
            fields.some((field) =>
                String(item[field] ?? "")
                    .toLowerCase()
                    .includes(normalizedQuery)
            )
        );
    },

    // Reset demo data
    reset() {
        return writeData(clone(initialData));
    },

    // Listen for changes
    subscribe(callback) {
        const handler = () => callback(getData());

        window.addEventListener("clinic-data-updated", handler);

        return () => {
            window.removeEventListener(
                "clinic-data-updated",
                handler
            );
        };
    },
};
