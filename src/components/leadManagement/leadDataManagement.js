import axios from "axios";
import { toast } from "react-toastify";
import { courseOptions, placeOptions, enquirerEducation, contactPoints } from "../../data/DataSets.jsx";
import { formatDate, getLeadStatusLabel, getLeadStatusColor, getLatestRemark, hasUnreadRemarks } from "./leadHelpers";

import API from "../../config/api";
import { isManager } from "../../utils/roleHelpers";

// Fetch all customers/leads
export const fetchCustomers = async (setData, setLoading) => {
  try {
    const response = await axios.get(
      `${API}/customers/all`,
      { withCredentials: true }
    );

    const customers = response.data.customers || [];
    if (typeof setData === 'function') {
      setData(customers);
    }
    if (typeof setLoading === 'function') {
      setLoading(false);
    }
    return customers;
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
export const fetchCampaigns = async (setCampaignOptions, campaigns, user) => {
  try {
    const response = await axios.get(
      `${API}/campaigns/active`,
      { withCredentials: true }
    );
    const formattedCampaigns = response.data.campaigns.map(c => ({
      value: c.value,
      label: c.name
    }));
    // Add "Add New Campaign" option at the end if user is manager
    if (isManager(user)) {
      formattedCampaigns.push({
        value: "__add_new__",
        label: "+ Add New Campaign"
      });
    }
    if (typeof setCampaignOptions === 'function') {
      setCampaignOptions(formattedCampaigns);
    }
    return formattedCampaigns;
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    // Fallback to hardcoded campaigns if API fails
    const fallbackOptions = [...campaigns];
    if (isManager(user)) {
      fallbackOptions.push({ value: "__add_new__", label: "+ Add New Campaign" });
    }
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
    setOtherEducation,
    setContactPoint,
    setOtherContactPoint,
    setCampaign,
    setHandledByPerson,
    setFollowUpDate,
    setRemarks,
    setLeadStatus,
    setLeadPotential, // Added lead potential setter
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
    const matchedPlace = placeOptions.find(opt => opt.value === row.place);
    if (matchedPlace || !row.place) {
      setPlace(row.place || "");
    } else {
      setPlace("Other");
    }
  }
  if (typeof setOtherPlace === 'function') {
    const isOther = !placeOptions.some(opt => opt.value === row.place);
    // Use stored otherPlace if available, otherwise fallback to check if place is a custom value
    setOtherPlace(row.otherPlace || (isOther ? row.place || "" : ""));
  }
  if (typeof setStatus === 'function') {
    setStatus(row.status || "");
  }
  if (typeof setEducation === 'function') {
    const matchedEdu = enquirerEducation.find(opt => opt.value === row.education);
    if (matchedEdu || !row.education) {
      setEducation(row.education || "");
    } else {
      setEducation("Other");
    }
  }
  if (typeof setOtherEducation === 'function') {
    if (row.education === "Other") {
      setOtherEducation(row.otherEducation || "");
    } else {
      const matchedEdu = enquirerEducation.find(opt => opt.value === row.education);
      if (!matchedEdu && row.education) {
        setOtherEducation(row.education);
      } else {
        setOtherEducation("");
      }
    }
  }
  if (typeof setContactPoint === 'function') {
    // Use dynamic contact points if available, otherwise fall back to static
    const contactPointsToUse = setters.contactPointOptions || contactPoints;
    const cpValue = row.contactPoint?.toLowerCase();
    const isSpecialCP = cpValue === "other" || cpValue === "reference" || cpValue === "referance";
    const matchedCP = contactPointsToUse.find(opt => opt.value === row.contactPoint);

    if (matchedCP || !row.contactPoint) {
      setContactPoint(row.contactPoint || "");
    } else {
      setContactPoint("other");
    }
  }
  if (typeof setOtherContactPoint === 'function') {
    const cpValue = row.contactPoint?.toLowerCase();
    const isSpecialCP = cpValue === "other" || cpValue === "reference" || cpValue === "referance";

    if (isSpecialCP) {
      setOtherContactPoint(row.otherContactPoint || "");
    } else {
      // Use dynamic contact points if available, otherwise fall back to static
      const contactPointsToUse = setters.contactPointOptions || contactPoints;
      const matchedCP = contactPointsToUse.find(opt => opt.value === row.contactPoint);
      if (!matchedCP && row.contactPoint) {
        setOtherContactPoint(row.contactPoint);
      } else {
        setOtherContactPoint("");
      }
    }
  }
  if (typeof setCampaign === 'function') {
    setCampaign(row.campaign || "");
  }
  if (typeof setHandledByPerson === 'function') {
    setHandledByPerson(row.handledBy || "");
  }
  if (typeof setFollowUpDate === 'function') {
    // Clear followUpDate if lead status is converted or lost
    if (row.leadStatus === "converted" || row.leadStatus === "lost") {
      setFollowUpDate("");
    } else {
      setFollowUpDate(row.followUpDate ? new Date(row.followUpDate).toISOString().split("T")[0] : "");
    }
  }
  if (typeof setRemarks === 'function') {
    setRemarks("");
  }
  if (typeof setLeadStatus === 'function') {
    setLeadStatus(row.leadStatus || "");
  }
  if (typeof setLeadPotential === 'function') { // Added lead potential setter
    setLeadPotential(row.leadPotential || "");
  }

  // Map coursePreference from database to match courseOptions format
  const mappedCourses = row.coursePreference?.map(courseName => {
    const optionsToUse = setters.courseOptions || courseOptions;

    // If courseName is already in the correct format (value from courseOptions), use it directly
    if (typeof courseName === 'string') {
      // Check if it's already a valid course option value
      const isValidValue = optionsToUse.some(opt => opt.value === courseName);
      if (isValidValue) {
        return courseName;
      }
      // If not a valid value, try to find a matching option by label
      const matchedOption = optionsToUse.find(opt => opt.label === courseName);
      return matchedOption ? matchedOption.value : courseName;
    }
    // Fallback for any other case
    return courseName;
  }) || [];

  if (typeof setSelectedValues === 'function') {
    setSelectedValues(mappedCourses);
  }
};