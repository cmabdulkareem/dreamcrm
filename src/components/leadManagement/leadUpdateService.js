import axios from "axios";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Save lead changes
export const saveLeadChanges = async (
  selectedRow,
  remarks,
  leadStatus,
  fullName,
  phone1,
  phone2,
  email,
  gender,
  dob,
  place,
  otherPlace,
  status,
  education,
  contactPoint,
  otherContactPoint,
  campaign,
  followUpDate,
  selectedValues,
  user,
  handledByPerson,
  getLeadStatusLabel,
  addEvent,
  updateEvent,
  events,
  fetchCustomers,
  setSelectedRow,
  setRemarks,
  addNotification,
  areToastsEnabled
) => {
  try {
    let latestCustomerData = selectedRow;
    
    // Check if there's a new remark to add OR if the lead status has changed
    const hasRemark = remarks.trim();
    const hasStatusChanged = selectedRow?.leadStatus !== leadStatus;
    
    if (hasRemark || hasStatusChanged) {
      // Create remark payload - if no remark text, create a status change remark
      const remarkText = hasRemark 
        ? remarks 
        : `Status changed to ${getLeadStatusLabel(leadStatus || "new")}`;
        
      const remarkPayload = {
        remark: remarkText,
        handledBy: user?.fullName || "Unknown",
        nextFollowUpDate: followUpDate || null,
        leadStatus: leadStatus || "new"
      };
      
      // Add remark via the API endpoint with logged-in user's name and current lead status
      const remarkResponse = await axios.post(
        `${API}/customers/remark/${selectedRow._id}`,
        remarkPayload,
        { withCredentials: true }
      );
      
      // Update latestCustomerData with the latest data from the remark response
      if (remarkResponse.data.customer) {
        latestCustomerData = remarkResponse.data.customer;
      }
    }

    // Update the lead details
    const updatePayload = {
      fullName,
      phone1,
      phone2,
      email,
      gender,
      dob,
      place,
      otherPlace,
      status,
      education,
      contactPoint,
      otherContactPoint,
      campaign,
      handledBy: user?.fullName || handledByPerson,
      followUpDate,
      leadStatus,
      coursePreference: selectedValues.map(item => item.value)
    };
    
    const response = await axios.put(
      `${API}/customers/update/${selectedRow._id}`,
      updatePayload,
      { withCredentials: true }
    );
    
    // Automatically update calendar event if followUpDate exists
    if (followUpDate) {
      try {
        // Check if an event already exists for this lead
        const existingEvent = events.find(event => 
          event.extendedProps?.leadId === selectedRow._id
        );
        
        const formattedDate = followUpDate; // Already in YYYY-MM-DD format
        const eventPayload = {
          title: `Follow-up: ${fullName}`,
          start: formattedDate,
          end: formattedDate,
          allDay: true,
          extendedProps: {
            calendar: "Warning",
            leadId: selectedRow._id,
            phone: phone1,
            email: email,
            status: leadStatus || "new",
          },
        };
        
        if (existingEvent) {
          // Update existing event
          updateEvent(existingEvent.id, eventPayload);
        } else {
          // Create new event
          addEvent(eventPayload);
        }
      } catch (calendarError) {
        console.error("Error managing calendar event:", calendarError);
      }
    }
    
    // Refresh data to show updates instantly in the table
    if (typeof fetchCustomers === 'function') {
      await fetchCustomers();
    }
    
    // Update selectedRow with the latest data to refresh history stack
    if (response.data.customer) {
      if (typeof setSelectedRow === 'function') {
        setSelectedRow(response.data.customer);
      }
    } else {
      // If for some reason the response doesn't contain customer data, 
      // use the latestCustomerData we tracked
      if (typeof setSelectedRow === 'function') {
        setSelectedRow(latestCustomerData);
      }
    }
    
    // Clear remarks field after successful update
    if (typeof setRemarks === 'function') {
      setRemarks("");
    }
    
    // Add notification
    if (typeof addNotification === 'function') {
      addNotification({
        type: 'lead_updated',
        userName: user?.fullName || 'Someone',
        action: 'updated lead',
        entityName: fullName,
        module: 'Lead Management',
      });
    }
    
    // Show single success toast notification only if enabled
    if (typeof areToastsEnabled === 'function' && areToastsEnabled()) {
      toast.success("Updated lead status", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error updating lead:", error);
    if (typeof areToastsEnabled === 'function' && areToastsEnabled()) {
      toast.error("Failed to update lead. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
    return false;
  }
};

// Delete lead
export const deleteLead = async (
  selectedRow,
  isManager,
  closeDeleteModal,
  resetModal,
  setData,
  addNotification,
  areToastsEnabled,
  toast
) => {
  // Additional check to ensure only managers can delete
  if (!isManager) {
    toast.error("Only managers can delete leads.", {
      position: "top-center",
      autoClose: 3000,
    });
    if (typeof closeDeleteModal === 'function') {
      closeDeleteModal();
    }
    return;
  }
  
  try {
    await axios.delete(
      `${API}/customers/delete/${selectedRow._id}`,
      { withCredentials: true }
    );
    
    if (typeof setData === 'function') {
      setData((prev) => prev.filter((item) => item._id !== selectedRow._id));
    }
    if (typeof closeDeleteModal === 'function') {
      closeDeleteModal();
    }
    if (typeof resetModal === 'function') {
      resetModal();
    }
    
    // Add notification
    if (typeof addNotification === 'function') {
      addNotification({
        type: 'lead_deleted',
        userName: selectedRow.handledBy || 'Someone',
        action: 'deleted lead',
        entityName: selectedRow.fullName,
        module: 'Lead Management',
      });
    }
    
    if (typeof areToastsEnabled === 'function' && areToastsEnabled()) {
      toast.success("Lead deleted successfully!", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  } catch (error) {
    console.error("Error deleting lead:", error);
    if (typeof areToastsEnabled === 'function' && areToastsEnabled()) {
      toast.error("Failed to delete lead. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  }
};

// Set reminder for lead
export const setLeadReminder = async (
  selectedRow,
  closeAlarmModal,
  resetModal,
  addEvent,
  toast
) => {
  if (!selectedRow?.followUpDate) {
    toast.error("No follow-up date set for this lead.");
    if (typeof closeAlarmModal === 'function') {
      closeAlarmModal();
    }
    return;
  }

  try {
    // Create calendar event
    const followUpDate = new Date(selectedRow.followUpDate);
    const formattedDate = followUpDate.toISOString().split("T")[0];
    
    // Add event to in-app calendar
    if (typeof addEvent === 'function') {
      addEvent({
        title: `Follow-up: ${selectedRow.fullName}`,
        start: formattedDate,
        end: formattedDate,
        allDay: true,
        extendedProps: {
          calendar: "Warning",
          leadId: selectedRow._id,
          phone: selectedRow.phone1,
          email: selectedRow.email,
          status: selectedRow.status,
        },
      });
    }
    
    toast.success(`Calendar reminder added for ${selectedRow.fullName}!`);
    if (typeof closeAlarmModal === 'function') {
      closeAlarmModal();
    }
    if (typeof resetModal === 'function') {
      resetModal();
    }
  } catch (error) {
    console.error('Error creating calendar event:', error);
    toast.error('Failed to create calendar event.');
  }
};

// Mark remark as read
export const markRemarkAsRead = async (leadId, remarkIndex) => {
  try {
    const response = await axios.put(
      `${API}/customers/mark-remark-read/${leadId}/${remarkIndex}`,
      {},
      { withCredentials: true }
    );
    
    return response.data.customer;
  } catch (error) {
    console.error("Error marking remark as read:", error);
    throw error;
  }
};