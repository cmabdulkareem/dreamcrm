import express from "express";
import { studentSignup } from "../controller/userController.js";
import verifyToken from "../middleware/verifyToken.js";
import Student from "../model/studentModel.js";
import BatchStudent from "../model/batchStudentModel.js";
import Batch from "../model/batchModel.js";
import Attendance from "../model/attendanceModel.js";
import Holiday from "../model/holidayModel.js";

const router = express.Router();

// Public: Student Signup
router.post("/signup", studentSignup);

// Protected: Student Dashboard Data
router.get("/dashboard", verifyToken, async (req, res) => {
    try {
        // Ensure user is a student
        const isStudent = req.user.designation === "Student" ||
            (req.user.brands && req.user.brands.some(b => b.roles && b.roles.includes("Student")));

        if (!isStudent) {
            return res.status(403).json({ message: "Access denied. Student role required." });
        }

        const { email } = req.user;

        // 1. Find Student Record
        const student = await Student.findOne({ email: new RegExp(`^${email}$`, 'i') }).populate('brand');
        if (!student) {
            return res.status(404).json({ message: "Student record not linked." });
        }

        // 2. Find Batches
        const batchRelations = await BatchStudent.find({ studentId: student._id }).populate('batchId');
        const batches = batchRelations.map(br => br.batchId).filter(b => b); // filter nulls

        // 3. Get Recent Attendance (Last 7 days relevant to active batch)
        const today = new Date();
        // Logic for attendance summary could go here

        // For now, return basic info
        res.json({
            student,
            batches,
            message: "Dashboard data fetched"
        });

    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get detailed attendance for a batch
router.get("/attendance/:batchId", verifyToken, async (req, res) => {
    try {
        const { batchId } = req.params;
        const { email } = req.user;

        const student = await Student.findOne({ email: new RegExp(`^${email}$`, 'i') });
        if (!student) return res.status(404).json({ message: "Student not found" });

        // Verify student is in batch
        const inBatch = await BatchStudent.findOne({ batchId, studentId: student._id });
        if (!inBatch) return res.status(403).json({ message: "You are not in this batch." });

        const batch = await Batch.findById(batchId);

        // Fetch Attendance Records
        const attendanceRecords = await Attendance.find({ batchId });

        // Process student's attendance
        const myAttendance = attendanceRecords.map(record => {
            const myRecord = record.records.find(r => r.studentId.toString() === student._id.toString());
            return {
                date: record.date,
                status: myRecord ? myRecord.status : null,
                remarks: myRecord ? myRecord.remarks : null
            };
        }).filter(a => a.status); // Only days with status

        // Fetch Holidays
        const holidays = await Holiday.find({
            brand: batch.brand,
            date: { $gte: batch.startDate, $lte: batch.expectedEndDate } // rough range
        });

        res.json({
            attendance: myAttendance,
            holidays,
            batch
        });

    } catch (error) {
        console.error("Attendance fetch error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
