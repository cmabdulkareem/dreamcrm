import customerModel from "../model/customerModel.js";
import userModel from "../model/userModel.js";
import { isAdmin } from "../utils/roleHelpers.js";
import { isManager } from "../middleware/roleMiddleware.js";

// Create new customer/lead
export const createCustomer = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone1,
      phone2,
      gender,
      dob,
      place,
      otherPlace,
      status,
      education,
      coursePreference,
      contactPoint,
      otherContactPoint,
      campaign,
      handledBy,
      followUpDate,
      leadRemarks,
      leadPotential // Added leadPotential field
    } = req.body;

    console.log("Creating customer with leadPotential:", leadPotential); // Add logging

    // Validation
    if (!fullName || !email || !phone1) {
      return res.status(400).json({ message: "Full name, email, and phone are required." });
    }

    // Create initial remark if leadRemarks exists
    const remarks = leadRemarks ? [{
      updatedOn: new Date(),
      nextFollowUpDate: followUpDate ? new Date(followUpDate) : null,
      handledBy: handledBy || "Unknown", // Ensure handledBy is always populated
      remark: leadRemarks,
      leadStatus: 'new' // Initial lead status
    }] : [];

    const newCustomer = new customerModel({
      fullName,
      email,
      phone1,
      phone2,
      gender,
      dob: dob ? new Date(dob) : null,
      place,
      otherPlace,
      status,
      education,
      coursePreference,
      contactPoint,
      otherContactPoint,
      campaign,
      handledBy,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      remarks,
      leadPotential, // Added leadPotential field
      remarks,
      leadPotential, // Added leadPotential field
      // Automatically assign the lead to the user who created it
      assignedTo: req.user.id,
      assignedBy: req.user.id,
      assignedAt: new Date(),
      brand: req.brandFilter?.brand || req.headers['x-brand-id'] || null // Strict brand assignment
    });

    await newCustomer.save();

    console.log("Customer saved with leadPotential:", newCustomer.leadPotential); // Add logging

    // Fetch the updated customer with populated user details
    const updatedCustomer = await customerModel.findById(newCustomer._id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');

    console.log("Updated customer with leadPotential:", updatedCustomer.leadPotential); // Add logging

    return res.status(201).json({
      message: "Lead created successfully.",
      customer: updatedCustomer
    });
  } catch (error) {
    console.error("Create customer error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all customers/leads
export const getAllCustomers = async (req, res) => {
  try {
    // Check user role using role helpers
    const hasAdminAccess = isAdmin(req.user);
    const hasManagerAccess = isManager(req.user);

    // Start with brand filter if present
    let query = { ...req.brandFilter };

    // If user is not admin or manager, only show leads assigned to them
    if (!hasAdminAccess && !hasManagerAccess) {
      query.assignedTo = req.user.id; // Only leads assigned to the user
      console.log(`User ${req.user.id} is not admin/manager, filtering leads by assignedTo`);
    } else {
      console.log(`User ${req.user.id} is admin/manager, showing all leads`);
    }

    console.log("Query:", query);
    const customers = await customerModel.find(query)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email')
      .sort({ createdAt: -1 });
    console.log(`Found ${customers.length} customers`);

    // Log the first customer's leadPotential to debug
    if (customers.length > 0) {
      console.log("First customer leadPotential:", customers[0].leadPotential);
    }

    return res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all converted customers/leads
export const getConvertedCustomers = async (req, res) => {
  try {
    // Check user role using role helpers
    const hasAdminAccess = isAdmin(req.user);
    const hasManagerAccess = isManager(req.user);

    let query = { leadStatus: 'converted' };

    // If user is not admin or manager, only show leads assigned to them
    if (!hasAdminAccess && !hasManagerAccess) {
      query = {
        leadStatus: 'converted',
        assignedTo: req.user.id // Only leads assigned to the user
      };
      console.log(`User ${req.user.id} is not admin/manager, filtering converted leads by assignedTo`);
    } else {
      console.log(`User ${req.user.id} is admin/manager, showing all converted leads`);
    }

    console.log("Converted query:", query);
    console.log("Fetching converted customers...");
    const customers = await customerModel.find(query).sort({ createdAt: -1 });
    console.log("Found converted customers:", customers.length);
    return res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching converted customers:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get single customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await customerModel.findById(id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');

    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    console.log("Customer fetched with leadPotential:", customer.leadPotential); // Add logging

    return res.status(200).json({ customer });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log("Updating customer with data:", updateData); // Add logging

    const customer = await customerModel.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key === 'dob' || key === 'followUpDate') {
        customer[key] = updateData[key] ? new Date(updateData[key]) : null;
      } else if (key !== 'remarks') {
        customer[key] = updateData[key];
      }
    });

    await customer.save();

    console.log("Customer updated with leadPotential:", customer.leadPotential); // Add logging

    // Fetch the updated customer with all fields
    const updatedCustomer = await customerModel.findById(id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');

    console.log("Updated customer with leadPotential:", updatedCustomer.leadPotential); // Add logging

    return res.status(200).json({
      message: "Customer updated successfully.",
      customer: updatedCustomer
    });
  } catch (error) {
    console.error("Update customer error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Add remark to customer
export const addRemark = async (req, res) => {
  try {
    const { id } = req.params;
    const { nextFollowUpDate, handledBy, remark, leadStatus } = req.body;

    const customer = await customerModel.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    customer.remarks.push({
      updatedOn: new Date(),
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      handledBy: handledBy || req.user.fullName || "Unknown", // Ensure handledBy is always populated
      remark,
      leadStatus: leadStatus || 'new'
    });

    // Update customer's main leadStatus field if provided
    if (leadStatus) {
      customer.leadStatus = leadStatus;
    }

    // Update followUpDate if provided
    if (nextFollowUpDate) {
      customer.followUpDate = new Date(nextFollowUpDate);
    }

    await customer.save();

    // Fetch the updated customer with all fields
    const updatedCustomer = await customerModel.findById(id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');

    return res.status(200).json({
      message: "Remark added successfully.",
      customer: updatedCustomer
    });
  } catch (error) {
    console.error("Add remark error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Strict Permission: Only Owner can delete leads
    // Import isOwner dynamically or assume it's available if imported at top, 
    // but better to rely on what's available. 
    // I need to make sure isOwner is imported. 
    // Since I can't easily add import at top without reading file again or using multi-replace (which is risky if file changed),
    // I will check roles manually here or assume isOwner is imported if I add it.
    // Wait, I should add the import first or use manual check.
    // Manual check is safer if I'm not sure about imports.
    // But I should try to use the helper.
    // Let's check imports in customerController.js first. 
    // It imports isAdmin, isManager. I didn't see isOwner imported.
    // I'll stick to a manual check or update imports.
    // Updating imports is better.

    // Actually, I'll allow this step to just update the function and I'll update imports in a separate step or same step if I can see the top.
    // I can't see the top in this replace_chunk.
    // So I will use manual role check for safety: "Owner" role.

    const userRoles = req.user.roles || [];
    const isOwnerUser = Array.isArray(userRoles) ? userRoles.includes('Owner') : userRoles === 'Owner';

    if (!isOwnerUser) {
      return res.status(403).json({ message: "Access denied. Only the Owner can delete leads." });
    }

    const customer = await customerModel.findByIdAndDelete(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    return res.status(200).json({ message: "Customer deleted successfully." });
  } catch (error) {
    console.error("Delete customer error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Assign lead to user
export const assignLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignmentRemark } = req.body;
    const assignedBy = req.user.id; // Get the assigning user from token

    // Check if user has permission to assign leads (Admin or Manager)
    const isAuthorized = isAdmin(req.user) || isManager(req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: "Access denied. Only Admins and Managers can assign leads." });
    }

    // Validate assignedTo user exists
    const assignedUser = await userModel.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({ message: "Assigned user not found." });
    }

    // Find the customer/lead
    const customer = await customerModel.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // Update assignment fields
    customer.assignedTo = assignedTo;
    customer.assignedBy = assignedBy;
    customer.assignedAt = new Date();
    customer.assignmentRemark = assignmentRemark;

    // Add a remark about the assignment
    customer.remarks.push({
      updatedOn: new Date(),
      handledBy: req.user.fullName || "Unknown", // Ensure handledBy is always populated
      remark: assignmentRemark ? `Lead assigned to ${assignedUser.fullName}. Remark: ${assignmentRemark}` : `Lead assigned to ${assignedUser.fullName}`,
      leadStatus: customer.leadStatus || 'new',
      isUnread: true // Mark as unread for the assigned user
    });

    await customer.save();

    // Fetch the updated customer with populated user details
    const updatedCustomer = await customerModel.findById(id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');

    return res.status(200).json({
      message: "Lead assigned successfully.",
      customer: updatedCustomer
    });
  } catch (error) {
    console.error("Assign lead error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Mark remark as read
export const markRemarkAsRead = async (req, res) => {
  try {
    const { id, remarkIndex } = req.params;

    const customer = await customerModel.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // Check if remark exists
    if (!customer.remarks[remarkIndex]) {
      return res.status(404).json({ message: "Remark not found." });
    }

    // Mark the remark as read
    customer.remarks[remarkIndex].isUnread = false;
    await customer.save();

    // Fetch the updated customer with populated user details
    const updatedCustomer = await customerModel.findById(id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');

    return res.status(200).json({
      message: "Remark marked as read.",
      customer: updatedCustomer
    });
  } catch (error) {
    console.error("Mark remark as read error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get total leads count across all users
export const getAllLeadsCount = async (req, res) => {
  try {
    // Count all customers/leads in the database
    const totalCount = await customerModel.countDocuments();

    return res.status(200).json({
      count: totalCount,
      message: "Total leads count retrieved successfully."
    });
  } catch (error) {
    console.error("Error fetching total leads count:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get brand-wide conversion metrics
export const getBrandConversionMetrics = async (req, res) => {
  try {
    // Get all customers/leads in the database (not filtered by user)
    const allCustomers = await customerModel.find();

    // Total leads count across all users
    const totalLeads = allCustomers.length;

    // Count converted leads across all users
    const convertedLeads = allCustomers.filter(c => c.leadStatus === 'converted').length;

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;

    return res.status(200).json({
      totalLeads,
      convertedLeads,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      message: "Brand conversion metrics retrieved successfully."
    });
  } catch (error) {
    console.error("Error fetching brand conversion metrics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all customers without user filtering (for brand-wide metrics)
export const getAllCustomersUnfiltered = async (req, res) => {
  try {
    // Get all customers/leads in the database without any user filtering
    const customers = await customerModel.find()
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching all customers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};