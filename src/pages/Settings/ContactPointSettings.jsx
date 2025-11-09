import { useState, useEffect, useContext } from "react";
import axios from "axios";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import Badge from "../../components/ui/badge/Badge";
import { PencilIcon, CloseIcon, PlusIcon } from "../../icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../context/authContext";
import { useNotifications } from "../../context/NotificationContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function ContactPointSettings() {
  const { user } = useContext(AuthContext);
  const { addNotification } = useNotifications();
  const [contactPoints, setContactPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContactPoint, setSelectedContactPoint] = useState(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  useEffect(() => {
    fetchContactPoints();
  }, []);

  const fetchContactPoints = async () => {
    try {
      const response = await axios.get(`${API}/contact-points/all`, { withCredentials: true });
      setContactPoints(response.data.contactPoints);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching contact points:", error);
      toast.error("Failed to load contact points");
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsActive(true);
    setSelectedContactPoint(null);
  };

  const handleAdd = () => {
    resetForm();
    openAddModal();
  };

  const handleEdit = (contactPoint) => {
    setSelectedContactPoint(contactPoint);
    setName(contactPoint.name);
    setDescription(contactPoint.description || "");
    setIsActive(contactPoint.isActive);
    openEditModal();
  };

  const handleDelete = (contactPoint) => {
    setSelectedContactPoint(contactPoint);
    openDeleteModal();
  };

  const createContactPoint = async () => {
    if (!name.trim()) {
      toast.error("Contact point name is required");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/contact-points/create`,
        { 
          name, 
          description, 
          isActive 
        },
        { withCredentials: true }
      );
      
      toast.success("Contact point created successfully!");
      
      // Add notification
      addNotification({
        type: 'contact_point_created',
        userName: user?.fullName || 'Someone',
        action: 'created contact point',
        entityName: name,
        module: 'Contact Point Settings',
      });
      
      closeAddModal();
      resetForm();
      fetchContactPoints();
    } catch (error) {
      console.error("Error creating contact point:", error);
      toast.error(error.response?.data?.message || "Failed to create contact point");
    }
  };

  const updateContactPoint = async () => {
    if (!name.trim()) {
      toast.error("Contact point name is required");
      return;
    }

    try {
      await axios.put(
        `${API}/contact-points/update/${selectedContactPoint._id}`,
        { 
          name, 
          description, 
          isActive 
        },
        { withCredentials: true }
      );
      
      toast.success("Contact point updated successfully!");
      
      // Add notification
      addNotification({
        type: 'contact_point_updated',
        userName: user?.fullName || 'Someone',
        action: 'updated contact point',
        entityName: name,
        module: 'Contact Point Settings',
      });
      
      closeEditModal();
      resetForm();
      fetchContactPoints();
    } catch (error) {
      console.error("Error updating contact point:", error);
      toast.error(error.response?.data?.message || "Failed to update contact point");
    }
  };

  const deleteContactPoint = async () => {
    try {
      await axios.delete(
        `${API}/contact-points/delete/${selectedContactPoint._id}`,
        { withCredentials: true }
      );
      
      toast.success("Contact point deleted successfully!");
      
      // Add notification
      addNotification({
        type: 'contact_point_deleted',
        userName: user?.fullName || 'Someone',
        action: 'deleted contact point',
        entityName: selectedContactPoint.name,
        module: 'Contact Point Settings',
      });
      
      closeDeleteModal();
      resetForm();
      fetchContactPoints();
    } catch (error) {
      console.error("Error deleting contact point:", error);
      toast.error("Failed to delete contact point");
    }
  };

  return (
    <>
      <PageMeta
        title="Contact Point Settings | Manage Contact Points"
        description="Manage contact points for lead tracking"
      />
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-title-md2 font-bold text-black dark:text-white">
              Contact Point Management
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage contact points for lead tracking
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleAdd}
            startIcon={<PlusIcon className="size-5" />}
          >
            Add Contact Point
          </Button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Name
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Description
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Status
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {contactPoints.length > 0 ? (
                    contactPoints.map((contactPoint) => (
                      <TableRow key={contactPoint._id}>
                        <TableCell className="py-3 font-medium text-gray-800 dark:text-white/90">
                          {contactPoint.name}
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                          {contactPoint.description || "No description"}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            size="sm"
                            color={contactPoint.isActive ? "success" : "error"}
                          >
                            {contactPoint.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(contactPoint)}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              <PencilIcon className="size-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(contactPoint)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <CloseIcon className="size-5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No contact points found. Add your first contact point to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Point Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={closeAddModal}
        className="max-w-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Add New Contact Point
        </h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="newContactPointName">Contact Point Name *</Label>
            <Input
              id="newContactPointName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Walk In"
            />
          </div>

          <div>
            <Label htmlFor="newContactPointDesc">Description</Label>
            <textarea
              id="newContactPointDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contact point description (optional)"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newContactPointActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="newContactPointActive" className="mb-0">Mark as Active</Label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Only active contact points will appear in dropdowns</p>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button type="button" onClick={createContactPoint}>
              Create Contact Point
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Contact Point Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={closeEditModal}
        className="max-w-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Edit Contact Point
        </h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="editContactPointName">Contact Point Name *</Label>
            <Input
              id="editContactPointName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Walk In"
            />
          </div>

          <div>
            <Label htmlFor="editContactPointDesc">Description</Label>
            <textarea
              id="editContactPointDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contact point description (optional)"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editContactPointActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="editContactPointActive" className="mb-0">Mark as Active</Label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button type="button" onClick={updateContactPoint}>
              Update Contact Point
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        className="max-w-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Delete Contact Point
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete <strong>{selectedContactPoint?.name}</strong>? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={deleteContactPoint}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </>
  );
}