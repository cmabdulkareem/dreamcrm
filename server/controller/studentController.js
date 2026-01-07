import studentModel from "../model/studentModel.js";
import customerModel from "../model/customerModel.js";
import courseModel from "../model/courseModel.js";
import { generateStudentId } from "../helpers/studentIdGenerator.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
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
      photoPath = `/uploads/${req.file.filename}`;
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
      leadId: (leadId && leadId !== "no_lead") ? leadId : null,
      createdBy: req.user.fullName || req.user.email,
      brand: brandId
    });

    await newStudent.save();

    // Mark lead as admission taken (Only if leadId provided)
    if (leadId && leadId !== "no_lead") {
      await customerModel.findByIdAndUpdate(leadId, { isAdmissionTaken: true });
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

    const batchHistory = await Promise.all(batchEnrollments.map(async (enrollment) => {
      if (!enrollment.batchId) return null;

      const batch = enrollment.batchId;

      // Fetch attendance records for this student in this batch
      const attendanceRecords = await Attendance.find({
        batchId: batch._id,
        'records.studentId': enrollment._id // Link is via BatchStudent ID in records
      }).select('date records.$');

      const attendanceData = attendanceRecords.map(record => ({
        date: record.date,
        status: record.records[0]?.status,
        remarks: record.records[0]?.remarks
      }));

      const totalClasses = attendanceRecords.length;
      const presentCount = attendanceData.filter(r => r.status === 'Present').length;
      const attendancePercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;

      return {
        batchId: batch._id,
        batchName: batch.batchName,
        subject: batch.subject,
        instructorName: batch.instructorName,
        startDate: batch.startDate,
        expectedEndDate: batch.expectedEndDate,
        attendancePercentage,
        attendanceDetails: attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date))
      };
    }));

    studentObj.batchHistory = batchHistory.filter(b => b !== null);

    return res.status(200).json({ student: studentObj });
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
      updateData.photo = `/uploads/${req.file.filename}`;
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

    return res.status(200).json({
      message: "Student updated successfully.",
      student
    });
  } catch (error) {
    console.error("Update student error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
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