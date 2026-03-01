import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { applyBrandFilter } from "../middleware/brandMiddleware.js";
import {
    getLaboratories, addLaboratory, updateLaboratory, deleteLaboratory,
    getPCs, addPC, updatePC, deletePC,
    getSchedules, addSchedule, updateSchedule, deleteSchedule,
    getComplaints, addComplaint, updateComplaint, deleteComplaint,
    getRows, addRow, updateRow, deleteRow, addEmptySlot, removeEmptySlot
} from "../controller/labController.js";

const router = express.Router();

router.use(verifyToken);
router.use(applyBrandFilter);

// ─── Laboratories ────────────────────────────
router.get("/laboratories", getLaboratories);
router.post("/laboratories", addLaboratory);
router.put("/laboratories/:id", updateLaboratory);
router.delete("/laboratories/:id", deleteLaboratory);

// ─── PCs ─────────────────────────────────────
router.get("/pcs", getPCs);
router.post("/pcs", addPC);
router.put("/pcs/:id", updatePC);
router.delete("/pcs/:id", deletePC);

// ─── Schedules ───────────────────────────────
router.get("/schedules", getSchedules);
router.post("/schedules", addSchedule);
router.put("/schedules/:id", updateSchedule);
router.delete("/schedules/:id", deleteSchedule);

// ─── Complaints (subdocs on LabPC) ───────────
router.get("/complaints", getComplaints);
router.post("/complaints", addComplaint);
router.put("/complaints/:id", updateComplaint);
router.delete("/complaints/:id", deleteComplaint);

// ─── Rows (replaces sections + slots) ────────
router.get("/rows", getRows);
router.post("/rows", addRow);
router.put("/rows/:id", updateRow);
router.delete("/rows/:id", deleteRow);
router.post("/rows/slots", addEmptySlot);
router.delete("/rows/slots/:id", removeEmptySlot);

// ─── Lab Lifecycle (Queue & Sessions) ────────
import {
    getQueue, addToQueue, removeFromQueue,
    assignSession, startSession, endSession, transferSession,
    getActiveSessions, getLabAnalytics, getLabHistory
} from "../controller/labController.js";

router.get("/queue", getQueue);
router.post("/queue", addToQueue);
router.delete("/queue/:id", removeFromQueue);

router.get("/sessions/active", getActiveSessions);
router.post("/sessions/assign", assignSession);
router.post("/sessions/:id/start", startSession);
router.post("/sessions/:id/end", endSession);
router.post("/sessions/:id/transfer", transferSession);

router.get("/analytics/usage", getLabAnalytics);
router.get("/history", getLabHistory);

export default router;
