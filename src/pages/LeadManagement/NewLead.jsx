import PageBreadcrumb from "../../components/common/PageBreadCrumb.jsx";
import PageMeta from "../../components/common/PageMeta.jsx";
import { useState, useContext, useEffect } from "react";
import ComponentCard from "../../components/common/ComponentCard.jsx";
import Label from "../../components/form/Label.jsx";
import Input from "../../components/form/input/InputField.jsx";
import PhoneInput from "../../components/form/group-input/PhoneInput.jsx";
import Select from "../../components/form/Select.jsx";
import DatePicker from "../../components/form/date-picker.jsx";
import MultiSelect from "../../components/form/MultiSelect.jsx";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import { AuthContext } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useCalendar } from "../../context/calendarContext"; // Added import
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  placeOptions,
  countries,
  enquirerGender,
  enquirerStatus,
  enquirerEducation,
  //   courseOptions,
  contactPoints,
  campaigns,
  leadPotentialOptions // Added import
} from "../../data/DataSets.jsx";
import Button from "../../components/ui/button/Button.jsx";

import API from "../../config/api";

export default function FormElements() {

  const { user } = useContext(AuthContext);
  const { addEvent } = useCalendar(); // Added useCalendar hook
  const navigate = useNavigate();
  const { addNotification, areToastsEnabled } = useNotifications();
  // Controlled states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [place, setPlace] = useState("");
  const [otherPlace, setOtherPlace] = useState("");
  const [status, setStatus] = useState("");
  const [education, setEducation] = useState("");
  const [otherEducation, setOtherEducation] = useState("");
  const [selectedValues, setSelectedValues] = useState(["General"]);
  const [contactPoint, setContactPoint] = useState("");
  const [otherContactPoint, setOtherContactPoint] = useState("");
  const [campaign, setCampaign] = useState("");
  const [leadRemarks, setLeadRemarks] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [leadPotential, setLeadPotential] = useState(""); // Added state for lead potential
  const [error, setError] = useState(false);
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [contactPointOptions, setContactPointOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]); // Dynamic course options

  // Validation error states
  const [validationErrors, setValidationErrors] = useState({});

  // Campaign modal states
  const { isOpen: isCampaignModalOpen, openModal: openCampaignModal, closeModal: closeCampaignModal } = useModal();
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [newCampaignDiscount, setNewCampaignDiscount] = useState("");
  const [newCampaignCashback, setNewCampaignCashback] = useState("");
  const [newCampaignActive, setNewCampaignActive] = useState(true);

  // Contact Point modal states
  const { isOpen: isContactPointModalOpen, openModal: openContactPointModal, closeModal: closeContactPointModal } = useModal();
  const [newContactPointName, setNewContactPointName] = useState("");
  const [newContactPointDesc, setNewContactPointDesc] = useState("");
  const [newContactPointActive, setNewContactPointActive] = useState(true);

  useEffect(() => {
    // Check for pre-filled data from event registration
    const prefillData = sessionStorage.getItem('prefillLeadData');
    if (prefillData) {
      const { fullName, email } = JSON.parse(prefillData);
      setFullName(fullName || "");
      setEmail(email || "");
      // Clear the session storage after using it
      sessionStorage.removeItem('prefillLeadData');
    }

    fetchCampaigns();
    fetchContactPoints();
    fetchCourseCategories();
  }, []);

  const fetchCourseCategories = async () => {
    try {
      const response = await axios.get(
        `${API}/course-categories/all`,
        { withCredentials: true }
      );
      const categories = response.data.categories.filter(c => c.isActive).map(c => ({
        value: c.name, // Using name as value to match existing data structure logic if needed, or ID
        label: c.name
      }));
      setCourseOptions(categories);
    } catch (error) {
      console.error("Error fetching course categories:", error);
      // Fallback
      setCourseOptions([
        { value: "General", label: "General" }
      ]);
    }
  };

  const fetchCampaigns = async () => {
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
      setCampaignOptions(formattedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      // Fallback to hardcoded campaigns if API fails
      const fallbackOptions = [...campaigns, { value: "__add_new__", label: "+ Add New Campaign" }];
      setCampaignOptions(fallbackOptions);
    }
  };

  const fetchContactPoints = async () => {
    try {
      const response = await axios.get(
        `${API}/contact-points/active`,
        { withCredentials: true }
      );
      const formattedContactPoints = response.data.contactPoints.map(c => ({
        value: c.value,
        label: c.name
      }));

      // Add "Other" option
      formattedContactPoints.push({
        value: "other",
        label: "Other"
      });

      // Add "Add New Contact Point" option at the end
      formattedContactPoints.push({
        value: "__add_new__",
        label: "+ Add New Contact Point"
      });

      setContactPointOptions(formattedContactPoints);
    } catch (error) {
      console.error("Error fetching contact points:", error);
      // Fallback to hardcoded contact points if API fails
      const fallbackOptions = [...contactPoints, { value: "__add_new__", label: "+ Add New Contact Point" }];
      setContactPointOptions(fallbackOptions);
    }
  };

  const validateEmail = (value) => {
    // If email is empty, it's valid (optional field)
    if (!value || !value.trim()) {
      setError(false);
      return true;
    }
    const isValidEmail =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    setError(!isValidEmail);
    return isValidEmail;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handleCampaignChange = (value) => {
    if (value === "__add_new__") {
      openCampaignModal();
    } else {
      setCampaign(value);
    }
  };

  const handleContactPointChange = (value) => {
    if (value === "__add_new__") {
      openContactPointModal();
    } else {
      setContactPoint(value);
    }
  };

  const createNewCampaign = async () => {
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
      setCampaign(response.data.campaign.value);

      // Refresh campaigns list
      await fetchCampaigns();

      // Close modal and reset fields
      closeCampaignModal();
      setNewCampaignName("");
      setNewCampaignDesc("");
      setNewCampaignDiscount("");
      setNewCampaignCashback("");
      setNewCampaignActive(true);
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error(error.response?.data?.message || "Failed to create campaign");
    }
  };

  const createNewContactPoint = async () => {
    if (!newContactPointName.trim()) {
      toast.error("Contact point name is required");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/contact-points/create`,
        {
          name: newContactPointName,
          description: newContactPointDesc,
          isActive: newContactPointActive
        },
        { withCredentials: true }
      );

      toast.success("Contact point created successfully!");

      // Set the newly created contact point as selected
      setContactPoint(response.data.contactPoint.value);

      // Refresh contact points list
      await fetchContactPoints();

      // Close modal and reset fields
      closeContactPointModal();
      setNewContactPointName("");
      setNewContactPointDesc("");
      setNewContactPointActive(true);
    } catch (error) {
      console.error("Error creating contact point:", error);
      toast.error(error.response?.data?.message || "Failed to create contact point");
    }
  };

  // Validate mandatory fields
  const validateForm = () => {
    const errors = {};

    if (!fullName.trim()) {
      errors.fullName = "Full Name is required";
    }

    // Email is optional, but if provided, it must be valid
    if (email.trim() && !validateEmail(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!phone1.trim()) {
      errors.phone1 = "Phone is required";
    }

    if (!place) {
      errors.place = "Place is required";
    } else if (place === "Other" && !otherPlace.trim()) {
      errors.otherPlace = "Please specify the place";
    }

    if (!education) {
      errors.education = "Education is required";
    } else if (education === "Other" && !otherEducation.trim()) {
      errors.otherEducation = "Please specify the education";
    }

    if (selectedValues.length === 0) {
      errors.coursePreference = "Course preference is required";
    }

    if (!contactPoint) {
      errors.contactPoint = "Contact point is required";
    }

    // Add validation for other contact point
    if (contactPoint === "other" && !otherContactPoint.trim()) {
      errors.otherContactPoint = "Please specify the contact point";
    }

    if (!campaign) {
      errors.campaign = "Campaign is required";
    }

    if (!followUpDate) {
      errors.followUpDate = "Next follow up date is required";
    }

    if (!leadRemarks.trim()) {
      errors.leadRemarks = "Remarks are required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset the whole form
  const handleClear = () => {
    setFullName("");
    setEmail("");
    setPhone1("");
    setPhone2("");
    setGender("");
    setDob("");
    setPlace("");
    setOtherPlace("");
    setStatus("");
    setEducation("");
    setOtherEducation("");
    setSelectedValues(["General"]);
    setContactPoint("");
    setOtherContactPoint("");
    setCampaign("");
    setLeadRemarks("");
    setFollowUpDate("");
    setLeadPotential(""); // Reset lead potential
    setError(false);
    setValidationErrors({});
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const formData = {
      fullName,
      email: email.trim() || null, // Send null if email is empty
      phone1,
      phone2,
      gender,
      dob,
      place: place === "Other" ? otherPlace : place,
      otherPlace: place === "Other" ? otherPlace : "",
      status,
      education: education === "Other" ? otherEducation : education,
      otherEducation: education === "Other" ? otherEducation : "",
      coursePreference: selectedValues,
      contactPoint,
      otherContactPoint: contactPoint === "other" ? otherContactPoint : "",
      campaign,
      handledBy: user?.fullName || "Unknown",
      leadRemarks,
      followUpDate,
      leadPotential, // Added lead potential to form data
    };

    console.log("Sending formData with leadPotential:", formData); // Add logging

    try {
      const response = await axios.post(
        `${API}/customers/create`,
        formData,
        { withCredentials: true }
      );

      if (response.status === 201) {
        // Automatically create calendar event if followUpDate exists
        if (followUpDate) {
          try {
            const formattedDate = followUpDate; // Already in YYYY-MM-DD format

            addEvent({
              title: `Follow-up: ${fullName}`,
              start: formattedDate,
              end: formattedDate,
              allDay: true,
              extendedProps: {
                calendar: "Warning",
                leadId: response.data.customer._id,
                phone: phone1,
                email: email,
                status: response.data.customer.leadStatus || "new",
              },
            });
          } catch (calendarError) {
            console.error("Error creating calendar event:", calendarError);
            // Don't fail the lead creation if calendar event fails
          }
        }

        // Add notification
        addNotification({
          type: 'lead_created',
          userName: user?.fullName || 'Someone',
          avatar: user?.avatar || null,  // Add avatar to notification
          action: 'added new lead',
          entityName: fullName,
          module: 'Lead Management',
        });

        // Show single success toast notification only if enabled
        if (areToastsEnabled()) {
          toast.success("Lead created successfully!", {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }

        handleClear();
        navigate("/lead-management");
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to create a lead.");
      } else {
        toast.error(error.response?.data?.message || "Failed to create lead. Please try again.");
      }
    }
  };


  return (
    <div>
      <PageMeta
        title="New Lead | DreamCRM"
        description="Add new enquiry here"
      />
      <PageBreadcrumb pageTitle="New Enquiry" />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <ComponentCard title="Basic Details">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2">
                    <Label htmlFor="firstName">Full Name *</Label>
                    <Input
                      type="text"
                      id="firstName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      error={!!validationErrors.fullName}
                      hint={validationErrors.fullName}
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      error={error || !!validationErrors.email}
                      onChange={handleEmailChange}
                      placeholder="Enter your email (optional)"
                      hint={validationErrors.email || (error ? "This is an invalid email address." : "")}
                    />
                  </div>
                </div>

                {/* Phones */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2">
                    <Label>Phone *</Label>
                    <PhoneInput
                      selectPosition="end"
                      countries={countries}
                      placeholder="+91 98765 43210"
                      value={phone1}
                      onChange={setPhone1}
                      error={!!validationErrors.phone1}
                      hint={validationErrors.phone1}
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <Label>Phone (optional)</Label>
                    <PhoneInput
                      selectPosition="end"
                      countries={countries}
                      placeholder="+91 98765 43210"
                      value={phone2}
                      onChange={setPhone2}
                    />
                  </div>
                </div>

                {/* Gender, DoB, Place */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/4">
                    <Label>Gender</Label>
                    <Select
                      options={enquirerGender}
                      value={gender}
                      placeholder="Select Gender"
                      onChange={setGender}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <DatePicker
                      id="dob"
                      label="DoB"
                      value={dob}
                      onChange={(date, str) => setDob(str)}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Place *</Label>
                    <Select
                      options={placeOptions}
                      value={place}
                      placeholder="Select Place"
                      onChange={setPlace}
                      error={!!validationErrors.place}
                      hint={validationErrors.place}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label htmlFor="otherPlace">Specify other</Label>
                    <Input
                      type="text"
                      id="otherPlace"
                      value={otherPlace}
                      onChange={(e) => setOtherPlace(e.target.value)}
                      disabled={place !== "Other"}
                      error={place === "Other" && !otherPlace.trim() && !!validationErrors.otherPlace}
                      hint={place === "Other" && !otherPlace.trim() ? validationErrors.otherPlace : ""}
                    />
                  </div>
                </div>

                {/* Status, Education - removed Remarks */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/3">
                    <Label>Current Status</Label>
                    <Select
                      options={enquirerStatus}
                      value={status}
                      placeholder="Select Status"
                      onChange={setStatus}
                    />
                  </div>
                  <div className="w-full md:w-1/3">
                    <Label>Education</Label>
                    <Select
                      options={enquirerEducation}
                      value={education}
                      placeholder="Select Education"
                      onChange={setEducation}
                      error={!!validationErrors.education}
                      hint={validationErrors.education}
                    />
                  </div>
                  <div className="w-full md:w-1/3">
                    <Label htmlFor="otherEducation">Specify other</Label>
                    <Input
                      type="text"
                      id="otherEducation"
                      value={otherEducation}
                      onChange={(e) => setOtherEducation(e.target.value)}
                      disabled={education !== "Other"}
                      error={education === "Other" && !otherEducation.trim() && !!validationErrors.otherEducation}
                      hint={education === "Other" && !otherEducation.trim() ? validationErrors.otherEducation : ""}
                    />
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <ComponentCard title="Enquiry / Lead Information">
              <div className="space-y-6">
                <div>
                  <MultiSelect
                    label="Course Preference"
                    options={courseOptions}
                    selectedValues={selectedValues}
                    onChange={setSelectedValues}
                    error={!!validationErrors.coursePreference}
                    hint={validationErrors.coursePreference}
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full">
                    <Label>Contact Point *</Label>
                    <Select
                      options={contactPointOptions}
                      value={contactPoint}
                      placeholder="Contact Point"
                      onChange={handleContactPointChange}
                      error={!!validationErrors.contactPoint}
                      hint={validationErrors.contactPoint}
                    />
                  </div>
                  <div className="w-full">
                    <Label htmlFor="otherContactPoint">Specify other</Label>
                    <Input
                      type="text"
                      id="otherContactPoint"
                      value={otherContactPoint}
                      onChange={(e) => setOtherContactPoint(e.target.value)}
                      disabled={contactPoint !== "other"}
                      error={contactPoint === "other" && !otherContactPoint.trim() && !!validationErrors.otherContactPoint}
                      hint={contactPoint === "other" && !otherContactPoint.trim() ? validationErrors.otherContactPoint : ""}
                    />
                  </div>
                  <div className="w-full">
                    <Label>Campaign *</Label>
                    <Select
                      options={campaignOptions}
                      value={campaign}
                      placeholder="Campaigns"
                      onChange={handleCampaignChange}
                      error={!!validationErrors.campaign}
                      hint={validationErrors.campaign}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Changed to 1/2 width each */}
                  <div className="w-full md:w-1/3">
                    <DatePicker
                      id="followupDate"
                      label="Next Follow Up Date"
                      value={followUpDate}
                      disablePastDates={true} // Hide past dates completely
                      onChange={(date, str) => setFollowUpDate(str)}
                      error={!!validationErrors.followUpDate}
                      hint={validationErrors.followUpDate}
                    />
                  </div>
                  <div className="w-full md:w-2/3">
                    <Label htmlFor="leadRemarks">Remarks *</Label>
                    <Input
                      type="text"
                      id="leadRemarks"
                      value={leadRemarks}
                      onChange={(e) => setLeadRemarks(e.target.value)}
                      error={!!validationErrors.leadRemarks}
                      hint={validationErrors.leadRemarks}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full">
                    <Label>Lead Potential</Label>
                    <Select
                      options={leadPotentialOptions}
                      value={leadPotential}
                      placeholder="Select Lead Potential"
                      onChange={setLeadPotential}
                    />
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-end mt-6">
          <Button type="button" onClick={handleClear} variant="outline">Clear</Button>
          <Button variant="primary" type="submit">Save</Button>
        </div>
      </form>

      {/* Add Campaign Modal */}
      <Modal
        isOpen={isCampaignModalOpen}
        onClose={closeCampaignModal}
        className="max-w-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Add New Campaign
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="newCampaignName">Campaign Name *</Label>
            <Input
              id="newCampaignName"
              type="text"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              placeholder="e.g., Summer Promotion 2024"
            />
          </div>

          <div>
            <Label htmlFor="newCampaignDesc">Description</Label>
            <textarea
              id="newCampaignDesc"
              value={newCampaignDesc}
              onChange={(e) => setNewCampaignDesc(e.target.value)}
              placeholder="Campaign description (optional)"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="newCampaignDiscount">Discount %</Label>
              <Input
                id="newCampaignDiscount"
                type="number"
                min="0"
                max="100"
                value={newCampaignDiscount}
                onChange={(e) => setNewCampaignDiscount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="newCampaignCashback">Cashback (₹)</Label>
              <Input
                id="newCampaignCashback"
                type="number"
                min="0"
                value={newCampaignCashback}
                onChange={(e) => setNewCampaignCashback(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newCampaignActive"
              checked={newCampaignActive}
              onChange={(e) => setNewCampaignActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="newCampaignActive" className="mb-0">Mark as Active</Label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Only active campaigns will appear in dropdowns</p>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={closeCampaignModal}>
              Cancel
            </Button>
            <Button type="button" onClick={createNewCampaign}>
              Create Campaign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Contact Point Modal */}
      <Modal
        isOpen={isContactPointModalOpen}
        onClose={closeContactPointModal}
        className="max-w-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Add New Contact Point
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="newContactPointName">Contact Point Name *</Label>
            <Input
              id="newContactPointName"
              type="text"
              value={newContactPointName}
              onChange={(e) => setNewContactPointName(e.target.value)}
              placeholder="e.g., Walk In"
            />
          </div>

          <div>
            <Label htmlFor="newContactPointDesc">Description</Label>
            <textarea
              id="newContactPointDesc"
              value={newContactPointDesc}
              onChange={(e) => setNewContactPointDesc(e.target.value)}
              placeholder="Contact point description (optional)"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newContactPointActive"
              checked={newContactPointActive}
              onChange={(e) => setNewContactPointActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="newContactPointActive" className="mb-0">Mark as Active</Label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Only active contact points will appear in dropdowns</p>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={closeContactPointModal}>
              Cancel
            </Button>
            <Button type="button" onClick={createNewContactPoint}>
              Create Contact Point
            </Button>
          </div>
        </div>
      </Modal>

      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div>
  );
}