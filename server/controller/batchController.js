import mongoose from 'mongoose';
import Batch from '../model/batchModel.js';
import Student from '../model/studentModel.js';
import User from '../model/userModel.js';
import Brand from '../model/brandModel.js';
import Holiday from '../model/holidayModel.js';
import { isAdmin, isOwner, hasRole, isManager, isInstructor, isCounsellor, isAcademicCoordinator } from '../utils/roleHelpers.js';
import { generateBatchId } from '../helpers/batchIdGenerator.js';
import { emitNotification } from '../realtime/socket.js';
import { logActivity } from "../utils/activityLogger.js";

// Helper to check and inactivate student based on 7-day consecutive absence
const checkAndInactivateStudent = async (studentId, brandId, currentUserId) => {
    try {
        const student = await Student.findById(studentId);
        if (!student || student.academicStatus === 'Inactive') return;

        // Fetch all batches where this student is enrolled
        const studentBatches = await Batch.find({ 'students.studentId': studentId });
        if (studentBatches.length === 0) return;

        // Collect all attendance records for this student from those batches
        let allAttendanceDocs = [];
        studentBatches.forEach(batch => {
            const enrollment = batch.students.find(s => s.studentId && s.studentId.toString() === studentId.toString());
            if (enrollment) {
                const enrollmentInternalId = enrollment._id.toString();
                (batch.attendance || []).forEach(att => {
                    const record = att.records.find(r => r.studentId && r.studentId.toString() === enrollmentInternalId);
                    if (record) {
                        allAttendanceDocs.push({
                            date: att.date,
                            status: record.status
                        });
                    }
                });
            }
        });

        if (allAttendanceDocs.length === 0) return;

        // Sort by date DESC
        allAttendanceDocs.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Fetch holidays for the brand
        const holidays = await Holiday.find({ brand: brandId });
        const holidayDates = new Set(holidays.map(h => new Date(h.date).toDateString()));

        let today = new Date();
        today.setHours(0, 0, 0, 0);

        // Map status by date for quick access
        const statusMap = {};
        allAttendanceDocs.forEach(doc => {
            statusMap[new Date(doc.date).toDateString()] = doc.status;
        });

        let checkDate = new Date(today);
        let absenceStreak = 0;
        let daysChecked = 0;


        // Loop back up to 30 days to check for the 7-day streak
        for (let i = 0; i < 30; i++) {
            const dateStr = checkDate.toDateString();
            const isSunday = checkDate.getDay() === 0;
            const isHoliday = holidayDates.has(dateStr);

            if (isHoliday) {
                // Official holidays must be excluded from the count (skip)
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }

            const status = statusMap[dateStr];

            if (status === 'Absent') {
                absenceStreak++;
            } else if (status === 'Present' || status === 'Late' || status === 'Excused') {
                // Activity found, streak broken
                break;
            } else if (isSunday) {
                // The 7-day count includes Sundays.
                absenceStreak++;
            } else if (!status) {
                // No record for this day.
                absenceStreak++;
            }

            if (absenceStreak >= 7) {
                student.academicStatus = 'Inactive';
                student.history.push({
                    status: 'Inactive',
                    remark: 'Automatically marked as Inactive due to 7 consecutive days of absence.',
                    updatedBy: currentUserId,
                    updatedOn: new Date()
                });
                await student.save();

                // Log activity
                await logActivity(currentUserId, 'UPDATE', 'Students', {
                    entityId: student._id,
                    description: `Automatically marked student Inactive: ${student.fullName}`,
                    brandId: brandId
                });

                // Socket notification? (Optional but good)
                break;
            }

            checkDate.setDate(checkDate.getDate() - 1);
        }

    } catch (error) {
        console.error("Error checking student inactivation:", error);
    }
};

