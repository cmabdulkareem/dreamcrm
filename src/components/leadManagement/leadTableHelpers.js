import { getLeadPotentialBackgroundColor } from "./leadHelpers";
import { formatDate } from "./leadHelpers";

// Helper function to determine row background color based on due date
export const getRowBackgroundColor = (followUpDate) => {
  if (!followUpDate) return "";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  
  const dueDate = new Date(followUpDate);
  dueDate.setHours(0, 0, 0, 0);
  
  // If due date is today or in the past - red background (matching error badge)
  if (dueDate <= today) {
    return "bg-red-100 dark:bg-red-800";
  }
  
  // If due date is tomorrow - orange background (matching warning badge)
  if (dueDate.getTime() === tomorrow.getTime()) {
    return "bg-orange-100 dark:bg-orange-800";
  }
  
  // If due date is day after tomorrow - green background (matching success badge)
  if (dueDate.getTime() === dayAfterTomorrow.getTime()) {
    return "bg-green-100 dark:bg-green-800";
  }
  
  return ""; // No background color for other cases
};

// Helper function to determine lead potential background color for the name cell
export const getNameCellBackgroundColor = (leadPotential) => {
  return getLeadPotentialBackgroundColor(leadPotential);
};

// Helper function to determine due date badge color based on due date
export const getDueDateBadgeColor = (followUpDate) => {
  if (!followUpDate) return "light";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  
  const dueDate = new Date(followUpDate);
  dueDate.setHours(0, 0, 0, 0);
  
  // If due date is today or in the past - red background
  if (dueDate <= today) {
    return "error";
  }
  
  // If due date is tomorrow - orange background
  if (dueDate.getTime() === tomorrow.getTime()) {
    return "warning";
  }
  
  // If due date is day after tomorrow - green background
  if (dueDate.getTime() === dayAfterTomorrow.getTime()) {
    return "success";
  }
  
  return "light"; // Default light background for other dates
};

// Helper function to get due date badge text
export const getDueDateBadgeText = (followUpDate) => {
  if (!followUpDate) return "No Date";
  
  // For all cases, show the actual formatted date
  return formatDate(followUpDate);
};

// Helper function to get lead potential label
export const getLeadPotentialLabel = (leadPotential) => {
  switch (leadPotential) {
    case "strongProspect":
      return "Strong Prospect";
    case "potentialProspect":
      return "Potential Prospect";
    case "weakProspect":
      return "Weak Prospect";
    case "notAProspect":
      return "Not a Prospect";
    default:
      return "N/A";
  }
};

// Helper function to get lead potential class
export const getLeadPotentialClass = (leadPotential) => {
  switch (leadPotential) {
    case "strongProspect":
      return "text-green-800 bg-green-200 dark:text-green-200 dark:bg-green-800";
    case "potentialProspect":
      return "text-blue-800 bg-blue-200 dark:text-blue-200 dark:bg-blue-800";
    case "weakProspect":
      return "text-yellow-800 bg-yellow-200 dark:text-yellow-200 dark:bg-yellow-800";
    case "notAProspect":
      return "text-red-800 bg-red-200 dark:text-red-200 dark:bg-red-800";
    default:
      return "text-gray-600 bg-gray-100";
  }
};