import customerModel from "../model/customerModel.js";

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
      leadRemarks
    } = req.body;

    // Validation
    if (!fullName || !email || !phone1) {
      return res.status(400).json({ message: "Full name, email, and phone are required." });
    }

    // Create initial remark if leadRemarks exists
    const remarks = leadRemarks ? [{
      updatedOn: new Date(),
      nextFollowUpDate: followUpDate ? new Date(followUpDate) : null,
      handledBy: handledBy,
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
      remarks
    });

    await newCustomer.save();

    return res.status(201).json({ 
      message: "Lead created successfully.", 
      customer: newCustomer 
    });
  } catch (error) {
    console.error("Create customer error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all customers/leads
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await customerModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get single customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await customerModel.findById(id);
    
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
      if (key === 'dob' || key === 'followUpDate') {
        customer[key] = updateData[key] ? new Date(updateData[key]) : null;
      } else if (key !== 'remarks') {
        customer[key] = updateData[key];
      }
    });

    await customer.save();

    return res.status(200).json({ 
      message: "Customer updated successfully.", 
      customer 
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
      handledBy,
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

    return res.status(200).json({ 
      message: "Remark added successfully.", 
      customer 
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
