import studentModel from "../model/studentModel.js";
import customerModel from "../model/customerModel.js";
import Brand from "../model/brandModel.js";
import * as mongoose from "mongoose";
import { generateStudentId } from "../helpers/studentIdGenerator.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

// Configure multer for file uploads
import { getUploadDir, getUploadUrl } from "../utils/uploadHelper.js";
import { emitNotification } from '../realtime/socket.js';
import { logActivity } from "../utils/activityLogger.js";
import fs from "fs";
import { generateInvoiceInternal } from "../helpers/invoiceHelper.js";

/**
 * Look up an embedded course sub-document by its _id across all Brand documents.
 * Returns the course object or null.
 */
async function findCourseById(courseId) {
  if (!courseId) return null;
  try {
    const brand = await Brand.findOne({ "courses._id": courseId }, { "courses.$": 1 });
    return brand ? brand.courses[0] : null;
  } catch {
    return null;
  }
}

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
      brandId,
      modules,
      feeBreakdown,
      complimentaryModules,
      remarks
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
      brand: brandId,
      modules: modules ? (typeof modules === 'string' ? JSON.parse(modules) : modules) : [],
      complimentaryModules: complimentaryModules ? (typeof complimentaryModules === 'string' ? JSON.parse(complimentaryModules) : complimentaryModules) : [],
      remarks: remarks || "",
      history: [{
        status: 'Admission Taken',
        moduleName: 'Admission',
        metadata: { type: 'admission' },
        remark: 'Student created and admitted.',
        updatedBy: req.user.id,
        updatedOn: new Date()
      }],
      feeBreakdown: feeBreakdown ? (typeof feeBreakdown === 'string' ? JSON.parse(feeBreakdown) : feeBreakdown) : []
    });

    await newStudent.save();

    // Auto-generate invoice
    try {
      const invoiceItems = newStudent.feeBreakdown.map(item => ({
        description: item.name || (item.type === 'course' ? 'Course Fee' : 'Module Fee'),
        quantity: 1,
        rate: item.basePrice || 0,
        amount: item.finalAmount || 0
      }));

      const invoiceData = {
        customer: newStudent._id,
        customerModel: 'Student',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: invoiceItems,
        subTotal: newStudent.totalCourseValue,
        tax: 0,
        discount: newStudent.discountAmount,
        totalAmount: newStudent.finalAmount,
        status: 'Draft',
        brand: brandId,
        createdBy: req.user.id
      };

      await generateInvoiceInternal(invoiceData);
    } catch (invoiceError) {
      console.error("Error auto-generating invoice:", invoiceError);
      // We don't want to fail student creation if invoice generation fails, 
      // but we should probably log it or notify.
    }

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
        avatar: req.user.avatar,
        action: 'created new student',
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

    // Log activity
    await logActivity(req.user.id, 'CREATE', 'Students', {
      entityId: newStudent._id,
      description: `Created student: ${newStudent.fullName}`,
      brandId: newStudent.brand
    });

    await newStudent.populate('history.updatedBy', 'fullName email');

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
    let query = { ...req.brandFilter }; // Apply brand filter
    const headerBrandId = req.headers['x-brand-id'];

    // If viewing All Brands and not a Global Admin, restrict to managed brands only
    if (!headerBrandId && !req.user.isAdmin) {
      const { getManagedBrandIds } = await import('../utils/roleHelpers.js');
      const managedBrandIds = getManagedBrandIds(req.user);
      query.brand = { $in: managedBrandIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Filter for batch availability if requested
    if (req.query.availableForBatch === 'true') {
      query.batchScheduled = { $ne: true };
    }

    // Add brands filter if specifically requested (e.g. from Lab module)
    if (req.query.brands) {
      const brandIds = req.query.brands.split(',').filter(Boolean);
      if (brandIds.length > 0) {
        const objectIdBrands = brandIds.map(id => new mongoose.Types.ObjectId(id));

        // If query.brand already exists (from middleware), we intersect it
        if (query.brand) {
          if (query.brand.$in) {
            const authorizedIds = query.brand.$in.map(id => id.toString());
            const filtered = objectIdBrands.filter(id => authorizedIds.includes(id.toString()));
            query.brand = { $in: filtered };
          } else {
            const authId = query.brand.toString();
            if (objectIdBrands.some(id => id.toString() === authId)) {
              query.brand = authId;
            } else {
              query.brand = { $in: [] }; // No match
            }
          }
        } else {
          query.brand = { $in: objectIdBrands };
        }
      }
    }

    // Add search filter if provided
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { fullName: searchRegex },
        { studentId: searchRegex }
      ];
    }
    
    // Filter by current module if provided
    if (req.query.currentModule) {
      query.currentModule = req.query.currentModule;
    }

    const students = await studentModel.find(query)
      .sort({ createdAt: -1 })
      .populate('leadId', 'fullName email')
      .populate('history.updatedBy', 'fullName email');
    // Populate course details for each student
    const studentsWithCourseDetails = await Promise.all(students.map(async (student) => {
      const studentObj = student.toObject();

      // Populate primary course details
      if (student.coursePreference) {
        const course = await findCourseById(student.coursePreference);
        studentObj.courseDetails = course;
      }

      // Populate additional courses details
      if (student.additionalCourses && student.additionalCourses.length > 0) {
        studentObj.additionalCourseDetails = await Promise.all(
          student.additionalCourses.map(courseId => findCourseById(courseId))
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
      const course = await findCourseById(student.coursePreference);
      studentObj.courseDetails = course;
    }

    // Populate additional courses details
    if (student.additionalCourses && student.additionalCourses.length > 0) {
      studentObj.additionalCourseDetails = await Promise.all(
        student.additionalCourses.map(courseId => findCourseById(courseId))
      );
      studentObj.additionalCourseDetails = studentObj.additionalCourseDetails.filter(c => c !== null);
    }

    // Fetch Batch History and Attendance from all Batches
    const Batch = (await import('../model/batchModel.js')).default;

    // Find all batches where this student is enrolled
    const allBatches = await Batch.find({ 'students.studentId': id });

    let totalAggregatedWorkingDays = 0;
    let totalAggregatedAbsents = 0;

    const batchHistory = await Promise.all(allBatches.map(async (batch) => {
      // Find the specific enrollment record for this student in the batch
      const enrollment = batch.students.find(s => s.studentId && s.studentId.toString() === id);
      if (!enrollment) return null;

      const enrollmentInternalId = enrollment._id.toString();

      // Attendance records for this student in this batch
      const studentAttendanceDocs = (batch.attendance || []).filter(att => 
        att.records.some(rec => rec.studentId && rec.studentId.toString() === enrollmentInternalId)
      );

      const today = new Date();
      const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const batchStart = new Date(batch.startDate);
      const batchStartNormalized = new Date(batchStart.getFullYear(), batchStart.getMonth(), batchStart.getDate());

      // Create a status map for quick lookup
      const studentStatusMap = {};
      let earliestMarkDate = null;
      
      studentAttendanceDocs.forEach(att => {
        const d = new Date(att.date);
        const record = att.records.find(rec => rec.studentId && rec.studentId.toString() === enrollmentInternalId);
        if (record) {
          studentStatusMap[d.toDateString()] = record.status;
          if (!earliestMarkDate || d < earliestMarkDate) {
            earliestMarkDate = d;
          }
        }
      });

      const studentJoinedDate = new Date(enrollment.joinedAt || student.enrollmentDate);
      studentJoinedDate.setHours(0, 0, 0, 0);

      // Effective Start is earliest of Join Date or First Mark, but at least Batch Start
      let effectiveStart = earliestMarkDate && earliestMarkDate < studentJoinedDate ? earliestMarkDate : studentJoinedDate;
      effectiveStart = new Date(effectiveStart.getFullYear(), effectiveStart.getMonth(), effectiveStart.getDate());
      if (effectiveStart < batchStartNormalized) effectiveStart = batchStartNormalized;

      let absentCount = 0;
      let totalWorkingDays = 0;
      const oneDay = 24 * 60 * 60 * 1000;

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
        attendanceDetails: studentAttendanceDocs.map(att => {
          const record = att.records.find(rec => rec.studentId && rec.studentId.toString() === enrollmentInternalId);
          return {
            date: att.date,
            status: record?.status,
            remarks: record?.remarks
          };
        }).sort((a, b) => new Date(b.date) - new Date(a.date)),
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
      // Delete old photo if it exists
      if (student.photo) {
        const fileName = student.photo.split('/').pop();
        const filePath = path.join(getUploadDir('student_photos'), fileName);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkError) {
            console.error('Error unlinking old student photo:', unlinkError);
          }
        }
      }
      updateData.photo = getUploadUrl('student_photos', req.file.filename);
    }

    // Parse additional courses, modules, and feeBreakdown if provided as JSON string
    const jsonFields = ['additionalCourses', 'modules', 'feeBreakdown', 'complimentaryModules'];
    jsonFields.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          console.warn(`Failed to parse ${field} in update:`, e);
        }
      }
    });

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

    // Log activity
    await logActivity(req.user.id, 'UPDATE', 'Students', {
      entityId: student._id,
      description: `Updated student: ${student.fullName}`,
      brandId: student.brand
    });

    await student.populate('history.updatedBy', 'fullName email');
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

    await student.populate('history.updatedBy', 'fullName email');
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

    const student = await studentModel.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const leadId = student.leadId;

    // Delete photo from disk if it exists
    if (student.photo) {
      const fileName = student.photo.split('/').pop();
      const filePath = path.join(getUploadDir('student_photos'), fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.error('Error unlinking student photo during deletion:', unlinkError);
        }
      }
    }

    await studentModel.findByIdAndDelete(id);

    // Reset lead isAdmissionTaken flag if leadId exists
    if (leadId) {
      try {
        await customerModel.findByIdAndUpdate(leadId, {
          isAdmissionTaken: false,
          $push: {
            remarks: {
              updatedOn: new Date(),
              handledBy: req.user.fullName || "System",
              remark: `Student record (${student.studentId}) deleted. Lead reset to unconverted status.`,
              leadStatus: 'converted', // Keep status for consistent logs but flag is now false
              isUnread: false
            }
          }
        });
      } catch (leadUpdateError) {
        console.error('Error updating lead status during student deletion:', leadUpdateError);
        // We don't fail the whole request if the lead update fails, but we log it
      }
    }

    // Notification Logic
    try {
      const notificationData = {
        userName: req.user.fullName || "Admin",
        action: 'deleted student record',
        entityName: student.fullName,
        module: 'Student Management',
        actionUrl: '/student-management',
        metadata: { studentId: id },
        timestamp: new Date().toISOString()
      };

      if (student.brand) {
        emitNotification({
          brandId: student.brand,
          notification: notificationData
        });
      }
    } catch (notifError) {
      console.error('Error sending student delete notification:', notifError);
    }

    // Log activity
    await logActivity(req.user.id, 'DELETE', 'Students', {
      entityId: id,
      description: `Deleted student: ${student.fullName}`,
      brandId: student.brand
    });

    return res.status(200).json({ message: "Student deleted successfully." });
  } catch (error) {
    console.error("Delete student error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update student current module (Kanban stage)
export const updateStudentModule = async (req, res) => {
  try {
    const { id } = req.params;
    let { moduleId, previousModuleStatus, remark: userRemark } = req.body;

    const student = await studentModel.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    let resolvedModule = null;

    // Handle placeholder stages from Kanban (e.g. "stage_project_stage")
    if (moduleId && typeof moduleId === 'string' && moduleId.startsWith('stage_')) {
      const stageIdToName = {
        'stage_project_stage': "Project Stage",
        'stage_project_review': "Project Review",
        'stage_certificate_process': "Certificate Process",
        'stage_graduation': "Graduation"
      };
      
      const stageName = stageIdToName[moduleId];
      if (stageName) {
        const brandId = student.brand;
        const brand = await Brand.findById(brandId);
        
        if (brand) {
          let module = brand.modules.find(m => m.name.toLowerCase() === stageName.toLowerCase());
          if (!module) {
            brand.modules.push({
              name: stageName,
              duration: "0",
              mode: "offline",
              syllabus: "",
              isActive: true,
              order: (brand.modules.length > 0 ? Math.max(...brand.modules.map(m => m.order || 0)) + 1 : 0)
            });
            await brand.save();
            module = brand.modules[brand.modules.length - 1];
          }
          moduleId = module._id;
          resolvedModule = module;
        } else {
          console.error(`Brand not found for student ${id}: ${brandId}`);
        }
      } else {
        console.error(`Unknown stage placeholder in mapping: ${moduleId}`);
      }
    }

    // FINAL GUARD: Ensure moduleId is a valid ObjectId string (24 hex chars) or null
    if (moduleId && (typeof moduleId === 'string' && !/^[0-9a-fA-F]{24}$/.test(moduleId))) {
        moduleId = null; // Revert to pending if we can't resolve the stage
    }

    // Track module completion history and detailed timeline
    if (student.currentModule?.toString() !== moduleId?.toString()) {
        const prevModuleId = student.currentModule;
        
        // Fetch brand to resolve module names for history logs
        const brandDoc = await Brand.findById(student.brand);
        let prevModuleName = 'Pending/No Module';
        let newModuleName = 'Pending/No Module';
        
        if (brandDoc && brandDoc.modules) {
            if (prevModuleId) {
                const pMod = brandDoc.modules.find(m => m._id.toString() === prevModuleId.toString());
                if (pMod) prevModuleName = pMod.name;
            }
            if (moduleId) {
                const nMod = brandDoc.modules.find(m => m._id.toString() === moduleId.toString());
                if (nMod) newModuleName = nMod.name;
            }
        }

        if (!student.completedModules) {
            student.completedModules = [];
        }
        if (!student.history) {
            student.history = [];
        }

        if (prevModuleId) {
            const isActuallyCompleted = previousModuleStatus === 'Completed';
            
            if (isActuallyCompleted) {
                if (!student.completedModules.some(id => id.toString() === prevModuleId.toString())) {
                    student.completedModules.push(prevModuleId);
                }
            }

            // Use user-provided remark or fallback
            // Determine the final status for the history stack
            let finalStatus = 'Started';
            if (isActuallyCompleted) {
                finalStatus = 'Completed';
            } else if (previousModuleStatus === 'Partially Completed') {
                finalStatus = 'Partially Completed';
            } else if (previousModuleStatus === 'Pending') {
                finalStatus = 'Pending';
            }

            const finalRemark = userRemark || `${prevModuleName} marked as ${finalStatus.toLowerCase()}`;

            student.history.push({
                status: finalStatus,
                moduleName: prevModuleName,
                metadata: { moduleId: prevModuleId },
                remark: finalRemark,
                updatedBy: req.user.id,
                updatedOn: new Date()
            });
        }

        if (moduleId) {
            // RESCHEDULING LOGIC: If moving back to a completed module, remove it from completed list
            const completedIndex = student.completedModules.findIndex(id => id.toString() === moduleId.toString());
            if (completedIndex > -1) {
                student.completedModules.splice(completedIndex, 1);
                
                // Log the rescheduling event explicitly
                student.history.push({
                    status: 'Rescheduled',
                    moduleName: newModuleName,
                    metadata: { moduleId: moduleId },
                    remark: userRemark || `${newModuleName} rescheduled`,
                    updatedBy: req.user.id,
                    updatedOn: new Date()
                });
            } else {
                // Standard start log if not already completed
                student.history.push({
                    status: 'Started',
                    moduleName: newModuleName,
                    metadata: { moduleId: moduleId },
                    remark: `${newModuleName} started`,
                    updatedBy: req.user.id,
                    updatedOn: new Date()
                });
            }
        }
    }

    student.currentModule = moduleId || null;
    await student.save();

    // Log activity
    await logActivity(req.user.id, 'UPDATE', 'Students', {
      entityId: student._id,
      description: `Moved student ${student.fullName} to module stage: ${moduleId || 'Pending'}`,
      brandId: student.brand
    });

    // Populate history before returning
    await student.populate('history.updatedBy', 'fullName email');

    return res.status(200).json({
      message: "Student progress updated successfully.",
      student,
      newModule: resolvedModule
    });
  } catch (error) {
    console.error("Update student module error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};