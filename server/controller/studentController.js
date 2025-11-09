import studentModel from "../model/studentModel.js";
import customerModel from "../model/customerModel.js";
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
      studentId,
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
      enrollmentDate,
      leadId
    } = req.body;

    // Validation
    if (!studentId || !fullName || !email || !phone1 || !address || !aadharCardNumber || !coursePreference || !enrollmentDate || !leadId) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // Validate Aadhar card number
    if (!/^\d{12}$/.test(aadharCardNumber)) {
      return res.status(400).json({ message: "Aadhar Card Number must be 12 digits." });
    }

    // Check if student ID already exists
    const existingStudent = await studentModel.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ message: "Student with this ID already exists." });
    }

    // Check if lead exists and is converted
    const lead = await customerModel.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found." });
    }

    if (lead.leadStatus !== 'converted') {
      return res.status(400).json({ 
        message: `Only converted leads can be used to create students. Current lead status is: ${lead.leadStatus}` 
      });
    }

    // Handle photo upload
    let photoPath = null;
    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`;
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
      enrollmentDate: new Date(enrollmentDate),
      leadId,
      createdBy: req.user.fullName || req.user.email
    });

    await newStudent.save();

    return res.status(201).json({ 
      message: "Student created successfully.", 
      student: newStudent 
    });
  } catch (error) {
    console.error("Create student error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await studentModel.find().sort({ createdAt: -1 }).populate('leadId', 'fullName email');
    return res.status(200).json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get single student by ID
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await studentModel.findById(id).populate('leadId', 'fullName email');
    
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    return res.status(200).json({ student });
  } catch (error) {
    console.error("Error fetching student:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const student = await studentModel.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key === 'dob' || key === 'enrollmentDate') {
        student[key] = updateData[key] ? new Date(updateData[key]) : null;
      } else if (key !== '_id' && key !== '__v') {
        student[key] = updateData[key];
      }
    });

    await student.save();

    return res.status(200).json({ 
      message: "Student updated successfully.", 
      student 
    });
  } catch (error) {
    console.error("Update student error:", error);
    return res.status(500).json({ message: "Server error" });
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