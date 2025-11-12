import axios from "axios";
import { toast } from "react-toastify";
import { courseOptions } from "../../data/DataSets.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Fetch all customers/leads
export const fetchCustomers = async (setData, setLoading) => {
  try {
    const response = await axios.get(
      `${API}/customers/all`,
      { withCredentials: true }
    );
    if (typeof setData === 'function') {
      setData(response.data.customers);
    }
    if (typeof setLoading === 'function') {
      setLoading(false);
    }
    return response.data.customers;
  } catch (error) {
    console.error("Error fetching customers:", error);
    if (typeof setLoading === 'function') {
      setLoading(false);
    }
    if (error.response?.status === 401) {
      alert("Please login to view leads.");
    }
    return [];
  }
};

// Fetch active campaigns
export const fetchCampaigns = async (setCampaignOptions, campaigns) => {
  try {
    const response = await axios.get(
      `${API}/campaigns/active`,
      { withCredentials: true }
    );
    const formattedCampaigns = response.data.campaigns.map(c => ({
      value: c.value,
      label: c.name
    }));
    // Add "Add New Campaign" option at the end
    formattedCampaigns.push({
      value: "__add_new__",
      label: "+ Add New Campaign"
    });
    if (typeof setCampaignOptions === 'function') {
      setCampaignOptions(formattedCampaigns);
    }
    return formattedCampaigns;
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    // Fallback to hardcoded campaigns if API fails
    const fallbackOptions = [...campaigns, { value: "__add_new__", label: "+ Add New Campaign" }];
    if (typeof setCampaignOptions === 'function') {
      setCampaignOptions(fallbackOptions);
    }
    return fallbackOptions;
  }
};

// Create new campaign
export const createNewCampaign = async (
  newCampaignName,
  newCampaignDesc,
  newCampaignDiscount,
  newCampaignCashback,
  newCampaignActive,
  setCampaign,
  fetchCampaigns,
  closeCampaignModal,
  setNewCampaignName,
  setNewCampaignDesc,
  setNewCampaignDiscount,
  setNewCampaignCashback,
  setNewCampaignActive,
  toast
) => {
  if (!newCampaignName.trim()) {
    toast.error("Campaign name is required");
    return;
  }

  try {
    const response = await axios.post(
      `${API}/campaigns/create`,
      { 
        name: newCampaignName, 
        description: newCampaignDesc,
        discountPercentage: newCampaignDiscount ? parseFloat(newCampaignDiscount) : 0,
        cashback: newCampaignCashback ? parseFloat(newCampaignCashback) : 0,
        isActive: newCampaignActive
      },
      { withCredentials: true }
    );
    
    toast.success("Campaign created successfully!");
    
    // Set the newly created campaign as selected
    if (typeof setCampaign === 'function') {
      setCampaign(response.data.campaign.value);
    }
    
    // Refresh campaigns list
    if (typeof fetchCampaigns === 'function') {
      await fetchCampaigns();
    }
    
    // Close modal and reset fields
    if (typeof closeCampaignModal === 'function') {
      closeCampaignModal();
    }
    if (typeof setNewCampaignName === 'function') {
      setNewCampaignName("");
    }
    if (typeof setNewCampaignDesc === 'function') {
      setNewCampaignDesc("");
    }
    if (typeof setNewCampaignDiscount === 'function') {
      setNewCampaignDiscount("");
    }
    if (typeof setNewCampaignCashback === 'function') {
      setNewCampaignCashback("");
    }
    if (typeof setNewCampaignActive === 'function') {
      setNewCampaignActive(true);
    }
  } catch (error) {
    console.error("Error creating campaign:", error);
    toast.error(error.response?.data?.message || "Failed to create campaign");
  }
};

// Prepare lead data for editing
export const prepareLeadForEdit = (row, setters) => {
  const {
    setSelectedRow,
    setEditName,
    setEditPhone,
    setEditEmail,
    setEditStatus,
    setEditFollowUp,
    setFullName,
    setEmail,
    setPhone1,
    setPhone2,
    setGender,
    setDob,
    setPlace,
    setOtherPlace,
    setStatus,
    setEducation,
    setContactPoint,
    setOtherContactPoint,
    setCampaign,
    setHandledByPerson,
    setFollowUpDate,
    setRemarks,
    setLeadStatus,
    setSelectedValues
  } = setters;

  if (typeof setSelectedRow === 'function') {
    setSelectedRow(row);
  }
  if (typeof setEditName === 'function') {
    setEditName(row.fullName);
  }
  if (typeof setEditPhone === 'function') {
    setEditPhone(row.phone1);
  }
  if (typeof setEditEmail === 'function') {
    setEditEmail(row.email);
  }
  if (typeof setEditStatus === 'function') {
    setEditStatus(row.status);
  }
  if (typeof setEditFollowUp === 'function') {
    setEditFollowUp(row.followUpDate ? new Date(row.followUpDate).toISOString().split("T")[0] : "");
  }
  
  // Populate all fields from row to match dropdown option values
  if (typeof setFullName === 'function') {
    setFullName(row.fullName);
  }
  if (typeof setEmail === 'function') {
    setEmail(row.email);
  }
  if (typeof setPhone1 === 'function') {
    setPhone1(row.phone1);
  }
  if (typeof setPhone2 === 'function') {
    setPhone2(row.phone2 || "");
  }
  if (typeof setGender === 'function') {
    setGender(row.gender || "");
  }
  if (typeof setDob === 'function') {
    setDob(row.dob ? new Date(row.dob).toISOString().split("T")[0] : "");
  }
  if (typeof setPlace === 'function') {
    setPlace(row.place || "");
  }
  if (typeof setOtherPlace === 'function') {
    setOtherPlace(row.otherPlace || "");
  }
  if (typeof setStatus === 'function') {
    setStatus(row.status || "");
  }
  if (typeof setEducation === 'function') {
    setEducation(row.education || "");
  }
  if (typeof setContactPoint === 'function') {
    setContactPoint(row.contactPoint || "");
  }
  if (typeof setOtherContactPoint === 'function') {
    setOtherContactPoint(row.otherContactPoint || "");
  }
  if (typeof setCampaign === 'function') {
    setCampaign(row.campaign || "");
  }
  if (typeof setHandledByPerson === 'function') {
    setHandledByPerson(row.handledBy || "");
  }
  if (typeof setFollowUpDate === 'function') {
    setFollowUpDate(row.followUpDate ? new Date(row.followUpDate).toISOString().split("T")[0] : "");
  }
  if (typeof setRemarks === 'function') {
    setRemarks("");
  }
  if (typeof setLeadStatus === 'function') {
    setLeadStatus(row.leadStatus || "");
  }
  
  // Map coursePreference from database to match courseOptions format
  const mappedCourses = row.coursePreference?.map(courseName => {
    // Find matching option in courseOptions
    const matchedOption = courseOptions.find(opt => 
      opt.value === courseName || opt.text === courseName
    );
    return matchedOption || { value: courseName, text: courseName };
  }) || [];
  
  if (typeof setSelectedValues === 'function') {
    setSelectedValues(mappedCourses);
  }
};