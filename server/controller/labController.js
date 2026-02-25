import LabPC from "../model/labPcModel.js";
import LabSchedule from "../model/labScheduleModel.js";
import LabRow from "../model/labRowModel.js";

// ─────────────────────────────────────────────
// PCs
// ─────────────────────────────────────────────

export const getPCs = async (req, res) => {
    try {
        const rawPcs = await LabPC.find().sort({ row: 1, position: 1, pcNumber: 1 });
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
        let { pcNumber, label, status, specs, location, row, position, notes, softwares } = req.body;
        if (row) row = row.replace(/Row\s+/i, '').trim().toUpperCase();
        else row = 'A';
        if (!pcNumber) return res.status(400).json({ message: "PC number is required" });

        const exists = await LabPC.findOne({ pcNumber: pcNumber.trim() });
        if (exists) return res.status(409).json({ message: `PC number "${pcNumber}" already exists` });

        const pc = await LabPC.create({ pcNumber, label, status, specs, location, row, position, notes, softwares: softwares || [] });
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

// ─────────────────────────────────────────────
// Schedules
// ─────────────────────────────────────────────

export const getSchedules = async (req, res) => {
    try {
        const { date, pc } = req.query;
        const filter = {};
        if (date) {
            const d = new Date(date);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            filter.date = { $gte: d, $lt: next };
        }
        if (pc) filter.pc = pc;

        const schedules = await LabSchedule.find(filter)
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
        const { pc, student, studentName, date, timeSlot, purpose, notes } = req.body;
        if (!pc || !date || !timeSlot)
            return res.status(400).json({ message: "PC, date, and time slot are required" });

        const schedDate = new Date(date); schedDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(schedDate); nextDate.setDate(nextDate.getDate() + 1);

        const existingBooking = await LabSchedule.findOne({
            pc, timeSlot, date: { $gte: schedDate, $lt: nextDate }
        });
        if (existingBooking)
            return res.status(409).json({ message: `This PC is already booked for ${timeSlot} on this date.` });

        const schedule = await LabSchedule.create({
            pc, student, studentName, date, timeSlot, purpose, notes,
            assignedBy: req.user.id || req.user._id
        });

        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (schedDate.getTime() === today.getTime()) {
            await LabPC.findByIdAndUpdate(pc, { status: "in-use" });
        }

        const populated = await LabSchedule.findById(schedule._id)
            .populate("pc", "pcNumber label")
            .populate("student", "name studentId")
            .populate("assignedBy", "fullName");

        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateSchedule = async (req, res) => {
    try {
        const schedule = await LabSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate("pc", "pcNumber label")
            .populate("student", "name studentId")
            .populate("assignedBy", "fullName");
        if (!schedule) return res.status(404).json({ message: "Schedule not found" });
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteSchedule = async (req, res) => {
    try {
        const schedule = await LabSchedule.findByIdAndDelete(req.params.id);
        if (!schedule) return res.status(404).json({ message: "Schedule not found" });
        res.json({ message: "Schedule removed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────
// Complaints (embedded in LabPC)
// ─────────────────────────────────────────────

export const getComplaints = async (req, res) => {
    try {
        const { status } = req.query;
        const pcs = await LabPC.find({ "complaints.0": { $exists: true } })
            .populate("complaints.raisedBy", "fullName")
            .populate("complaints.resolvedBy", "fullName");

        let complaints = [];
        for (const pc of pcs) {
            for (const c of pc.complaints) {
                if (!status || c.status === status) {
                    complaints.push({
                        ...c.toObject(),
                        pc: { _id: pc._id, pcNumber: pc.pcNumber, label: pc.label }
                    });
                }
            }
        }
        complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const addComplaint = async (req, res) => {
    try {
        const { pc, title, description, priority } = req.body;
        if (!pc || !title) return res.status(400).json({ message: "PC and title are required" });

        const complaint = {
            title, description, priority,
            raisedBy: req.user.id || req.user._id
        };

        const updated = await LabPC.findByIdAndUpdate(
            pc,
            { $push: { complaints: complaint } },
            { new: true }
        ).populate("complaints.raisedBy", "fullName");

        const newComplaint = updated.complaints[updated.complaints.length - 1];
        res.status(201).json({
            ...newComplaint.toObject(),
            pc: { _id: updated._id, pcNumber: updated.pcNumber, label: updated.label }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateComplaint = async (req, res) => {
    try {
        const { id } = req.params;  // complaint subdocument _id
        const update = { ...req.body };

        const setFields = {};
        for (const [key, val] of Object.entries(update)) {
            setFields[`complaints.$.${key}`] = val;
        }
        if (req.body.status === "resolved") {
            setFields["complaints.$.resolvedBy"] = req.user.id || req.user._id;
            setFields["complaints.$.resolvedAt"] = new Date();
        }

        const pc = await LabPC.findOneAndUpdate(
            { "complaints._id": id },
            { $set: setFields },
            { new: true }
        ).populate("complaints.raisedBy", "fullName")
            .populate("complaints.resolvedBy", "fullName");

        if (!pc) return res.status(404).json({ message: "Complaint not found" });
        const complaint = pc.complaints.find(c => c._id.toString() === id);
        res.json({ ...complaint.toObject(), pc: { _id: pc._id, pcNumber: pc.pcNumber, label: pc.label } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const pc = await LabPC.findOneAndUpdate(
            { "complaints._id": id },
            { $pull: { complaints: { _id: id } } },
            { new: true }
        );
        if (!pc) return res.status(404).json({ message: "Complaint not found" });
        res.json({ message: "Complaint deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────
// Rows (replaces Sections + Slots)
// ─────────────────────────────────────────────

export const getRows = async (req, res) => {
    try {
        const rows = await LabRow.find().sort({ name: 1 });
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const addRow = async (req, res) => {
    try {
        let { name } = req.body;
        if (!name) return res.status(400).json({ message: "Row name is required" });
        name = name.replace(/Row\s+/i, '').trim().toUpperCase();

        const exists = await LabRow.findOne({ name });
        if (exists) return res.status(409).json({ message: `Row "${name}" already exists` });

        const row = await LabRow.create({ name, emptySlots: [] });
        res.status(201).json(row);
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
        const { row, position } = req.body;
        if (!row || position === undefined) return res.status(400).json({ message: "Row and position are required" });
        const rowName = row.replace(/Row\s+/i, '').trim().toUpperCase();

        const updated = await LabRow.findOneAndUpdate(
            { name: rowName },
            { $addToSet: { emptySlots: position } },
            { new: true, upsert: true }
        );
        // Return shape compatible with old LabSlot: { _id, row, position }
        res.status(201).json({ _id: `${updated._id}_${position}`, row: rowName, position });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const removeEmptySlot = async (req, res) => {
    try {
        // id format: "<rowId>_<position>"
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
