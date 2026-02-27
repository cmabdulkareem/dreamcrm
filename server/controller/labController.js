import LabPC from "../model/labPcModel.js";
import LabSchedule from "../model/labScheduleModel.js";
import LabRow from "../model/labRowModel.js";
import Laboratory from "../model/laboratoryModel.js";
import LabQueue from "../model/labQueueModel.js";
import mongoose from "mongoose";

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
        const labId = req.params.id;

        // 1. Find all PCs in this lab to delete their schedules
        const pcs = await LabPC.find({ lab: labId });
        const pcIds = pcs.map(p => p._id);

        // 2. Delete all schedules for these PCs
        await LabSchedule.deleteMany({ pc: { $in: pcIds } });

        // 3. Delete all PCs in this lab
        await LabPC.deleteMany({ lab: labId });

        // 4. Delete all rows in this lab
        await LabRow.deleteMany({ lab: labId });

        // 5. Delete the laboratory itself
        const lab = await Laboratory.findByIdAndDelete(labId);

        if (!lab) return res.status(404).json({ message: "Laboratory not found" });

        res.json({ message: "Laboratory and all associated assets deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── PCs ─────────────────────────────────────
export const getPCs = async (req, res) => {
    try {
        const { labId } = req.query;
        let query = {};

        if (labId) {
            query.lab = labId;
        } else {
            // Find all labs the user has access to via brand filtering
            const labs = await Laboratory.find(req.brandFilter || {}).select('_id');
            query.lab = { $in: labs.map(l => l._id) };
        }

        const rawPcs = await LabPC.find(query).sort({ row: 1, position: 1, pcNumber: 1 });
        const pcs = rawPcs.map(pc => {
            const row = pc.row ? pc.row.replace(/Row\s+/i, '').trim().toUpperCase() : 'A';
            return { ...pc.toObject(), row };
        });
        res.json(pcs);
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

        const exists = await LabPC.findOne({ pcNumber: pcNumber.trim(), lab: labId });
        if (exists) return res.status(409).json({ message: `PC number "${pcNumber}" already exists in this lab` });

        const pc = await LabPC.create({
            pcNumber, label, status, specs, location, row, position, notes,
            softwares: softwares || [],
            lab: labId
        });
        res.status(201).json(pc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updatePC = async (req, res) => {
    try {
        const pc = await LabPC.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!pc) return res.status(404).json({ message: "PC not found" });
        res.json(pc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deletePC = async (req, res) => {
    try {
        const pc = await LabPC.findByIdAndDelete(req.params.id);
        if (!pc) return res.status(404).json({ message: "PC not found" });
        await LabSchedule.deleteMany({ pc: req.params.id });
        res.json({ message: "PC deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Schedules ───────────────────────────────
export const getSchedules = async (req, res) => {
    try {
        const { date, labId } = req.query;
        let query = {};
        if (date) {
            const d = new Date(date);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            query.date = { $gte: d, $lt: next };
        }

        if (labId) {
            const labPcs = await LabPC.find({ lab: labId }).select('_id');
            const pcIds = labPcs.map(p => p._id);
            query.pc = { $in: pcIds };
        }

        const schedules = await LabSchedule.find(query)
            .populate("pc", "pcNumber label")
            .populate("student", "name studentId")
            .populate("assignedBy", "fullName")
            .sort({ date: 1 });
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const addSchedule = async (req, res) => {
    try {
        const { pc, student, studentName, date, timeSlot, purpose, notes, queueItem } = req.body;
        const schedule = await LabSchedule.create({
            pc, student, studentName, date, timeSlot, purpose, notes, queueItem,
            assignedBy: req.user.id
        });

        // If from waitlist, transition to 'assigned'
        if (queueItem) {
            await LabQueue.findByIdAndUpdate(queueItem, { status: 'assigned' });
        }

        res.status(201).json(schedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateSchedule = async (req, res) => {
    try {
        const { queueItem } = req.body;
        const schedule = await LabSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // If updating with a queue item, transition that item to 'assigned'
        if (queueItem) {
            await LabQueue.findByIdAndUpdate(queueItem, { status: 'assigned' });
        }

        res.json(schedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteSchedule = async (req, res) => {
    try {
        const schedule = await LabSchedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ message: "Schedule not found" });

        // If it was linked to a queue entry, transition to 'completed'
        if (schedule.queueItem) {
            await LabQueue.findByIdAndUpdate(schedule.queueItem, { status: 'completed' });
        }

        await LabSchedule.findByIdAndDelete(req.params.id);
        res.json({ message: "Schedule deleted and student released" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Complaints ──────────────────────────────
export const getComplaints = async (req, res) => {
    try {
        const { labId } = req.query;
        let pcQuery = {};
        if (labId) {
            pcQuery.lab = labId;
        }

        const pcs = await LabPC.find({ ...pcQuery, "complaints.0": { $exists: true } })
            .populate("complaints.raisedBy", "fullName")
            .populate("complaints.resolvedBy", "fullName");

        const allComplaints = pcs.flatMap(pc =>
            pc.complaints.map(c => ({
                ...c.toObject(),
                pcId: pc._id,
                pcNumber: pc.pcNumber
            }))
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

        const complaint = {
            title, description, priority,
            raisedBy: req.user.id
        };

        const updated = await LabPC.findByIdAndUpdate(
            pcId,
            { $push: { complaints: complaint } },
            { new: true }
        ).populate("complaints.raisedBy", "fullName");

        if (!updated) return res.status(404).json({ message: "PC not found" });

        const newComplaint = updated.complaints[updated.complaints.length - 1];
        res.status(201).json(newComplaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateComplaint = async (req, res) => {
    try {
        const { status, resolutionNotes } = req.body;
        const pc = await LabPC.findOne({ "complaints._id": req.params.id });
        if (!pc) return res.status(404).json({ message: "Complaint not found" });

        const complaint = pc.complaints.id(req.params.id);
        if (status) complaint.status = status;
        if (resolutionNotes) {
            complaint.resolutionNotes = resolutionNotes;
            complaint.resolvedBy = req.user.id;
            complaint.resolvedAt = new Date();
        }
        await pc.save();
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteComplaint = async (req, res) => {
    try {
        const pc = await LabPC.findOne({ "complaints._id": req.params.id });
        if (!pc) return res.status(404).json({ message: "Complaint not found" });
        pc.complaints.pull(req.params.id);
        await pc.save();
        res.json({ message: "Complaint deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Rows ────────────────────────────────────
export const getRows = async (req, res) => {
    try {
        const { labId } = req.query;
        let query = {};

        if (labId) {
            query.lab = labId;
        } else {
            // Find all labs the user has access to via brand filtering
            const labs = await Laboratory.find(req.brandFilter || {}).select('_id');
            query.lab = { $in: labs.map(l => l._id) };
        }

        const rows = await LabRow.find(query).sort({ name: 1 });
        res.json(rows);
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

        const exists = await LabRow.findOne({ name, lab: labId });
        if (exists) return res.status(409).json({ message: `Row "${name}" already exists in this lab` });

        const row = await LabRow.create({
            name,
            emptySlots: [],
            lab: labId
        });
        res.status(201).json(row);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateRow = async (req, res) => {
    try {
        const row = await LabRow.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!row) return res.status(404).json({ message: "Row not found" });
        res.json(row);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteRow = async (req, res) => {
    try {
        await LabRow.findByIdAndDelete(req.params.id);
        res.json({ message: "Row deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const addEmptySlot = async (req, res) => {
    try {
        const { rowId, position } = req.body;
        if (!rowId || position === undefined) return res.status(400).json({ message: "rowId and position are required" });

        const updated = await LabRow.findByIdAndUpdate(
            rowId,
            { $addToSet: { emptySlots: position } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Row not found" });
        res.status(201).json({ _id: `${updated._id}_${position}`, row: updated.name, position });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const removeEmptySlot = async (req, res) => {
    try {
        const [rowId, posStr] = req.params.id.split('_');
        const position = parseInt(posStr);
        const updated = await LabRow.findByIdAndUpdate(
            rowId,
            { $pull: { emptySlots: position } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Row not found" });
        res.json({ message: "Slot removed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Queue ───────────────────────────────────
export const getQueue = async (req, res) => {
    try {
        const { labId, all } = req.query;

        // Default to only 'waiting' students unless 'all' is specified
        let query = {};
        if (!all) query.status = 'waiting';

        if (labId) {
            query.lab = labId;
        } else {
            // Find all labs the user has access to via brand filtering
            const labs = await Laboratory.find(req.brandFilter || {}).select('_id');
            query.lab = { $in: labs.map(l => l._id) };
        }

        const queue = await LabQueue.find(query).sort({ createdAt: 1 });
        res.json(queue);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const addToQueue = async (req, res) => {
    try {
        const { studentName, purpose, batchPreference, labId } = req.body;
        if (!labId || !studentName) return res.status(400).json({ message: "labId and studentName are required" });

        const item = await LabQueue.create({
            studentName,
            purpose: purpose || "",
            batchPreference: batchPreference || "Early AM",
            lab: labId,
            addedBy: req.user.id
        });
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const removeFromQueue = async (req, res) => {
    try {
        const item = await LabQueue.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
        if (!item) return res.status(404).json({ message: "Queue item not found" });
        res.json({ message: "Student removed from waitlist (cancelled)" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
