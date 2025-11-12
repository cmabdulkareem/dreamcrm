import { leadStatusOptions } from "../../data/DataSets.jsx";

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const dateObj = new Date(dateString);
  return dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Get lead status label from value
export const getLeadStatusLabel = (value) => {
  if (!value) return "New Lead";
  const option = leadStatusOptions.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Get lead status color for badge
export const getLeadStatusColor = (status) => {
  if (status === 'converted' || status === 'qualified') return "success";
  if (status === 'negotiation' || status === 'contacted') return "info";
  if (status === 'callBackLater' || status === 'new') return "warning";
  if (status === 'lost' || status === 'notInterested') return "error";
  return "light";
};

// Get latest remark from lead
export const getLatestRemark = (remarks) => {
  if (remarks && remarks.length > 0) {
    return remarks[remarks.length - 1].remark;
  }
  return "No remarks yet";
};