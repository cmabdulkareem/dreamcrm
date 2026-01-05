import Batch from '../model/batchModel.js';
import BatchStudent from '../model/batchStudentModel.js';
import Attendance from '../model/attendanceModel.js';
import Student from '../model/studentModel.js';
import User from '../model/userModel.js';
import { isAdmin, isOwner, hasRole, isManager, isInstructor } from '../utils/roleHelpers.js';
import { emitNotification } from '../realtime/socket.js';

// Get all batches for current user's brand
export const getAllBatches = async (req, res) => {
    try {
        const finalQuery = req.brandFilter || {};

        // If user is an instructor (and not admin/owner/manager), filter by instructor name
        if (isInstructor(req.user) && !isAdmin(req.user) && !isOwner(req.user) && !isManager(req.user)) {
            finalQuery.instructorName = req.user.fullName;
        }

        const batches = await Batch.find(finalQuery).sort({ createdAt: -1 });

        // Self-healing: Ensure all batches have a shareToken
        let updated = false;
        for (let batch of batches) {
            if (!batch.shareToken) {
                batch.shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                await batch.save();
                updated = true;
            }
        }

        return res.status(200).json({ batches });
    } catch (error) {
        console.error("Error fetching batches:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Create a new batch
export const createBatch = async (req, res) => {
    try {
        const {
            batchName,
            instructorName,
            mode,
            subject,
            startDate,
            expectedEndDate,
            batchTime
        } = req.body;

        const brandId = req.headers['x-brand-id'];
        if (!brandId) {
            return res.status(400).json({ message: "Brand ID is required in headers." });
        }

        const newBatch = new Batch({
            batchName,
            instructorName,
            mode,
            subject,
            startDate,
            expectedEndDate,
            batchTime,
            brand: brandId,
            createdBy: req.user.id
        });

        await newBatch.save();

        // Notification Logic
        try {
            // Find instructor to notify
            const instructor = await User.findOne({ fullName: instructorName });

            const notificationData = {
                type: 'batch_assigned',
                title: 'New Batch Assigned',
                message: `You have been assigned to new batch: ${batchName}`,
                actionUrl: '/batch-management',
                metadata: { batchId: newBatch._id }
            };

            emitNotification({
                recipients: instructor ? [instructor._id] : [],
                brandId: brandId, // Notify brand managers
                notification: notificationData
            });
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
        }

        return res.status(201).json({ message: "Batch created successfully.", batch: newBatch });
    } catch (error) {
        console.error("Error creating batch:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Update batch details
export const updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedBatch = await Batch.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedBatch) {
            return res.status(404).json({ message: "Batch not found." });
        }

        // Notification Logic
        try {
            // Find instructor to notify
            const instructor = await User.findOne({ fullName: updatedBatch.instructorName });

            const notificationData = {
                type: 'batch_updated',
                title: 'Batch Updated',
                message: `Batch ${updatedBatch.batchName} has been updated.`,
                actionUrl: '/batch-management',
                metadata: { batchId: updatedBatch._id }
            };

            emitNotification({
                recipients: instructor ? [instructor._id] : [],
                brandId: updatedBatch.brand,
                notification: notificationData
            });
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
        }

        return res.status(200).json({ message: "Batch updated successfully.", batch: updatedBatch });
    } catch (error) {
        console.error("Error updating batch:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Delete batch and its students
export const deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;

        const batch = await Batch.findByIdAndDelete(id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found." });
        }

        // Find all students in this batch to release them
        const batchStudents = await BatchStudent.find({ batchId: id });

        // Release students (set batchScheduled = false ONLY if not in other batches)
        for (const bs of batchStudents) {
            if (bs.studentId) {
                // We are about to delete these, so count excluding CURRENT batch
                // But since we haven't deleted them from BatchStudent collection yet, the count includes this batch.
                // So if count is 1 (only this batch), then set to false.
                const count = await BatchStudent.countDocuments({ studentId: bs.studentId });
                if (count <= 1) {
                    await Student.findByIdAndUpdate(bs.studentId, { batchScheduled: false });
                }
            }
        }

        // Also delete all students in this batch
        await BatchStudent.deleteMany({ batchId: id });

        return res.status(200).json({ message: "Batch and its students deleted successfully." });
    } catch (error) {
        console.error("Error deleting batch:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get all students for a specific batch
export const getBatchStudents = async (req, res) => {
    try {
        const { id } = req.params; // batchId
        const students = await BatchStudent.find({ batchId: id })
            .populate('studentId', 'fullName phone1 dob phone2') // Populate commonly used fields
            .sort({ studentName: 1 });
        return res.status(200).json({ students });
    } catch (error) {
        console.error("Error fetching batch students:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Add student to a batch
export const addStudentToBatch = async (req, res) => {
    try {
        const { id } = req.params; // batchId
        const {
            studentId, // This is the Student Model _id
            studentName,
            dob,
            phoneNumber,
            parentPhoneNumber
        } = req.body;

        const batch = await Batch.findById(id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found." });
        }

        // Check availability if it's a linked student
        if (studentId) {
            const student = await Student.findById(studentId);
            if (!student) {
                return res.status(404).json({ message: "Student record not found." });
            }
            // Mark as scheduled (if not already)
            student.batchScheduled = true;
            await student.save();
        }

        const newStudent = new BatchStudent({
            batchId: id,
            studentId,
            studentName,
            dob,
            phoneNumber,
            parentPhoneNumber,
            brand: batch.brand
        });

        await newStudent.save();

        // Populate the student details before returning
        await newStudent.populate('studentId', 'studentId fullName phone1 dob phone2');

        return res.status(201).json({ message: "Student added to batch successfully.", student: newStudent });
    } catch (error) {
        console.error("Error adding student to batch:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Update student in batch
export const updateBatchStudent = async (req, res) => {
    try {
        const { studentId: id } = req.params; // DB _id
        const updateData = req.body;

        const updatedStudent = await BatchStudent.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedStudent) {
            return res.status(404).json({ message: "Student not found." });
        }

        return res.status(200).json({ message: "Student updated successfully.", student: updatedStudent });
    } catch (error) {
        console.error("Error updating batch student:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Remove student from batch
export const removeStudentFromBatch = async (req, res) => {
    try {
        const { studentId: id } = req.params; // DB _id

        const student = await BatchStudent.findByIdAndDelete(id);
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        // Check if student is in any other batch
        if (student.studentId) {
            const count = await BatchStudent.countDocuments({ studentId: student.studentId });
            if (count === 0) {
                await Student.findByIdAndUpdate(student.studentId, { batchScheduled: false });
            }
        }

        return res.status(200).json({ message: "Student removed from batch successfully." });
    } catch (error) {
        console.error("Error removing student from batch:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Mark attendance for a batch
export const markAttendance = async (req, res) => {
    try {
        const { id } = req.params; // batchId
        const { records, date: providedDate } = req.body;
        const userId = req.user._id;

        if (!records || !Array.isArray(records)) {
            return res.status(400).json({ message: "Valid records array are required." });
        }

        const batch = await Batch.findById(id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        // Attendance Date: Use provided date from client (local) or fallback to server today
        let attendanceDate;
        if (providedDate) {
            attendanceDate = new Date(providedDate);
        } else {
            attendanceDate = new Date();
        }

        // Normalize to midnight UTC for storage consistency while representing the intended "Day"
        attendanceDate.setHours(0, 0, 0, 0);

        if (isNaN(attendanceDate.getTime())) {
            return res.status(400).json({ message: "Invalid date provided." });
        }

        // Check if "Today" is within batch duration
        const batchStart = new Date(batch.startDate);
        batchStart.setHours(0, 0, 0, 0);
        const batchEnd = new Date(batch.expectedEndDate);
        batchEnd.setHours(0, 0, 0, 0);

        if (attendanceDate < batchStart || attendanceDate > batchEnd) {
            return res.status(400).json({ message: "Cannot mark attendance: Today is outside the batch duration." });
        }

        // Permission check
        if (!isAdmin(req.user) && !isOwner(req.user) && !isManager(req.user)) {
            // For faculty/instructors
            if (batch.instructorName !== req.user.fullName && !req.user.roles.includes('Instructor')) {
                return res.status(403).json({ message: "Not authorized to mark attendance for this batch." });
            }
        }

        const attendance = await Attendance.findOneAndUpdate(
            { batchId: id, date: attendanceDate },
            {
                batchId: id,
                date: attendanceDate,
                markedBy: userId,
                records: records
            },
            { new: true, upsert: true }
        );

        return res.status(200).json({ message: "Attendance marked successfully.", attendance });
    } catch (error) {
        console.error("Error marking attendance:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get attendance for a batch
export const getAttendance = async (req, res) => {
    try {
        const { id } = req.params; // batchId
        const { date, month, year } = req.query;

        const query = { batchId: id };
        let sortOrder = -1; // Default descending

        if (date) {
            const searchDate = new Date(date);
            searchDate.setHours(0, 0, 0, 0);
            // Match exact date (range for the whole day to be safe, or just normalize stored dates to 00:00:00)
            // Our markAttendance sets 00:00:00. So exact match should work if we construct searchDate correctly.
            query.date = searchDate;
        } else if (month && year) {
            const m = parseInt(month) - 1; // JS months are 0-11
            const y = parseInt(year);

            const startDate = new Date(y, m, 1);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(y, m + 1, 0); // Last day of month
            endDate.setHours(23, 59, 59, 999);

            query.date = {
                $gte: startDate,
                $lte: endDate
            };
            sortOrder = 1; // Ascending for monthly report
        }

        const attendance = await Attendance.find(query).sort({ date: sortOrder });

        return res.status(200).json({ attendance });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get public attendance for a batch using shareToken
export const getPublicBatchAttendance = async (req, res) => {
    try {
        const { shareToken } = req.params;
        const { month, year } = req.query;

        const batch = await Batch.findOne({ shareToken });
        if (!batch) {
            return res.status(404).json({ message: "Batch not found or link is invalid." });
        }

        const students = await BatchStudent.find({ batchId: batch._id }).sort({ studentName: 1 });

        const query = { batchId: batch._id };
        let sortOrder = 1;

        if (month && year) {
            const m = parseInt(month) - 1;
            const y = parseInt(year);

            const startDate = new Date(y, m, 1);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(y, m + 1, 0);
            endDate.setHours(23, 59, 59, 999);

            query.date = {
                $gte: startDate,
                $lte: endDate
            };
        } else {
            // Default to current month if not provided
            const now = new Date();
            const m = now.getMonth();
            const y = now.getFullYear();

            const startDate = new Date(y, m, 1);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(y, m + 1, 0);
            endDate.setHours(23, 59, 59, 999);

            query.date = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const attendance = await Attendance.find(query).sort({ date: sortOrder });

        return res.status(200).json({
            batch: {
                batchName: batch.batchName,
                subject: batch.subject,
                instructorName: batch.instructorName
            },
            students,
            attendance
        });
    } catch (error) {
        console.error("Error fetching public attendance:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
