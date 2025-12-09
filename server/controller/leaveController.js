import leaveModel from '../model/leaveModel.js';
import { hasAdminOrManagerOrCounsellorAccess } from '../utils/roleHelpers.js';

// Generate unique ticket number
const generateTicketNumber = async () => {
  let ticketNumber;
  let isUnique = false;

  while (!isUnique) {
    // Generate ticket: LR + YYYYMMDD + random 6 digits
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(100000 + Math.random() * 900000); // 6 digit random number
    ticketNumber = `LR${year}${month}${day}${random}`;

    // Check if ticket number already exists
    const existing = await leaveModel.findOne({ ticketNumber });
    if (!existing) {
      isUnique = true;
    }
  }

  return ticketNumber;
};

// Get all leaves
export const getAllLeaves = async (req, res) => {
  try {
    const query = { ...req.brandFilter };
    const leaves = await leaveModel.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      leaves: leaves || []
    });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      leaves: []
    });
  }
};

// Get single leave by ID
export const getLeaveById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid leave ID format" });
    }

    const leave = await leaveModel.findById(id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found." });
    }

    return res.status(200).json({
      success: true,
      leave
    });
  } catch (error) {
    console.error("Error fetching leave:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Create new leave request
export const createLeave = async (req, res) => {
  try {
    const {
      employeeName,
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason
    } = req.body;

    // Validate required fields
    if (!employeeName || !employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        message: "All fields are required: employeeName, employeeId, leaveType, startDate, endDate, and reason"
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (start > end) {
      return res.status(400).json({ message: "Start date cannot be after end date" });
    }

    // Check if start date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return res.status(400).json({ message: "Start date cannot be in the past" });
    }

    // Generate unique ticket number
    const ticketNumber = await generateTicketNumber();

    const newLeave = new leaveModel({
      ticketNumber,
      employeeName: employeeName.trim(),
      employeeId: employeeId.trim(),
      leaveType,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
      brand: req.headers['x-brand-id'] || req.body.brandId || null // Try to capture brand context
    });

    await newLeave.save();

    return res.status(201).json({
      message: "Leave request submitted successfully.",
      ticketNumber: newLeave.ticketNumber,
      leave: newLeave
    });
  } catch (error) {
    console.error("Create leave error:", error);

    // Handle validation errors from mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors
      });
    }

    return res.status(500).json({
      message: error.message || "Server error"
    });
  }
};

// Update leave
export const updateLeave = async (req, res) => {
  try {
    // Check if user has admin, manager, or counselor access
    if (!hasAdminOrManagerOrCounsellorAccess(req.user)) {
      return res.status(403).json({ message: "Access denied. Admin, Manager, or Counselor privileges required." });
    }

    const { id } = req.params;
    const updateData = req.body;

    const leave = await leaveModel.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found." });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key === 'startDate' || key === 'endDate') {
        leave[key] = new Date(updateData[key]);
      } else if (key !== '_id' && key !== '__v') {
        leave[key] = updateData[key];
      }
    });

    await leave.save();

    return res.status(200).json({
      message: "Leave updated successfully.",
      leave
    });
  } catch (error) {
    console.error("Update leave error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete leave
export const deleteLeave = async (req, res) => {
  try {
    // Check if user has admin, manager, or counselor access
    if (!hasAdminOrManagerOrCounsellorAccess(req.user)) {
      return res.status(403).json({ message: "Access denied. Admin, Manager, or Counselor privileges required." });
    }

    const { id } = req.params;

    const leave = await leaveModel.findByIdAndDelete(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found." });
    }

    return res.status(200).json({ message: "Leave deleted successfully." });
  } catch (error) {
    console.error("Delete leave error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update leave status
export const updateLeaveStatus = async (req, res) => {
  try {
    // Check if user has admin, manager, or counselor access
    if (!hasAdminOrManagerOrCounsellorAccess(req.user)) {
      return res.status(403).json({ message: "Access denied. Admin, Manager, or Counselor privileges required." });
    }

    const { id } = req.params;
    const { status } = req.body;

    const leave = await leaveModel.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found." });
    }

    leave.status = status;
    await leave.save();

    return res.status(200).json({
      message: `Leave ${status} successfully.`,
      leave
    });
  } catch (error) {
    console.error("Update leave status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get leave status by ticket number (Public endpoint)
export const getLeaveByTicketNumber = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    if (!ticketNumber) {
      return res.status(400).json({
        success: false,
        message: "Ticket number is required"
      });
    }

    const leave = await leaveModel.findOne({ ticketNumber });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found. Please check your ticket number."
      });
    }

    // Return only necessary information (no sensitive data)
    return res.status(200).json({
      success: true,
      leave: {
        ticketNumber: leave.ticketNumber,
        employeeName: leave.employeeName,
        employeeId: leave.employeeId,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason,
        status: leave.status,
        createdAt: leave.createdAt,
        updatedAt: leave.updatedAt
      }
    });
  } catch (error) {
    console.error("Error fetching leave by ticket number:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};