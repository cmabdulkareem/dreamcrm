import PageBreadcrumb from "../../components/common/PageBreadCrumb.jsx";
import PageMeta from "../../components/common/PageMeta.jsx";
import { useState, useEffect, useContext } from "react";
import ComponentCard from "../../components/common/ComponentCard.jsx";
import Button from "../../components/ui/button/Button.jsx";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function ManageStudents() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addNotification, areToastsEnabled } = useNotifications();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

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

  const handleViewStudent = (studentId) => {
    // In a real implementation, you would navigate to a student detail page
    toast.info(`Viewing student ${studentId}`);
  };

  const handleEditClick = (student) => {
    setEditingStudentId(student._id);
    setEditFormData({ ...student });
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setEditFormData({});
  };

  const handleInputChange = (e, field) => {
    setEditFormData({
      ...editFormData,
      [field]: e.target.value
    });
  };

  const handleSaveEdit = async () => {
    try {
      const response = await axios.put(
        `${API}/students/update/${editingStudentId}`,
        editFormData,
        { withCredentials: true }
      );
      
      // Update the student in the local state
      setStudents(students.map(student => 
        student._id === editingStudentId ? response.data.student : student
      ));
      
      setEditingStudentId(null);
      setEditFormData({});
      
      if (areToastsEnabled()) {
        toast.success("Student updated successfully!");
      }
      
      // Add notification
      addNotification({
        type: 'student_updated',
        userName: user?.fullName || 'Someone',
        avatar: user?.avatar || null,  // Add avatar to notification
        action: 'updated student',
        entityName: response.data.student.fullName,
        module: 'Student Management',
      });
    } catch (error) {
      console.error("Error updating student:", error);
      if (areToastsEnabled()) {
        toast.error("Failed to update student. Please try again.");
      }
    }
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return "/images/user/user-01.jpg";
    if (photoPath.startsWith('http')) return photoPath;
    
    // Extract the base URL (without /api) to construct the correct photo URL
    const baseUrl = API.replace('/api', '');
    // Photo paths from the database already start with /uploads/
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
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Final Amount
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {editingStudentId === student._id ? (
                            <input
                              type="text"
                              value={editFormData.studentId || ''}
                              onChange={(e) => handleInputChange(e, 'studentId')}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            student.studentId
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {editingStudentId === student._id ? (
                            <input
                              type="text"
                              value={editFormData.fullName || ''}
                              onChange={(e) => handleInputChange(e, 'fullName')}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            student.fullName
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {editingStudentId === student._id ? (
                            <input
                              type="email"
                              value={editFormData.email || ''}
                              onChange={(e) => handleInputChange(e, 'email')}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            student.email
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {editingStudentId === student._id ? (
                            <input
                              type="text"
                              value={editFormData.phone1 || ''}
                              onChange={(e) => handleInputChange(e, 'phone1')}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            student.phone1
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {editingStudentId === student._id ? (
                            <input
                              type="text"
                              value={editFormData.coursePreference || ''}
                              onChange={(e) => handleInputChange(e, 'coursePreference')}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            <div>
                              {student.courseDetails ? 
                                `${student.courseDetails.courseCode} - ${student.courseDetails.courseName}` : 
                                student.coursePreference}
                              {student.additionalCourseDetails && student.additionalCourseDetails.length > 0 && (
                                <div className="text-xs text-gray-400 mt-1">
                                  +{student.additionalCourseDetails.length} additional course(s)
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {editingStudentId === student._id ? (
                            <input
                              type="number"
                              value={editFormData.totalCourseValue || ''}
                              onChange={(e) => handleInputChange(e, 'totalCourseValue')}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            `₹${student.totalCourseValue || 0}`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {editingStudentId === student._id ? (
                            <input
                              type="number"
                              value={editFormData.discountPercentage || ''}
                              onChange={(e) => handleInputChange(e, 'discountPercentage')}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            `${student.discountPercentage || 0}%`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {editingStudentId === student._id ? (
                            <input
                              type="number"
                              value={editFormData.finalAmount || ''}
                              onChange={(e) => handleInputChange(e, 'finalAmount')}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            `₹${student.finalAmount || 0}`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {editingStudentId === student._id ? (
                            <input
                              type="date"
                              value={editFormData.enrollmentDate ? new Date(editFormData.enrollmentDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => handleInputChange(e, 'enrollmentDate')}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            new Date(student.enrollmentDate).toLocaleDateString()
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingStudentId === student._id ? (
                            <div className="flex space-x-2">
                              <button 
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Save
                              </button>
                              <button 
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleEditClick(student)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleViewStudent(student.studentId)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                View
                              </button>
                            </div>
                          )}
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

      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div>
  );
}