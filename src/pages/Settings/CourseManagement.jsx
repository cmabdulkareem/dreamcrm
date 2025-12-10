import PageBreadcrumb from "../../components/common/PageBreadCrumb.jsx";
import PageMeta from "../../components/common/PageMeta.jsx";
import { useState, useEffect } from "react";
import ComponentCard from "../../components/common/ComponentCard.jsx";
import Button from "../../components/ui/button/Button.jsx";
import Label from "../../components/form/Label.jsx";
import Input from "../../components/form/input/InputField.jsx";
import Select from "../../components/form/Select.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

import API from "../../config/api";

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    modules: "",
    duration: "",
    mode: "online",
    singleShotFee: "",
    normalFee: "",
    isActive: true
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/courses/all`,
        { withCredentials: true }
      );

      setCourses(response.data.courses);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching courses:", error);
      // Use mock data for demonstration if API fails
      const mockCourses = [
        {
          id: 1,
          courseCode: "GD101",
          courseName: "Graphic Design Fundamentals",
          modules: "Photoshop, Illustrator, InDesign",
          duration: "40",
          mode: "online",
          singleShotFee: "15000",
          normalFee: "18000",
          isActive: true
        },
        {
          id: 2,
          courseCode: "WD201",
          courseName: "Web Development Bootcamp",
          modules: "HTML, CSS, JavaScript, React",
          duration: "60",
          mode: "offline",
          singleShotFee: "25000",
          normalFee: "30000",
          isActive: true
        },
        {
          id: 3,
          courseCode: "DM301",
          courseName: "Digital Marketing",
          modules: "SEO, SEM, Social Media, Analytics",
          duration: "35",
          mode: "online",
          singleShotFee: "12000",
          normalFee: "15000",
          isActive: false
        }
      ];

      setCourses(mockCourses);
      toast.info("Using demo data for demonstration");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value, name) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.courseCode || !formData.courseName) {
      toast.error("Course Code and Course Name are required");
      return;
    }

    try {
      if (editingCourse) {
        // Update existing course
        const response = await axios.put(
          `${API}/courses/update/${editingCourse._id}`,
          formData,
          { withCredentials: true }
        );

        setCourses(prev => prev.map(course =>
          course._id === editingCourse._id ? response.data.course : course
        ));
        toast.success("Course updated successfully");
      } else {
        // Add new course
        const response = await axios.post(
          `${API}/courses/create`,
          formData,
          { withCredentials: true }
        );

        setCourses(prev => [...prev, response.data.course]);
        toast.success("Course added successfully");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error(error.response?.data?.message || "Failed to save course. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      courseCode: "",
      courseName: "",
      modules: "",
      duration: "",
      mode: "online",
      singleShotFee: "",
      normalFee: "",
      isActive: true
    });
    setEditingCourse(null);
    setShowModal(false);
  };

  const handleEdit = (course) => {
    setFormData({
      courseCode: course.courseCode,
      courseName: course.courseName,
      modules: course.modules,
      duration: course.duration.toString(),
      mode: course.mode,
      singleShotFee: course.singleShotFee.toString(),
      normalFee: course.normalFee.toString(),
      isActive: course.isActive
    });
    setEditingCourse(course);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${API}/courses/delete/${id}`,
        { withCredentials: true }
      );

      setCourses(prev => prev.filter(course => course._id !== id));
      toast.success("Course deleted successfully");
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error(error.response?.data?.message || "Failed to delete course. Please try again.");
    }
  };

  const toggleCourseStatus = async (id) => {
    try {
      const response = await axios.patch(
        `${API}/courses/toggle-status/${id}`,
        {},
        { withCredentials: true }
      );

      setCourses(prev => prev.map(course =>
        course._id === id ? response.data.course : course
      ));
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error toggling course status:", error);
      toast.error(error.response?.data?.message || "Failed to update course status. Please try again.");
    }
  };

  const modeOptions = [
    { value: "online", label: "Online" },
    { value: "offline", label: "Offline" }
  ];

  return (
    <div>
      <PageMeta
        title="Course Management | DreamCRM"
        description="Manage courses here"
      />
      <PageBreadcrumb pageTitle="Course Management" />

      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Add New Course
          </Button>
        </div>

        <ComponentCard title="Course List">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Course Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Course Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Modules
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Duration (hrs)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Single Shot Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Normal Fee
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
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {course.courseCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {course.courseName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {course.modules}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {course.duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.mode === "online"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100"
                            }`}>
                            {course.mode}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ₹{course.singleShotFee}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ₹{course.normalFee}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                              : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                            }`}>
                            {course.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleCourseStatus(course._id)}
                              className={`${course.isActive
                                  ? "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  : "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                }`}
                            >
                              {course.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleEdit(course)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(course._id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No courses found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Add/Edit Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetForm}></div>

            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full dark:bg-gray-800">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  {editingCourse ? "Edit Course" : "Add New Course"}
                </h3>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="courseCode">Course Code *</Label>
                      <Input
                        type="text"
                        id="courseCode"
                        name="courseCode"
                        value={formData.courseCode}
                        onChange={handleInputChange}
                        placeholder="Enter course code"
                        disabled={!!editingCourse}
                      />
                    </div>

                    <div>
                      <Label htmlFor="courseName">Course Name *</Label>
                      <Input
                        type="text"
                        id="courseName"
                        name="courseName"
                        value={formData.courseName}
                        onChange={handleInputChange}
                        placeholder="Enter course name"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="modules">Modules Included</Label>
                      <Input
                        type="text"
                        id="modules"
                        name="modules"
                        value={formData.modules}
                        onChange={handleInputChange}
                        placeholder="Enter modules separated by commas"
                      />
                    </div>

                    <div>
                      <Label htmlFor="duration">Duration (hours)</Label>
                      <Input
                        type="number"
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        placeholder="Enter duration in hours"
                      />
                    </div>

                    <div>
                      <Label>Mode</Label>
                      <Select
                        options={modeOptions}
                        value={formData.mode}
                        onChange={(value) => handleSelectChange(value, "mode")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="singleShotFee">Single Shot Payment Fee</Label>
                      <Input
                        type="number"
                        id="singleShotFee"
                        name="singleShotFee"
                        value={formData.singleShotFee}
                        onChange={handleInputChange}
                        placeholder="Enter fee amount"
                      />
                    </div>

                    <div>
                      <Label htmlFor="normalFee">Normal Fee</Label>
                      <Input
                        type="number"
                        id="normalFee"
                        name="normalFee"
                        value={formData.normalFee}
                        onChange={handleInputChange}
                        placeholder="Enter fee amount"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <Label htmlFor="isActive" className="ml-2 mb-0">
                        Active Course
                      </Label>
                    </div>
                  </div>
                </form>
              </div>

              <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-gray-700">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit}
                  className="inline-flex justify-center w-full px-4 py-2 sm:ml-3 sm:w-auto"
                >
                  {editingCourse ? "Update Course" : "Add Course"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="inline-flex justify-center w-full px-4 py-2 mt-3 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div>
  );
};

export default CourseManagement;