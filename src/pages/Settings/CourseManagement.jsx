import PageBreadcrumb from "../../components/common/PageBreadCrumb.jsx";
import PageMeta from "../../components/common/PageMeta.jsx";
import { useState, useEffect } from "react";
import ComponentCard from "../../components/common/ComponentCard.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import Button from "../../components/ui/button/Button.jsx";
import Label from "../../components/form/Label.jsx";
import Input from "../../components/form/input/InputField.jsx";
import Select from "../../components/form/Select.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useDrag, useDrop } from "react-dnd";

import API from "../../config/api";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { isManager } from "../../utils/roleHelpers";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import { PencilIcon, CloseIcon, VerticalDotsIcon } from "../../icons";
import Badge from "../../components/ui/badge/Badge";
import { GripVertical } from "lucide-react";

const DraggableModuleRow = ({ mod, index, moveModule, saveOrder, handleEditModule, toggleModuleStatusHandler, handleDeleteModule, openDropdownId, setOpenDropdownId, isSelected, onSelect }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "MODULE",
    item: { id: mod._id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "MODULE",
    hover: (item, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      if (item.index === index) return;
      moveModule(item.index, index);
      item.index = index;
    },
    drop: () => {
      saveOrder();
    },
  });

  return (
    <TableRow
      ref={(node) => drag(drop(node))}
      className={`group transition-all hover:bg-slate-50/80 dark:hover:bg-white/5 odd:bg-transparent even:bg-gray-50/30 dark:even:bg-white/[0.01] border-b border-gray-100 dark:border-gray-800/50 last:border-0 ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <TableCell className="py-4 px-4 relative w-12 text-center pointer-events-none">
        <div className="cursor-grab active:cursor-grabbing pointer-events-auto">
          <GripVertical className="size-4 text-gray-400" />
        </div>
      </TableCell>
      <TableCell className="py-4 px-4 relative w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
        />
      </TableCell>
      <TableCell className="py-4 px-3 text-gray-500 dark:text-gray-400 text-[11px] font-bold tabular-nums w-12">
        {index + 1}
      </TableCell>
      <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
        {mod.name}
      </TableCell>
      <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-gray-600 dark:text-gray-400 text-theme-sm">
        {mod.duration || "-"}
      </TableCell>
      <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-center text-gray-600 dark:text-gray-400 text-theme-sm capitalize">
        {mod.mode}
      </TableCell>
      <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-center">
        <Badge size="sm" color={mod.isActive ? "success" : "error"}>
          {mod.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-center">
        <div className="flex items-center justify-center">
          <Button
            size="sm"
            variant="outline"
            className="mr-2"
            onClick={() => handleEditModule(mod)}
          >
            <PencilIcon className="size-5" />
          </Button>
          <div className="relative">
            <button
              onClick={() => setOpenDropdownId(openDropdownId === mod._id ? null : mod._id)}
              className="dropdown-toggle size-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.05]"
            >
              <VerticalDotsIcon className="size-5" />
            </button>
            <Dropdown isOpen={openDropdownId === mod._id} onClose={() => setOpenDropdownId(null)} className="w-40">
              <DropdownItem
                onClick={() => {
                  setOpenDropdownId(null);
                  toggleModuleStatusHandler(mod._id);
                }}
                className={mod.isActive ? "text-red-500" : "text-emerald-500"}
              >
                {mod.isActive ? "Deactivate" : "Activate"}
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  setOpenDropdownId(null);
                  handleDeleteModule(mod._id);
                }}
                className="text-red-500"
              >
                <CloseIcon className="size-4 mr-2" /> Delete
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

const CourseManagement = () => {
  const { user, selectedBrand } = useContext(AuthContext);
  const hasAccess = isManager(user);
  const [activeTab, setActiveTab] = useState("courses");

  // Course States
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    modules: [],
    duration: "",
    mode: "online",
    singleShotFee: "",
    normalFee: "",
    isActive: true,
  });
  const [moduleSearchTerm, setModuleSearchTerm] = useState("");

  // Category States
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  // Module States
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleFormData, setModuleFormData] = useState({
    name: "",
    duration: "",
    mode: "offline",
    syllabus: "",
    isActive: true,
  });

  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Selection States
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);

  // Refetch when global selectedBrand changes
  useEffect(() => {
    if (selectedBrand?._id) {
      fetchCourses();
      fetchCategories();
      fetchModules();
    } else {
      setCourses([]);
      setCategories([]);
      setModules([]);
      setLoading(false);
      setLoadingCategories(false);
      setLoadingModules(false);
    }
  }, [selectedBrand]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/courses/all`, {
        withCredentials: true,
        headers: { "x-brand-id": selectedBrand?._id },
      });
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
      const response = await axios.get(`${API}/course-categories/all`, {
        withCredentials: true,
        headers: { "x-brand-id": selectedBrand?._id },
      });
      setCategories(response.data.categories);
      setLoadingCategories(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoadingCategories(false);
    }
  };

  const fetchModules = async () => {
    try {
      setLoadingModules(true);
      const response = await axios.get(`${API}/modules/all`, {
        withCredentials: true,
        headers: { "x-brand-id": selectedBrand?._id },
      });
      setModules(response.data.modules);
      setLoadingModules(false);
    } catch (error) {
      console.error("Error fetching modules:", error);
      setLoadingModules(false);
    }
  };

  // --- Course Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    if (!formData.courseCode || !formData.courseName) {
      toast.error("Course Code and Course Name are required");
      return;
    }

    const brandId = selectedBrand?._id;
    if (!brandId) {
      toast.error("Please select a brand from the top switcher");
      return;
    }

    try {
      if (editingCourse) {
        const response = await axios.put(
          `${API}/courses/update/${editingCourse._id}`,
          formData,
          {
            withCredentials: true,
            headers: { "x-brand-id": brandId },
          },
        );
        setCourses((prev) =>
          prev.map((course) =>
            course._id === editingCourse._id ? response.data.course : course,
          ),
        );
        toast.success("Course updated successfully");
      } else {
        const response = await axios.post(
          `${API}/courses/create`,
          { ...formData },
          {
            withCredentials: true,
            headers: { "x-brand-id": brandId },
          },
        );
        setCourses((prev) => [...prev, response.data.course]);
        toast.success("Course added successfully");
      }
      resetForm();
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error(error.response?.data?.message || "Failed to save course");
    }
  };

  const getModuleNameById = (id) => {
    const foundModule = modules.find((m) => m._id === id);
    if (foundModule) return foundModule.name;
    // Fallback for legacy data (names stored directly) or if module not found
    return id;
  };

  const addModuleToCourse = (moduleId) => {
    if (!formData.modules.includes(moduleId)) {
      setFormData((prev) => ({
        ...prev,
        modules: [...prev.modules, moduleId],
      }));
    }
    setModuleSearchTerm("");
  };

  const removeModuleFromCourse = (moduleId) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m !== moduleId),
    }));
  };

  const resetForm = () => {
    setFormData({
      courseCode: "",
      courseName: "",
      modules: [],
      duration: "",
      mode: "online",
      singleShotFee: "",
      normalFee: "",
      isActive: true,
    });
    setModuleSearchTerm("");
    setEditingCourse(null);
    setShowModal(false);
  };

  const handleEdit = (course) => {
    setFormData({
      courseCode: course.courseCode,
      courseName: course.courseName,
      modules: Array.isArray(course.modules) ? course.modules : [],
      duration: course.duration.toString(),
      mode: course.mode,
      singleShotFee: course.singleShotFee.toString(),
      normalFee: course.normalFee.toString(),
      isActive: course.isActive,
    });
    setEditingCourse(course);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await axios.delete(`${API}/courses/delete/${id}`, {
        withCredentials: true,
        headers: { "x-brand-id": selectedBrand?._id },
      });
      setCourses((prev) => prev.filter((course) => course._id !== id));
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
        {
          withCredentials: true,
          headers: { "x-brand-id": selectedBrand?._id },
        },
      );
      setCourses((prev) =>
        prev.map((course) =>
          course._id === id ? response.data.course : course,
        ),
      );
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  // --- Category Handlers ---
  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name) {
      toast.error("Category Name is required");
      return;
    }

    const brandId = selectedBrand?._id;
    if (!brandId) {
      toast.error("Please select a brand from the top switcher");
      return;
    }

    try {
      if (editingCategory) {
        const response = await axios.put(
          `${API}/course-categories/update/${editingCategory._id}`,
          categoryFormData,
          {
            withCredentials: true,
            headers: { "x-brand-id": brandId },
          },
        );
        setCategories((prev) =>
          prev.map((cat) =>
            cat._id === editingCategory._id ? response.data.category : cat,
          ),
        );
        toast.success("Category updated successfully");
      } else {
        const response = await axios.post(
          `${API}/course-categories/create`,
          { ...categoryFormData }, // Use categoryFormData directly
          {
            withCredentials: true,
            headers: { "x-brand-id": brandId },
          },
        );
        setCategories((prev) => [...prev, response.data.category]);
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
      isActive: true,
    });
    setEditingCategory(null);
    setShowCategoryModal(false);
  };

  const handleEditCategory = (category) => {
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive,
    });
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;
    try {
      await axios.delete(`${API}/course-categories/delete/${id}`, {
        withCredentials: true,
        headers: { "x-brand-id": selectedBrand?._id },
      });
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
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
        {
          withCredentials: true,
          headers: { "x-brand-id": selectedBrand?._id },
        },
      );
      setCategories((prev) =>
        prev.map((cat) => (cat._id === id ? response.data.category : cat)),
      );
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  // --- Module Handlers ---
  const handleModuleInputChange = (e) => {
    const { name, value } = e.target;
    setModuleFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    if (!moduleFormData.name) {
      toast.error("Module Name is required");
      return;
    }

    const brandId = selectedBrand?._id;
    if (!brandId) {
      toast.error("Please select a brand from the top switcher");
      return;
    }

    try {
      if (editingModule) {
        const response = await axios.put(
          `${API}/modules/update/${editingModule._id}`,
          moduleFormData,
          {
            withCredentials: true,
            headers: { "x-brand-id": brandId },
          },
        );
        setModules((prev) =>
          prev.map((mod) =>
            mod._id === editingModule._id ? response.data.module : mod,
          ),
        );
        toast.success("Module updated successfully");
      } else {
        const response = await axios.post(
          `${API}/modules/create`,
          { ...moduleFormData },
          {
            withCredentials: true,
            headers: { "x-brand-id": brandId },
          },
        );
        setModules((prev) => [...prev, response.data.module]);
        toast.success("Module added successfully");
      }
      resetModuleForm();
    } catch (error) {
      console.error("Error saving module:", error);
      toast.error(error.response?.data?.message || "Failed to save module");
    }
  };

  const resetModuleForm = () => {
    setModuleFormData({
      name: "",
      duration: "",
      mode: "offline",
      syllabus: "",
      isActive: true,
    });
    setEditingModule(null);
    setShowModuleModal(false);
  };

  const handleEditModule = (module) => {
    setModuleFormData({
      name: module.name,
      duration: module.duration || "",
      mode: module.mode || "offline",
      syllabus: module.syllabus || "",
      isActive: module.isActive,
    });
    setEditingModule(module);
    setShowModuleModal(true);
  };

  const handleDeleteModule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;
    try {
      await axios.delete(`${API}/modules/delete/${id}`, {
        withCredentials: true,
        headers: { "x-brand-id": selectedBrand?._id },
      });
      setModules((prev) => prev.filter((mod) => mod._id !== id));
      toast.success("Module deleted successfully");
    } catch (error) {
      console.error("Error deleting module:", error);
      toast.error("Failed to delete module");
    }
  };

  const toggleModuleStatusHandler = async (id) => {
    try {
      const response = await axios.patch(
        `${API}/modules/toggle-status/${id}`,
        {},
        {
          withCredentials: true,
          headers: { "x-brand-id": selectedBrand?._id },
        },
      );
      setModules((prev) =>
        prev.map((mod) => (mod._id === id ? response.data.module : mod)),
      );
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  const moveModule = (dragIndex, hoverIndex) => {
    const dragModule = modules[dragIndex];
    const newModules = [...modules];
    newModules.splice(dragIndex, 1);
    newModules.splice(hoverIndex, 0, dragModule);
    setModules(newModules);
  };

  const saveModuleOrder = async () => {
    try {
      const orders = [...modules].map((m, index) => ({ id: m._id, order: index }));
      await axios.patch(
        `${API}/modules/reorder`,
        { orders },
        {
          withCredentials: true,
          headers: { "x-brand-id": selectedBrand?._id },
        },
      );
      toast.success("Module order updated", { autoClose: 500 });
    } catch (error) {
      console.error("Error saving module order:", error);
      toast.error("Failed to save module order");
    }
  };

  const initializeDefaultStages = async () => {
    const defaultStages = [
      "Project Submitted",
      "Project Reviewed",
      "Applied for Certificate",
      "Graduated"
    ];

    const brandId = selectedBrand?._id;
    if (!brandId) return;

    try {
      for (const stageName of defaultStages) {
        const exists = modules.some(m => m.name.toLowerCase() === stageName.toLowerCase());
        if (!exists) {
          await axios.post(
            `${API}/modules/create`,
            { name: stageName, duration: "0", mode: "offline", syllabus: "", isActive: true },
            {
              withCredentials: true,
              headers: { "x-brand-id": brandId },
            },
          );
        }
      }
      fetchModules();
      toast.success("New stages added and initialized");
    } catch (error) {
      console.error("Error initializing stages:", error);
      toast.error("Failed to add some stages");
    }
  };

  const modeOptions = [
    { value: "online", label: "Online" },
    { value: "offline", label: "Offline" },
    { value: "hybrid", label: "Hybrid" },
  ];

  if (!hasAccess) {
    return (
      <div>
        <PageMeta
          title="Course Management | Access Denied"
          description="Access denied to course management"
        />
        <PageBreadcrumb pageTitle="Course Management" />
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                You don't have permission to access course management. Only
                Owners, Admins, and Center Heads/Managers can manage courses.
              </p>
            </div>
          </div>
        </div>
        <ToastContainer
          position="top-center"
          className="!z-[999999]"
          style={{ zIndex: 999999 }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title="Course Management | CDC International"
        description="Manage courses and categories here"
      />
      <PageBreadcrumb pageTitle="Course Management" />

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === "courses"
                ? "text-brand-600 border-b-2 border-brand-600 dark:text-brand-400 dark:border-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("courses")}
          >
            Courses
          </button>
          <button
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === "categories"
                ? "text-brand-600 border-b-2 border-brand-600 dark:text-brand-400 dark:border-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("categories")}
          >
            Course Categories
          </button>
          <button
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === "modules"
                ? "text-brand-600 border-b-2 border-brand-600 dark:text-brand-400 dark:border-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("modules")}
          >
            Modules
          </button>
        </div>

        {/* Stats / Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Brand:{" "}
                <span className="font-semibold text-gray-700 dark:text-white/90">
                  {selectedBrand?.name || "None selected"}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Total Courses: {courses.length}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-3">
              {activeTab === "courses" ? (
                <Button variant="primary" onClick={() => setShowModal(true)}>
                  Add New Course
                </Button>
              ) : activeTab === "categories" ? (
                <Button
                  variant="primary"
                  onClick={() => setShowCategoryModal(true)}
                >
                  Add New Category
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setShowModuleModal(true)}
                >
                  Add New Module
                </Button>
              )}
              {activeTab === "modules" && (
                <Button variant="outline" onClick={initializeDefaultStages}>
                  Add Standard Stages
                </Button>
              )}
            </div>
          </div>
        </div>

        <ComponentCard
          title={
            activeTab === "courses"
              ? "Course List"
              : activeTab === "categories"
                ? "Category List"
                : "Module List"
          }
        >
          <div className="overflow-auto max-h-[calc(100vh-300px)] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm custom-scrollbar">
            <Table className="min-w-full border-collapse">
              {activeTab === "courses" ? (
                <>
                  <TableHeader className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)] border-b border-gray-100 dark:border-gray-800">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit w-12"
                      >
                        <input
                          type="checkbox"
                          checked={
                            courses.length > 0 &&
                            selectedCourses.length === courses.length
                          }
                          onChange={(e) =>
                            setSelectedCourses(
                              e.target.checked ? courses.map((c) => c._id) : [],
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-3 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit w-12"
                      >
                        #
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Code
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Modules
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Mode
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-end text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Fee
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Status
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-8 text-center">
                          <LoadingSpinner />
                        </TableCell>
                      </TableRow>
                    ) : courses.length > 0 ? (
                      courses.map((course, index) => (
                        <TableRow
                          key={course._id}
                          className="group transition-all hover:bg-slate-50/80 dark:hover:bg-white/5 odd:bg-transparent even:bg-gray-50/30 dark:even:bg-white/[0.01] border-b border-gray-100 dark:border-gray-800/50 last:border-0"
                        >
                          <TableCell className="py-4 px-4 relative w-12">
                            <input
                              type="checkbox"
                              checked={selectedCourses.includes(course._id)}
                              onChange={() =>
                                setSelectedCourses((prev) =>
                                  prev.includes(course._id)
                                    ? prev.filter((id) => id !== course._id)
                                    : [...prev, course._id],
                                )
                              }
                              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                            />
                          </TableCell>
                          <TableCell className="py-4 px-3 text-gray-500 dark:text-gray-400 text-[11px] font-bold tabular-nums w-12">
                            {index + 1}
                          </TableCell>
                          <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                            {course.courseCode}
                          </TableCell>
                          <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-gray-600 dark:text-gray-400 text-theme-sm">
                            {course.courseName}
                          </TableCell>
                          <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50">
                            <div className="flex flex-wrap gap-1">
                              {(course.modules || []).map((mod, idx) => (
                                <Badge key={idx} size="sm" color="light">
                                  {getModuleNameById(mod)}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-center text-gray-600 dark:text-gray-400 text-theme-sm capitalize">
                            {course.mode}
                          </TableCell>
                          <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-end text-gray-800 dark:text-white/90 font-medium tabular-nums text-theme-sm">
                            ₹{course.normalFee}
                          </TableCell>
                          <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-center">
                            <Badge
                              size="sm"
                              color={course.isActive ? "success" : "error"}
                            >
                              {course.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-center">
                            <div className="flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="mr-2"
                                onClick={() => handleEdit(course)}
                              >
                                <PencilIcon className="size-5" />
                              </Button>
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setOpenDropdownId(
                                      openDropdownId === course._id
                                        ? null
                                        : course._id,
                                    )
                                  }
                                  className="dropdown-toggle size-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.05]"
                                >
                                  <VerticalDotsIcon className="size-5" />
                                </button>
                                <Dropdown
                                  isOpen={openDropdownId === course._id}
                                  onClose={() => setOpenDropdownId(null)}
                                  className="w-40"
                                >
                                  <DropdownItem
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      toggleCourseStatus(course._id);
                                    }}
                                    className={
                                      course.isActive
                                        ? "text-red-500"
                                        : "text-emerald-500"
                                    }
                                  >
                                    {course.isActive
                                      ? "Deactivate"
                                      : "Activate"}
                                  </DropdownItem>
                                  <DropdownItem
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      handleDelete(course._id);
                                    }}
                                    className="text-red-500"
                                  >
                                    <CloseIcon className="size-4 mr-2" /> Delete
                                  </DropdownItem>
                                </Dropdown>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="py-8 text-center text-gray-500"
                        >
                          No courses found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </>
              ) : activeTab === "categories" ? (
                <>
                  <TableHeader className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)] border-b border-gray-100 dark:border-gray-800">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit w-12"
                      >
                        <input
                          type="checkbox"
                          checked={
                            categories.length > 0 &&
                            selectedCategories.length === categories.length
                          }
                          onChange={(e) =>
                            setSelectedCategories(
                              e.target.checked
                                ? categories.map((c) => c._id)
                                : [],
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-3 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit w-12"
                      >
                        #
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Description
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Status
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {loadingCategories ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center">
                          <LoadingSpinner />
                        </TableCell>
                      </TableRow>
                    ) : categories.length > 0 ? (
                      categories.map((cat, index) => (
                        <TableRow
                          key={cat._id}
                          className="group transition-all hover:bg-slate-50/80 dark:hover:bg-white/5 odd:bg-transparent even:bg-gray-50/30 dark:even:bg-white/[0.01] border-b border-gray-100 dark:border-gray-800/50 last:border-0"
                        >
                          <TableCell className="py-4 px-4 relative w-12">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(cat._id)}
                              onChange={() =>
                                setSelectedCategories((prev) =>
                                  prev.includes(cat._id)
                                    ? prev.filter((id) => id !== cat._id)
                                    : [...prev, cat._id],
                                )
                              }
                              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                            />
                          </TableCell>
                          <TableCell className="py-4 px-3 text-gray-500 dark:text-gray-400 text-[11px] font-bold tabular-nums w-12">
                            {index + 1}
                          </TableCell>
                          <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                            {cat.name}
                          </TableCell>
                          <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-gray-600 dark:text-gray-400 text-theme-sm">
                            {cat.description || "-"}
                          </TableCell>
                          <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-center">
                            <Badge
                              size="sm"
                              color={cat.isActive ? "success" : "error"}
                            >
                              {cat.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-center">
                            <div className="flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="mr-2"
                                onClick={() => handleEditCategory(cat)}
                              >
                                <PencilIcon className="size-5" />
                              </Button>
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setOpenDropdownId(
                                      openDropdownId === cat._id
                                        ? null
                                        : cat._id,
                                    )
                                  }
                                  className="dropdown-toggle size-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.05]"
                                >
                                  <VerticalDotsIcon className="size-5" />
                                </button>
                                <Dropdown
                                  isOpen={openDropdownId === cat._id}
                                  onClose={() => setOpenDropdownId(null)}
                                  className="w-40"
                                >
                                  <DropdownItem
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      toggleCategoryStatusHandler(cat._id);
                                    }}
                                    className={
                                      cat.isActive
                                        ? "text-red-500"
                                        : "text-emerald-500"
                                    }
                                  >
                                    {cat.isActive ? "Deactivate" : "Activate"}
                                  </DropdownItem>
                                  <DropdownItem
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      handleDeleteCategory(cat._id);
                                    }}
                                    className="text-red-500"
                                  >
                                    <CloseIcon className="size-4 mr-2" /> Delete
                                  </DropdownItem>
                                </Dropdown>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-gray-500"
                        >
                          No categories found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </>
              ) : (
                <>
                   <TableHeader className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)] border-b border-gray-100 dark:border-gray-800">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit w-12"
                      >
                        <GripVertical className="size-4 mx-auto" />
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit w-12"
                      >
                        <input
                          type="checkbox"
                          checked={
                            modules.length > 0 &&
                            selectedModules.length === modules.length
                          }
                          onChange={(e) =>
                            setSelectedModules(
                              e.target.checked ? modules.map((m) => m._id) : [],
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-3 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit w-12"
                      >
                        #
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Module Name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Duration
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Mode
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Status
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {loadingModules ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8 text-center">
                          <LoadingSpinner />
                        </TableCell>
                      </TableRow>
                    ) : modules.length > 0 ? (
                      modules.map((mod, index) => (
                        <DraggableModuleRow
                          key={mod._id}
                          mod={mod}
                          index={index}
                          moveModule={moveModule}
                          saveOrder={saveModuleOrder}
                          handleEditModule={handleEditModule}
                          toggleModuleStatusHandler={toggleModuleStatusHandler}
                          handleDeleteModule={handleDeleteModule}
                          openDropdownId={openDropdownId}
                          setOpenDropdownId={setOpenDropdownId}
                          isSelected={selectedModules.includes(mod._id)}
                          onSelect={() =>
                            setSelectedModules((prev) =>
                              prev.includes(mod._id)
                                ? prev.filter((id) => id !== mod._id)
                                : [...prev, mod._id],
                            )
                          }
                        />
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="py-8 text-center text-gray-500"
                        >
                          No modules found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </>
              )}
            </Table>
          </div>
        </ComponentCard>
      </div>

      {/* Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={resetForm}
            ></div>
            <div className="relative inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full dark:bg-gray-800">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  {editingCourse ? "Edit Course" : "Add New Course"}
                </h3>
                <form onSubmit={handleCourseSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="courseCode">Course Code *</Label>
                      <Input
                        id="courseCode"
                        name="courseCode"
                        value={formData.courseCode}
                        onChange={handleInputChange}
                        disabled={!!editingCourse}
                      />
                    </div>
                    <div>
                      <Label htmlFor="courseName">Course Name *</Label>
                      <Input
                        id="courseName"
                        name="courseName"
                        value={formData.courseName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label
                        htmlFor="modules"
                        className="flex items-center justify-between"
                      >
                        <span>Modules</span>
                        <span className="text-[10px] text-gray-400 font-normal italic">
                          Search and select modules from your database
                        </span>
                      </Label>

                      {/* Selected Modules Badges */}
                      <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl min-h-[46px]">
                        {formData.modules.length > 0 ? (
                          formData.modules.map((modId, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-semibold rounded-lg border border-brand-100 dark:border-brand-800/50"
                            >
                              {getModuleNameById(modId)}
                              <button
                                type="button"
                                onClick={() => removeModuleFromCourse(modId)}
                                className="hover:text-brand-900 dark:hover:text-white transition-colors"
                              >
                                <CloseIcon className="size-3" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No modules selected
                          </span>
                        )}
                      </div>

                      {/* Search Input for Modules */}
                      <div className="relative">
                        <Input
                          id="moduleSearch"
                          placeholder="Search modules..."
                          value={moduleSearchTerm}
                          onChange={(e) => setModuleSearchTerm(e.target.value)}
                        />
                        {moduleSearchTerm && (
                          <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {modules
                              .filter(
                                (m) =>
                                  m.name
                                    .toLowerCase()
                                    .includes(moduleSearchTerm.toLowerCase()) &&
                                  !formData.modules.includes(m._id),
                              )
                              .map((m) => (
                                <button
                                  key={m._id}
                                  type="button"
                                  onClick={() => addModuleToCourse(m._id)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-colors"
                                >
                                  {m.name}
                                </button>
                              ))}
                            {modules.filter(
                              (m) =>
                                m.name
                                  .toLowerCase()
                                  .includes(moduleSearchTerm.toLowerCase()) &&
                                !formData.modules.includes(m._id),
                            ).length === 0 && (
                              <div className="px-4 py-2 text-xs text-gray-500 italic">
                                No matching modules found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (hrs) *</Label>
                      <Input
                        type="number"
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label>Mode</Label>
                      <Select
                        options={modeOptions}
                        value={formData.mode}
                        onChange={(val) => handleSelectChange(val, "mode")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="singleShotFee">Single Shot Fee *</Label>
                      <Input
                        type="number"
                        id="singleShotFee"
                        name="singleShotFee"
                        value={formData.singleShotFee}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="normalFee">Normal Fee *</Label>
                      <Input
                        type="number"
                        id="normalFee"
                        name="normalFee"
                        value={formData.normalFee}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isActive: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <Label htmlFor="isActive" className="ml-2 mb-0">
                        Active Course
                      </Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      {editingCourse ? "Update" : "Add"}
                    </Button>
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
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={resetCategoryForm}
            ></div>
            <div className="relative inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-md sm:w-full dark:bg-gray-800">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h3>
                <form
                  onSubmit={handleCategorySubmit}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <Label htmlFor="catName">Category Name *</Label>
                    <Input
                      id="catName"
                      name="name"
                      value={categoryFormData.name}
                      onChange={handleCategoryInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="catDesc">Description</Label>
                    <Input
                      id="catDesc"
                      name="description"
                      value={categoryFormData.description}
                      onChange={handleCategoryInputChange}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="catActive"
                      checked={categoryFormData.isActive}
                      onChange={(e) =>
                        setCategoryFormData((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <Label htmlFor="catActive" className="ml-2 mb-0">
                      Active Category
                    </Label>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetCategoryForm}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      {editingCategory ? "Update" : "Add"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer
        position="top-center"
        className="!z-[999999]"
        style={{ zIndex: 999999 }}
      />

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={resetModuleForm}
            ></div>
            <div className="relative inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-md sm:w-full dark:bg-gray-800">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  {editingModule ? "Edit Module" : "Add New Module"}
                </h3>
                <form onSubmit={handleModuleSubmit} className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="modName">Module Name *</Label>
                    <Input
                      id="modName"
                      name="name"
                      value={moduleFormData.name}
                      onChange={handleModuleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="modDuration">Duration</Label>
                    <Input
                      id="modDuration"
                      name="duration"
                      value={moduleFormData.duration}
                      onChange={handleModuleInputChange}
                      placeholder="e.g. 40 hrs"
                    />
                  </div>
                  <div>
                    <Label>Mode</Label>
                    <Select
                      options={modeOptions}
                      value={moduleFormData.mode}
                      onChange={(val) =>
                        setModuleFormData((prev) => ({ ...prev, mode: val }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="modSyllabus">Syllabus</Label>
                    <textarea
                      id="modSyllabus"
                      name="syllabus"
                      rows="4"
                      className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
                      value={moduleFormData.syllabus}
                      onChange={handleModuleInputChange}
                    ></textarea>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="modActive"
                      checked={moduleFormData.isActive}
                      onChange={(e) =>
                        setModuleFormData((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <Label htmlFor="modActive" className="ml-2 mb-0">
                      Active Module
                    </Label>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetModuleForm}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      {editingModule ? "Update" : "Add"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
