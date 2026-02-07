import studentModel from "../model/studentModel.js";
import customerModel from "../model/customerModel.js";
import courseModel from "../model/courseModel.js";
import { generateStudentId } from "../helpers/studentIdGenerator.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

// Configure multer for file uploads
import { getUploadDir, getUploadUrl } from "../utils/uploadHelper.js";
import { emitNotification } from '../realtime/socket.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadDir('student_photos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "student-" + uuidv4() + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// Middleware to handle single file upload
export const uploadStudentPhoto = upload.single("photo");

// Create new student
export const createStudent = async (req, res) => {
  try {
    // Handle form data fields
    const {
      fullName,
      email,
      phone1,
      phone2,
      gender,
      dob,
      place,
      otherPlace,
      address,
      aadharCardNumber,
      status,
      education,
      coursePreference,
      additionalCourses,
      totalCourseValue,
      discountPercentage,
      discountAmount,
      finalAmount,
      enrollmentDate,
      feeType,
      leadId,
      brandId
    } = req.body;

    // Validation (Removed leadId from mandatory fields)
    if (!fullName || !email || !phone1 || !address || !aadharCardNumber || !coursePreference || !enrollmentDate || !brandId) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // Validate Aadhar card number
    if (!/^\d{12}$/.test(aadharCardNumber)) {
      return res.status(400).json({ message: "Aadhar Card Number must be 12 digits." });
    }

    // Check if lead exists and is converted (Only if leadId is provided)
    if (leadId && leadId !== "no_lead") {
      const lead = await customerModel.findById(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found." });
      }

      if (lead.leadStatus !== 'converted') {
        return res.status(400).json({
          message: `Only converted leads can be used to create students. Current lead status is: ${lead.leadStatus}`
        });
      }
    }

    // Generate Student ID automatically
    const studentId = await generateStudentId(brandId, enrollmentDate);

    // Check if generated student ID already exists (edge case)
    const existingStudent = await studentModel.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ message: "Generated Student ID already exists. Please try again." });
    }

    // Handle photo upload
    let photoPath = null;
    if (req.file) {
      photoPath = getUploadUrl('student_photos', req.file.filename);
    }

    // Parse additional courses if provided as JSON string
    let parsedAdditionalCourses = [];
    if (additionalCourses) {
      try {
        parsedAdditionalCourses = typeof additionalCourses === 'string'
          ? JSON.parse(additionalCourses)
          : additionalCourses;
      } catch (e) {
        // If parsing fails, use as-is
        parsedAdditionalCourses = additionalCourses;
      }
    }

    const newStudent = new studentModel({
      studentId,
      fullName,
      email,
      phone1,
      phone2,
      gender,
      dob: dob ? new Date(dob) : null,
      place,
      otherPlace,
      address,
      aadharCardNumber,
      photo: photoPath,
      status,
      education,
      coursePreference,
      additionalCourses: parsedAdditionalCourses,
      totalCourseValue: parseFloat(totalCourseValue) || 0,
      discountPercentage: parseFloat(discountPercentage) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      finalAmount: parseFloat(finalAmount) || 0,
      enrollmentDate: new Date(enrollmentDate),
      feeType: feeType || 'normal',
      leadId: (leadId && leadId !== "no_lead") ? leadId : null,
      createdBy: req.user.fullName || req.user.email,
      brand: brandId
    });

    await newStudent.save();

    // Mark lead as admission taken and add conversion remark (Only if leadId provided)
    if (leadId && leadId !== "no_lead") {
      await customerModel.findByIdAndUpdate(leadId, {
        isAdmissionTaken: true,
        $push: {
          remarks: {
            updatedOn: new Date(),
            handledBy: req.user.fullName || "System",
            remark: "Admission taken. Lead converted to student.",
            leadStatus: 'converted', // Keep status for consistency in reports
            isUnread: false
          }
        }
      });
    }

    // Notification Logic
    try {
      const creatorName = req.user.fullName || "Unknown";
      const notificationData = {
        userName: creatorName,
        action: 'created student',
        entityName: newStudent.fullName,
        module: 'Student Management',
        actionUrl: `/student-management?studentId=${newStudent._id}`,
        metadata: { studentId: newStudent._id },
        timestamp: new Date().toISOString()
      };

      emitNotification({
        brandId: brandId,
        notification: notificationData
      });
    } catch (notifError) {
      console.error('Error sending student create notification:', notifError);
    }


    return res.status(201).json({
      message: "Student created successfully.",
      student: newStudent
    });
  } catch (error) {
    console.error("Create student error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const query = { ...req.brandFilter }; // Apply brand filter

    // Filter for batch availability if requested
    if (req.query.availableForBatch === 'true') {
      query.batchScheduled = { $ne: true };
    }

    const students = await studentModel.find(query).sort({ createdAt: -1 }).populate('leadId', 'fullName email');
    // Populate course details for each student
    const studentsWithCourseDetails = await Promise.all(students.map(async (student) => {
      const studentObj = student.toObject();

      // Populate primary course details
      if (student.coursePreference) {
        const course = await courseModel.findById(student.coursePreference);
        studentObj.courseDetails = course;
      }

      // Populate additional courses details
      if (student.additionalCourses && student.additionalCourses.length > 0) {
        studentObj.additionalCourseDetails = await Promise.all(
          student.additionalCourses.map(async (courseId) => {
            return await courseModel.findById(courseId);
          })
        );
      }

      return studentObj;
    }));
    return res.status(200).json({ students: studentsWithCourseDetails });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get single student by ID with full batch and attendance history
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await studentModel.findById(id).populate('leadId', 'fullName email').populate('brand', 'name code');

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const studentObj = student.toObject();

    // Populate primary course details
    if (student.coursePreference) {
      const course = await courseModel.findById(student.coursePreference);
      studentObj.courseDetails = course;
    }

    // Populate additional courses details
    if (student.additionalCourses && student.additionalCourses.length > 0) {
      studentObj.additionalCourseDetails = await Promise.all(
        student.additionalCourses.map(async (courseId) => {
          try {
            return await courseModel.findById(courseId);
          } catch (err) {
            console.error(`Error populating additional course ${courseId}:`, err);
            return null;
          }
        })
      );
      // Filter out any null results from failed lookups
      studentObj.additionalCourseDetails = studentObj.additionalCourseDetails.filter(c => c !== null);
    }

    // Fetch Batch History and Attendance
    const BatchStudent = (await import('../model/batchStudentModel.js')).default;
    const Attendance = (await import('../model/attendanceModel.js')).default;

    const batchEnrollments = await BatchStudent.find({ studentId: id }).populate('batchId');

    let totalAggregatedWorkingDays = 0;
    let totalAggregatedAbsents = 0;

    const batchHistory = await Promise.all(batchEnrollments.map(async (enrollment) => {
      const batch = enrollment.batchId;
      if (!batch) return null;

      // Fetch all attendance dates for this batch to identify unmarked days vs days student joined late
      const allBatchAttendance = await Attendance.find({ batchId: batch._id }).select("date records.studentId");
      const batchAttendanceMap = {};
      allBatchAttendance.forEach(doc => {
        const dStr = new Date(doc.date).toDateString();
        batchAttendanceMap[dStr] = {
          wasBatchAttended: true,
          studentsInRecord: new Set(doc.records.map(r => r.studentId?.toString()))
        };
      });

      const today = new Date();
      const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const batchStart = new Date(batch.startDate);
      const batchStartNormalized = new Date(batchStart.getFullYear(), batchStart.getMonth(), batchStart.getDate());

      const attendanceRecords = await Attendance.find({
        batchId: batch._id,
        "records.studentId": enrollment._id,
      }).select("date records.$");

      // Find earliest mark date
      let earliestMarkDate = null;
      const studentStatusMap = {};
      attendanceRecords.forEach((r) => {
        const d = new Date(r.date);
        studentStatusMap[d.toDateString()] = r.records[0]?.status;
        if (!earliestMarkDate || d < earliestMarkDate) {
          earliestMarkDate = d;
        }
      });

      const studentJoinedDate = new Date(enrollment.createdAt);
      studentJoinedDate.setHours(0, 0, 0, 0);

      // Effective Start is earliest of Join Date or First Mark, but at least Batch Start
      let effectiveStart = earliestMarkDate && earliestMarkDate < studentJoinedDate ? earliestMarkDate : studentJoinedDate;
      effectiveStart = new Date(effectiveStart.getFullYear(), effectiveStart.getMonth(), effectiveStart.getDate());
      if (effectiveStart < batchStartNormalized) effectiveStart = batchStartNormalized;

      let absentCount = 0;
      let totalWorkingDays = 0;
      const oneDay = 24 * 60 * 60 * 1000;

      // Loop from the START OF THE BATCH
      const totalDays = Math.max(0, Math.floor((todayNormalized - batchStartNormalized) / oneDay) + 1);

      for (let i = 0; i < totalDays; i++) {
        const d = new Date(batchStartNormalized.getTime() + i * oneDay);
        const dStr = d.toDateString();
        const status = studentStatusMap[dStr];

        let isSession = false;
        let finalStatus = status;

        if (status) {
          if (status !== "Holiday") isSession = true;
        } else if (d >= effectiveStart) {
          isSession = true;
          if (d.getDay() === 0) { // Sunday Rule
            const prevDate = new Date(d.getTime() - oneDay);
            const nextDate = new Date(d.getTime() + oneDay);
            const isPrevInRange = prevDate >= effectiveStart;
            const isNextInRange = nextDate <= todayNormalized;
            const isPrevAbsent = isPrevInRange && studentStatusMap[prevDate.toDateString()] === "Absent";
            const isNextAbsent = isNextInRange && studentStatusMap[nextDate.toDateString()] === "Absent";

            let isSundayAbsent = false;
            if (isPrevInRange && isNextInRange) isSundayAbsent = isPrevAbsent && isNextAbsent;
            else if (isPrevInRange) isSundayAbsent = isPrevAbsent;
            else if (isNextInRange) isSundayAbsent = isNextAbsent;

            finalStatus = isSundayAbsent ? "Absent" : "Present";
          } else {
            finalStatus = "Present";
          }
        }

        if (isSession) {
          totalWorkingDays++;
          if (finalStatus === "Absent") absentCount++;
        }
      }

      totalAggregatedWorkingDays += totalWorkingDays;
      totalAggregatedAbsents += absentCount;

      const attendancePercentage = totalWorkingDays > 0 ? (((totalWorkingDays - absentCount) / totalWorkingDays) * 100).toFixed(2) : "0.00";

      return {
        batchId: batch._id,
        batchName: batch.batchName,
        subject: batch.subject,
        instructorName: batch.instructorName,
        startDate: batch.startDate,
        expectedEndDate: batch.expectedEndDate,
        attendancePercentage,
        attendanceDetails: attendanceRecords.map(r => ({
          date: r.date,
          status: r.records[0]?.status,
          remarks: r.records[0]?.remarks
        })).sort((a, b) => new Date(b.date) - new Date(a.date)),
      };
    }));

    const filteredBatchHistory = batchHistory.filter((b) => b !== null);
    const averageAttendance = totalAggregatedWorkingDays > 0 ? (((totalAggregatedWorkingDays - totalAggregatedAbsents) / totalAggregatedWorkingDays) * 100).toFixed(2) : "0.00";

    return res.status(200).json({
      student: {
        ...studentObj,
        batchHistory: filteredBatchHistory,
        averageAttendance,
      },
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const student = await studentModel.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Exclude studentId and internal fields from update
    delete updateData.studentId;
    delete updateData._id;
    delete updateData.__v;

    // Handle photo upload
    if (req.file) {
      updateData.photo = getUploadUrl('student_photos', req.file.filename);
    }

    // Parse additional courses if provided as JSON string
    if (updateData.additionalCourses) {
      try {
        updateData.additionalCourses = typeof updateData.additionalCourses === 'string'
          ? JSON.parse(updateData.additionalCourses)
          : updateData.additionalCourses;
      } catch (e) {
        // If parsing fails, use as-is or keep existing
        console.warn("Failed to parse additionalCourses in update:", e);
      }
    }

    // Convert dates and numeric fields
    if (updateData.dob) updateData.dob = new Date(updateData.dob);
    if (updateData.enrollmentDate) updateData.enrollmentDate = new Date(updateData.enrollmentDate);

    if (updateData.totalCourseValue) updateData.totalCourseValue = parseFloat(updateData.totalCourseValue) || 0;
    if (updateData.discountPercentage) updateData.discountPercentage = parseFloat(updateData.discountPercentage) || 0;
    if (updateData.discountAmount) updateData.discountAmount = parseFloat(updateData.discountAmount) || 0;
    if (updateData.finalAmount) updateData.finalAmount = parseFloat(updateData.finalAmount) || 0;

    if (updateData.leadId === "" || updateData.leadId === "no_lead") {
      updateData.leadId = null;
    }

    // Apply updates
    Object.keys(updateData).forEach(key => {
      student[key] = updateData[key];
    });

    await student.save();

    // Notification Logic
    try {
      const updaterName = req.user.fullName || "Unknown";
      const notificationData = {
        userName: updaterName,
        action: 'updated student',
        entityName: student.fullName,
        module: 'Student Management',
        actionUrl: `/student-management?studentId=${student._id}`,
        metadata: { studentId: student._id },
        timestamp: new Date().toISOString()
      };

      emitNotification({
        brandId: student.brand,
        notification: notificationData
      });
    } catch (notifError) {
      console.error('Error sending student update notification:', notifError);
    }

    return res.status(200).json({
      message: "Student updated successfully.",
      student
    });
  } catch (error) {
    console.error("Update student error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

// Update only enrollment date
export const updateEnrollmentDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { enrollmentDate } = req.body;

    if (!enrollmentDate) {
      return res.status(400).json({ message: "Enrollment date is required" });
    }

    const student = await studentModel.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.enrollmentDate = new Date(enrollmentDate);
    await student.save();

    return res.status(200).json({
      message: "Enrollment date updated successfully",
      student
    });
  } catch (error) {
    console.error("Update enrollment date error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get next student ID for preview
export const getNextStudentId = async (req, res) => {
  try {
    const { brandId, enrollmentDate } = req.query;

    if (!brandId || !enrollmentDate) {
      return res.status(400).json({ message: "Brand ID and Enrollment Date are required." });
    }

    const nextStudentId = await generateStudentId(brandId, enrollmentDate);

    return res.status(200).json({ nextStudentId });
  } catch (error) {
    console.error("Error generating next student ID:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await studentModel.findByIdAndDelete(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    return res.status(200).json({ message: "Student deleted successfully." });
  } catch (error) {
    console.error("Delete student error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};