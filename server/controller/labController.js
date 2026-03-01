import Laboratory from "../model/laboratoryModel.js";
import LabActivity from "../model/labActivityModel.js";
import { emitLabUpdate } from "../realtime/socket.js";

const SLOT_TIMES = {
    "Early AM": [9, 0, 10, 30],
    "Late AM": [10, 30, 12, 0],
    "Midday": [12, 0, 13, 30],
    "Early PM": [14, 0, 15, 30],
    "Late PM": [15, 30, 17, 0],
};

const calculateSessionStatus = (timeSlot) => {
    const now = new Date();
    const [startH, startM, endH, endM] = SLOT_TIMES[timeSlot] || [0, 0, 0, 0];
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (nowMins >= startMins && nowMins < endMins) return "active";
    return "assigned";
};

const syncSession = async (labId, pcId, schedule, queueId = null, userId) => {
    if (!schedule.student && !schedule.studentName) return;

    const status = calculateSessionStatus(schedule.timeSlot);
    const lab = await Laboratory.findById(labId);
    if (!lab) return;

    // Create or update session in embedded array
    let session = lab.sessions.find(s => s.pcId === pcId && s.slot === schedule.timeSlot && s.status !== "completed" && s.status !== "cancelled");

    if (session) {
        session.studentId = schedule.student || null;
        session.studentName = schedule.studentName || "Unknown";
        session.status = status;
        session.software = schedule.purpose || "General";
        if (status === "active" && !session.startTime) session.startTime = new Date();
    } else {
        lab.sessions.push({
            studentId: schedule.student || null,
            studentName: schedule.studentName || "Unknown",
            status,
            pcId,
            slot: schedule.timeSlot,
            software: schedule.purpose || "General",
            startTime: status === "active" ? new Date() : null
        });
        session = lab.sessions[lab.sessions.length - 1];
    }

    // Update queue if provided
    if (queueId) {
        const queueEntry = lab.queue.id(queueId);
        if (queueEntry) {
            queueEntry.status = "assigned";
        }
        notifyLabUpdate(labId, "QUEUE_UPDATED", { action: "assigned", queueId });
    }

    await lab.save();

    // Get PC details for a better log
    const pc = lab.workstations.id(pcId);
    const workstationLabel = pc ? `Station ${pc.pcNumber}` : pcId;

    // Log Activity
    await LabActivity.create({
        userId,
        action: "LAB_SESSION_SYNC",
        module: "Lab",
        entityId: session._id,
        description: `Synced session for ${schedule.studentName} on ${workstationLabel} (${schedule.timeSlot})`,
        metadata: {
            labId: labId ? labId.toString() : null,
            studentId: schedule.student || null,
            studentName: schedule.studentName || "Unknown"
        }
    });
};

// Helper to notify real-time updates
const notifyLabUpdate = async (labId, type, data = {}) => {
    try {
        const lab = await Laboratory.findById(labId).select('brands');
        if (lab) {
            emitLabUpdate({
                labId,
                brandIds: lab.brands,
                type,
                data
            });
        }
    } catch (err) {
        console.error("Failed to emit lab update:", err);
    }
};

