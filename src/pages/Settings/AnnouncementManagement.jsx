import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { isManager } from "../../utils/roleHelpers";

import API from "../../config/api";

const AnnouncementManagement = () => {
  const { user } = useContext(AuthContext);
  const { addNotification } = useNotifications();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    startTime: "",
    endTime: ""
  });

  // Check if user can approve announcements (admin/owner/manager/centre head)
  const canApprove = isManager(user);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/announcements/all`, {
        withCredentials: true
      });
      setAnnouncements(response.data.announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to fetch announcements");
    } finally {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.title || !formData.message || !formData.startTime || !formData.endTime) {
      toast.error("Please fill all fields");
      return;
    }

    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      const payload = {
        ...formData,
        createdBy: user._id,
        status: canApprove ? "approved" : "pending" // Auto-approve for managers
      };

      const response = await axios.post(`${API}/announcements/create`, payload, {
        withCredentials: true
      });

      setAnnouncements(prev => [response.data.announcement, ...prev]);
      setShowCreateModal(false);
      setFormData({
        title: "",
        message: "",
        startTime: "",
        endTime: ""
      });

      toast.success("Announcement created successfully");

      // If auto-approved, notify all users
      if (canApprove) {
        // In a real implementation, this would be handled by the backend
        // For now, we'll just show a toast
        toast.info("Announcement auto-approved and will be visible to all users");
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error(error.response?.data?.message || "Failed to create announcement");
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      startTime: new Date(announcement.startTime).toISOString().slice(0, 16),
      endTime: new Date(announcement.endTime).toISOString().slice(0, 16)
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.title || !formData.message || !formData.startTime || !formData.endTime) {
      toast.error("Please fill all fields");
      return;
    }

    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      const payload = {
        ...formData,
        status: editingAnnouncement.status // Keep the existing status
      };

      const response = await axios.put(`${API}/announcements/${editingAnnouncement._id}`, payload, {
        withCredentials: true
      });

      setAnnouncements(prev =>
        prev.map(announcement =>
          announcement._id === editingAnnouncement._id
            ? response.data.announcement
            : announcement
        )
      );

      setShowEditModal(false);
      setEditingAnnouncement(null);
      setFormData({
        title: "",
        message: "",
        startTime: "",
        endTime: ""
      });

      toast.success("Announcement updated successfully");
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast.error(error.response?.data?.message || "Failed to update announcement");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      await axios.delete(`${API}/announcements/${id}`, {
        withCredentials: true
      });

      setAnnouncements(prev => prev.filter(announcement => announcement._id !== id));
      toast.success("Announcement deleted");
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error(error.response?.data?.message || "Failed to delete announcement");
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await axios.patch(`${API}/announcements/${id}/approve`, {}, {
        withCredentials: true
      });

      setAnnouncements(prev =>
        prev.map(announcement =>
          announcement._id === id
            ? { ...announcement, status: "approved" }
            : announcement
        )
      );

      toast.success("Announcement approved");

      // Notify all users about the new announcement
      addNotification({
        type: "announcement",
        title: "New Announcement",
        message: "A new announcement has been posted",
        priority: "high"
      });
    } catch (error) {
      console.error("Error approving announcement:", error);
      toast.error(error.response?.data?.message || "Failed to approve announcement");
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.delete(`${API}/announcements/${id}`, {
        withCredentials: true
      });

      setAnnouncements(prev => prev.filter(announcement => announcement._id !== id));
      toast.success("Announcement rejected");
    } catch (error) {
      console.error("Error rejecting announcement:", error);
      toast.error(error.response?.data?.message || "Failed to reject announcement");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  // Filter announcements based on user role
  const filteredAnnouncements = canApprove
    ? announcements // Managers see all announcements
    : announcements.filter(a => a.status === "approved"); // Regular users see only approved

  return (
    <>
      <PageMeta
        title="Announcement Management | DreamCRM"
        description="Create and manage system announcements"
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Announcement Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {canApprove
              ? "Create and approve system announcements"
              : "Request new announcements (subject to approval)"}
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Announcement
          </Button>
        </div>

        <ComponentCard title="Announcements">
          {loading ? (
            <LoadingSpinner />
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {canApprove
                  ? "No announcements found. Create one to get started."
                  : "No announcements available at this time."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created By
                    </th>
                    {canApprove && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {filteredAnnouncements.map((announcement) => (
                    <tr key={announcement._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {announcement.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                          {announcement.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(announcement.startTime).toLocaleDateString()} - {new Date(announcement.endTime).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(announcement.status)}`}>
                          {announcement.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {announcement.createdBy?.fullName || "Unknown"}
                      </td>
                      {canApprove && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {announcement.status === "pending" ? (
                            <>
                              <button
                                onClick={() => handleApprove(announcement._id)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(announcement._id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(announcement)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(announcement._id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                              <span className="text-gray-500 dark:text-gray-400">Approved</span>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:max-w-lg sm:w-full dark:bg-gray-800">
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    Create New Announcement
                  </h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <Label>Title *</Label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label>Message *</Label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label>Start Time *</Label>
                      <input
                        type="datetime-local"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label>End Time *</Label>
                      <input
                        type="datetime-local"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-gray-700">
                  <Button
                    type="submit"
                    variant="primary"
                    className="inline-flex justify-center w-full px-4 py-2 sm:ml-3 sm:w-auto"
                  >
                    Create Announcement
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:max-w-lg sm:w-full dark:bg-gray-800">
              <form onSubmit={handleUpdate}>
                <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    Edit Announcement
                  </h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <Label>Title *</Label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label>Message *</Label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label>Start Time *</Label>
                      <input
                        type="datetime-local"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label>End Time *</Label>
                      <input
                        type="datetime-local"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-gray-700">
                  <Button
                    type="submit"
                    variant="primary"
                    className="inline-flex justify-center w-full px-4 py-2 sm:ml-3 sm:w-auto"
                  >
                    Update Announcement
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </>
  );
};

export default AnnouncementManagement;