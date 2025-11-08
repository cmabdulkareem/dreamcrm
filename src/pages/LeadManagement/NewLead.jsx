import PageBreadcrumb from "../../components/common/PageBreadCrumb.jsx";
import PageMeta from "../../components/common/PageMeta.jsx";
import { useState, useContext, useEffect } from "react";
import ComponentCard from "../../components/common/ComponentCard.jsx";
import Label from "../../components/form/Label.tsx";
import Input from "../../components/form/input/InputField.tsx";
import PhoneInput from "../../components/form/group-input/PhoneInput.tsx";
import Select from "../../components/form/Select.tsx";
import DatePicker from "../../components/form/date-picker.tsx";
import MultiSelect from "../../components/form/MultiSelect.tsx";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import { AuthContext } from "../../context/authContext";
import { useNotifications } from "../../context/NotificationContext";
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
  courseOptions,
  contactPoints,
  campaigns
} from "../../data/DataSets.jsx";
import Button from "../../components/ui/button/Button.tsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function FormElements() {

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
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
  const [remarks, setRemarks] = useState("");
  const [selectedValues, setSelectedValues] = useState([]);
  const [contactPoint, setContactPoint] = useState("");
  const [otherContactPoint, setOtherContactPoint] = useState("");
  const [campaign, setCampaign] = useState("");
  const [leadRemarks, setLeadRemarks] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [error, setError] = useState(false);
  const [campaignOptions, setCampaignOptions] = useState([]);
  
  // Campaign modal states
  const { isOpen: isCampaignModalOpen, openModal: openCampaignModal, closeModal: closeCampaignModal } = useModal();
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [newCampaignDiscount, setNewCampaignDiscount] = useState("");
  const [newCampaignCashback, setNewCampaignCashback] = useState("");
  const [newCampaignActive, setNewCampaignActive] = useState(true);

  useEffect(()=>{
    fetchCampaigns();
  }, [])

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

  const validateEmail = (value) => {
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
    setRemarks("");
    setSelectedValues([]);
    setContactPoint("");
    setOtherContactPoint("");
    setCampaign("");
    setLeadRemarks("");
    setFollowUpDate("");
    setError(false);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = {
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
      coursePreference: selectedValues.map(item => item.value),
      contactPoint,
      otherContactPoint,
      campaign,
      handledBy: user?.fullName || "Unknown",
      leadRemarks,
      followUpDate,
    };

    try {
      const response = await axios.post(
        `${API}/customers/create`,
        formData,
        { withCredentials: true }
      );
      
      if (response.status === 201) {
        // Add notification
        addNotification({
          type: 'lead_created',
          userName: user?.fullName || 'Someone',
          action: 'added new lead',
          entityName: fullName,
          module: 'Lead Management',
        });
        
        toast.success("Lead created successfully!");
        handleClear();
        navigate("/lead-management");
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error.response?.status === 401) {
        alert("Please login to create a lead.");
      } else {
        alert(error.response?.data?.message || "Failed to create lead. Please try again.");
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
          {/* Left column */}
          <div className="space-y-6">
            <ComponentCard title="Basic Details">
              <div className="space-y-6">
                {/* Name + Email */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2">
                    <Label htmlFor="firstName">Full Name</Label>
                    <Input
                      type="text"
                      id="firstName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      error={error}
                      onChange={handleEmailChange}
                      placeholder="Enter your email"
                      hint={error ? "This is an invalid email address." : ""}
                    />
                  </div>
                </div>

                {/* Phones */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2">
                    <Label>Phone</Label>
                    <PhoneInput
                      selectPosition="end"
                      countries={countries}
                      placeholder="+91 98765 43210"
                      value={phone1}
                      onChange={setPhone1}
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
                      placeholder="Select a date"
                      value={dob}
                      onChange={(date, str) => setDob(str)}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Place</Label>
                    <Select
                      options={placeOptions}
                      value={place}
                      placeholder="Select Place"
                      onChange={setPlace}
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
                    />
                  </div>
                </div>

                {/* Status, Education, Remarks */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                  <div className="flex-[0.5] flex flex-col">
                    <Label>Current Status</Label>
                    <Select
                      options={enquirerStatus}
                      value={status}
                      placeholder="Select Status"
                      onChange={setStatus}
                    />
                  </div>
                  <div className="flex-[0.5] flex flex-col">
                    <Label>Education</Label>
                    <Select
                      options={enquirerEducation}
                      value={education}
                      placeholder="Select Education"
                      onChange={setEducation}
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Input
                      type="text"
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
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
                    defaultSelected={["General"]}
                    onChange={setSelectedValues}
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/3">
                    <Label>Contact Point</Label>
                    <Select
                      options={contactPoints}
                      value={contactPoint}
                      placeholder="Contacted Through"
                      onChange={setContactPoint}
                    />
                  </div>
                  <div className="w-full md:w-1/3">
                    <Label htmlFor="otherContactPoint">Specify other</Label>
                    <Input
                      type="text"
                      id="otherContactPoint"
                      value={otherContactPoint}
                      onChange={(e) => setOtherContactPoint(e.target.value)}
                      disabled={contactPoint !== "other"}
                    />
                  </div>
                  <div className="w-full md:w-1/3">
                    <Label>Campaign</Label>
                    <Select
                      options={campaignOptions}
                      value={campaign}
                      placeholder="Campaigns"
                      onChange={handleCampaignChange}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full">
                    <DatePicker
                      id="followupDate"
                      label="Next Follow Up Date"
                      placeholder="Select a date"
                      value={followUpDate}
                      onChange={(date, str) => setFollowUpDate(str)}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full">
                    <Label htmlFor="leadRemarks">Remarks</Label>
                    <Input
                      type="text"
                      id="leadRemarks"
                      value={leadRemarks}
                      onChange={(e) => setLeadRemarks(e.target.value)}
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

      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div>
  );
}