// ─── Laboratories ────────────────────────────────
export const getLaboratories = async (req, res) => {
    try {
        let query = {};

        // Admins/Owners see all. Others see labs associated with their permitted brands.
        if (!req.user.isAdmin) {
            const userBrands = req.user.brands.map(b => (b.brand?._id || b.brand || b).toString());
            query.brands = { $in: userBrands };
        }

        const labs = await Laboratory.find(query).sort({ name: 1 });
        res.json(labs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const addLaboratory = async (req, res) => {
    try {
        const { name, description, location, brands } = req.body;
        if (!name) return res.status(400).json({ message: "Lab name is required" });

        // Ensure brands is handled correctly
        const lab = await Laboratory.create({
            name,
            description: description || "",
            location: location || "",
            brands: brands || []
        });

        // Return full object for frontend to use (especially the _id)
        res.status(201).json(lab);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateLaboratory = async (req, res) => {
    try {
        const lab = await Laboratory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!lab) return res.status(404).json({ message: "Laboratory not found" });
        res.json(lab);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteLaboratory = async (req, res) => {
    try {
        const lab = await Laboratory.findByIdAndDelete(req.params.id);
        if (!lab) return res.status(404).json({ message: "Laboratory not found" });
        res.json({ message: "Laboratory and all nested data deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── PCs ─────────────────────────────────────
export const getPCs = async (req, res) => {
    try {
        const { labId } = req.query;
        if (labId) {
            const lab = await Laboratory.findById(labId);
            if (!lab) return res.status(404).json({ message: "Lab not found" });
            return res.json(lab.workstations);
        }

        const labs = await Laboratory.find(req.brandFilter || {});
        const allPcs = labs.flatMap(lab => lab.workstations.map(pc => ({
            ...pc.toObject(),
            labId: lab._id
        })));
        res.json(allPcs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const addPC = async (req, res) => {
    try {
        let { pcNumber, label, status, specs, location, row, position, notes, softwares, labId } = req.body;
        if (!labId) return res.status(400).json({ message: "labId is required" });
        if (!pcNumber) return res.status(400).json({ message: "PC number is required" });

        if (row) row = row.replace(/Row\s+/i, '').trim().toUpperCase();
        else row = 'A';

        const lab = await Laboratory.findById(labId);
        if (!lab) return res.status(404).json({ message: "Lab not found" });

        const exists = lab.workstations.some(pc => pc.pcNumber === pcNumber.trim());
        if (exists) return res.status(409).json({ message: `PC number "${pcNumber}" already exists in this lab` });

        lab.workstations.push({
            pcNumber, label, status, specs, location, row, position, notes,
            softwares: softwares || []
        });
        await lab.save();

        res.status(201).json(lab.workstations[lab.workstations.length - 1]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updatePC = async (req, res) => {
    try {
        const lab = await Laboratory.findOne({ "workstations._id": req.params.id });
        if (!lab) return res.status(404).json({ message: "PC not found" });

        const pc = lab.workstations.id(req.params.id);
        Object.assign(pc, req.body);
        await lab.save();

        res.json(pc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deletePC = async (req, res) => {
    try {
        const lab = await Laboratory.findOne({ "workstations._id": req.params.id });
        if (!lab) return res.status(404).json({ message: "PC not found" });

        // Also delete associated schedules in this lab
        lab.schedules = lab.schedules.filter(s => s.workstationId.toString() !== req.params.id);
        lab.workstations.pull(req.params.id);
        await lab.save();

        res.json({ message: "PC and associated schedules deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Schedules ───────────────────────────────
export const getSchedules = async (req, res) => {
    try {
        const { date, labId } = req.query;
        if (!labId) return res.status(400).json({ message: "labId is required for schedules" });

        const lab = await Laboratory.findById(labId)
            .populate("schedules.student", "fullName studentId")
            .populate("schedules.assignedBy", "fullName");

        if (!lab) return res.status(404).json({ message: "Lab not found" });

        let schedules = lab.schedules;
        if (date) {
            const targetDate = new Date(date).toDateString();
            schedules = schedules.filter(s => new Date(s.date).toDateString() === targetDate);
        }

        // Manually attach pcNumber/label for frontend compatibility
        const mappedSchedules = schedules.map(s => {
            const pc = lab.workstations.id(s.workstationId);
            return {
                ...s.toObject(),
                pc: pc ? { _id: pc._id, pcNumber: pc.pcNumber, label: pc.label } : null
            };
        });

        res.json(mappedSchedules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const addSchedule = async (req, res) => {
    try {
        const { pc, student, studentName, date, timeSlot, purpose, notes } = req.body;

        const newSchedule = {
            workstationId: pc,
            student,
            studentName,
            date,
            timeSlot,
            purpose,
            notes,
            assignedBy: req.user.id
        };

        const lab = await Laboratory.findOneAndUpdate(
            { "workstations._id": pc },
            { $push: { schedules: newSchedule } },
            { new: true, runValidators: true }
        );

        if (!lab) return res.status(404).json({ message: "PC not found" });

        // Automatic Lifecycle Sync
        await syncSession(lab._id.toString(), pc, newSchedule, req.body.queueId, req.user.id);

        // Find the newly added schedule in the updated lab object
        // It's likely the last one matching these criteria
        const addedSchedule = lab.schedules
            .filter(s => s.workstationId.toString() === pc && s.timeSlot === timeSlot)
            .sort((a, b) => b.createdAt - a.createdAt)[0];

        res.status(201).json(addedSchedule);
        notifyLabUpdate(lab._id, "SCHEDULE_UPDATED", { action: "add", pcId: pc });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateSchedule = async (req, res) => {
    try {
        const updateFields = {};
        for (const [key, value] of Object.entries(req.body)) {
            updateFields[`schedules.$.${key}`] = value;
        }

        const lab = await Laboratory.findOneAndUpdate(
            { "schedules._id": req.params.id },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!lab) return res.status(404).json({ message: "Schedule not found" });

        const updatedSchedule = lab.schedules.find(s => s._id.toString() === req.params.id);

        // Automatic Lifecycle Sync
        await syncSession(lab._id, updatedSchedule.workstationId, updatedSchedule, null, req.user.id);

        res.json(updatedSchedule);
        notifyLabUpdate(lab._id, "SCHEDULE_UPDATED", { action: "update", scheduleId: req.params.id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteSchedule = async (req, res) => {
    try {
        const lab = await Laboratory.findOne({ "schedules._id": req.params.id });
        if (!lab) return res.status(404).json({ message: "Schedule not found" });

        const scheduleToDelete = lab.schedules.id(req.params.id);
        const { student, studentName, workstationId, timeSlot, purpose } = scheduleToDelete;

        // Pull from schedules
        lab.schedules.pull(req.params.id);

        // Automatic Re-queue and Session Cleanup
        if (student || studentName) {
            // Find existing queue entry to update or create new one
            const existingQueueEntry = lab.queue.find(q =>
                (student && q.studentId?.toString() === student.toString()) ||
                (studentName && q.studentName === studentName)
            );

            if (existingQueueEntry) {
                existingQueueEntry.status = "waiting";
            } else {
                lab.queue.push({
                    studentId: student || null,
                    studentName: studentName || "Unknown",
                    preferredSoftware: purpose || "General",
                    preferredSlot: timeSlot,
                    status: "waiting"
                });
            }

            // Cleanup session
            const sessionIndex = lab.sessions.findIndex(s =>
                s.slot === timeSlot &&
                (student ? s.studentId?.toString() === student.toString() : s.studentName === studentName) &&
                ["assigned", "active"].includes(s.status)
            );
            if (sessionIndex !== -1) {
                lab.sessions.splice(sessionIndex, 1);
            }

            // Get PC Number for log
            const workstation = lab.workstations.id(workstationId);
            const workstationLabel = workstation ? `Station ${workstation.pcNumber}` : "Workstation";

            // Log Activity
            await LabActivity.create({
                userId: req.user.id,
                action: "LAB_SCHEDULE_REQUEUE",
                module: "Lab",
                entityId: lab._id,
                description: `Moved ${studentName || "Student"} from ${workstationLabel} back to waitlist (${timeSlot})`,
                metadata: {
                    labId: lab._id.toString(),
                    studentId: student || null,
                    studentName: studentName || "Unknown"
                }
            });

            notifyLabUpdate(lab._id, "QUEUE_UPDATED", { action: "requeue" });
        }

        await lab.save();

        res.json({ message: "Schedule removed and student re-queued" });
        notifyLabUpdate(lab._id, "SCHEDULE_UPDATED", { action: "delete", pcId: workstationId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Complaints ──────────────────────────────
export const getComplaints = async (req, res) => {
    try {
        const { labId } = req.query;
        let labs = [];
        if (labId) {
            const lab = await Laboratory.findById(labId)
                .populate("workstations.complaints.raisedBy", "fullName")
                .populate("workstations.complaints.resolvedBy", "fullName");
            if (lab) labs = [lab];
        } else {
            labs = await Laboratory.find(req.brandFilter || {})
                .populate("workstations.complaints.raisedBy", "fullName")
                .populate("workstations.complaints.resolvedBy", "fullName");
        }

        const allComplaints = labs.flatMap(lab =>
            lab.workstations.flatMap(pc =>
                pc.complaints.map(c => ({
                    ...c.toObject(),
                    pcId: pc._id,
                    pcNumber: pc.pcNumber,
                    labId: lab._id
                }))
            )
        );
        res.json(allComplaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const addComplaint = async (req, res) => {
    try {
        const { pcId, title, description, priority } = req.body;
        if (!pcId || !title) return res.status(400).json({ message: "PC and title are required" });

        const lab = await Laboratory.findOne({ "workstations._id": pcId });
        if (!lab) return res.status(404).json({ message: "PC not found" });

        const workstation = lab.workstations.id(pcId);
        workstation.complaints.push({
            title, description, priority,
            raisedBy: req.user.id
        });

        await lab.save();
        const newComplaint = workstation.complaints[workstation.complaints.length - 1];
        res.status(201).json(newComplaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateComplaint = async (req, res) => {
    try {
        const { status, resolutionNotes } = req.body;
        const lab = await Laboratory.findOne({ "workstations.complaints._id": req.params.id });
        if (!lab) return res.status(404).json({ message: "Complaint not found" });

        // Find the specific workstation and its complaint
        let foundComplaint = null;
        for (const pc of lab.workstations) {
            const complaint = pc.complaints.id(req.params.id);
            if (complaint) {
                if (status) complaint.status = status;
                if (resolutionNotes) {
                    complaint.resolutionNotes = resolutionNotes;
                    complaint.resolvedBy = req.user.id;
                    complaint.resolvedAt = new Date();
                }
                foundComplaint = complaint;
                break;
            }
        }

        await lab.save();
        res.json(foundComplaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteComplaint = async (req, res) => {
    try {
        const lab = await Laboratory.findOne({ "workstations.complaints._id": req.params.id });
        if (!lab) return res.status(404).json({ message: "Complaint not found" });

        for (const pc of lab.workstations) {
            if (pc.complaints.id(req.params.id)) {
                pc.complaints.pull(req.params.id);
                break;
            }
        }
        await lab.save();
        res.json({ message: "Complaint deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Rows ────────────────────────────────────
export const getRows = async (req, res) => {
    try {
        const { labId } = req.query;

        if (labId) {
            const lab = await Laboratory.findById(labId);
            return res.json(lab ? lab.rows : []);
        }

        // Find all labs the user has access to via brand filtering
        const labs = await Laboratory.find(req.brandFilter || {});
        const allRows = labs.flatMap(lab => lab.rows.map(row => ({
            ...row.toObject(),
            labId: lab._id
        })));

        res.json(allRows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const addRow = async (req, res) => {
    try {
        let { name, labId } = req.body;
        if (!labId) return res.status(400).json({ message: "labId is required" });
        if (!name) return res.status(400).json({ message: "Row name is required" });
        name = name.replace(/Row\s+/i, '').trim().toUpperCase();

        const lab = await Laboratory.findById(labId);
        if (!lab) return res.status(404).json({ message: "Laboratory not found" });

        const isDuplicate = lab.rows.some(r => r.name === name);
        if (isDuplicate) return res.status(409).json({ message: `Row "${name}" already exists in this lab` });

        lab.rows.push({ name, emptySlots: [] });
        await lab.save();

        const row = lab.rows[lab.rows.length - 1];
        res.status(201).json(row);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateRow = async (req, res) => {
    try {
        const { labId, name, emptySlots } = req.body;
        const lab = await Laboratory.findOne({ "rows._id": req.params.id });
        if (!lab) return res.status(404).json({ message: "Row not found" });

        const row = lab.rows.id(req.params.id);
        if (name) row.name = name.replace(/Row\s+/i, '').trim().toUpperCase();
        if (emptySlots) row.emptySlots = emptySlots;

        await lab.save();
        res.json(row);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteRow = async (req, res) => {
    try {
        const lab = await Laboratory.findOne({ "rows._id": req.params.id });
        if (!lab) return res.status(404).json({ message: "Row not found" });

        lab.rows.pull(req.params.id);
        await lab.save();
        res.json({ message: "Row deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const addEmptySlot = async (req, res) => {
    try {
        const { rowId, position } = req.body;
        if (!rowId || position === undefined) return res.status(400).json({ message: "rowId and position are required" });

        const lab = await Laboratory.findOne({ "rows._id": rowId });
        if (!lab) return res.status(404).json({ message: "Row not found" });

        const row = lab.rows.id(rowId);
        if (!row.emptySlots.includes(position)) {
            row.emptySlots.push(position);
            await lab.save();
        }

        res.status(201).json({ _id: `${row._id}_${position}`, row: row.name, position });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const removeEmptySlot = async (req, res) => {
    try {
        const [rowId, posStr] = req.params.id.split('_');
        const position = parseInt(posStr);

        const lab = await Laboratory.findOne({ "rows._id": rowId });
        if (!lab) return res.status(404).json({ message: "Row not found" });

        const row = lab.rows.id(rowId);
        row.emptySlots = row.emptySlots.filter(p => p !== position);
        await lab.save();

        res.json({ message: "Slot removed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Lab Lifecycle (Queue) ──────────────────
export const getQueue = async (req, res) => {
    try {
        const { labId, software, slot, status } = req.query;
        if (!labId) return res.status(400).json({ message: "labId is required" });

        const lab = await Laboratory.findById(labId).populate("queue.studentId", "fullName studentId phone1");
        if (!lab) return res.status(404).json({ message: "Lab not found" });

        const statusFilter = status ? status.split(",") : ["waiting"];
        let queue = lab.queue.filter(q => statusFilter.includes(q.status));
        if (software) queue = queue.filter(q => q.preferredSoftware === software);
        if (slot) queue = queue.filter(q => q.preferredSlot === slot);

        // FIFO sort
        queue.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        res.json(queue);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const addToQueue = async (req, res) => {
    try {
        const { studentId, studentName, labId, preferredSoftware, preferredSlot, notes } = req.body;
        if ((!studentId && !studentName) || !labId) {
            return res.status(400).json({ message: "Missing required queue fields" });
        }

        const lab = await Laboratory.findById(labId);
        if (!lab) return res.status(404).json({ message: "Lab not found" });

        // Check if student already in queue for this lab
        if (studentId) {
            const exists = lab.queue.find(q => q.studentId?.toString() === studentId && q.status === "waiting");
            if (exists) return res.status(400).json({ message: "Student already in queue" });
        }

        lab.queue.push({
            studentId: studentId || null,
            studentName: studentName || "Unknown",
            preferredSoftware, preferredSlot, notes
        });

        const queueEntry = lab.queue[lab.queue.length - 1];
        await lab.save();

        // Log Activity
        await LabActivity.create({
            userId: req.user.id,
            action: "LAB_QUEUE_ADD",
            module: "Lab",
            entityId: queueEntry._id,
            description: `Added ${studentName || "Student"} to waitlist for ${preferredSoftware || "Lab"} session (${preferredSlot})`,
            metadata: {
                labId: labId ? labId.toString() : null,
                studentId: studentId || null,
                studentName: studentName || "Unknown"
            }
        });

        res.status(201).json(queueEntry);
        notifyLabUpdate(labId, "QUEUE_UPDATED", { action: "add", entryId: queueEntry._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const removeFromQueue = async (req, res) => {
    try {
        const lab = await Laboratory.findOne({ "queue._id": req.params.id });
        if (!lab) return res.status(404).json({ message: "Queue entry not found" });

        const { status } = req.body;
        const queueEntry = lab.queue.id(req.params.id);
        queueEntry.status = status || "cancelled";
        await lab.save();

        // Log Activity
        await LabActivity.create({
            userId: req.user.id,
            action: "LAB_QUEUE_REMOVE",
            module: "Lab",
            entityId: queueEntry._id,
            description: `Removed ${queueEntry.studentName || "Student"} from waitlist`,
            metadata: {
                labId: lab._id.toString(),
                studentId: queueEntry.studentId || null,
                studentName: queueEntry.studentName || "Unknown"
            }
        });

        res.json({ message: "Student removed from queue" });
        notifyLabUpdate(lab._id, "QUEUE_UPDATED", { action: "remove", entryId: queueEntry._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Lab Lifecycle (Sessions) ───────────────
export const getActiveSessions = async (req, res) => {
    try {
        const { labId } = req.query;
        if (!labId) return res.status(400).json({ message: "labId is required" });

        const lab = await Laboratory.findById(labId).populate("sessions.studentId", "fullName studentId phone1");
        if (!lab) return res.status(404).json({ message: "Lab not found" });

        const sessions = lab.sessions.filter(s => ["assigned", "active"].includes(s.status));
        sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(sessions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const assignSession = async (req, res) => {
    try {
        const { studentId, studentName, labId, pcId, slot, software, queueId } = req.body;
        if ((!studentId && !studentName) || !labId || !pcId) {
            return res.status(400).json({ message: "Missing required assignment fields" });
        }

        const lab = await Laboratory.findById(labId);
        if (!lab) return res.status(404).json({ message: "Lab not found" });

        // Prevent double booking
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);

        const exists = lab.sessions.find(s =>
            s.pcId === pcId &&
            s.slot === (slot || "Early AM") &&
            new Date(s.createdAt) >= todayAtMidnight &&
            ["assigned", "active"].includes(s.status)
        );
        if (exists) return res.status(409).json({ message: "PC slot already booked for this time" });

        lab.sessions.push({
            studentId: studentId || null,
            studentName: studentName || "Unknown",
            pcId,
            slot: slot || "Early AM",
            software: software || "",
            status: "assigned"
        });

        const session = lab.sessions[lab.sessions.length - 1];

        // Update queue status if applicable
        if (queueId) {
            const queueEntry = lab.queue.id(queueId);
            if (queueEntry) queueEntry.status = "assigned";
        }

        await lab.save();

        // Get Workstation Details for Log
        const pc = lab.workstations.id(pcId);
        const workstationLabel = pc ? `Station ${pc.pcNumber}` : pcId;

        // Log Activity
        await LabActivity.create({
            userId: req.user.id,
            action: "LAB_SESSION_ASSIGN",
            module: "Lab",
            entityId: session._id,
            description: `Assigned ${studentName || "Student"} to ${workstationLabel} (${slot})`,
            metadata: {
                labId: labId ? labId.toString() : null,
                studentId: studentId || null,
                studentName: studentName || "Unknown"
            }
        });

        res.status(201).json(session);
        notifyLabUpdate(labId, "SESSION_UPDATED", { action: "assign", sessionId: session._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const startSession = async (req, res) => {
    try {
        const lab = await Laboratory.findOne({ "sessions._id": req.params.id });
        if (!lab) return res.status(404).json({ message: "Session not found" });

        const session = lab.sessions.id(req.params.id);
        session.status = "active";
        session.startTime = new Date();
        await lab.save();

        // Get Workstation Details
        const pc = lab.workstations.id(session.pcId);
        const workstationLabel = pc ? `Station ${pc.pcNumber}` : session.pcId;

        // Log Activity
        await LabActivity.create({
            userId: req.user.id,
            action: "LAB_SESSION_START",
            module: "Lab",
            entityId: session._id,
            description: `${session.studentName || "Student"} started session on ${workstationLabel}`,
            metadata: {
                labId: lab._id.toString(),
                studentId: session.studentId || null,
                studentName: session.studentName || "Unknown"
            }
        });

        res.json(session);
        notifyLabUpdate(lab._id, "SESSION_UPDATED", { action: "start", sessionId: session._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const endSession = async (req, res) => {
    try {
        const { option, summary } = req.body;
        const lab = await Laboratory.findOne({ "sessions._id": req.params.id });
        if (!lab) return res.status(404).json({ message: "Session not found" });

        const session = lab.sessions.id(req.params.id);
        session.status = option === "requeue" ? "cancelled" : "completed";
        session.endTime = new Date();
        session.summary = summary || "";

        if (option === "requeue") {
            lab.queue.push({
                studentId: session.studentId || null,
                studentName: session.studentName || "Unknown",
                preferredSoftware: session.software,
                preferredSlot: session.slot,
                status: "waiting"
            });
            notifyLabUpdate(lab._id, "QUEUE_UPDATED", { action: "requeue" });
        }

        await lab.save();

        // Log Activity
        await LabActivity.create({
            userId: req.user.id,
            action: "LAB_SESSION_END",
            module: "Lab",
            entityId: session._id,
            description: `${session.studentName || "Student"} session ended (${option === "requeue" ? "returned to waitlist" : "completed"})`,
            metadata: {
                labId: lab._id.toString(),
                studentId: session.studentId || null,
                studentName: session.studentName || "Unknown"
            }
        });

        res.json({ message: "Session concluded", session });
        notifyLabUpdate(lab._id, "SESSION_UPDATED", { action: "end", sessionId: session._id });
        if (option === "requeue") {
            notifyLabUpdate(lab._id, "QUEUE_UPDATED", { action: "requeue" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const transferSession = async (req, res) => {
    try {
        const { newPcId } = req.body;
        const lab = await Laboratory.findOne({ "sessions._id": req.params.id });
        if (!lab) return res.status(404).json({ message: "Session not found" });

        const session = lab.sessions.id(req.params.id);
        const oldPcId = session.pcId;
        session.pcId = newPcId;
        session.metadata = { ...session.metadata, transferredFrom: oldPcId };

        // Get readable workstation labels
        const oldPc = lab.workstations.id(oldPcId);
        const newPc = lab.workstations.id(newPcId);
        const oldLabel = oldPc ? `Station ${oldPc.pcNumber}` : oldPcId;
        const newLabel = newPc ? `Station ${newPc.pcNumber}` : newPcId;

        await lab.save();

        // Log Activity
        await LabActivity.create({
            userId: req.user.id,
            action: "LAB_SESSION_TRANSFER",
            module: "Lab",
            entityId: session._id,
            description: `Transferred ${session.studentName || "Student"} from ${oldLabel} to ${newLabel}`,
            metadata: {
                labId: lab._id.toString(),
                studentId: session.studentId || null,
                studentName: session.studentName || "Unknown"
            }
        });

        res.json(session);
        notifyLabUpdate(lab._id, "SESSION_UPDATED", { action: "transfer", sessionId: session._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getLabAnalytics = async (req, res) => {
    try {
        const { labId, days = 7 } = req.query;
        if (!labId) return res.status(400).json({ message: "labId is required" });

        const lab = await Laboratory.findById(labId);
        if (!lab) return res.status(404).json({ message: "Lab not found" });

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const sessions = lab.sessions.filter(s => new Date(s.createdAt) >= startDate);

        const analytics = {
            totalSessions: sessions.length,
            completedSessions: sessions.filter(s => s.status === "completed").length,
            averageWaitTime: 0,
            softwareUsage: {},
            pcUtilization: {}
        };

        sessions.forEach(s => {
            analytics.softwareUsage[s.software] = (analytics.softwareUsage[s.software] || 0) + 1;
            analytics.pcUtilization[s.pcId] = (analytics.pcUtilization[s.pcId] || 0) + 1;
        });

        res.json(analytics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const getLabHistory = async (req, res) => {
    try {
        const { labId, studentId, studentName, limit = 50 } = req.query;
        let query = { module: "Lab" };

        const metadataFilters = [];
        if (labId) {
            metadataFilters.push({
                $or: [
                    { "metadata.labId": labId.toString() },
                    { "metadata.labId": labId }
                ]
            });
        }

        if (studentId) {
            metadataFilters.push({
                $or: [
                    { "metadata.studentId": studentId.toString() },
                    { "metadata.studentId": studentId }
                ]
            });
        } else if (studentName) {
            metadataFilters.push({ "metadata.studentName": new RegExp(studentName, 'i') });
        }

        if (metadataFilters.length > 0) {
            query["$and"] = metadataFilters;
        }

        const logs = await LabActivity.find(query)
            .populate("userId", "fullName")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
