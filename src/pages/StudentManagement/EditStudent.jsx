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
import Button from "../../components/ui/button/Button.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { AuthContext } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
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

export default function EditStudent() {
  const { id } = useParams();
  const { user, selectedBrand: globalSelectedBrand } = useContext(AuthContext);
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
    feeType: "normal",
  });
  const [additionalCourses, setAdditionalCourses] = useState([]);
  const [enrollmentDate, setEnrollmentDate] = useState("");
  const [studentId, setStudentId] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(globalSelectedBrand?._id || "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]);
  const [brandModules, setBrandModules] = useState([]);
  const [complimentaryModules, setComplimentaryModules] = useState([]);
  const [remarks, setRemarks] = useState("");

  const [collapsedSections, setCollapsedSections] = useState({
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

  const [validationErrors, setValidationErrors] = useState({});

  const fileInputRef = useRef(null);

  // 1. Fetch Student Data initially
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await axios.get(`${API}/students/${id}`, { withCredentials: true });
        const student = response.data.student;
        
        // Populate Student Fields
        setFullName(student.fullName || "");
        setEmail(student.email || "");
        setPhone1(student.phone1 || "");
        setPhone2(student.phone2 || "");
        setGender(student.gender || "");
        setDob(student.dob ? new Date(student.dob).toISOString().split("T")[0] : "");
        
        const standardPlaces = placeOptions.map((p) => p.value);
        if (student.place && !standardPlaces.includes(student.place) && student.place !== "Other") {
          setPlace("Other");
          setOtherPlace(student.place);
        } else {
          setPlace(student.place || "");
          setOtherPlace(student.otherPlace || "");
        }
        
        setAddress(student.address || "");
        setAadharCardNumber(student.aadharCardNumber || "");
        setStatus(student.status || "");
        setEducation(student.education || "");
        setEnrollmentDate(student.enrollmentDate ? new Date(student.enrollmentDate).toISOString().split('T')[0] : "");
        setStudentId(student.studentId || "");
        setRemarks(student.remarks || "");

        // Set Brand first - this will trigger independent course/module fetches
        const brandId = student.brandId?._id || student.brandId || "";
        setSelectedBrand(brandId);

        // Course & Fee Logic - Extract from breakdown
        const studentCoursePrefId = student.coursePreference?._id || student.coursePreference || "";
        
        if (student.feeBreakdown && student.feeBreakdown.length > 0) {
          const breakdown = student.feeBreakdown;
          
          // Primary Course
          const primary = breakdown.find(b => {
             const bCourseId = b.courseId?._id || b.courseId || "";
             return b.type === 'course' && String(bCourseId) === String(studentCoursePrefId);
          });

          if (primary) {
            setCoursePreference(String(studentCoursePrefId));
            setPrimaryCourseFee({
              basePrice: primary.basePrice?.toString() || "0",
              discountPercentage: (primary.discountPercentage || 0).toFixed(2),
              discountAmount: (primary.discountAmount || 0).toFixed(2),
              finalAmount: (primary.finalAmount || 0).toFixed(2),
              feeType: student.feeType || "normal"
            });
          } else {
            setCoursePreference(String(studentCoursePrefId) || "");
          }

          // Additional Courses
          const additional = breakdown.filter(b => {
             const bCourseId = b.courseId?._id || b.courseId || "";
             return b.type === 'course' && String(bCourseId) !== String(studentCoursePrefId);
          });

          setAdditionalCourses(additional.map(a => ({
            courseId: String(a.courseId?._id || a.courseId || ""),
            basePrice: a.basePrice?.toString() || "0",
            discountPercentage: (a.discountPercentage || 0).toFixed(2),
            discountAmount: (a.discountAmount || 0).toFixed(2),
            finalAmount: (a.finalAmount || 0).toFixed(2),
            feeType: a.feeType || "normal"
          })));

          // Complimentary Modules
          const complimentary = breakdown.filter(b => b.type === 'module');
          setComplimentaryModules(complimentary.map(m => ({
            moduleId: String(m.moduleId?._id || m.moduleId || ""),
            basePrice: m.basePrice?.toString() || "0",
            discountPercentage: (m.discountPercentage || 0).toFixed(2),
            discountAmount: (m.discountAmount || 0).toFixed(2),
            finalAmount: (m.finalAmount || 0).toFixed(2)
          })));
        } else {
          setCoursePreference(String(studentCoursePrefId) || "");
        }

        if (student.photo) {
          const baseUrl = API.replace('/api', '');
          setPhotoPreview(`${baseUrl}${student.photo}`);
        }

      } catch (error) {
        console.error("Error fetching student:", error);
        toast.error("Failed to load student data");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [id]);

  // 2. Fetch Courses (Decoupled like NewStudent.jsx)
  const fetchCourses = useCallback(async () => {
    try {
      if (!selectedBrand) return;
      const response = await axios.get(`${API}/courses/all`, {
        withCredentials: true,
        headers: { "x-brand-id": selectedBrand },
      });
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  }, [selectedBrand]);

  useEffect(() => {
    fetchCourses();
  }, [selectedBrand, fetchCourses]);

  // 3. Fetch Modules (Decoupled like NewStudent.jsx)
  const fetchBrandModules = useCallback(async () => {
    try {
      if (!selectedBrand) return;
      const response = await axios.get(`${API}/modules/all`, {
        withCredentials: true,
        headers: { "x-brand-id": selectedBrand },
      });
      setBrandModules(response.data.modules || []);
    } catch (error) {
      console.error("Error fetching brand modules:", error);
    }
  }, [selectedBrand]);

  useEffect(() => {
    fetchBrandModules();
  }, [selectedBrand, fetchBrandModules]);

  // Fee Calculation Logic (Synced with NewStudent.jsx)
  const calculateTotalBaseValue = useCallback(() => {
    let total = parseFloat(primaryCourseFee.basePrice) || 0;
    additionalCourses.forEach((item) => { total += parseFloat(item.basePrice) || 0; });
    complimentaryModules.forEach((item) => { total += parseFloat(item.basePrice) || 0; });
    return total.toFixed(2);
  }, [primaryCourseFee.basePrice, additionalCourses, complimentaryModules]);

  const calculateTotalDiscount = useCallback(() => {
    let total = parseFloat(primaryCourseFee.discountAmount) || 0;
    additionalCourses.forEach((item) => { total += parseFloat(item.discountAmount) || 0; });
    complimentaryModules.forEach((item) => { total += parseFloat(item.discountAmount) || 0; });
    return total.toFixed(2);
  }, [primaryCourseFee.discountAmount, additionalCourses, complimentaryModules]);

  const calculateGrandTotal = useCallback(() => {
    let total = parseFloat(primaryCourseFee.finalAmount) || 0;
    additionalCourses.forEach((item) => { total += parseFloat(item.finalAmount) || 0; });
    complimentaryModules.forEach((item) => { total += parseFloat(item.finalAmount) || 0; });
    return total.toFixed(2);
  }, [primaryCourseFee.finalAmount, additionalCourses, complimentaryModules]);

  const calculateRowFees = (basePrice, percentage, amount, type) => {
    const bp = parseFloat(basePrice) || 0;
    let p = parseFloat(percentage) || 0;
    let a = parseFloat(amount) || 0;

    if (type === "percentage") { a = (bp * p) / 100; }
    else if (type === "amount") { p = bp > 0 ? (a / bp) * 100 : 0; }
    else if (type === "base" || type === "sync") { a = (bp * p) / 100; }
    else if (type === "final") { const final = parseFloat(amount) || 0; a = bp - final; p = bp > 0 ? (a / bp) * 100 : 0; }

    return {
      basePrice: bp.toString(),
      discountPercentage: p.toFixed(2),
      discountAmount: a.toFixed(2),
      finalAmount: (bp - a).toFixed(2),
    };
  };

  const handlePrimaryCourseChange = (courseId) => {
    setCoursePreference(courseId);
    if (!courseId) {
      setPrimaryCourseFee({ basePrice: 0, discountPercentage: 0, discountAmount: 0, finalAmount: 0, feeType: "normal" });
      return;
    }
    const course = courses.find((c) => c._id === courseId);
    if (course) {
      const basePrice = primaryCourseFee.feeType === "singleShot" ? course.singleShotFee : course.normalFee;
      const fees = calculateRowFees(basePrice, primaryCourseFee.discountPercentage, 0, "base");
      setPrimaryCourseFee(prev => ({ ...prev, ...fees, basePrice: basePrice.toString() }));
    }
  };

  const handlePrimaryFeeTypeChange = (newFeeType) => {
    const course = courses.find((c) => c._id === coursePreference);
    if (course) {
      const basePrice = newFeeType === "singleShot" ? course.singleShotFee : course.normalFee;
      const fees = calculateRowFees(basePrice, primaryCourseFee.discountPercentage, 0, "base");
      setPrimaryCourseFee(prev => ({ ...prev, ...fees, feeType: newFeeType, basePrice: basePrice.toString() }));
    } else {
      setPrimaryCourseFee(prev => ({ ...prev, feeType: newFeeType }));
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

      const fees = calculateRowFees(updated.basePrice, updated.discountPercentage, calcType === "final" ? updated.finalAmount : updated.discountAmount, calcType);
      return { ...fees, feeType: prev.feeType, [type]: value };
    });
  };

  const handleAdditionalCourseUpdate = (index, courseId) => {
    const newCourses = [...additionalCourses];
    const course = courses.find((c) => c._id === courseId);
    const basePrice = course ? (newCourses[index].feeType === "singleShot" ? course.singleShotFee : course.normalFee) : 0;
    newCourses[index] = { ...newCourses[index], courseId, basePrice, discountPercentage: 0, discountAmount: 0, finalAmount: basePrice };
    setAdditionalCourses(newCourses);
  };

  const handleAdditionalFeeChange = (index, value, type) => {
    const newCourses = [...additionalCourses];
    const item = { ...newCourses[index], [type]: value };
    let calcType = type === "discountPercentage" ? "percentage" : type === "discountAmount" ? "amount" : type === "finalAmount" ? "final" : "base";
    const fees = calculateRowFees(item.basePrice, item.discountPercentage, calcType === "final" ? item.finalAmount : item.discountAmount, calcType);
    newCourses[index] = { ...fees, feeType: item.feeType, courseId: item.courseId, [type]: value };
    setAdditionalCourses(newCourses);
  };

  const handleAddAdditionalCourse = () => {
    setAdditionalCourses([...additionalCourses, { courseId: "", basePrice: 0, discountPercentage: 0, discountAmount: 0, finalAmount: 0, feeType: "normal" }]);
  };

  const handleRemoveAdditionalCourse = (index) => {
    setAdditionalCourses(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdditionalFeeTypeChange = (index, newFeeType) => {
    const newCourses = [...additionalCourses];
    const item = { ...newCourses[index], feeType: newFeeType };
    const course = courses.find((c) => c._id === item.courseId);
    const basePrice = course ? (newFeeType === "singleShot" ? course.singleShotFee : course.normalFee) : 0;
    newCourses[index] = { ...item, basePrice, feeType: newFeeType, ...calculateRowFees(basePrice, item.discountPercentage, 0, "base") };
    setAdditionalCourses(newCourses);
  };

  // Module Sync logic - IDENTICAL to NewStudent.jsx
  useEffect(() => {
    const moduleIds = new Set();
    
    // Check primary course
    if (coursePreference) {
      const course = courses.find((c) => String(c._id) === String(coursePreference));
      if (course && course.modules) {
        course.modules.forEach((id) => moduleIds.add(id));
      }
    }
    
    // Check additional courses
    additionalCourses.forEach((item) => {
      if (item.courseId) {
        const course = courses.find((c) => String(c._id) === String(item.courseId));
        if (course && course.modules) {
          course.modules.forEach((id) => moduleIds.add(id));
        }
      }
    });
    
    // Check complimentary modules
    complimentaryModules.forEach((item) => { 
      if (item.moduleId) moduleIds.add(item.moduleId); 
    });
    
    setSelectedModules(Array.from(moduleIds));
  }, [coursePreference, additionalCourses, complimentaryModules, courses]);

  const getModuleName = (id) => {
    const mod = brandModules.find((m) => m._id === id);
    return mod ? mod.name : "Unknown Module";
  };

  const getCourseName = (id) => {
    const course = courses.find((c) => c._id === id);
    return course ? `${course.courseCode} - ${course.courseName}` : "";
  };

  const handleComplimentaryModuleUpdate = (index, moduleId) => {
    const newMods = [...complimentaryModules];
    const module = brandModules.find((m) => m._id === moduleId);
    const basePrice = module?.price || 0;
    newMods[index] = { ...newMods[index], moduleId, basePrice, discountPercentage: 0, discountAmount: 0, finalAmount: basePrice };
    setComplimentaryModules(newMods);
  };

  const handleComplimentaryFeeChange = (index, value, type) => {
    const newMods = [...complimentaryModules];
    const item = { ...newMods[index], [type]: value };
    let calcType = type === "discountPercentage" ? "percentage" : type === "discountAmount" ? "amount" : type === "finalAmount" ? "final" : "base";
    const fees = calculateRowFees(item.basePrice, item.discountPercentage, calcType === "final" ? item.finalAmount : item.discountAmount, calcType);
    newMods[index] = { ...fees, moduleId: item.moduleId, [type]: value };
    setComplimentaryModules(newMods);
  };

  const handleAddComplimentaryModule = () => {
    setComplimentaryModules([...complimentaryModules, { moduleId: "", basePrice: 0, discountPercentage: 0, discountAmount: 0, finalAmount: 0 }]);
  };

  const handleRemoveComplimentaryModule = (index) => {
    setComplimentaryModules(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File size exceeds 5MB limit"); return; }
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!fullName.trim()) errors.fullName = "Full Name is required";
    if (!email.trim()) errors.email = "Email is required";
    if (!phone1.trim()) errors.phone1 = "Phone is required";
    if (!place) { errors.place = "Place is required"; } else if (place === "Other" && !otherPlace.trim()) { errors.otherPlace = "Please specify the place"; }
    if (!address.trim()) errors.address = "Address is required";
    if (!aadharCardNumber.trim()) { errors.aadharCardNumber = "Aadhar Card Number is required"; } else if (!/^\d{12}$/.test(aadharCardNumber)) { errors.aadharCardNumber = "Aadhar Card Number must be 12 digits"; }
    if (!coursePreference) errors.coursePreference = "Primary course is required";
    if (!enrollmentDate) errors.enrollmentDate = "Enrollment date is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [fullName, email, phone1, place, otherPlace, address, aadharCardNumber, coursePreference, enrollmentDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { toast.error("Please fill in all required fields"); return; }

    try {
      setSubmitting(true);
      const formData = new FormData();
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
      formData.append("enrollmentDate", enrollmentDate);
      formData.append("brandId", selectedBrand);
      formData.append("remarks", remarks);
      formData.append("studentId", studentId);
      formData.append("totalCourseValue", calculateTotalBaseValue());
      formData.append("discountPercentage", ((calculateTotalDiscount() / calculateTotalBaseValue()) * 100).toFixed(2) || 0);
      formData.append("discountAmount", calculateTotalDiscount());
      formData.append("finalAmount", calculateGrandTotal());
      formData.append("feeType", primaryCourseFee.feeType);
      formData.append("modules", JSON.stringify(selectedModules));
      formData.append("complimentaryModules", JSON.stringify(complimentaryModules.map(m => m.moduleId)));

      const feeBreakdown = [
        { courseId: coursePreference, name: courses.find(c => c._id === coursePreference)?.courseName || "", ...primaryCourseFee, type: 'course' },
        ...additionalCourses.filter(c => c.courseId).map(c => ({ courseId: c.courseId, name: courses.find(course => course._id === c.courseId)?.courseName || "", ...c, type: 'course' })),
        ...complimentaryModules.filter(m => m.moduleId).map(m => ({ moduleId: m.moduleId, name: brandModules.find(mod => mod._id === m.moduleId)?.name || "", ...m, type: 'module' }))
      ];
      formData.append("feeBreakdown", JSON.stringify(feeBreakdown));

      if (photo) formData.append("photo", photo);

      await axios.put(`${API}/students/update/${id}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Student updated successfully!");
      addNotification({
        type: 'student_updated',
        userName: user?.fullName || 'Someone',
        action: 'updated student',
        entityName: fullName,
        module: 'Student Management',
      });
      navigate("/manage-students");
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error(error.response?.data?.message || "Failed to update student");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !fullName) return <div className="py-20 flex justify-center"><LoadingSpinner /></div>;

  return (
    <div>
      <PageMeta title="Edit Student | CDC International" description="Edit student details" />
      <PageBreadcrumb items={[
        { name: "Home", path: "/" },
        { name: "Student Management", path: "/manage-students" },
        { name: "Manage Students", path: "/manage-students" },
        { name: "Edit Student" }
      ]} />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            <ComponentCard title="Primary Information">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value.toUpperCase())} error={!!validationErrors.fullName} className="uppercase" />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={!!validationErrors.email} />
                </div>
                <div>
                  <Label>Student Photo</Label>
                  <div className="flex items-center gap-4">
                    <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-16 h-16 border-2 border-dashed rounded-full overflow-hidden flex items-center justify-center">
                      {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <span className="text-gray-400">UP</span>}
                    </button>
                  </div>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Personal & Contact Details">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <PhoneInput label="Phone 1 *" value={phone1} onChange={setPhone1} error={!!validationErrors.phone1} countries={countries} />
                <PhoneInput label="Phone 2" value={phone2} onChange={setPhone2} countries={countries} />
                <div>
                  <Label>Gender</Label>
                  <Select options={enquirerGender} value={gender} onChange={setGender} />
                </div>
                <DatePicker label="Date of Birth" value={dob} onChange={(_, str) => setDob(str)} />
                <div>
                  <Label>Place *</Label>
                  <Select options={placeOptions} value={place} onChange={setPlace} />
                </div>
                {place === "Other" && (
                  <div>
                    <Label>Specify Place *</Label>
                    <Input value={otherPlace} onChange={(e) => setOtherPlace(e.target.value.toUpperCase())} className="uppercase" />
                  </div>
                )}
                <div>
                  <Label>Address *</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value.toUpperCase())} className="uppercase" />
                </div>
                <div>
                  <Label>Aadhar Number *</Label>
                  <Input value={aadharCardNumber} onChange={(e) => setAadharCardNumber(e.target.value.replace(/\D/g, ""))} maxLength="12" />
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Academic & Enrollment">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <Label>Status</Label>
                  <Select options={enquirerStatus} value={status} onChange={setStatus} />
                </div>
                <div>
                  <Label>Education</Label>
                  <Select options={enquirerEducation} value={education} onChange={setEducation} />
                </div>
                <DatePicker label="Enrollment Date *" value={enrollmentDate} onChange={(_, str) => setEnrollmentDate(str)} />
                <div>
                  <Label>Student ID</Label>
                  <Input value={studentId} readOnly className="bg-gray-50" />
                </div>
                <div className="md:col-span-4">
                   <Label>Remarks</Label>
                   <textarea rows={3} className="w-full p-3 border rounded-xl" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Course & Fee Management">
              <div className="space-y-6">
                <div>
                  <Label>Primary Course *</Label>
                  <SearchableCourseSelect brandId={selectedBrand} value={coursePreference} onChange={handlePrimaryCourseChange} initialLabel={getCourseName(coursePreference)} />
                </div>

                {coursePreference && (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-brand-50 rounded-xl">
                    <div><Label>Fee Type</Label><Select options={[{value:'normal', label:'Normal'}, {value:'singleShot', label:'Single Shot'}]} value={primaryCourseFee.feeType} onChange={handlePrimaryFeeTypeChange} /></div>
                    <div><Label>Base Price</Label><Input type="number" value={primaryCourseFee.basePrice} onChange={(e) => handlePrimaryFeeChange(e.target.value, "basePrice")} /></div>
                    <div><Label>Discount (%)</Label><Input type="number" value={primaryCourseFee.discountPercentage} onChange={(e) => handlePrimaryFeeChange(e.target.value, "discountPercentage")} /></div>
                    <div><Label>Discount (₹)</Label><Input type="number" value={primaryCourseFee.discountAmount} onChange={(e) => handlePrimaryFeeChange(e.target.value, "discountAmount")} /></div>
                    <div><Label>Final (₹)</Label><Input type="number" value={primaryCourseFee.finalAmount} onChange={(e) => handlePrimaryFeeChange(e.target.value, "finalAmount")} className="font-bold text-brand-600" /></div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-center"><Label>Additional Courses</Label><Button type="button" variant="outline" size="sm" onClick={handleAddAdditionalCourse}>Add Course</Button></div>
                  {additionalCourses.map((item, index) => (
                    <div key={index} className="space-y-3 p-4 border rounded-xl">
                      <div className="flex gap-2">
                        <div className="flex-grow"><SearchableCourseSelect brandId={selectedBrand} value={item.courseId} onChange={(val) => handleAdditionalCourseUpdate(index, val)} initialLabel={getCourseName(item.courseId)} /></div>
                        <Button type="button" variant="outline" onClick={() => handleRemoveAdditionalCourse(index)}>Remove</Button>
                      </div>
                      {item.courseId && (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div><Label>Fee Type</Label><Select options={[{value:'normal', label:'Normal'}, {value:'singleShot', label:'Single Shot'}]} value={item.feeType} onChange={(v) => handleAdditionalFeeTypeChange(index, v)} /></div>
                          <div><Label>Base Price</Label><Input type="number" value={item.basePrice} onChange={(e) => handleAdditionalFeeChange(index, e.target.value, "basePrice")} /></div>
                          <div><Label>Disc (%)</Label><Input type="number" value={item.discountPercentage} onChange={(e) => handleAdditionalFeeChange(index, e.target.value, "discountPercentage")} /></div>
                          <div><Label>Disc (₹)</Label><Input type="number" value={item.discountAmount} onChange={(e) => handleAdditionalFeeChange(index, e.target.value, "discountAmount")} /></div>
                          <div><Label>Final (₹)</Label><Input type="number" value={item.finalAmount} onChange={(e) => handleAdditionalFeeChange(index, e.target.value, "finalAmount")} /></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t pt-6">
                  <div className="flex justify-between items-center"><Label>Complimentary Modules</Label><Button type="button" variant="outline" size="sm" onClick={handleAddComplimentaryModule}>Add Module</Button></div>
                  {complimentaryModules.map((item, index) => (
                    <div key={index} className="space-y-3 p-4 border border-green-100 bg-green-50/20 rounded-xl">
                      <div className="flex gap-2">
                        <div className="flex-grow"><SearchableModuleSelect brandId={selectedBrand} value={item.moduleId} onChange={(val) => handleComplimentaryModuleUpdate(index, val)} initialLabel={getModuleName(item.moduleId)} /></div>
                        <Button type="button" variant="outline" onClick={() => handleRemoveComplimentaryModule(index)}>Remove</Button>
                      </div>
                      {item.moduleId && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div><Label>Base Price</Label><Input type="number" value={item.basePrice} onChange={(e) => handleComplimentaryFeeChange(index, e.target.value, "basePrice")} /></div>
                          <div><Label>Disc (%)</Label><Input type="number" value={item.discountPercentage} onChange={(e) => handleComplimentaryFeeChange(index, e.target.value, "discountPercentage")} /></div>
                          <div><Label>Disc (₹)</Label><Input type="number" value={item.discountAmount} onChange={(e) => handleComplimentaryFeeChange(index, e.target.value, "discountAmount")} /></div>
                          <div><Label>Final (₹)</Label><Input type="number" value={item.finalAmount} onChange={(e) => handleComplimentaryFeeChange(index, e.target.value, "finalAmount")} /></div>
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
                        <Label className="!mb-0 text-xs uppercase tracking-wider text-gray-400">Gross Total</Label>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">₹{calculateTotalBaseValue()}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="!mb-0 text-xs uppercase tracking-wider text-gray-400">Total Discount</Label>
                        <p className="text-xl font-bold text-red-500">₹{calculateTotalDiscount()}</p>
                      </div>
                      <div className="pl-6 border-l border-gray-200 dark:border-gray-700 space-y-1">
                        <Label className="!mb-0 text-xs uppercase tracking-wider text-brand-500 font-bold">Grand Total</Label>
                        <p className="text-3xl font-black text-brand-600 dark:text-brand-400">₹{calculateGrandTotal()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>
        </div>

        <div className="flex gap-4 justify-end mt-8">
          <Button type="button" variant="outline" onClick={() => navigate("/manage-students")} disabled={submitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={submitting}>{submitting ? "Updating..." : "Update Student"}</Button>
        </div>
      </form>
      <ToastContainer position="top-center" />
    </div>
  );
}
