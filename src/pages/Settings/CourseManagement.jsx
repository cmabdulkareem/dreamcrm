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
  const [activeTab, setActiveTab] = useState("courses");

  // Course States
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

  // Category States
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    isActive: true
  });

  useEffect(() => {
    fetchCourses();
    fetchCategories();
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
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get(
        `${API}/course-categories/all`,
        { withCredentials: true }
      );
      setCategories(response.data.categories);
      setLoadingCategories(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoadingCategories(false);
    }
  };

  // --- Course Handlers ---
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

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    if (!formData.courseCode || !formData.courseName) {
      toast.error("Course Code and Course Name are required");
      return;
    }

    try {
      if (editingCourse) {
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
      toast.error(error.response?.data?.message || "Failed to save course");
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
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await axios.delete(
        `${API}/courses/delete/${id}`,
        { withCredentials: true }
      );
      setCourses(prev => prev.filter(course => course._id !== id));
      toast.success("Course deleted successfully");
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
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
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  // --- Category Handlers ---
  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name) {
      toast.error("Category Name is required");
      return;
    }

    try {
      if (editingCategory) {
        const response = await axios.put(
          `${API}/course-categories/update/${editingCategory._id}`,
          categoryFormData,
          { withCredentials: true }
        );
        setCategories(prev => prev.map(cat =>
          cat._id === editingCategory._id ? response.data.category : cat
        ));
        toast.success("Category updated successfully");
      } else {
        const response = await axios.post(
          `${API}/course-categories/create`,
          categoryFormData,
          { withCredentials: true }
        );
        setCategories(prev => [...prev, response.data.category]);
        toast.success("Category added successfully");
      }
      resetCategoryForm();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(error.response?.data?.message || "Failed to save category");
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: "",
      description: "",
      isActive: true
    });
    setEditingCategory(null);
    setShowCategoryModal(false);
  };

  const handleEditCategory = (category) => {
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive
    });
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await axios.delete(
        `${API}/course-categories/delete/${id}`,
        { withCredentials: true }
      );
      setCategories(prev => prev.filter(cat => cat._id !== id));
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const toggleCategoryStatusHandler = async (id) => {
    try {
      const response = await axios.patch(
        `${API}/course-categories/toggle-status/${id}`,
        {},
        { withCredentials: true }
      );
      setCategories(prev => prev.map(cat =>
        cat._id === id ? response.data.category : cat
      ));
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
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
        description="Manage courses and categories here"
      />
      <PageBreadcrumb pageTitle="Course Management" />

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`py-4 px-6 text-sm font-medium ${activeTab === 'courses'
              ? 'text-brand-600 border-b-2 border-brand-600 dark:text-brand-400 dark:border-brand-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('courses')}
          >
            Courses
          </button>
          <button
            className={`py-4 px-6 text-sm font-medium ${activeTab === 'categories'
              ? 'text-brand-600 border-b-2 border-brand-600 dark:text-brand-400 dark:border-brand-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('categories')}
          >
            Course Categories
          </button>
        </div>

        <div className="flex justify-end">
          {activeTab === 'courses' ? (
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Add New Course
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setShowCategoryModal(true)}>
              Add New Category
            </Button>
          )}
        </div>

        <ComponentCard title={activeTab === 'courses' ? "Course List" : "Category List"}>
          {activeTab === 'courses' ? (
            loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Modules</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {courses.length > 0 ? (
                      courses.map((course) => (
                        <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{course.courseCode}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{course.courseName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{course.modules}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{course.mode}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₹{course.normalFee}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.isActive ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"}`}>
                              {course.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button onClick={() => toggleCourseStatus(course._id)} className={course.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}>
                                {course.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button onClick={() => handleEdit(course)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                              <button onClick={() => handleDelete(course._id)} className="text-red-600 hover:text-red-900">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No courses found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // Category Table
            loadingCategories ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <tr key={cat._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{cat.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{cat.description || "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cat.isActive ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"}`}>
                              {cat.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button onClick={() => toggleCategoryStatusHandler(cat._id)} className={cat.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}>
                                {cat.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button onClick={() => handleEditCategory(cat)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                              <button onClick={() => handleDeleteCategory(cat._id)} className="text-red-600 hover:text-red-900">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No categories found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          )}
        </ComponentCard>
      </div>

      {/* Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetForm}></div>
            <div className="relative inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full dark:bg-gray-800">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{editingCourse ? "Edit Course" : "Add New Course"}</h3>
                <form onSubmit={handleCourseSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><Label htmlFor="courseCode">Course Code *</Label><Input id="courseCode" name="courseCode" value={formData.courseCode} onChange={handleInputChange} disabled={!!editingCourse} /></div>
                    <div><Label htmlFor="courseName">Course Name *</Label><Input id="courseName" name="courseName" value={formData.courseName} onChange={handleInputChange} /></div>
                    <div className="sm:col-span-2"><Label htmlFor="modules">Modules</Label><Input id="modules" name="modules" value={formData.modules} onChange={handleInputChange} /></div>
                    <div><Label htmlFor="duration">Duration (hrs)</Label><Input type="number" id="duration" name="duration" value={formData.duration} onChange={handleInputChange} /></div>
                    <div><Label>Mode</Label><Select options={modeOptions} value={formData.mode} onChange={(val) => handleSelectChange(val, "mode")} /></div>
                    <div><Label htmlFor="singleShotFee">Single Shot Fee</Label><Input type="number" id="singleShotFee" name="singleShotFee" value={formData.singleShotFee} onChange={handleInputChange} /></div>
                    <div><Label htmlFor="normalFee">Normal Fee</Label><Input type="number" id="normalFee" name="normalFee" value={formData.normalFee} onChange={handleInputChange} /></div>
                    <div className="flex items-center"><input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" /><Label htmlFor="isActive" className="ml-2 mb-0">Active Course</Label></div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button type="submit" variant="primary">{editingCourse ? "Update" : "Add"}</Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetCategoryForm}></div>
            <div className="relative inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-md sm:w-full dark:bg-gray-800">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{editingCategory ? "Edit Category" : "Add New Category"}</h3>
                <form onSubmit={handleCategorySubmit} className="mt-4 space-y-4">
                  <div><Label htmlFor="catName">Category Name *</Label><Input id="catName" name="name" value={categoryFormData.name} onChange={handleCategoryInputChange} /></div>
                  <div><Label htmlFor="catDesc">Description</Label><Input id="catDesc" name="description" value={categoryFormData.description} onChange={handleCategoryInputChange} /></div>
                  <div className="flex items-center"><input type="checkbox" id="catActive" checked={categoryFormData.isActive} onChange={(e) => setCategoryFormData(prev => ({ ...prev, isActive: e.target.checked }))} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" /><Label htmlFor="catActive" className="ml-2 mb-0">Active Category</Label></div>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={resetCategoryForm}>Cancel</Button>
                    <Button type="submit" variant="primary">{editingCategory ? "Update" : "Add"}</Button>
                  </div>
                </form>
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