import PageBreadcrumb from "../../components/common/PageBreadCrumb.jsx";
import PageMeta from "../../components/common/PageMeta.jsx";
import { useState, useEffect, useContext, useRef, useCallback } from "react";
import ComponentCard from "../../components/common/ComponentCard.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import Button from "../../components/ui/button/Button.jsx";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import StudentProfileModal from "../../components/StudentManagement/StudentProfileModal.jsx";

import API from "../../config/api";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label.jsx";
import Input from "../../components/form/input/InputField.jsx";
import PhoneInput from "../../components/form/group-input/PhoneInput.jsx";
import Select from "../../components/form/Select.jsx";
import DatePicker from "../../components/form/date-picker.jsx";
import SearchableCourseSelect from "../../components/form/SearchableCourseSelect.jsx";
import {
  countries,
  enquirerGender,
  enquirerStatus,
  enquirerEducation,
  placeOptions
} from "../../data/DataSets.jsx";

export default function ManageStudents() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addNotification, areToastsEnabled } = useNotifications();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedStudentForDate, setSelectedStudentForDate] = useState(null);
  const [newEnrollmentDate, setNewEnrollmentDate] = useState("");

  // Controlled form states
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
  const [coursePreference, setCoursePreference] = useState("");
  const [additionalCourses, setAdditionalCourses] = useState([]);
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [enrollmentDate, setEnrollmentDate] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  const [courses, setCourses] = useState([]);
  const [brands, setBrands] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [emailError, setEmailError] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudents();
    fetchCourses();
    fetchBrands();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API}/courses/all`, { withCredentials: true });
      setCourses(response.data.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get(`${API}/brands`, { withCredentials: true });
      setBrands(response.data.brands || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/students/all`,
        { withCredentials: true }
      );

      setStudents(response.data.students);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching students:", error);
      // Use mock data for demonstration if API fails
      const mockStudents = [
        {
          _id: "1",
          studentId: "STU001",
          fullName: "John Doe",
          email: "john@example.com",
          phone1: "+1 234 567 8900",
          coursePreference: "Graphic Design",
          enrollmentDate: "2025-01-15",
          status: "Active",
          photo: null
        },
        {
          _id: "2",
          studentId: "STU002",
          fullName: "Jane Smith",
          email: "jane@example.com",
          phone1: "+1 234 567 8901",
          coursePreference: "Interior Design",
          enrollmentDate: "2025-01-20",
          status: "Active",
          photo: null
        }
      ];
      setStudents(mockStudents);
      toast.info("Using demo data for demonstration");
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    navigate("/new-student");
  };

  const handleViewStudent = (student) => {
    setSelectedStudentForProfile(student);
    setIsProfileModalOpen(true);
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setFullName(student.fullName || "");
    setEmail(student.email || "");
    setPhone1(student.phone1 || "");
    setPhone2(student.phone2 || "");
    setGender(student.gender || "");
    setDob(student.dob ? new Date(student.dob).toISOString().split('T')[0] : "");
    // Check if place is in standard options
    const standardPlaces = placeOptions.map(p => p.value);
    if (student.place && !standardPlaces.includes(student.place) && student.place !== "Other") {
      setPlace("Other");
      setOtherPlace(student.place);
    } else {
      setPlace(student.place || "Kasaragod");
      setOtherPlace(student.otherPlace || "");
    }
    setAddress(student.address || "");
    setAadharCardNumber(student.aadharCardNumber || "");
    setPhoto(null);
    setPhotoPreview(student.photo ? getPhotoUrl(student.photo) : "");
    setStatus(student.status || "");
    setEducation(student.education || "");
    setCoursePreference(student.coursePreference || "");
    setAdditionalCourses(student.additionalCourses || []);
    setDiscountPercentage(student.discountPercentage || 0);
    setDiscountAmount(student.discountAmount || 0);
    setEnrollmentDate(student.enrollmentDate ? new Date(student.enrollmentDate).toISOString().split('T')[0] : "");
    setStudentId(student.studentId || "");
    setSelectedBrand(student.brand?._id || student.brand || "");

    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
    setValidationErrors({});
  };

  const handleDateClick = (student) => {
    setSelectedStudentForDate(student);
    setNewEnrollmentDate(student.enrollmentDate ? new Date(student.enrollmentDate).toISOString().split('T')[0] : "");
    setIsDateModalOpen(true);
  };

  const handleSaveDate = async () => {
    if (!newEnrollmentDate) {
      toast.error("Please select a date");
      return;
    }

    try {
      setSubmitting(true);
      await axios.patch(
        `${API}/students/update-enrollment-date/${selectedStudentForDate._id}`,
        { enrollmentDate: newEnrollmentDate },
        { withCredentials: true }
      );

      toast.success("Enrollment date updated successfully!");
      fetchStudents();
      setIsDateModalOpen(false);
    } catch (error) {
      console.error("Error updating enrollment date:", error);
      toast.error(error.response?.data?.message || "Failed to update date");
    } finally {
      setSubmitting(false);
    }
  };

  // Logic from NewStudent.jsx
  const calculateTotalValue = useCallback(() => {
    let total = 0;
    if (coursePreference) {
      const primaryCourse = courses.find(course => course._id === coursePreference);
      if (primaryCourse) total += primaryCourse.normalFee || 0;
    }
    additionalCourses.forEach(courseId => {
      const course = courses.find(course => course._id === courseId);
      if (course) total += course.normalFee || 0;
    });
    return total;
  }, [coursePreference, additionalCourses, courses]);

  const handleDiscountPercentageChange = useCallback((value) => {
    setDiscountPercentage(value);
    const total = calculateTotalValue();
    if (total > 0 && value !== "") {
      const amount = (total * parseFloat(value)) / 100;
      setDiscountAmount(amount.toFixed(2));
    } else if (value === "") {
      setDiscountAmount("");
    }
  }, [calculateTotalValue]);

  const handleDiscountAmountChange = useCallback((value) => {
    setDiscountAmount(value);
    const total = calculateTotalValue();
    if (total > 0 && value !== "") {
      const percentage = (parseFloat(value) / total) * 100;
      setDiscountPercentage(parseFloat(percentage.toFixed(4)).toString());
    } else if (value === "") {
      setDiscountPercentage("");
    }
  }, [calculateTotalValue]);

  // Sync discounts when total value changes in modal
  useEffect(() => {
    if (isEditModalOpen) {
      const total = calculateTotalValue();
      if (discountPercentage !== "" && total > 0) {
        const amount = (total * parseFloat(discountPercentage)) / 100;
        setDiscountAmount(amount.toFixed(2));
      }
    }
  }, [coursePreference, additionalCourses, courses, isEditModalOpen]);

  const calculateFinalAmount = useCallback(() => {
    const total = calculateTotalValue();
    const discount = parseFloat(discountAmount) || 0;
    return total - discount;
  }, [calculateTotalValue, discountAmount]);

  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!fullName.trim()) errors.fullName = "Full Name is required";
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!phone1.trim()) errors.phone1 = "Phone is required";
    if (!place) {
      errors.place = "Place is required";
    } else if (place === "Other" && !otherPlace.trim()) {
      errors.otherPlace = "Please specify the place";
    }
    if (!address.trim()) errors.address = "Address is required";
    if (!aadharCardNumber.trim()) {
      errors.aadharCardNumber = "Aadhar Card Number is required";
    } else if (!/^\d{12}$/.test(aadharCardNumber)) {
      errors.aadharCardNumber = "Aadhar Card Number must be 12 digits";
    }
    if (!coursePreference) errors.coursePreference = "Primary course is required";
    if (!enrollmentDate) errors.enrollmentDate = "Enrollment date is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [fullName, email, phone1, place, otherPlace, address, aadharCardNumber, coursePreference, enrollmentDate]);

  const handleSaveEdit = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("phone1", phone1);
      formData.append("phone2", phone2);
      formData.append("gender", gender);
      formData.append("dob", dob);
      formData.append("place", place);
      formData.append("otherPlace", otherPlace);
      formData.append("address", address);
      formData.append("aadharCardNumber", aadharCardNumber);
      formData.append("status", status);
      formData.append("education", education);
      formData.append("coursePreference", coursePreference);
      formData.append("additionalCourses", JSON.stringify(additionalCourses.filter(c => c)));
      formData.append("totalCourseValue", calculateTotalValue());
      formData.append("discountPercentage", discountPercentage || 0);
      formData.append("discountAmount", discountAmount || 0);
      formData.append("finalAmount", calculateFinalAmount());
      formData.append("enrollmentDate", enrollmentDate);
      formData.append("brandId", selectedBrand);
      if (photo) formData.append("photo", photo);

      const response = await axios.put(
        `${API}/students/update/${editingStudent._id}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      // Re-fetch students to get updated data with populated fields
      fetchStudents();

      setIsEditModalOpen(false);
      setEditingStudent(null);

      if (areToastsEnabled()) {
        toast.success("Student updated successfully!");
      }

      addNotification({
        type: 'student_updated',
        userName: user?.fullName || 'Someone',
        avatar: user?.avatar || null,
        action: 'updated student',
        entityName: response.data.student.fullName,
        module: 'Student Management',
      });
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error(error.response?.data?.message || "Failed to update student");
    } finally {
      setSubmitting(false);
    }
  };

  // Additional course helpers
  const handleAddAdditionalCourse = () => {
    setAdditionalCourses([...additionalCourses, ""]);
  };

  const handleRemoveAdditionalCourse = (index) => {
    const newCourses = [...additionalCourses];
    newCourses.splice(index, 1);
    setAdditionalCourses(newCourses);
  };

  const handleAdditionalCourseChange = (index, courseId) => {
    const newCourses = [...additionalCourses];
    newCourses[index] = courseId;
    setAdditionalCourses(newCourses);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return "/images/user/user-01.jpg";
    if (photoPath.startsWith('http') || photoPath.startsWith('data:')) return photoPath;
    const baseUrl = API.replace('/api', '');
    return `${baseUrl}${photoPath}`;
  };

  return (
    <div>
      <PageMeta
        title="Manage Students | DreamCRM"
        description="Manage your students here"
      />
      <PageBreadcrumb pageTitle="Manage Students" />

      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleAddStudent}>
            Add New Student
          </Button>
        </div>

        <ComponentCard title="Student List">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Enrollment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {students.length > 0 ? (
                    students.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                              src={getPhotoUrl(student.photo)}
                              alt={student.fullName}
                              onError={(e) => {
                                e.target.src = "/images/user/user-01.jpg";
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="flex flex-col">
                            <span
                              className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={() => handleViewStudent(student)}
                            >
                              {student.fullName}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{student.studentId}</span>
                              {student.batchScheduled ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400">
                                  Batch Assigned
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-error-50 text-error-600 dark:bg-error-900/20 dark:text-error-400">
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col">
                            <span className="text-gray-900 dark:text-white">{student.email}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{student.phone1}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="max-w-[200px] break-words">
                            {student.courseDetails ?
                              `${student.courseDetails.courseCode} - ${student.courseDetails.courseName}` :
                              student.coursePreference}
                            {student.additionalCourseDetails && student.additionalCourseDetails.length > 0 && (
                              <div className="text-xs text-gray-400 mt-1">
                                +{student.additionalCourseDetails.length} additional course(s)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white text-xs">Final: ₹{student.finalAmount || 0}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 line-through">Val: ₹{student.totalCourseValue || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(student.enrollmentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditClick(student)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleViewStudent(student)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDateClick(student)}
                              className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                            >
                              Date
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCancelEdit}
        className="max-w-[1400px] p-6 lg:p-10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="mb-2 font-semibold text-gray-800 dark:text-white/90 modal-title text-theme-xl lg:text-2xl">
            Edit Student: <span className="text-gray-500">{studentId}</span>
          </h2>
          <button
            onClick={handleCancelEdit}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[80vh] p-2">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value.toUpperCase())}
                    error={!!validationErrors.fullName}
                    hint={validationErrors.fullName}
                    className="uppercase"
                  />
                </div>
                <div>
                  <Label>Brand *</Label>
                  <Select
                    options={brands.map(b => ({ value: b._id, label: `${b.name} (${b.code})` }))}
                    value={selectedBrand}
                    onChange={setSelectedBrand}
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={!!validationErrors.email}
                    hint={validationErrors.email}
                  />
                </div>
                <div>
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
                      className="w-16 h-16 overflow-hidden border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-brand-500 transition-colors flex items-center justify-center"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xs text-gray-400 text-center">No Photo</div>
                      )}
                    </button>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => { setPhoto(null); setPhotoPreview(""); }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Phone 1 *</Label>
                  <PhoneInput
                    countries={countries}
                    value={phone1}
                    onChange={setPhone1}
                    error={!!validationErrors.phone1}
                  />
                </div>
                <div>
                  <Label>Phone 2</Label>
                  <PhoneInput
                    countries={countries}
                    value={phone2}
                    onChange={setPhone2}
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select
                    options={enquirerGender}
                    value={gender}
                    onChange={setGender}
                  />
                </div>
                <div>
                  <DatePicker
                    id="edit-student-dob"
                    label="Date of Birth"
                    value={dob}
                    onChange={(date, str) => setDob(str)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Place *</Label>
                  <Select
                    options={placeOptions}
                    value={place}
                    onChange={setPlace}
                    error={!!validationErrors.place}
                  />
                </div>
                <div>
                  <Label>Specify Other Place *</Label>
                  <Input
                    type="text"
                    value={otherPlace}
                    onChange={(e) => setOtherPlace(e.target.value.toUpperCase())}
                    error={!!validationErrors.otherPlace}
                    placeholder="Enter village/city name"
                    className="uppercase"
                  />
                </div>
                <div>
                  <Label>Address *</Label>
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value.toUpperCase())}
                    error={!!validationErrors.address}
                    className="uppercase"
                  />
                </div>
                <div>
                  <Label>Aadhar Number *</Label>
                  <Input
                    type="text"
                    value={aadharCardNumber}
                    onChange={(e) => setAadharCardNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength="12"
                    error={!!validationErrors.aadharCardNumber}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Current Status</Label>
                  <Select
                    options={enquirerStatus}
                    value={status}
                    onChange={setStatus}
                  />
                </div>
                <div>
                  <Label>Education</Label>
                  <Select
                    options={enquirerEducation}
                    value={education}
                    onChange={setEducation}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Primary Course *</Label>
                  <SearchableCourseSelect
                    value={coursePreference}
                    onChange={setCoursePreference}
                    error={!!validationErrors.coursePreference}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <Label className="!mb-0">Additional Courses</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddAdditionalCourse}>
                    Add Course
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {additionalCourses.map((courseId, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-grow">
                        <SearchableCourseSelect
                          value={courseId}
                          onChange={(val) => handleAdditionalCourseChange(index, val)}
                        />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveAdditionalCourse(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <Label>Total Value (₹)</Label>
                  <Input type="text" value={calculateTotalValue()} readOnly className="bg-white dark:bg-gray-900" />
                </div>
                <div>
                  <Label>Discount (%)</Label>
                  <Input type="number" value={discountPercentage} onChange={(e) => handleDiscountPercentageChange(e.target.value)} step="any" placeholder="0.00" />
                </div>
                <div>
                  <Label>Discount (₹)</Label>
                  <Input type="number" value={discountAmount} onChange={(e) => handleDiscountAmountChange(e.target.value)} step="any" />
                </div>
                <div>
                  <Label>Final Amount (₹)</Label>
                  <Input type="text" value={calculateFinalAmount().toFixed(2)} readOnly className="bg-white dark:bg-gray-900 font-bold text-brand-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <DatePicker
                    id="edit-student-enrollment-date"
                    label="Enrollment Date *"
                    value={enrollmentDate}
                    onChange={(date, str) => setEnrollmentDate(str)}
                    error={!!validationErrors.enrollmentDate}
                  />
                </div>
                <div>
                  <Label>Student ID (Locked)</Label>
                  <Input type="text" value={studentId} readOnly className="bg-gray-100 dark:bg-gray-700 font-mono" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={handleCancelEdit} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Modal>

      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        student={selectedStudentForProfile}
      />

      {/* Change Enrollment Date Modal */}
      <Modal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        className="max-w-[400px] p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Change Enrollment Date
          </h2>
          <button onClick={() => setIsDateModalOpen(false)} className="text-gray-500">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Updating date for: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedStudentForDate?.fullName}</span>
        </p>
        <div className="space-y-4">
          <DatePicker
            id="quick-enrollment-date"
            label="New Enrollment Date"
            value={newEnrollmentDate}
            onChange={(date, str) => setNewEnrollmentDate(str)}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsDateModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveDate} disabled={submitting}>
              {submitting ? "Updating..." : "Update Date"}
            </Button>
          </div>
        </div>
      </Modal>

      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div>
  );
}