// Get all batches for current user's brand
export const getAllBatches = async (req, res) => {
    try {
        let finalQuery;

        // If user is an instructor (and NOT an admin/owner/manager), ONLY show assigned batches
        // This overrides the brand filter for pure instructors
        const brandId = req.headers['x-brand-id'] || req.brandFilter?.brand;
        finalQuery = { ...req.brandFilter }; // Use the middleware-injected filter (e.g., { brand: brandId })

        // If user is a pure instructor (and NOT an admin/owner/manager), ONLY show their assigned batches IN THIS BRAND
        if (isInstructor(req.user, brandId) && !isAdmin(req.user, brandId) && !isOwner(req.user, brandId) && !isManager(req.user, brandId)) {
            finalQuery.instructor = req.user.id || req.user._id;
        }

        const batches = await Batch.find(finalQuery)
            .select('-attendance')
            .sort({ createdAt: -1 })
            .populate('brand', 'name code');

        // Enhance batches with student counts and self-healing
        const enhancedBatches = batches.map((batch) => {
            const batchObj = batch.toObject();
            
            // Add student count from embedded array
            batchObj.studentCount = batch.students?.length || 0;

            return batchObj;
        });

        return res.status(200).json({ batches: enhancedBatches });
    } catch (error) {
        console.error("Error fetching batches:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Create a new batch
export const createBatch = async (req, res) => {
    try {
        let {
            batchName,
            instructorName,
            mode,
            subject,
            startDate,
            expectedEndDate,
            batchTime,
            instructor, // Add instructor ID
            moduleId,
            slot,
            isSlot
        } = req.body;

        const brandId = req.headers['x-brand-id'];
        if (!brandId) {
            return res.status(400).json({ message: "Brand ID is required in headers." });
        }

        // Generate batchName automatically if it's a real batch (not a slot placeholder)
        if (!isSlot) {
            batchName = await generateBatchId(brandId, startDate || new Date());
        }

        const newBatch = new Batch({
            batchName,
            instructorName,
            mode,
            subject,
            startDate,
            expectedEndDate,
            batchTime,
            instructor, // Save instructor ID
            moduleId,
            slot,
            isSlot: isSlot || false,
            brand: brandId,
            createdBy: req.user.id
        });

        await newBatch.save();

        // Notification Logic
        try {
            const creatorName = req.user.fullName || "Unknown";
            const notificationData = {
                userName: creatorName,
                action: 'created',
                entityName: `batch ${batchName}`,
                module: 'Batch Management',
                actionUrl: '/batch-management',
                metadata: { batchId: newBatch._id },
                timestamp: new Date().toISOString()
            };

            // Notify brand managers and owner
            emitNotification({
                brandId: brandId,
                notification: notificationData
            });

            // Also notify instructor if they are a different user
            const instructorUser = await User.findOne({ fullName: instructorName });
            if (instructorUser && instructorUser._id.toString() !== req.user.id.toString()) {
                emitNotification({
                    recipients: [instructorUser._id],
                    notification: notificationData
                });
            }
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

        const batch = await Batch.findById(id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found." });
        }

        // Authorization check - Allow Admin, Owner, Manager, and Academic Coordinator
        const brandId = req.headers['x-brand-id'] || batch.brand?.toString();
        if (!isAdmin(req.user, brandId) && !isOwner(req.user, brandId) && !isManager(req.user, brandId) && !isAcademicCoordinator(req.user, brandId)) {
            const userId = (req.user.id || req.user._id).toString();
            const isAssignedInstructor = batch.instructor && batch.instructor.toString() === userId;
            if (!isAssignedInstructor) {
                return res.status(403).json({ message: "Not authorized to update this batch." });
            }
        }

        const updatedBatch = await Batch.findByIdAndUpdate(id, updateData, { new: true });

        // Notification Logic
        try {
            const updaterName = req.user.fullName || "Unknown";
            const notificationData = {
                userName: updaterName,
                action: 'updated',
                entityName: `batch ${updatedBatch.batchName}`,
                module: 'Batch Management',
                actionUrl: '/batch-management',
                metadata: { batchId: updatedBatch._id },
                timestamp: new Date().toISOString()
            };

            emitNotification({
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

        const batch = await Batch.findById(id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found." });
        }

        // Authorization check - Allow Admin, Owner, Manager, and Academic Coordinator
        const brandId = req.headers['x-brand-id'] || batch.brand?.toString();
        if (!isAdmin(req.user, brandId) && !isOwner(req.user, brandId) && !isManager(req.user, brandId) && !isAcademicCoordinator(req.user, brandId)) {
            const userId = (req.user.id || req.user._id).toString();
            const isAssignedInstructor = batch.instructor && batch.instructor.toString() === userId;
            if (!isAssignedInstructor) {
                return res.status(403).json({ message: "Not authorized to delete this batch." });
            }
        }

        await Batch.findByIdAndDelete(id);

        // Release students (set batchScheduled = false ONLY if not in other batches)
        for (const bs of batch.students || []) {
            if (bs.studentId) {
                const studentRecord = await Student.findById(bs.studentId);
                if (studentRecord) {
                    const otherBatchCount = await Batch.countDocuments({ 
                        'students.studentId': bs.studentId,
                        _id: { $ne: batch._id }
                    });
                    if (otherBatchCount === 0) {
                        studentRecord.batchScheduled = false;
                    }

                    // Log to history
                    studentRecord.history.push({
                        status: 'Removed from Batch',
                        moduleName: batch.batchName,
                        metadata: { batchId: batch._id },
                        remark: `Student removed from batch: ${batch.batchName} (Batch Deleted)`,
                        updatedBy: req.user.id,
                        updatedOn: new Date()
                    });

                    await studentRecord.save();
                }
            }
        }

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

        const batch = await Batch.findById(id).populate('brand', 'name');
        if (!batch) {
            return res.status(404).json({ message: "Batch not found." });
        }

        // Authorization check - Allow Admin, Owner, Manager, Counsellor, and Academic Coordinator
        const brandId = req.headers['x-brand-id'] || batch.brand?.toString();
        if (!isAdmin(req.user, brandId) && !isOwner(req.user, brandId) && !isManager(req.user, brandId) && !isCounsellor(req.user, brandId) && !isAcademicCoordinator(req.user, brandId)) {
            const userId = (req.user.id || req.user._id).toString();
            const isAssignedInstructor = batch.instructor && batch.instructor.toString() === userId;
            if (!isAssignedInstructor) {
                return res.status(403).json({ message: "Not authorized to view students for this batch." });
            }
        }

        // Extract students from the batch
        const students = batch.students || [];

        // Manually resolve course names for each student if they have a linked studentId
        const studentsWithDetails = await Promise.all(students.map(async (bs) => {
            const bsObj = bs.toObject ? bs.toObject() : bs;
            if (bsObj.studentId) {
                const fullStudent = await Student.findById(bsObj.studentId);
                if (fullStudent) {
                    bsObj.studentDetails = fullStudent;
                    
                    if (fullStudent.coursePreference) {
                        try {
                            const courseRef = fullStudent.coursePreference;
                            const isObjectId = mongoose.Types.ObjectId.isValid(courseRef) && courseRef.toString().length === 24;
                            if (isObjectId) {
                                const brandWithCourse = await Brand.findOne(
                                    { 'courses._id': courseRef },
                                    { 'courses.$': 1 }
                                );
                                if (brandWithCourse && brandWithCourse.courses.length > 0) {
                                    bsObj.courseName = brandWithCourse.courses[0].courseName;
                                }
                            } else {
                                bsObj.courseName = courseRef;
                            }
                        } catch (courseError) {
                            console.error("Error fetching course for student:", bsObj.studentId, courseError);
                        }
                    }
                }
            }
            return bsObj;
        }));

        return res.status(200).json({ students: studentsWithDetails });
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

        // Authorization check - Allow Admin, Owner, Manager, and Academic Coordinator
        const brandId = req.headers['x-brand-id'] || batch.brand?.toString();
        if (!isAdmin(req.user, brandId) && !isOwner(req.user, brandId) && !isManager(req.user, brandId) && !isAcademicCoordinator(req.user, brandId)) {
            const userId = (req.user.id || req.user._id).toString();
            const isAssignedInstructor = batch.instructor && batch.instructor.toString() === userId;
            if (!isAssignedInstructor) {
                return res.status(403).json({ message: "Not authorized to add students to this batch." });
            }
        }

        // Check compatibility if it's a linked student
        if (studentId) {
            const student = await Student.findById(studentId);
            if (!student) {
                return res.status(404).json({ message: "Student record not found." });
            }

            // ENFORCE: Only pending students can be added
            if (student.batchScheduled) {
                return res.status(400).json({ message: "Student is already scheduled in another batch." });
            }

            // ENFORCE: Student must be in the correct module stage
            if (batch.moduleId && student.currentModule?.toString() !== batch.moduleId.toString()) {
                return res.status(400).json({ message: "Student is not in the required progress stage for this batch." });
            }

            // Mark as scheduled
            student.batchScheduled = true;

            // Log to history
            student.history.push({
                status: 'Added to Batch',
                moduleName: batch.batchName,
                metadata: { batchId: batch._id },
                remark: `Student added to batch: ${batch.batchName}`,
                updatedBy: req.user.id,
                updatedOn: new Date()
            });

            await student.save();
        }

        // Create the new student object for the embedded array
        const newStudentEntry = {
            studentId,
            studentName,
            dob,
            phoneNumber,
            parentPhoneNumber,
            joinedAt: new Date()
        };

        batch.students.push(newStudentEntry);
        await batch.save();

        const addedStudent = batch.students[batch.students.length - 1];

        // Notification logic
        try {
            const updaterName = req.user.fullName || "Unknown";
            const notificationData = {
                userName: updaterName,
                action: 'added student to',
                entityName: `batch ${batch.batchName}`,
                module: 'Batch Management',
                actionUrl: `/batch-management?batchId=${batch._id}`,
                metadata: { batchId: batch._id, studentId: addedStudent._id },
                timestamp: new Date().toISOString()
            };

            emitNotification({
                brandId: batch.brand,
                notification: notificationData
            });
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
        }

        return res.status(201).json({ message: "Student added to batch successfully.", student: addedStudent });
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

        const batch = await Batch.findOne({ "students._id": id });
        if (!batch) {
            return res.status(404).json({ message: "Batch student not found." });
        }
        
        // Find the student in the embedded array
        const studentIndex = batch.students.findIndex(s => s._id.toString() === id);
        if (studentIndex === -1) {
            return res.status(404).json({ message: "Student not found in this batch." });
        }

        // Update student data
        const student = batch.students[studentIndex];
        Object.keys(updateData).forEach(key => {
            if (student[key] !== undefined) {
                student[key] = updateData[key];
            }
        });

        await batch.save();

        return res.status(200).json({ message: "Student updated successfully.", student: batch.students[studentIndex] });
    } catch (error) {
        console.error("Error updating batch student:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Remove student from batch
export const removeStudentFromBatch = async (req, res) => {
    try {
        const { studentId: id } = req.params; // DB _id

        const batch = await Batch.findOne({ "students._id": id });
        if (!batch) {
            return res.status(404).json({ message: "Batch student not found." });
        }

        // Find student in the embedded array
        const studentIndex = batch.students.findIndex(s => s._id.toString() === id);
        if (studentIndex === -1) {
            return res.status(404).json({ message: "Student not found in this batch." });
        }

        const student = batch.students[studentIndex];
        const linkedStudentId = student.studentId;

        // Remove from array
        batch.students.splice(studentIndex, 1);
        await batch.save();

        // Check if student is in any other batch
        if (linkedStudentId) {
            const studentRecord = await Student.findById(linkedStudentId);
            if (studentRecord) {
                // Check if this student exists in ANY other batch's students array
                const otherBatchCount = await Batch.countDocuments({
                    'students.studentId': linkedStudentId,
                    _id: { $ne: batch._id }
                });

                if (otherBatchCount === 0) {
                    studentRecord.batchScheduled = false;
                }

                // Log to history
                studentRecord.history.push({
                    status: 'Removed from Batch',
                    moduleName: batch.batchName,
                    metadata: { batchId: batch._id },
                    remark: `Student removed from batch: ${batch.batchName}`,
                    updatedBy: req.user.id,
                    updatedOn: new Date()
                });

                await studentRecord.save();
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
        const userId = req.user.id || req.user._id;

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
            const [y, m, d] = providedDate.split('-').map(Number);
            attendanceDate = new Date(y, m - 1, d);
        } else {
            attendanceDate = new Date();
        }

        // Normalize to local midnight (IST) for consistency with server/user calendar
        attendanceDate.setHours(0, 0, 0, 0);

        if (isNaN(attendanceDate.getTime())) {
            return res.status(400).json({ message: "Invalid date provided." });
        }

        // Check if "Today" is within batch duration
        const batchStart = new Date(batch.startDate);
        batchStart.setHours(0, 0, 0, 0);
        const batchEnd = new Date(batch.expectedEndDate);
        batchEnd.setHours(0, 0, 0, 0);

        const brandId = req.headers['x-brand-id'] || batch.brand?.toString();
        const isAdminUser = isAdmin(req.user, brandId) || isOwner(req.user, brandId) || isManager(req.user, brandId);

        if (!isAdminUser && (attendanceDate < batchStart || attendanceDate > batchEnd)) {
            return res.status(400).json({ message: "Cannot mark attendance: Today is outside the batch duration." });
        }
        // Permission check
        if (isAcademicCoordinator(req.user, brandId)) {
            return res.status(403).json({ message: "Academic coordinators are not authorized to mark attendance." });
        }

        if (!isAdmin(req.user, brandId) && !isOwner(req.user, brandId) && !isManager(req.user, brandId)) {
            // For faculty/instructors
            const userId = (req.user.id || req.user._id).toString();
            const isAssignedInstructor = batch.instructor && batch.instructor.toString() === userId;
            if (!isAssignedInstructor) {
                return res.status(403).json({ message: "Not authorized to mark attendance for this batch." });
            }

            // Instructors CANNOT mark attendance for past/future dates. Always TODAY.
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (attendanceDate.getTime() !== today.getTime()) {
                return res.status(403).json({ message: "Only Owners and Managers can mark attendance for past or future dates." });
            }
        }

        // Holiday/Sunday Check
        const isSunday = attendanceDate.getDay() === 0;
        const holiday = await Holiday.findOne({ brand: batch.brand, date: attendanceDate });

        if (isSunday || holiday) {
            // If it's a holiday or sunday, only allow "Holiday" or "Week Off" status unless Owner/Manager
            if (!isAdmin(req.user, brandId) && !isOwner(req.user, brandId) && !isManager(req.user, brandId)) {
                const requiredStatus = isSunday ? "Week Off" : "Holiday";
                const invalidRecord = records.find(r => r.status !== requiredStatus);
                if (invalidRecord) {
                    return res.status(400).json({ message: `Cannot mark attendance as 'Present' on a ${requiredStatus}.` });
                }
            }
        }

        // Use student names from the batch's embedded students array
        const studentNameMap = new Map(batch.students.map(s => [s._id.toString(), s.studentName]));

        const processedRecords = records.map(rec => ({
            ...rec,
            studentName: rec.studentName || studentNameMap.get(rec.studentId?.toString()) || "Unknown"
        }));

        // Create or update attendance record in the embedded array
        const attendanceIndex = batch.attendance.findIndex(a => a.date.getTime() === attendanceDate.getTime());
        
        if (attendanceIndex !== -1) {
            // Update existing record
            batch.attendance[attendanceIndex].markedBy = userId;
            batch.attendance[attendanceIndex].records = processedRecords;
        } else {
            // Add new record
            batch.attendance.push({
                date: attendanceDate,
                markedBy: userId,
                records: processedRecords
            });
        }

        await batch.save();

        const attendance = batch.attendance.find(a => a.date.getTime() === attendanceDate.getTime());

        // Notification logic
        try {
            const updaterName = req.user.fullName || "Unknown";
            const notificationData = {
                userName: updaterName,
                action: 'marked attendance for',
                entityName: `batch ${batch.batchName}`,
                module: 'Batch Management',
                actionUrl: `/batch-management?batchId=${batch._id}`,
                metadata: { batchId: batch._id, date: attendanceDate },
                timestamp: new Date().toISOString()
            };

            emitNotification({
                brandId: batch.brand,
                notification: notificationData
            });
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
        }

        // Trigger Automated Inactivation Check for students marked as Absent
        const absentStudents = records.filter(r => r.status === 'Absent').map(r => r.studentId);
        if (absentStudents.length > 0) {
            for (const studentRefId of absentStudents) {
                // Find studentId (Student model _id) from the embedded students array
                const batchStudent = batch.students.find(s => s._id.toString() === studentRefId.toString());
                if (batchStudent && batchStudent.studentId) {
                    await checkAndInactivateStudent(batchStudent.studentId, brandId, userId);
                }
            }
        }

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

        const batch = await Batch.findById(id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found." });
        }

        // Authorization check
        const brandId = req.headers['x-brand-id'] || batch.brand?.toString();
        if (!isAdmin(req.user, brandId) && !isOwner(req.user, brandId) && !isManager(req.user, brandId) && !isCounsellor(req.user, brandId)) {
            const userId = (req.user.id || req.user._id).toString();
            const isAssignedInstructor = batch.instructor && batch.instructor.toString() === userId;
            if (!isAssignedInstructor) {
                return res.status(403).json({ message: "Not authorized to view attendance for this batch." });
            }
        }

        let attendance = batch.attendance || [];

        if (date) {
            const [y, m, d] = date.split('-').map(Number);
            const searchDate = new Date(y, m - 1, d);
            searchDate.setHours(0, 0, 0, 0);
            attendance = attendance.filter(a => a.date.getTime() === searchDate.getTime());
        } else if (month && year) {
            const m = parseInt(month) - 1;
            const y = parseInt(year);
            const startDate = new Date(y, m, 1);
            const endDate = new Date(y, m + 1, 0);
            
            attendance = attendance.filter(a => a.date >= startDate && a.date <= endDate);
        }

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

        const students = batch.students || [];

        let attendance = batch.attendance || [];

        if (month && year) {
            const m = parseInt(month) - 1;
            const y = parseInt(year);

            // Use local server time (IST) for consistent filtering
            const startDate = new Date(y, m, 1, 0, 0, 0, 0);
            const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);

            attendance = attendance.filter(a => a.date >= startDate && a.date <= endDate);
        } else {
            // Default to current month
            const now = new Date();
            const m = now.getMonth();
            const y = now.getFullYear();

            const startDate = new Date(y, m, 1, 0, 0, 0, 0);
            const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);

            attendance = attendance.filter(a => a.date >= startDate && a.date <= endDate);
        }

        // No query needed as we already filtered the array

        const holidayQuery = { brand: batch.brand };
        const now = new Date();
        const m = month ? parseInt(month) - 1 : now.getMonth();
        const y = year ? parseInt(year) : now.getFullYear();
        holidayQuery.date = {
            $gte: new Date(y, m, 1),
            $lte: new Date(y, m + 1, 0, 23, 59, 59, 999)
        };
        const holidays = await Holiday.find(holidayQuery).sort({ date: 1 });

        return res.status(200).json({
            batch: {
                batchName: batch.batchName,
                subject: batch.subject,
                instructorName: batch.instructorName
            },
            students,
            attendance,
            holidays
        });
    } catch (error) {
        console.error("Error fetching public attendance:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Merge student attendance
export const mergeStudentAttendance = async (req, res) => {
    try {
        const { id: batchId } = req.params;
        const { sourceId, targetId } = req.body;

        if (sourceId === targetId) {
            return res.status(400).json({ message: "Source and Target students must be different." });
        }

        if (!mongoose.Types.ObjectId.isValid(batchId) || !mongoose.Types.ObjectId.isValid(sourceId) || !mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(400).json({ message: "Invalid ID format provided." });
        }

        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(404).json({ message: "Batch not found." });

        // Authorization check
        const brandId = req.headers['x-brand-id'] || batch.brand?.toString();
        if (!isAdmin(req.user, brandId) && !isOwner(req.user, brandId) && !isManager(req.user, brandId)) {
            const userId = (req.user.id || req.user._id).toString();
            const isAssignedInstructor = batch.instructor && batch.instructor.toString() === userId;
            if (!isAssignedInstructor) {
                return res.status(403).json({ message: "Not authorized to perform this action." });
            }
        }

        const sourceStudentIndex = batch.students.findIndex(s => s._id.toString() === sourceId);
        const targetStudentIndex = batch.students.findIndex(s => s._id.toString() === targetId);

        if (sourceStudentIndex === -1 || targetStudentIndex === -1) {
            return res.status(404).json({ message: "One or both student records were not found in this batch." });
        }

        const sourceStudent = batch.students[sourceStudentIndex];
        const targetStudent = batch.students[targetStudentIndex];

        // Merge attendance records inside the batch
        let updatedCount = 0;
        if (batch.attendance && Array.isArray(batch.attendance)) {
            batch.attendance.forEach(attDoc => {
                if (!attDoc.records || !Array.isArray(attDoc.records)) return;

                const sourceRecIndex = attDoc.records.findIndex(r => r.studentId && r.studentId.toString() === sourceId);
                const targetRecIndex = attDoc.records.findIndex(r => r.studentId && r.studentId.toString() === targetId);

                if (sourceRecIndex !== -1) {
                    const sourceRec = attDoc.records[sourceRecIndex];
                    if (targetRecIndex !== -1) {
                        // Both exist: Merge
                        const targetRec = attDoc.records[targetRecIndex];
                        if (sourceRec.status === 'Present') targetRec.status = 'Present';
                        if (sourceRec.remarks) {
                            targetRec.remarks = targetRec.remarks
                                ? `${targetRec.remarks} | ${sourceRec.remarks}`
                                : sourceRec.remarks;
                        }
                        // Remove source record
                        attDoc.records.splice(sourceRecIndex, 1);
                    } else {
                        // Only source exists: Transfer it to target
                        sourceRec.studentId = targetStudent._id;
                        sourceRec.studentName = targetStudent.studentName;
                    }
                    updatedCount++;
                }

                // Ensure markedBy is present if it was missing (for history/compliance)
                if (!attDoc.markedBy) {
                    attDoc.markedBy = req.user.id || req.user._id;
                }
            });
        }

        // Finally remove the source student from the batch
        const sourceLinkedStudentId = sourceStudent.studentId;
        batch.students.splice(sourceStudentIndex, 1);
        
        await batch.save();

        // If source was a linked student, check if it's in any other batch
        if (sourceLinkedStudentId) {
            const otherBatchCount = await Batch.countDocuments({
                'students.studentId': sourceLinkedStudentId,
                _id: { $ne: batch._id }
            });
            if (otherBatchCount === 0) {
                await Student.findByIdAndUpdate(sourceLinkedStudentId, { batchScheduled: false });
            }
        }

        return res.status(200).json({
            message: "Attendance merged successfully and source student removed from batch.",
            details: `Updated ${updatedCount} attendance records within the batch.`
        });
    } catch (error) {
        console.error("Critical Merge Error:", error);
        return res.status(500).json({
            message: "Internal server error during attendance merge",
            error: error.message,
            hint: "Please ensure all attendance records for this batch have valid student references."
        });
    }
};
// Get next batch ID for preview
export const getNextBatchId = async (req, res) => {
    try {
        const { brandId, startDate } = req.query;

        if (!brandId) {
            return res.status(400).json({ message: "Brand ID is required." });
        }

        const nextBatchId = await generateBatchId(brandId, startDate || new Date());

        return res.status(200).json({ nextBatchId });
    } catch (error) {
        console.error("Error generating next batch ID:", error);
        return res.status(500).json({ message: error.message || "Server error" });
    }
};
