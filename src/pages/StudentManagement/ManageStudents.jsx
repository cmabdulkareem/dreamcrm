import PageBreadcrumb from "../../components/common/PageBreadCrumb.jsx";
import PageMeta from "../../components/common/PageMeta.jsx";
import { useState, useEffect, useContext, useCallback } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import Button from "../../components/ui/button/Button.jsx";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import StudentProfileModal from "../../components/StudentManagement/StudentProfileModal.jsx";
import { isCounsellor } from "../../utils/roleHelpers";

import API from "../../config/api";
import { Modal } from "../../components/ui/modal";
import DatePicker from "../../components/form/date-picker.jsx";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import StudentFilters from "../../components/StudentManagement/StudentFilters.jsx";
import StudentTableRow from "../../components/StudentManagement/StudentTableRow.jsx";
import StudentMobileCard from "../../components/StudentManagement/StudentMobileCard.jsx";

export default function ManageStudents() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addNotification } = useNotifications();
  const isUserCounsellor = user && isCounsellor(user);
  
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);

  // Date Modal State
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedStudentForDate, setSelectedStudentForDate] = useState(null);
  const [newEnrollmentDate, setNewEnrollmentDate] = useState("");

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBatchStatus, setFilterBatchStatus] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showFilters, setShowFilters] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const toggleDropdown = useCallback((id) => {
    setOpenDropdownId(prev => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API}/courses/all`, { withCredentials: true });
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/students/all`, { withCredentials: true });
      setStudents(response.data.students || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    navigate("/new-student");
  };

  const handleEditClick = (student) => {
    navigate(`/edit-student/${student._id}`);
  };

  const handleViewStudent = (student) => {
    navigate(`/edit-student/${student._id}`);
  };

  const handleViewProfile = (student) => {
    setSelectedStudentForProfile(student);
    setIsProfileModalOpen(true);
  };

  const handleDeleteStudent = async (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.fullName}? This will also reset the associated lead's status.`)) {
      try {
        await axios.delete(`${API}/students/delete/${student._id}`, { withCredentials: true });
        toast.success("Student deleted successfully");
        fetchStudents();
        
        addNotification({
          type: 'student_deleted',
          userName: user?.fullName || 'Someone',
          avatar: user?.avatar || null,
          action: 'deleted student',
          entityName: student.fullName,
          module: 'Student Management',
        });
      } catch (error) {
        console.error("Error deleting student:", error);
        toast.error(error.response?.data?.message || "Failed to delete student");
      }
    }
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

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return "/images/user/user-01.jpg";
    if (photoPath.startsWith('http') || photoPath.startsWith('data:')) return photoPath;
    const baseUrl = API.replace('/api', '');
    return `${baseUrl}${photoPath}`;
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const name = student.fullName || "";
    const sid = student.studentId || "";
    const email = student.email || "";
    const phone = student.phone1 || "";
    
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = filterCourse === "" || student.coursePreference === filterCourse;
    const matchesStatus = filterStatus === "" || student.status === filterStatus;
    const matchesBatchStatus =
      filterBatchStatus === "" ||
      (filterBatchStatus === "assigned" && student.batchScheduled) ||
      (filterBatchStatus === "unassigned" && !student.batchScheduled);

    return matchesSearch && matchesCourse && matchesStatus && matchesBatchStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCourse, filterStatus, filterBatchStatus]);

  return (
    <div>
      <PageMeta
        title="Manage Students | CDC International"
        description="Manage your students here"
      />
      <PageBreadcrumb items={[
        { name: "Home", path: "/" },
        { name: "Student Management", path: "/manage-students" },
        { name: "Manage Students" }
      ]} />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <StudentFilters
            filteredCount={filteredStudents.length}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            search={searchTerm}
            filterCourse={filterCourse}
            filterStatus={filterStatus}
            filterBatchStatus={filterBatchStatus}
            onSearchChange={setSearchTerm}
            onFilterCourseChange={setFilterCourse}
            onFilterStatusChange={setFilterStatus}
            onFilterBatchStatusChange={setFilterBatchStatus}
            courseOptions={courses.map(c => ({ label: c.courseName, value: c._id }))}
            onAddStudent={handleAddStudent}
            isUserCounsellor={isUserCounsellor}
          />

          {loading ? (
            <LoadingSpinner className="py-20" />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-auto max-h-[calc(100vh-250px)] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm custom-scrollbar">
                <Table className="min-w-full border-collapse">
                  <TableHeader className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)] border-b border-gray-100 dark:border-gray-800">
                    <TableRow>
                      <TableCell isHeader className="py-4 px-3 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit">#</TableCell>
                      <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Photo</TableCell>
                      <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Student</TableCell>
                      <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Contact</TableCell>
                      <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Course</TableCell>
                      <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Amount</TableCell>
                      <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Enrollment Date</TableCell>
                      <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Status</TableCell>
                      <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {currentItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-20 text-center text-gray-500 bg-white dark:bg-transparent">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <p className="text-sm font-medium">No students found.</p>
                            <p className="text-xs text-gray-400">Try adjusting your search or filters.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentItems.map((student, index) => (
                        <StudentTableRow
                          key={student._id}
                          student={student}
                          index={indexOfFirstItem + index + 1}
                          onEdit={handleEditClick}
                          onView={handleViewStudent}
                          onDate={handleDateClick}
                          onDelete={handleDeleteStudent}
                          onViewProfile={handleViewProfile}
                          openDropdownId={openDropdownId}
                          onToggleDropdown={toggleDropdown}
                          onDropdownClose={() => setOpenDropdownId(null)}
                          isUserCounsellor={isUserCounsellor}
                          getPhotoUrl={getPhotoUrl}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {currentItems.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    No students found.
                  </div>
                ) : (
                  currentItems.map((student) => (
                    <StudentMobileCard
                      key={student._id}
                      student={student}
                      onEdit={handleEditClick}
                      onView={handleViewStudent}
                      onDate={handleDateClick}
                      onDelete={handleDeleteStudent}
                      onViewProfile={handleViewProfile}
                      openDropdownId={openDropdownId}
                      onToggleDropdown={toggleDropdown}
                      onDropdownClose={() => setOpenDropdownId(null)}
                      isUserCounsellor={isUserCounsellor}
                      getPhotoUrl={getPhotoUrl}
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
              {filteredStudents.length > itemsPerPage && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900 dark:text-gray-200">{indexOfFirstItem + 1}</span> to{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-200">
                      {Math.min(indexOfLastItem, filteredStudents.length)}
                    </span>{" "}
                    of <span className="font-medium text-gray-900 dark:text-gray-200">{filteredStudents.length}</span> students
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                              ? "bg-brand-500 text-white"
                              : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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