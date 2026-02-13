import customerModel from "../model/customerModel.js";
import userModel from "../model/userModel.js";
import { emitNotification as emitSocketNotification } from '../realtime/socket.js';
import { isAdmin, isCounsellor } from "../utils/roleHelpers.js";
import { isManager } from "../middleware/roleMiddleware.js";
import { logActivity } from "../utils/activityLogger.js";

// Create new customer/lead
export const createCustomer = async (req, res) => {
  try {
    let {
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
      otherEducation,
      coursePreference,
      contactPoint,
      otherContactPoint,
      campaign,
      handledBy,
      followUpDate,
      leadRemarks,
      leadPotential // Added leadPotential field
    } = req.body;
    const { hasRole } = await import("../utils/roleHelpers.js");


    // Validation
    if (!fullName || !phone1) {
      return res.status(400).json({ message: "Full name and phone are required." });
    }

    // Sanitize Gender
    const validGenders = ['male', 'female', 'other'];
    // If gender is empty string or invalid, set to undefined so mongoose ignores it
    if (gender !== undefined && !validGenders.includes(gender)) {
      gender = undefined;
    }

    // Sanitize Education
    const validEducations = ['notEducated', 'below10th', '10th', '12th', 'diploma', 'graduate', 'postGraduate', 'Other'];
    // If education is provided but is not in the valid list
    if (education && !validEducations.includes(education)) {
      // If otherEducation is not already set, use the invalid education value
      if (!otherEducation) {
        otherEducation = education;
      }
      // Set education to 'Other' to satisfy certain enum requirements
      education = 'Other';
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
      otherEducation,
      coursePreference,
      contactPoint,
      otherContactPoint,
      campaign,
      handledBy,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      remarks,
      leadPotential, // Added leadPotential field
      // Automatically assign the lead to the user who created it
      assignedTo: req.user.id,
      assignedBy: req.user.id,
      createdBy: req.user.id, // Persistent creator
      assignedAt: new Date(),
      brand: req.brandFilter?.brand || req.headers['x-brand-id'] || null // Strict brand assignment
    });

    await newCustomer.save();

    // Log activity
    await logActivity(req.user.id, 'CREATE', 'Leads', {
      entityId: newCustomer._id,
      description: `Created lead: ${newCustomer.fullName}`
    });


    // Fetch the updated customer with populated user details
    const updatedCustomer = await customerModel.findById(newCustomer._id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');

    // Emit Real-time Notification to Brand
    try {
      if (newCustomer.brand) {
        const creatorName = req.user.fullName || "Unknown";
        const notificationData = {
          userName: creatorName,
          action: 'created',
          entityName: newCustomer.fullName,
          module: 'Lead Management',
          actionUrl: `/lead-management?leadId=${newCustomer._id}`,
          metadata: { leadId: newCustomer._id },
          timestamp: new Date().toISOString()
        };

        emitSocketNotification({
          brandId: newCustomer.brand,
          notification: notificationData
        });
      }
    } catch (notifError) {
      console.error('Error sending create notification:', notifError);
    }

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

    const { hasRole } = await import("../utils/roleHelpers.js");

    let query = { ...req.brandFilter };

    const hasCounsellorAccess = isCounsellor(req.user);

    // If user is not admin, manager, or counsellor, only show leads assigned to them
    if (!hasAdminAccess && !hasManagerAccess && !hasCounsellorAccess) {
      query.assignedTo = req.user.id; // Only leads assigned to the user
    }

    const customers = await customerModel.find(query)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email')
      .populate('createdBy', 'fullName email') // Populate creator
      .sort({ createdAt: -1 });

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

    const { includeStudents } = req.query;
    let query = { ...req.brandFilter, leadStatus: 'converted' };

    if (includeStudents !== 'true') {
      query.isAdmissionTaken = { $ne: true };
    }

    const hasCounsellorAccess = isCounsellor(req.user);

    // If user is not admin, manager, or counsellor, only show leads assigned to them
    if (!hasAdminAccess && !hasManagerAccess && !hasCounsellorAccess) {
      query.assignedTo = req.user.id; // Only leads assigned to the user
    }

    const customers = await customerModel.find(query).sort({ createdAt: -1 });
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


    const customer = await customerModel.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      // Sanitize Enums: If empty string, set to undefined or don't update
      if ((key === 'gender' || key === 'status') && (updateData[key] === '' || updateData[key] === null)) {
        return; // Skip updating this field if empty
      }

      if (key === 'dob' || key === 'followUpDate') {
        customer[key] = updateData[key] ? new Date(updateData[key]) : null;
      } else if (key !== 'remarks' && key !== 'createdBy') { // Prevent overwriting createdBy
        customer[key] = updateData[key];
      }
    });

    // Clear followUpDate if leadStatus is set to converted
    if (updateData.leadStatus === 'converted') {
      customer.followUpDate = null;
    }

    await customer.save();


    // Fetch the updated customer with all fields
    const updatedCustomer = await customerModel.findById(id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');

    // Emit Real-time Notification for Update
    try {
      // Only emit if significant changes (optional, but requested "any activity")
      // We'll limit to brand-wide broadcast to avoid noise, but user asked for "everyone within the brand".
      // Let's emit a generic update notification
      if (customer.brand) {
        const updaterName = req.user.fullName || "Unknown";
        const notificationData = {
          userName: updaterName,
          action: 'updated',
          entityName: customer.fullName,
          module: 'Lead Management',
          actionUrl: `/lead-management?leadId=${customer._id}`,
          metadata: { leadId: customer._id },
          timestamp: new Date().toISOString()
        };

        emitSocketNotification({
          brandId: customer.brand,
          notification: notificationData
        });
      }
    } catch (notifError) {
      console.error('Error sending update notification:', notifError);
    }

    // Log activity
    await logActivity(req.user.id, 'UPDATE', 'Leads', {
      entityId: customer._id,
      description: `Updated lead: ${customer.fullName}`
    });

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
      // Clear followUpDate if status is converted
      if (leadStatus === 'converted') {
        customer.followUpDate = null;
      }
    }

    // Update followUpDate if provided and status is not converted
    if (nextFollowUpDate && leadStatus !== 'converted') {
      customer.followUpDate = new Date(nextFollowUpDate);
    }

    await customer.save();

    // Fetch the updated customer with all fields
    const updatedCustomer = await customerModel.findById(id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');

    // Emit Real-time Notification for Remark
    try {
      if (customer.brand) {
        const updaterName = req.user.fullName || "Unknown";
        const notificationData = {
          userName: updaterName,
          action: 'added a remark to',
          entityName: customer.fullName,
          module: 'Lead Management',
          actionUrl: `/lead-management?leadId=${customer._id}`,
          metadata: { leadId: customer._id },
          timestamp: new Date().toISOString()
        };

        emitSocketNotification({
          brandId: customer.brand,
          notification: notificationData
        });
      }
    } catch (notifError) {
      console.error('Error sending remark notification:', notifError);
    }

    // Log activity
    await logActivity(req.user.id, 'REMARK', 'Leads', {
      entityId: customer._id,
      description: `Added remark to lead: ${customer.fullName}`
    });

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

    // Notification Logic (Optional: Owner-only action, but good for logs/audits)
    try {
      const notificationData = {
        userName: req.user.fullName || "Owner",
        action: 'permanently deleted',
        entityName: `lead: ${customer.fullName}`,
        module: 'Lead Management',
        actionUrl: '/lead-management',
        metadata: { leadId: id },
        timestamp: new Date().toISOString()
      };

      if (customer.brand) {
        emitSocketNotification({
          brandId: customer.brand,
          notification: notificationData
        });
      }
    } catch (notifError) {
      console.error('Error sending delete lead notification:', notifError);
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

    // Check if user has permission to assign leads (Admin, Manager, or Counsellor)
    const isAuthorized = isAdmin(req.user) || isManager(req.user) || isCounsellor(req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: "Access denied. Only Admins, Managers, and Counsellors can assign leads." });
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

    // Brand validation: Ensure the assigned user belongs to the same brand as the lead
    if (customer.brand) {
      const leadBrandId = customer.brand.toString();
      const userBrandIds = (assignedUser.brands || []).map(b => b.toString());

      if (!userBrandIds.includes(leadBrandId)) {
        return res.status(403).json({
          message: "Cannot assign lead to user from a different brand. Lead assignment is restricted to users within the same brand."
        });
      }
    }

    // Get assigner details to ensure correct name
    const assigner = await userModel.findById(req.user.id);
    const assignerName = assigner ? assigner.fullName : "Unknown";

    // Update assignment fields
    customer.assignedTo = assignedTo;
    customer.assignedBy = assignedBy;
    customer.assignedAt = new Date();
    customer.assignmentRemark = assignmentRemark;

    // Add a remark about the assignment
    customer.remarks.push({
      updatedOn: new Date(),
      handledBy: assignerName,
      remark: assignmentRemark ? `Lead assigned to ${assignedUser.fullName}. Remark: ${assignmentRemark}` : `Lead assigned to ${assignedUser.fullName}`,
      leadStatus: customer.leadStatus || 'new',
      isUnread: true // Mark as unread for the assigned user
    });

    await customer.save();

    // Fetch the updated customer with populated user details
    const updatedCustomer = await customerModel.findById(id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');

    // Emit Real-time Notification
    try {
      const notificationData = {
        userName: assignerName,
        action: 'assigned',
        entityName: `lead ${customer.fullName} to ${assignedUser.fullName}`,
        module: 'Lead Management',
        actionUrl: `/lead-management?leadId=${customer._id}`,
        metadata: { leadId: customer._id },
        timestamp: new Date().toISOString()
      };

      // Broadcast to Brand (everyone sees who got assigned what)
      if (customer.brand) {
        emitSocketNotification({
          brandId: customer.brand,
          recipients: [assignedTo], // Also explicitly notify assignee
          notification: notificationData
        });
      } else {
        // Fallback to just assignee if no brand
        emitSocketNotification({
          recipients: [assignedTo],
          notification: notificationData
        });
      }

    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    return res.status(200).json({
      message: "Lead assigned successfully.",
      customer: updatedCustomer
    });

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
    // Count customers/leads based on brand filter
    const totalCount = await customerModel.countDocuments(req.brandFilter || {});

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
    // Get customers/leads based on brand filter
    const allCustomers = await customerModel.find(req.brandFilter || {});

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
    // Get customers/leads based on brand filter (but not filtered by assignedTo)
    const customers = await customerModel.find(req.brandFilter || {})
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching all customers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get leaderboard data (brand specific)
export const getLeaderboard = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Start with brand filter
    const brandQuery = req.brandFilter || {};

    // Get all leads (brand specific) with remarks to track conversions
    const allLeads = await customerModel.find(brandQuery)
      .populate('assignedTo', 'fullName email avatar')
      .select('assignedTo leadStatus createdAt remarks isAdmissionTaken');

    // Group by assignedTo user
    const userStats = {};

    allLeads.forEach(lead => {
      if (!lead.assignedTo) return; // Skip if no assigned user

      const userId = lead.assignedTo._id.toString();

      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          fullName: lead.assignedTo.fullName,
          email: lead.assignedTo.email,
          avatar: lead.assignedTo.avatar,
          totalLeads: 0,
          conversions: 0
        };
      }

      // Check if lead was created this month
      if (lead.createdAt) {
        const createdDate = new Date(lead.createdAt);
        if (createdDate.getMonth() === currentMonth &&
          createdDate.getFullYear() === currentYear) {
          userStats[userId].totalLeads++;
        }
      }

      // Check if lead was converted this month (by checking remarks and isAdmissionTaken)
      if (lead.isAdmissionTaken && lead.remarks && lead.remarks.length > 0) {
        // Find the remark where it was converted or admission was taken this month
        const conversionRemark = lead.remarks.find(remark => {
          // Look for 'converted' status OR specific admission remarks if we add them
          if ((remark.leadStatus === 'converted' || remark.remark?.includes("Admission taken")) && remark.updatedOn) {
            const updatedDate = new Date(remark.updatedOn);
            return updatedDate.getMonth() === currentMonth &&
              updatedDate.getFullYear() === currentYear;
          }
          return false;
        });

        if (conversionRemark) {
          userStats[userId].conversions++;
        }
      }
    });

    // Convert to array and calculate conversion rates
    const leaderboardData = Object.values(userStats)
      .filter(user => user.totalLeads > 0 || user.conversions > 0) // Only include users with activity
      .map(user => ({
        ...user,
        conversionRate: user.totalLeads > 0
          ? parseFloat(((user.conversions / user.totalLeads) * 100).toFixed(2))
          : 0
      }));

    // Get top performers
    const topByLeads = [...leaderboardData]
      .sort((a, b) => b.totalLeads - a.totalLeads)
      .slice(0, 5);

    const topByConversions = [...leaderboardData]
      .filter(user => user.conversions > 0) // Only show users with conversions
      .sort((a, b) => {
        // Sort by conversions first, then by conversion rate
        if (b.conversions !== a.conversions) {
          return b.conversions - a.conversions;
        }
        return b.conversionRate - a.conversionRate;
      })
      .slice(0, 5);

    return res.status(200).json({
      leaderboard: leaderboardData,
      topByLeads,
      topByConversions,
      message: "Leaderboard data retrieved successfully."
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Import leads from CSV
export const importLeads = async (req, res) => {
  try {
    const { leads } = req.body;
    const brandId = req.brandFilter?.brand || req.headers['x-brand-id'];

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ message: "No leads data provided." });
    }

    if (!brandId) {
      return res.status(400).json({ message: "Brand context is missing." });
    }

    let successCount = 0;
    let failedCount = 0;
    let errors = [];

    // Helper to normalize phone
    const normalizePhone = (phone) => String(phone).replace(/\D/g, '').slice(-10);

    for (const [index, leadData] of leads.entries()) {
      try {
        // 1. Basic Validation
        if (!leadData.fullName || !leadData.phone1) {
          throw new Error("Full Name and Phone are required.");
        }

        // 2. Duplicate Check (Phone or Email) within Brand
        const existingQuery = {
          brand: brandId,
          $or: [
            { phone1: { $regex: normalizePhone(leadData.phone1), $options: 'i' } }
          ]
        };

        if (leadData.email) {
          existingQuery.$or.push({ email: leadData.email });
        }

        const existingLead = await customerModel.findOne(existingQuery);
        if (existingLead) {
          throw new Error(`Duplicate lead found (matches phone or email): ${existingLead.fullName}`);
        }

        // 3. Prepare Data
        // default status if missing
        const leadStatus = leadData.leadStatus || 'new';
        const leadPotential = leadData.leadPotential || 'potentialProspect';

        const newLead = new customerModel({
          fullName: leadData.fullName,
          phone1: leadData.phone1,
          email: leadData.email || "",
          place: leadData.place || "",
          education: leadData.education || "Other",
          coursePreference: leadData.coursePreference || "",
          contactPoint: leadData.contactPoint || "Other",
          campaign: leadData.campaign || "",
          leadStatus: leadStatus,
          leadPotential: leadPotential,
          followUpDate: leadData.nextFollowUpDate ? new Date(leadData.nextFollowUpDate) : null,
          brand: brandId,
          assignedTo: req.user.id, // Assign to uploader
          assignedBy: req.user.id,
          createdBy: req.user.id, // Persistent creator
          assignedAt: leadData.createdAt ? new Date(leadData.createdAt) : new Date(),
          createdAt: leadData.createdAt ? new Date(leadData.createdAt) : new Date(),
          remarks: leadData.remarks ? [{
            updatedOn: leadData.createdAt ? new Date(leadData.createdAt) : new Date(),
            remark: leadData.remarks,
            handledBy: req.user.fullName,
            leadStatus: leadStatus
          }] : []
        });

        await newLead.save();
        successCount++;
      } catch (err) {
        failedCount++;
        errors.push({
          row: index + 1,
          name: leadData.fullName || 'Unknown',
          error: err.message
        });
      }
    }

    // Notification Logic
    try {
      if (successCount > 0) {
        const notificationData = {
          userName: req.user.fullName || "Unknown",
          action: 'imported',
          entityName: `${successCount} leads via CSV`,
          module: 'Lead Management',
          actionUrl: '/lead-management',
          metadata: { count: successCount },
          timestamp: new Date().toISOString()
        };

        emitSocketNotification({
          brandId: brandId,
          notification: notificationData
        });
      }
    } catch (notifError) {
      console.error('Error sending import notification:', notifError);
    }

    return res.status(200).json({
      message: "Import processing confirmed.",
      summary: {
        total: leads.length,
        success: successCount,
        failed: failedCount,
        errors: errors
      }
    });

  } catch (error) {
    console.error("Import leads error:", error);
    return res.status(500).json({ message: "Server error during import." });
  }
};