import PageBreadcrumb from "../../components/common/PageBreadCrumb.jsx";
import PageMeta from "../../components/common/PageMeta.jsx";
import {
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import ComponentCard from "../../components/common/ComponentCard.jsx";
import Label from "../../components/form/Label.jsx";
import Input from "../../components/form/input/InputField.jsx";
import PhoneInput from "../../components/form/group-input/PhoneInput.jsx";
import Select from "../../components/form/Select.jsx";
import DatePicker from "../../components/form/date-picker.jsx";
import SearchableCourseSelect from "../../components/form/SearchableCourseSelect.jsx";
import SearchableModuleSelect from "../../components/form/SearchableModuleSelect.jsx";
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
  const [place, setPlace] = useState("");
  const [otherPlace, setOtherPlace] = useState("");
  const [address, setAddress] = useState("");
  const [aadharCardNumber, setAadharCardNumber] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [status, setStatus] = useState("");
  const [education, setEducation] = useState("");
  const [coursePreference, setCoursePreference] = useState(""); // Primary course
  const [primaryCourseFee, setPrimaryCourseFee] = useState({
    basePrice: 0,
    discountPercentage: 0,
    discountAmount: 0,
    finalAmount: 0,
    feeType: "normal", // 'singleShot' or 'normal'
  });
  const [additionalCourses, setAdditionalCourses] = useState([]); // Array of { courseId, basePrice, discountPercentage, discountAmount, finalAmount, feeType }
  const [enrollmentDate, setEnrollmentDate] = useState("");
  const [studentId, setStudentId] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [convertedLeads, setConvertedLeads] = useState([]);
  const [courses, setCourses] = useState([]); // Course data from API
  const [selectedBrand, setSelectedBrand] = useState(
    globalSelectedBrand?._id || "",
  ); // Selected brand
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]); // Modules for student
  const [brandModules, setBrandModules] = useState([]); // All modules for selected brand
  const [complimentaryModules, setComplimentaryModules] = useState([]); // Array of { moduleId, basePrice, discountPercentage, discountAmount, finalAmount }
  const [remarks, setRemarks] = useState("");

  // Section collapse states
  const [collapsedSections, setCollapsedSections] = useState({
    primary: false,
    personal: false,
    academic: false,
    courses: false,
  });

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Validation error states
  const [validationErrors, setValidationErrors] = useState({});

  // Auto-expand sections with errors
  useEffect(() => {
    if (Object.keys(validationErrors).length > 0) {
      const newCollapsed = { ...collapsedSections };
      let changed = false;

      // Check primary section fields
      if (
        validationErrors.selectedLead ||
        validationErrors.fullName ||
        validationErrors.email
      ) {
        if (newCollapsed.primary) {
          newCollapsed.primary = false;
          changed = true;
        }
      }

      // Check personal section fields
      if (
        validationErrors.phone1 ||
        validationErrors.place ||
        validationErrors.otherPlace ||
        validationErrors.address ||
        validationErrors.aadharCardNumber
      ) {
        if (newCollapsed.personal) {
          newCollapsed.personal = false;
          changed = true;
        }
      }

      // Check academic section fields
      if (validationErrors.enrollmentDate || validationErrors.studentId) {
        if (newCollapsed.academic) {
          newCollapsed.academic = false;
          changed = true;
        }
      }

      // Check courses section fields
      if (
        validationErrors.coursePreference ||
        Object.keys(validationErrors).some((k) => k.startsWith("additionalCourse"))
      ) {
        if (newCollapsed.courses) {
          newCollapsed.courses = false;
          changed = true;
        }
      }

      if (changed) {
        setCollapsedSections(newCollapsed);
      }
    }
  }, [validationErrors]);

  // Refs for file input
  const fileInputRef = useRef(null);

  // Fetch converted leads when selectedBrand changes
  useEffect(() => {
    fetchConvertedLeads();
  }, [selectedBrand]);

  // Refetch courses when selectedBrand changes
  useEffect(() => {
    if (selectedBrand) {
      fetchCourses();
    } else {
      setCourses([]);
    }
  }, [selectedBrand]);

  // Sync with global selected brand if it changes or initializes
  useEffect(() => {
    if (globalSelectedBrand?._id && !selectedBrand) {
      setSelectedBrand(globalSelectedBrand._id);
    }
  }, [globalSelectedBrand, selectedBrand]);

  const fetchCourses = useCallback(async () => {
    try {
      if (!selectedBrand) return;
      const response = await axios.get(`${API}/courses/all`, {
        withCredentials: true,
        headers: { "x-brand-id": selectedBrand },
      });
      setCourses(response.data.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  }, [selectedBrand]);

  const fetchConvertedLeads = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/customers/converted`, {
        withCredentials: true,
        headers: { "x-brand-id": selectedBrand },
      });

      // Filter to ensure only converted leads are shown (extra safety check)
      const convertedLeads = response.data.customers.filter(
        (lead) => lead.leadStatus === "converted",
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
            leadStatus: "converted",
          },
          {
            _id: "2",
            fullName: "Jane Smith",
            email: "jane@example.com",
            phone1: "+1 234 567 8901",
            leadStatus: "converted",
          },
        ];
        setConvertedLeads(mockLeads);
        toast.info("Using demo data for demonstration");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedBrand]);


  const fetchBrandModules = useCallback(async () => {
    try {
      if (!selectedBrand) return;
      const response = await axios.get(`${API}/modules/all`, {
        withCredentials: true,
        headers: { "x-brand-id": selectedBrand },
      });
      setBrandModules(response.data.modules || []);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  }, [selectedBrand]);

  // Sync brand modules when selectedBrand changes
  useEffect(() => {
    fetchBrandModules();
  }, [selectedBrand, fetchBrandModules]);

  // Memoized lead options
  const leadOptions = useMemo(() => {
    return convertedLeads.map((lead) => ({
      value: lead._id,
      label: `${lead.fullName} (${lead.email})`,
    }));
  }, [convertedLeads]);

  // Calculate total course value (Sum of base prices)
  const calculateTotalBaseValue = useCallback(() => {
    let total = parseFloat(primaryCourseFee.basePrice) || 0;
    additionalCourses.forEach((item) => {
      total += parseFloat(item.basePrice) || 0;
    });
    complimentaryModules.forEach((item) => {
      total += parseFloat(item.basePrice) || 0;
    });
    return total.toFixed(2);
  }, [primaryCourseFee.basePrice, additionalCourses, complimentaryModules]);

  // Calculate total discount amount
  const calculateTotalDiscount = useCallback(() => {
    let total = parseFloat(primaryCourseFee.discountAmount) || 0;
    additionalCourses.forEach((item) => {
      total += parseFloat(item.discountAmount) || 0;
    });
    complimentaryModules.forEach((item) => {
      total += parseFloat(item.discountAmount) || 0;
    });
    return total.toFixed(2);
  }, [primaryCourseFee.discountAmount, additionalCourses, complimentaryModules]);

  // Calculate final grand total (Sum of final amounts)
  const calculateGrandTotal = useCallback(() => {
    let total = parseFloat(primaryCourseFee.finalAmount) || 0;
    additionalCourses.forEach((item) => {
      total += parseFloat(item.finalAmount) || 0;
    });
    complimentaryModules.forEach((item) => {
      total += parseFloat(item.finalAmount) || 0;
    });
    return total.toFixed(2);
  }, [primaryCourseFee.finalAmount, additionalCourses, complimentaryModules]);

  // Helper to calculate row fees
  const calculateRowFees = (basePrice, percentage, amount, type) => {
    const bp = parseFloat(basePrice) || 0;
    let p = parseFloat(percentage) || 0;
    let a = parseFloat(amount) || 0;

    if (type === "percentage") {
      a = (bp * p) / 100;
    } else if (type === "amount") {
      p = bp > 0 ? (a / bp) * 100 : 0;
    } else if (type === "base" || type === "sync") {
      a = (bp * p) / 100;
    } else if (type === "final") {
      const final = parseFloat(amount) || 0;
      a = bp - final;
      p = bp > 0 ? (a / bp) * 100 : 0;
    }

    const result = {
      basePrice: bp,
      discountPercentage: p,
      discountAmount: a,
      finalAmount: bp - a,
    };

    // Return strings with fixed decimals for display/calculated fields,
    // but the handlers will override the active field with raw input.
    return {
      basePrice: result.basePrice.toString(),
      discountPercentage: result.discountPercentage.toFixed(2),
      discountAmount: result.discountAmount.toFixed(2),
      finalAmount: result.finalAmount.toFixed(2),
    };
  };

  const handlePrimaryCourseChange = (courseId) => {
    setCoursePreference(courseId);
    if (!courseId) {
      setPrimaryCourseFee({
        basePrice: 0,
        discountPercentage: 0,
        discountAmount: 0,
        finalAmount: 0,
        feeType: "normal",
      });
      return;
    }
    const course = courses.find((c) => c._id === courseId);
    if (course) {
      setPrimaryCourseFee((prev) => {
        const basePrice =
          prev.feeType === "singleShot" ? course.singleShotFee : course.normalFee;
        const fees = calculateRowFees(basePrice, prev.discountPercentage, 0, "base");
        return {
          ...prev,
          ...fees,
          basePrice: basePrice.toString(),
        };
      });
    }
  };

  const handlePrimaryFeeTypeChange = (newFeeType) => {
    if (!coursePreference) {
      setPrimaryCourseFee((prev) => ({ ...prev, feeType: newFeeType }));
      return;
    }
    const course = courses.find((c) => c._id === coursePreference);
    if (course) {
      const basePrice =
        newFeeType === "singleShot" ? course.singleShotFee : course.normalFee;
      setPrimaryCourseFee((prev) => {
        const fees = calculateRowFees(basePrice, prev.discountPercentage, 0, "base");
        return {
          ...prev,
          ...fees,
          feeType: newFeeType,
          basePrice: basePrice.toString(),
        };
      });
    }
  };

  const handlePrimaryFeeChange = (value, type) => {
    setPrimaryCourseFee((prev) => {
      const updated = { ...prev, [type]: value };
      let calcType = "sync";
      if (type === "discountPercentage") calcType = "percentage";
      else if (type === "discountAmount") calcType = "amount";
      else if (type === "finalAmount") calcType = "final";
      else if (type === "basePrice") calcType = "base";

      const fees = calculateRowFees(
        updated.basePrice,
        updated.discountPercentage,
        calcType === "final" ? updated.finalAmount : updated.discountAmount,
        calcType,
      );

      return {
        ...fees,
        feeType: prev.feeType,
        [type]: value, // Preserve raw input string
      };
    });
  };

  const handleAdditionalCourseUpdate = (index, courseId) => {
    const newCourses = [...additionalCourses];
    const course = courses.find((c) => c._id === courseId);
    const basePrice = course
      ? newCourses[index].feeType === "singleShot"
        ? course.singleShotFee
        : course.normalFee
      : 0;

    newCourses[index] = {
      ...newCourses[index],
      courseId,
      basePrice,
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: basePrice,
    };
    setAdditionalCourses(newCourses);
  };

  const handleAdditionalFeeChange = (index, value, type) => {
    const newCourses = [...additionalCourses];
    const item = { ...newCourses[index], [type]: value };

    let calcType = "sync";
    if (type === "discountPercentage") calcType = "percentage";
    else if (type === "discountAmount") calcType = "amount";
    else if (type === "finalAmount") calcType = "final";
    else if (type === "basePrice") calcType = "base";

    const fees = calculateRowFees(
      item.basePrice,
      item.discountPercentage,
      calcType === "final" ? item.finalAmount : item.discountAmount,
      calcType,
    );

    newCourses[index] = {
      ...fees,
      feeType: item.feeType,
      courseId: item.courseId,
      [type]: value, // Preserve raw input string
    };
    setAdditionalCourses(newCourses);
  };

  // Add additional course
  const handleAddAdditionalCourse = () => {
    setAdditionalCourses([
      ...additionalCourses,
      {
        courseId: "",
        basePrice: 0,
        discountPercentage: 0,
        discountAmount: 0,
        finalAmount: 0,
        feeType: "normal",
      },
    ]);
  };

  // Remove additional course
  const handleRemoveAdditionalCourse = (index) => {
    const newCourses = [...additionalCourses];
    newCourses.splice(index, 1);
    setAdditionalCourses(newCourses);
  };

  const handleAdditionalFeeTypeChange = (index, newFeeType) => {
    const newCourses = [...additionalCourses];
    const item = { ...newCourses[index], feeType: newFeeType };
    const course = courses.find((c) => c._id === item.courseId);

    if (course) {
      const basePrice =
        newFeeType === "singleShot" ? course.singleShotFee : course.normalFee;
      newCourses[index] = {
        ...item,
        basePrice,
        feeType: newFeeType,
        ...calculateRowFees(basePrice, item.discountPercentage, 0, "base"),
      };
      setAdditionalCourses(newCourses);
    } else {
      newCourses[index] = { ...item, feeType: newFeeType };
      setAdditionalCourses(newCourses);
    }
  };

  // No global feeType sync needed anymore as it's handled per row

  // Sync selected modules when course selections change
  useEffect(() => {
    const moduleIds = new Set();

    // Check primary course
    if (coursePreference) {
      const course = courses.find((c) => c._id === coursePreference);
      if (course && course.modules) {
        course.modules.forEach((id) => moduleIds.add(id));
      }
    }

    // Check additional courses
    additionalCourses.forEach((item) => {
      if (item.courseId) {
        const course = courses.find((c) => c._id === item.courseId);
        if (course && course.modules) {
          course.modules.forEach((id) => moduleIds.add(id));
        }
      }
    });

    // Check complimentary modules
    complimentaryModules.forEach((item) => {
      if (item.moduleId) {
        moduleIds.add(item.moduleId);
      }
    });

    setSelectedModules(Array.from(moduleIds));
  }, [coursePreference, additionalCourses, complimentaryModules, courses]);

  const getModuleName = (id) => {
    const mod = brandModules.find((m) => m._id === id);
    return mod ? mod.name : "Unknown Module";
  };

  const handleLeadChange = useCallback(
    (leadId) => {
      setSelectedLead(leadId);

      // Populate form fields with lead data
      if (leadId && leadId !== "no_lead") {
        const lead = convertedLeads.find((l) => l._id === leadId);
        if (lead) {
          setFullName(lead.fullName || "");
          setEmail(lead.email || "");
          setPhone1(lead.phone1 || "");
          setPhone2(lead.phone2 || "");
          setGender(lead.gender || "");
          setDob(
            lead.dob ? new Date(lead.dob).toISOString().split("T")[0] : "",
          );
          // Check if lead's place is in standard options
          const standardPlaces = placeOptions.map((p) => p.value);
          if (
            lead.place &&
            !standardPlaces.includes(lead.place) &&
            lead.place !== "Other"
          ) {
            setPlace("Other");
            setOtherPlace(lead.place);
          } else {
            setPlace(lead.place || "Kasaragod");
            setOtherPlace(lead.otherPlace || "");
          }
          // Set brand from the lead if it exists
          if (lead.brand) {
            const brandId = lead.brand._id || lead.brand;
            setSelectedBrand(brandId);
          }

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
    },
    [convertedLeads],
  );

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
            { withCredentials: true },
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

  const handleEmailChange = useCallback(
    (e) => {
      const value = e.target.value;
      setEmail(value);
      validateEmail(value);
    },
    [validateEmail],
  );

  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
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
  const handleComplimentaryModuleUpdate = (index, moduleId) => {
    const newMods = [...complimentaryModules];
    const module = brandModules.find((m) => m._id === moduleId);
    const basePrice = module ? module.price || 0 : 0;

    newMods[index] = {
      ...newMods[index],
      moduleId,
      basePrice,
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: basePrice,
    };
    setComplimentaryModules(newMods);
  };
  const handleComplimentaryFeeChange = (index, value, type) => {
    const newMods = [...complimentaryModules];
    const item = { ...newMods[index], [type]: value };

    let calcType = "sync";
    if (type === "discountPercentage") calcType = "percentage";
    else if (type === "discountAmount") calcType = "amount";
    else if (type === "finalAmount") calcType = "final";
    else if (type === "basePrice") calcType = "base";

    const fees = calculateRowFees(
      item.basePrice,
      item.discountPercentage,
      calcType === "final" ? item.finalAmount : item.discountAmount,
      calcType,
    );

    newMods[index] = {
      ...fees,
      moduleId: item.moduleId,
      [type]: value, // Preserve raw input string
    };
    setComplimentaryModules(newMods);
  };

  const handleAddComplimentaryModule = () => {
    setComplimentaryModules([
      ...complimentaryModules,
      {
        moduleId: "",
        basePrice: 0,
        discountPercentage: 0,
        discountAmount: 0,
        finalAmount: 0,
      },
    ]);
  };

  const handleRemoveComplimentaryModule = (index) => {
    const newMods = [...complimentaryModules];
    newMods.splice(index, 1);
    setComplimentaryModules(newMods);
  };

  const getFullModuleName = (modId) => {
    const mod = brandModules.find((m) => m._id === modId);
    return mod ? mod.name : modId;
  };

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
    setPrimaryCourseFee({
      basePrice: 0,
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: 0,
      feeType: "normal",
    });
    setAdditionalCourses([]);
    setComplimentaryModules([]);
    setRemarks("");
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
      errors.selectedLead =
        "Please select a converted lead or 'Add without lead'";
    } else if (selectedLead !== "no_lead") {
      // Additional validation to ensure selected lead is converted
      const selectedLeadData = convertedLeads.find(
        (lead) => lead._id === selectedLead,
      );
      if (selectedLeadData && selectedLeadData.leadStatus !== "converted") {
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
      errors.coursePreference =
        "Primary course is required. Please select a course from the course management database.";
    }

    // Validate additional courses
    additionalCourses.forEach((item, index) => {
      if (!item.courseId) {
        errors[`additionalCourse${index}`] =
          `Additional course ${index + 1} is required`;
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
    validateEmail,
  ]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e) => {
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
        // Construct breakdown for submission
        const breakdown = [];
        if (coursePreference) {
          const primaryCourse = courses.find((c) => c._id === coursePreference);
          breakdown.push({
            courseId: coursePreference,
            name: primaryCourse?.courseName || "",
            ...primaryCourseFee,
          });
        }
        additionalCourses.forEach((item) => {
          if (item.courseId) {
            const course = courses.find((c) => c._id === item.courseId);
            breakdown.push({
              courseId: item.courseId,
              name: course?.courseName || "",
              ...item,
            });
          }
        });

        complimentaryModules.forEach((item) => {
          if (item.moduleId) {
            const mod = brandModules.find((m) => m._id === item.moduleId);
            breakdown.push({
              moduleId: item.moduleId,
              name: mod?.name || "",
              ...item,
              type: "module",
            });
          }
        });
        formData.append(
          "additionalCourses",
          JSON.stringify(
            additionalCourses.map((i) => i.courseId).filter(Boolean),
          ),
        );
        formData.append("feeBreakdown", JSON.stringify(breakdown));
        formData.append("totalCourseValue", calculateTotalBaseValue());
        formData.append(
          "discountPercentage",
          (
            (calculateTotalDiscount() / calculateTotalBaseValue()) *
            100
          ).toFixed(2) || 0,
        );
        formData.append("discountAmount", calculateTotalDiscount());
        formData.append("finalAmount", calculateGrandTotal());
        formData.append("enrollmentDate", enrollmentDate);
        formData.append(
          "leadId",
          selectedLead === "no_lead" ? "" : selectedLead,
        );
        formData.append("brandId", selectedBrand);
        formData.append("modules", JSON.stringify(selectedModules));
        formData.append("complimentaryModules", JSON.stringify(complimentaryModules.map(m => m.moduleId)));
        formData.append("remarks", remarks);
        if (photo) {
          formData.append("photo", photo);
        }

        const response = await axios.post(`${API}/students/create`, formData, {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.status === 201) {
          if (areToastsEnabled()) {
            toast.success("Student created successfully!");
          }

          // Add notification
          addNotification({
            type: "student_created",
            userName: user?.fullName || "Someone",
            avatar: user?.avatar || null,
            action: "created student",
            entityName: fullName,
            module: "Student Management",
          });

          handleClear();
          navigate("/manage-students");
        }
      } catch (error) {
        console.error("Error creating student:", error);
        if (areToastsEnabled()) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.message
          ) {
            toast.error(error.response.data.message);
          } else {
            toast.error("Failed to create student. Please try again.");
          }
        }
      } finally {
        setSubmitting(false);
      }
    },
    [
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
      calculateTotalBaseValue,
      calculateTotalDiscount,
      calculateGrandTotal,
      enrollmentDate,
      selectedLead,
      selectedBrand,
      photo,
      handleClear,
      navigate,
      areToastsEnabled,
    ],
  );

  return (
    <div>
      <PageMeta
        title="New Student | CDC International"
        description="Add new student here"
      />
      <PageBreadcrumb items={[
        { name: "Home", path: "/" },
        { name: "Student Management", path: "/manage-students" },
        { name: "Manage Students", path: "/manage-students" },
        { name: "New Student" }
      ]} />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            {/* Section 1: Primary Information */}
            <ComponentCard
              title={
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-sm">
                    01
                  </div>
                  <span>Primary Information</span>
                </div>
              }
              action={
                <button
                  type="button"
                  onClick={() => toggleSection("primary")}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${collapsedSections.primary ? "" : "rotate-180"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              }
            >
              {!collapsedSections.primary && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-1/4">
                      <Label>Select Converted Lead *</Label>
                      {loading ? (
                        <div className="flex items-center justify-center h-10 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <LoadingSpinner className="" size="h-5 w-5" />
                          <span className="ml-2 text-gray-500 dark:text-gray-400">
                            Loading converted leads...
                          </span>
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
                        onChange={(e) =>
                          setFullName(e.target.value.toUpperCase())
                        }
                        error={!!validationErrors.fullName}
                        hint={validationErrors.fullName}
                        className="uppercase"
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
                        hint={
                          validationErrors.email ||
                          (emailError
                            ? "This is an invalid email address."
                            : "")
                        }
                      />
                    </div>

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
                </div>
              )}
            </ComponentCard>

            {/* Section 2: Personal & Contact Details */}
            <ComponentCard
              title={
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-sm">
                    02
                  </div>
                  <span>Personal & Contact Details</span>
                </div>
              }
              action={
                <button
                  type="button"
                  onClick={() => toggleSection("personal")}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${collapsedSections.personal ? "" : "rotate-180"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              }
            >
              {!collapsedSections.personal && (
                <div className="space-y-6">
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
                      />
                    </div>
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
                        label="Date of Birth"
                        value={dob}
                        onChange={(date, str) => setDob(str)}
                      />
                    </div>
                  </div>

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
                      <Label htmlFor="otherPlace">Specify Other Place *</Label>
                      <Input
                        type="text"
                        id="otherPlace"
                        value={otherPlace}
                        onChange={(e) =>
                          setOtherPlace(e.target.value.toUpperCase())
                        }
                        error={!!validationErrors.otherPlace}
                        hint={validationErrors.otherPlace}
                        placeholder="Enter village/city name"
                        className="uppercase"
                      />
                    </div>
                    <div className="w-full md:w-1/4">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) =>
                          setAddress(e.target.value.toUpperCase())
                        }
                        error={!!validationErrors.address}
                        hint={validationErrors.address}
                        placeholder="Enter full address"
                        className="uppercase"
                      />
                    </div>
                    <div className="w-full md:w-1/4">
                      <Label htmlFor="aadharCardNumber">
                        Aadhar Card Number *
                      </Label>
                      <Input
                        type="text"
                        id="aadharCardNumber"
                        value={aadharCardNumber}
                        onChange={(e) =>
                          setAadharCardNumber(e.target.value.replace(/\D/g, ""))
                        }
                        error={!!validationErrors.aadharCardNumber}
                        hint={validationErrors.aadharCardNumber}
                        placeholder="Enter 12-digit Aadhar number"
                        maxLength="12"
                      />
                    </div>
                  </div>
                </div>
              )}
            </ComponentCard>

            {/* Section 3: Academic & Enrollment Information */}
            <ComponentCard
              title={
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-sm">
                    03
                  </div>
                  <span>Academic & Enrollment</span>
                </div>
              }
              action={
                <button
                  type="button"
                  onClick={() => toggleSection("academic")}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${collapsedSections.academic ? "" : "rotate-180"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              }
            >
              {!collapsedSections.academic && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-1/4">
                      <Label>Current Status</Label>
                      <Select
                        options={enquirerStatus}
                        value={status}
                        placeholder="Select Status"
                        onChange={setStatus}
                      />
                    </div>
                    <div className="w-full md:w-1/4">
                      <Label>Education</Label>
                      <Select
                        options={enquirerEducation}
                        value={education}
                        placeholder="Select Education"
                        onChange={setEducation}
                      />
                    </div>
                    <div className="w-full md:w-1/4">
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
                    <div className="w-full md:w-1/4">
                      <Label htmlFor="studentId">
                        Student ID (Auto-generated)
                      </Label>
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

                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full">
                      <Label htmlFor="remarks">Remarks / Miscellaneous Notes</Label>
                      <textarea
                        id="remarks"
                        rows={3}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                        placeholder="Enter any additional notes about the student..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </ComponentCard>

            {/* Section 4: Course & Fee Management */}
            <ComponentCard
              title={
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-sm">
                    04
                  </div>
                  <span>Course & Fee Management</span>
                </div>
              }
              action={
                <button
                  type="button"
                  onClick={() => toggleSection("courses")}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${collapsedSections.courses ? "" : "rotate-180"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              }
            >
              {!collapsedSections.courses && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full">
                      <Label>Primary Course *</Label>
                      <SearchableCourseSelect
                        value={coursePreference}
                        onChange={handlePrimaryCourseChange}
                        placeholder="Search and select a course..."
                        error={!!validationErrors.coursePreference}
                      />
                    </div>
                  </div>

                  {/* Primary Course Fees */}
                  {coursePreference && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-brand-50/50 dark:bg-brand-500/5 rounded-xl border border-brand-100 dark:border-brand-500/20">
                      <div>
                        <Label>Fee Type</Label>
                        <Select
                          options={[
                            { value: "normal", label: "Normal" },
                            { value: "singleShot", label: "Single Shot" },
                          ]}
                          value={primaryCourseFee.feeType}
                          onChange={handlePrimaryFeeTypeChange}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label>Base Price (₹)</Label>
                        <Input
                          type="number"
                          value={primaryCourseFee.basePrice}
                          onChange={(e) =>
                            handlePrimaryFeeChange(
                              e.target.value,
                              "basePrice",
                            )
                          }
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <Label>Discount (%)</Label>
                        <Input
                          type="number"
                          value={primaryCourseFee.discountPercentage}
                          onChange={(e) =>
                            handlePrimaryFeeChange(
                              e.target.value,
                              "discountPercentage",
                            )
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Discount (₹)</Label>
                        <Input
                          type="number"
                          value={primaryCourseFee.discountAmount}
                          onChange={(e) =>
                            handlePrimaryFeeChange(
                              e.target.value,
                              "discountAmount",
                            )
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Final (₹)</Label>
                        <Input
                          type="number"
                          value={primaryCourseFee.finalAmount}
                          onChange={(e) =>
                            handlePrimaryFeeChange(
                              e.target.value,
                              "finalAmount",
                            )
                          }
                          className="bg-white dark:bg-gray-800 font-bold text-brand-600 dark:text-brand-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Courses */}
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <Label>Additional Courses</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddAdditionalCourse}
                      >
                        Add Course
                      </Button>
                    </div>

                    {additionalCourses.map((item, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-grow">
                            <SearchableCourseSelect
                              value={item.courseId}
                              onChange={(value) =>
                                handleAdditionalCourseUpdate(index, value)
                              }
                              placeholder="Search and select an additional course..."
                              error={
                                !!validationErrors[`additionalCourse${index}`]
                              }
                              hint={
                                validationErrors[`additionalCourse${index}`]
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveAdditionalCourse(index)}
                            className="h-[46px]"
                          >
                            Remove
                          </Button>
                        </div>

                        {item.courseId && (
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm ml-4">
                            <div>
                              <Label className="text-xs">Fee Type</Label>
                              <Select
                                options={[
                                  { value: "normal", label: "Normal" },
                                  { value: "singleShot", label: "Single Shot" },
                                ]}
                                value={item.feeType}
                                onChange={(value) =>
                                  handleAdditionalFeeTypeChange(index, value)
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Base Price (₹)</Label>
                              <Input
                                type="number"
                                value={item.basePrice}
                                onChange={(e) =>
                                  handleAdditionalFeeChange(
                                    index,
                                    e.target.value,
                                    "basePrice",
                                  )
                                }
                                className="h-9 text-sm bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Discount (%)</Label>
                              <Input
                                type="number"
                                value={item.discountPercentage}
                                onChange={(e) =>
                                  handleAdditionalFeeChange(
                                    index,
                                    e.target.value,
                                    "discountPercentage",
                                  )
                                }
                                placeholder="0.00"
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Discount (₹)</Label>
                              <Input
                                type="number"
                                value={item.discountAmount}
                                onChange={(e) =>
                                  handleAdditionalFeeChange(
                                    index,
                                    e.target.value,
                                    "discountAmount",
                                  )
                                }
                                placeholder="0"
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-bold text-gray-600 dark:text-gray-400">Final (₹)</Label>
                              <Input
                                type="number"
                                value={item.finalAmount}
                                onChange={(e) =>
                                  handleAdditionalFeeChange(
                                    index,
                                    e.target.value,
                                    "finalAmount",
                                  )
                                }
                                className="h-9 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Complimentary Modules */}
                  <div className="flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Label className="!mb-0">Complimentary Modules</Label>
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          Complimentary
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddComplimentaryModule}
                      >
                        Add Module
                      </Button>
                    </div>

                    {complimentaryModules.map((item, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-grow">
                            <SearchableModuleSelect
                              brandId={selectedBrand}
                              value={item.moduleId}
                              onChange={(value) =>
                                handleComplimentaryModuleUpdate(index, value)
                              }
                              placeholder="Search and select a complimentary module..."
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveComplimentaryModule(index)}
                            className="h-[46px]"
                          >
                            Remove
                          </Button>
                        </div>

                        {item.moduleId && (
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-3 bg-green-50/30 dark:bg-green-500/5 rounded-lg border border-green-100 dark:border-green-500/10 shadow-sm ml-4">
                            <div>
                              <Label className="text-xs">Base Price (₹)</Label>
                              <Input
                                type="number"
                                value={item.basePrice}
                                onChange={(e) =>
                                  handleComplimentaryFeeChange(
                                    index,
                                    e.target.value,
                                    "basePrice",
                                  )
                                }
                                placeholder="0"
                                className="h-9 text-sm bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Discount (%)</Label>
                              <Input
                                type="number"
                                value={item.discountPercentage}
                                onChange={(e) =>
                                  handleComplimentaryFeeChange(
                                    index,
                                    e.target.value,
                                    "discountPercentage",
                                  )
                                }
                                placeholder="0.00"
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Discount (₹)</Label>
                              <Input
                                type="number"
                                value={item.discountAmount}
                                onChange={(e) =>
                                  handleComplimentaryFeeChange(
                                    index,
                                    e.target.value,
                                    "discountAmount",
                                  )
                                }
                                placeholder="0"
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-xs font-bold text-green-600 dark:text-green-400">Final (₹)</Label>
                              <Input
                                type="number"
                                value={item.finalAmount}
                                onChange={(e) =>
                                  handleComplimentaryFeeChange(
                                    index,
                                    e.target.value,
                                    "finalAmount",
                                  )
                                }
                                className="h-9 text-sm font-bold text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 border-green-200 dark:border-green-800"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Modules Display Selection */}
                  {selectedModules.length > 0 && (
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <Label className="!mb-0">Selected Course Modules</Label>
                        <span className="text-[10px] text-gray-400 font-medium px-2 py-0.5 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700">
                          {selectedModules.length} Modules
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedModules.map((modId, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mr-2"></div>
                            {getModuleName(modId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Course Value Calculation */}
                  <div className="mt-4 p-5 bg-brand-500/[0.03] dark:bg-brand-500/[0.02] rounded-2xl border-2 border-brand-500/10 dark:border-brand-500/5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-2 h-6 bg-brand-500 rounded-full"></div>
                          Fee Summary
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Total calculated fees across all selected courses
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-8 items-center">
                        <div className="space-y-1">
                          <Label className="!mb-0 text-xs uppercase tracking-wider text-gray-400">
                            Gross Total
                          </Label>
                          <p className="text-xl font-bold text-gray-700 dark:text-gray-200 tabular-nums">
                            ₹{calculateTotalBaseValue().toLocaleString()}
                          </p>
                        </div>

                        <div className="text-xl font-light text-gray-300 dark:text-gray-700 hidden md:block">
                          −
                        </div>

                        <div className="space-y-1">
                          <Label className="!mb-0 text-xs uppercase tracking-wider text-gray-400">
                            Total Discount
                          </Label>
                          <p className="text-xl font-bold text-red-500 tabular-nums">
                            ₹{calculateTotalDiscount().toLocaleString()}
                          </p>
                        </div>

                        <div className="text-xl font-light text-gray-300 dark:text-gray-700 hidden md:block">
                          =
                        </div>

                        <div className="px-6 py-3 bg-white dark:bg-gray-800 rounded-xl border border-brand-500/20 shadow-inner">
                          <div className="space-y-0.5">
                            <Label className="!mb-0 text-[10px] uppercase tracking-widest text-brand-500 font-bold">
                              Grand Total
                            </Label>
                            <p className="text-2xl font-black text-brand-600 dark:text-brand-400 tabular-nums">
                              ₹{calculateGrandTotal().toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Saving...
              </span>
            ) : (
              "Save Student"
            )}
          </Button>
        </div>
      </form>

      <ToastContainer
        position="top-center"
        className="!z-[999999]"
        style={{ zIndex: 999999 }}
      />
    </div>
  );
}
