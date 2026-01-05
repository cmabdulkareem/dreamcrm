import PageBreadcrumb from "../../components/common/PageBreadCrumb.jsx";
import PageMeta from "../../components/common/PageMeta.jsx";
import { useState, useContext, useEffect, useMemo, useCallback, useRef } from "react";
import ComponentCard from "../../components/common/ComponentCard.jsx";
import Label from "../../components/form/Label.jsx";
import Input from "../../components/form/input/InputField.jsx";
import PhoneInput from "../../components/form/group-input/PhoneInput.jsx";
import Select from "../../components/form/Select.jsx";
import DatePicker from "../../components/form/date-picker.jsx";
import SearchableCourseSelect from "../../components/form/SearchableCourseSelect.jsx";
import SearchableLeadSelect from "../../components/form/SearchableLeadSelect.jsx";
import Button from "../../components/ui/button/Button.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { AuthContext } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  countries,
  placeOptions,
  enquirerGender,
  enquirerStatus,
  enquirerEducation,
} from "../../data/DataSets.jsx";

import API from "../../config/api";

// Place options removed (now using shared DataSets)

export default function NewStudent() {
  const { user, selectedBrand: globalSelectedBrand } = useContext(AuthContext);
  const navigate = useNavigate();
  const { addNotification, areToastsEnabled } = useNotifications();

  // Controlled states
  const [selectedLead, setSelectedLead] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [place, setPlace] = useState("Kasaragod");
  const [otherPlace, setOtherPlace] = useState("");
  const [address, setAddress] = useState("");
  const [aadharCardNumber, setAadharCardNumber] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [status, setStatus] = useState("");
  const [education, setEducation] = useState("");
  const [coursePreference, setCoursePreference] = useState(""); // Primary course
  const [additionalCourses, setAdditionalCourses] = useState([]); // Additional courses
  const [discountPercentage, setDiscountPercentage] = useState(""); // Discount percentage
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentId, setStudentId] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [convertedLeads, setConvertedLeads] = useState([]);
  const [courses, setCourses] = useState([]); // Course data from API
  const [brands, setBrands] = useState([]); // Brand data from API
  const [selectedBrand, setSelectedBrand] = useState(globalSelectedBrand?._id || ""); // Selected brand
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Validation error states
  const [validationErrors, setValidationErrors] = useState({});

  // Refs for file input
  const fileInputRef = useRef(null);

  // Fetch converted leads
  useEffect(() => {
    fetchConvertedLeads();
    fetchCourses(); // Fetch courses for value calculation
    fetchBrands(); // Fetch brands for selection
  }, []);

  // Sync with global selected brand if it changes or initializes
  useEffect(() => {
    if (globalSelectedBrand?._id && !selectedBrand) {
      setSelectedBrand(globalSelectedBrand._id);
    }
  }, [globalSelectedBrand, selectedBrand]);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/courses/all`, { withCredentials: true });
      setCourses(response.data.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  }, []);

  const fetchConvertedLeads = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/customers/converted`,
        { withCredentials: true }
      );

      // Filter to ensure only converted leads are shown (extra safety check)
      const convertedLeads = response.data.customers.filter(lead =>
        lead.leadStatus === 'converted'
      );

      setConvertedLeads(convertedLeads);
    } catch (error) {
      console.error("Error fetching converted leads:", error);
      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        toast.error("Please login to view converted leads");
      } else {
        // Use mock data for demonstration if API fails
        const mockLeads = [
          {
            _id: "1",
            fullName: "John Doe",
            email: "john@example.com",
            phone1: "+1 234 567 8900",
            leadStatus: "converted"
          },
          {
            _id: "2",
            fullName: "Jane Smith",
            email: "jane@example.com",
            phone1: "+1 234 567 8901",
            leadStatus: "converted"
          }
        ];
        setConvertedLeads(mockLeads);
        toast.info("Using demo data for demonstration");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/brands`, { withCredentials: true });
      setBrands(response.data.brands || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to fetch brands");
    }
  }, []);

  // Memoized lead options
  const leadOptions = useMemo(() => {
    return convertedLeads.map(lead => ({
      value: lead._id,
      label: `${lead.fullName} (${lead.email})`
    }));
  }, [convertedLeads]);

  // Calculate total course value
  const calculateTotalValue = useCallback(() => {
    let total = 0;

    // Add primary course value
    if (coursePreference) {
      const primaryCourse = courses.find(course => course._id === coursePreference);
      if (primaryCourse) {
        total += primaryCourse.normalFee || 0;
      }
    }

    // Add additional courses values
    additionalCourses.forEach(courseId => {
      const course = courses.find(course => course._id === courseId);
      if (course) {
        total += course.normalFee || 0;
      }
    });

    return total;
  }, [coursePreference, additionalCourses, courses]);

  // Calculate discount amount
  const calculateDiscountAmount = useCallback(() => {
    const total = calculateTotalValue();
    const discount = parseFloat(discountPercentage) || 0;
    return (total * discount / 100);
  }, [calculateTotalValue, discountPercentage]);

  // Calculate final amount after discount
  const calculateFinalAmount = useCallback(() => {
    const total = calculateTotalValue();
    const discount = calculateDiscountAmount();
    return total - discount;
  }, [calculateTotalValue, calculateDiscountAmount]);

  // Add additional course
  const handleAddAdditionalCourse = () => {
    setAdditionalCourses([...additionalCourses, ""]);
  };

  // Remove additional course
  const handleRemoveAdditionalCourse = (index) => {
    const newCourses = [...additionalCourses];
    newCourses.splice(index, 1);
    setAdditionalCourses(newCourses);
  };

  // Update additional course
  const handleAdditionalCourseChange = (index, courseId) => {
    const newCourses = [...additionalCourses];
    newCourses[index] = courseId;
    setAdditionalCourses(newCourses);
  };

  const handleLeadChange = useCallback((leadId) => {
    setSelectedLead(leadId);

    // Populate form fields with lead data
    if (leadId && leadId !== "no_lead") {
      const lead = convertedLeads.find(l => l._id === leadId);
      if (lead) {
        setFullName(lead.fullName || "");
        setEmail(lead.email || "");
        setPhone1(lead.phone1 || "");
        setPhone2(lead.phone2 || "");
        setGender(lead.gender || "");
        setDob(lead.dob ? new Date(lead.dob).toISOString().split('T')[0] : "");
        setPlace(lead.place || "");
        setOtherPlace(lead.otherPlace || "");
        setStatus(lead.status || "");
        setEducation(lead.education || "");
        setCoursePreference("");
        setAdditionalCourses([]);
      }
    } else {
      // Clear form if no lead selected or "Add without lead" selected
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
      setCoursePreference("");
      setAdditionalCourses([]);
    }
  }, [convertedLeads]);

  // Handle enrollment date change and auto-generate student ID
  const handleEnrollmentDateChange = (date, str) => {
    setEnrollmentDate(str);
  };

  // Auto-generate student ID when brand or enrollment date changes
  useEffect(() => {
    const fetchNextStudentId = async () => {
      if (selectedBrand && enrollmentDate) {
        try {
          const response = await axios.get(
            `${API}/students/get-next-id?brandId=${selectedBrand}&enrollmentDate=${enrollmentDate}`,
            { withCredentials: true }
          );
          setStudentId(response.data.nextStudentId);
        } catch (error) {
          console.error("Error fetching next student ID:", error);
          // Don't toast here to avoid spamming while typing/selecting
        }
      } else {
        setStudentId("");
      }
    };

    fetchNextStudentId();
  }, [selectedBrand, enrollmentDate]);

  const validateEmail = useCallback((value) => {
    const isValidEmail =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    setEmailError(!isValidEmail);
    return isValidEmail;
  }, []);

  const handleEmailChange = useCallback((e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  }, [validateEmail]);

  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    setPhoto(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Reset the whole form
  const handleClear = useCallback(() => {
    setSelectedLead("");
    setFullName("");
    setEmail("");
    setPhone1("");
    setPhone2("");
    setGender("");
    setDob("");
    setPlace("");
    setOtherPlace("");
    setAddress("");
    setAadharCardNumber("");
    setPhoto(null);
    setPhotoPreview("");
    setStatus("");
    setEducation("");
    setCoursePreference("");
    setAdditionalCourses([]);
    setDiscountPercentage("");
    setEnrollmentDate("");
    setStudentId("");
    setSelectedBrand("");
    setEmailError(false);
    setValidationErrors({});
  }, []);

  // Validate mandatory fields
  const validateForm = useCallback(() => {
    const errors = {};

    if (!selectedLead) {
      errors.selectedLead = "Please select a converted lead or 'Add without lead'";
    } else if (selectedLead !== "no_lead") {
      // Additional validation to ensure selected lead is converted
      const selectedLeadData = convertedLeads.find(lead => lead._id === selectedLead);
      if (selectedLeadData && selectedLeadData.leadStatus !== 'converted') {
        errors.selectedLead = "Selected lead is not in converted status";
      }
    }

    if (!fullName.trim()) {
      errors.fullName = "Full Name is required";
    }

    if (!selectedBrand) {
      errors.selectedBrand = "Please select a brand";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
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

    if (!address.trim()) {
      errors.address = "Address is required";
    }

    if (!aadharCardNumber.trim()) {
      errors.aadharCardNumber = "Aadhar Card Number is required";
    } else if (!/^\d{12}$/.test(aadharCardNumber)) {
      errors.aadharCardNumber = "Aadhar Card Number must be 12 digits";
    }

    if (!coursePreference) {
      errors.coursePreference = "Primary course is required. Please select a course from the course management database.";
    }

    // Validate additional courses
    additionalCourses.forEach((courseId, index) => {
      if (!courseId) {
        errors[`additionalCourse${index}`] = `Additional course ${index + 1} is required`;
      }
    });

    if (!enrollmentDate) {
      errors.enrollmentDate = "Enrollment date is required";
    }

    if (!studentId.trim()) {
      errors.studentId = "Student ID is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [
    selectedLead,
    fullName,
    selectedBrand,
    email,
    phone1,
    place,
    otherPlace,
    address,
    aadharCardNumber,
    coursePreference,
    additionalCourses,
    enrollmentDate,
    studentId,
    convertedLeads,
    validateEmail
  ]);

  // Handle submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      if (areToastsEnabled()) {
        toast.error("Please fill in all required fields");
      }
      return;
    }

    try {
      setSubmitting(true);

      // Create form data for file upload
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("phone1", phone1);
      formData.append("phone2", phone2);
      formData.append("gender", gender);
      formData.append("dob", dob);
      formData.append("place", place === "Other" ? otherPlace : place);
      formData.append("otherPlace", place === "Other" ? otherPlace : "");
      formData.append("address", address);
      formData.append("aadharCardNumber", aadharCardNumber);
      formData.append("status", status);
      formData.append("education", education);
      formData.append("coursePreference", coursePreference);
      formData.append("additionalCourses", JSON.stringify(additionalCourses.filter(course => course))); // Filter out empty values
      formData.append("totalCourseValue", calculateTotalValue());
      formData.append("discountPercentage", discountPercentage || 0);
      formData.append("discountAmount", calculateDiscountAmount());
      formData.append("finalAmount", calculateFinalAmount());
      formData.append("enrollmentDate", enrollmentDate);
      formData.append("leadId", selectedLead === "no_lead" ? "" : selectedLead);
      formData.append("brandId", selectedBrand);
      if (photo) {
        formData.append("photo", photo);
      }

      const response = await axios.post(
        `${API}/students/create`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.status === 201) {
        if (areToastsEnabled()) {
          toast.success("Student created successfully!");
        }

        // Add notification
        addNotification({
          type: 'student_created',
          userName: user?.fullName || 'Someone',
          avatar: user?.avatar || null,
          action: 'created student',
          entityName: fullName,
          module: 'Student Management',
        });

        handleClear();
        navigate("/manage-students");
      }
    } catch (error) {
      console.error("Error creating student:", error);
      if (areToastsEnabled()) {
        if (error.response && error.response.data && error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Failed to create student. Please try again.");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    validateForm,
    studentId,
    fullName,
    email,
    phone1,
    phone2,
    gender,
    dob,
    place,
    otherPlace,
    address,
    aadharCardNumber,
    status,
    education,
    coursePreference,
    additionalCourses,
    calculateTotalValue,
    discountPercentage,
    calculateDiscountAmount,
    calculateFinalAmount,
    enrollmentDate,
    selectedLead,
    selectedBrand,
    photo,
    handleClear,
    navigate,
    areToastsEnabled
  ]);

  return (
    <div>
      <PageMeta
        title="New Student | DreamCRM"
        description="Add new student here"
      />
      <PageBreadcrumb pageTitle="New Student" />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            <ComponentCard title="Student Information">
              <div className="space-y-6">
                {/* Lead Selection and Basic Info */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/4">
                    <Label>Select Converted Lead *</Label>
                    {loading ? (
                      <div className="flex items-center justify-center h-10 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <LoadingSpinner className="" size="h-5 w-5" />
                        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading converted leads...</span>
                      </div>
                    ) : (
                      <SearchableLeadSelect
                        leads={convertedLeads}
                        value={selectedLead}
                        onChange={handleLeadChange}
                        placeholder="Search and select a converted lead"
                        error={!!validationErrors.selectedLead}
                        disabled={loading}
                      />
                    )}
                  </div>

                  <div className="w-full md:w-1/4">
                    <Label htmlFor="firstName">Full Name *</Label>
                    <Input
                      type="text"
                      id="firstName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      error={!!validationErrors.fullName}
                      hint={validationErrors.fullName}
                      disabled={!!selectedLead && selectedLead !== "no_lead"}
                    />
                  </div>

                  <div className="w-full md:w-1/4">
                    <Label htmlFor="brand">Brand *</Label>
                    <Select
                      options={brands.map(b => ({ value: b._id, label: `${b.name} (${b.code})` }))}
                      value={selectedBrand}
                      placeholder="Select Brand"
                      onChange={setSelectedBrand}
                      error={!!validationErrors.selectedBrand}
                    />
                  </div>

                  <div className="w-full md:w-1/4">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={email}
                      error={emailError || !!validationErrors.email}
                      onChange={handleEmailChange}
                      placeholder="Enter your email"
                      hint={validationErrors.email || (emailError ? "This is an invalid email address." : "")}
                      disabled={!!selectedLead && selectedLead !== "no_lead"}
                    />
                  </div>

                  {/* Photo Upload - Minimal Implementation - Top Right Corner */}
                  <div className="w-full md:w-1/4">
                    <Label>Student Photo</Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={triggerFileSelect}
                        className="w-20 h-20 overflow-hidden border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-brand-500 transition-colors flex items-center justify-center"
                      >
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhoto(null);
                            setPhotoPreview("");
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phone Numbers */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/4">
                    <Label>Phone *</Label>
                    <PhoneInput
                      selectPosition="end"
                      countries={countries}
                      placeholder="+91 98765 43210"
                      value={phone1}
                      onChange={setPhone1}
                      error={!!validationErrors.phone1}
                      hint={validationErrors.phone1}
                      disabled={!!selectedLead && selectedLead !== "no_lead"}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Phone (optional)</Label>
                    <PhoneInput
                      selectPosition="end"
                      countries={countries}
                      placeholder="+91 98765 43210"
                      value={phone2}
                      onChange={setPhone2}
                      disabled={!!selectedLead && selectedLead !== "no_lead"}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Gender</Label>
                    <Select
                      options={enquirerGender}
                      value={gender}
                      placeholder="Select Gender"
                      onChange={setGender}
                      disabled={!!selectedLead && selectedLead !== "no_lead"}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <DatePicker
                      id="dob"
                      label="Date of Birth"
                      value={dob}
                      onChange={(date, str) => setDob(str)}
                      disabled={!!selectedLead && selectedLead !== "no_lead"}
                    />
                  </div>


                </div>

                {/* Gender, DoB, Place */}
                <div className="flex flex-col md:flex-row gap-4">

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
                    <Label htmlFor="otherPlace">Specify other *</Label>
                    <Input
                      type="text"
                      id="otherPlace"
                      value={otherPlace}
                      onChange={(e) => setOtherPlace(e.target.value)}
                      error={place === "Other" && !otherPlace.trim() && !!validationErrors.otherPlace}
                      hint={place === "Other" && !otherPlace.trim() ? validationErrors.otherPlace : ""}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      type="text"
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      error={!!validationErrors.address}
                      hint={validationErrors.address}
                      placeholder="Enter full address"
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label htmlFor="aadharCardNumber">Aadhar Card Number *</Label>
                    <Input
                      type="text"
                      id="aadharCardNumber"
                      value={aadharCardNumber}
                      onChange={(e) => setAadharCardNumber(e.target.value.replace(/\D/g, ''))}
                      error={!!validationErrors.aadharCardNumber}
                      hint={validationErrors.aadharCardNumber}
                      placeholder="Enter 12-digit Aadhar number"
                      maxLength="12"
                    />
                  </div>
                </div>

                {/* Status, Education, Course Preference */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/4">
                    <Label>Current Status</Label>
                    <Select
                      options={enquirerStatus}
                      value={status}
                      placeholder="Select Status"
                      onChange={setStatus}
                      disabled={!!selectedLead && selectedLead !== "no_lead"}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Education</Label>
                    <Select
                      options={enquirerEducation}
                      value={education}
                      placeholder="Select Education"
                      onChange={setEducation}
                      disabled={!!selectedLead && selectedLead !== "no_lead"}
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <Label>Primary Course *</Label>
                    <SearchableCourseSelect
                      value={coursePreference}
                      onChange={setCoursePreference}
                      placeholder="Search and select a course..."
                      error={!!validationErrors.coursePreference}
                    />
                  </div>
                </div>

                {/* Additional Courses */}
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <Label>Additional Courses *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAdditionalCourse}
                    >
                      Add Course
                    </Button>
                  </div>

                  {additionalCourses.map((courseId, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-grow">
                        <SearchableCourseSelect
                          value={courseId}
                          onChange={(value) => handleAdditionalCourseChange(index, value)}
                          placeholder="Search and select an additional course..."
                          error={!!validationErrors[`additionalCourse${index}`]}
                          hint={validationErrors[`additionalCourse${index}`]}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAdditionalCourse(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Course Value Calculation */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Total Course Value (₹)</Label>
                    <Input
                      type="text"
                      value={calculateTotalValue()}
                      readOnly
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <Label>Discount Percentage (%)</Label>
                    <Input
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label>Discount Amount (₹)</Label>
                    <Input
                      type="text"
                      value={calculateDiscountAmount()}
                      readOnly
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <Label>Final Amount (₹)</Label>
                    <Input
                      type="text"
                      value={calculateFinalAmount()}
                      readOnly
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                </div>

                {/* Enrollment Date and Student ID */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2">
                    <DatePicker
                      id="enrollmentDate"
                      label="Enrollment Date"
                      placeholder="Select a date"
                      value={enrollmentDate}
                      onChange={handleEnrollmentDateChange}
                      error={!!validationErrors.enrollmentDate}
                      hint={validationErrors.enrollmentDate}
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <Label htmlFor="studentId">Student ID (Auto-generated)</Label>
                    <Input
                      type="text"
                      id="studentId"
                      value={studentId}
                      readOnly
                      placeholder="Select Brand & Date"
                      className="bg-gray-100 dark:bg-gray-700 font-mono"
                      error={!!validationErrors.studentId}
                      hint={validationErrors.studentId}
                    />
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-end mt-6">
          <Button
            type="button"
            onClick={handleClear}
            variant="outline"
            disabled={submitting}
          >
            Clear
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Saving...
              </span>
            ) : "Save Student"}
          </Button>
        </div>
      </form>

      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div >
  );
}

