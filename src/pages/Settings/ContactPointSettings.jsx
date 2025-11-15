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
import { AuthContext } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { isManager } from "../../utils/roleHelpers";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function ContactPointSettings() {
  const { user } = useContext(AuthContext);
  const { addNotification, areToastsEnabled } = useNotifications();
  
  // Check if user has appropriate role (Owner, Admin, Centre Head/Manager)
  const hasAccess = isManager(user);
  
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
    if (hasAccess) {
      fetchContactPoints();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

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
      
      if (areToastsEnabled()) {
        toast.success("Contact point created successfully!");
      }
      
      // Add notification
      addNotification({
        type: 'contact_point_created',
        userName: user?.fullName || 'Someone',
        avatar: user?.avatar || null,  // Add avatar to notification
        action: 'created contact point',
        entityName: name,
        module: 'Contact Point Settings',
      });
      
      closeAddModal();
      resetForm();
      fetchContactPoints();
    } catch (error) {
      console.error("Error creating contact point:", error);
      if (areToastsEnabled()) {
        toast.error(error.response?.data?.message || "Failed to create contact point");
      }
    }
  };

  const updateContactPoint = async () => {
    if (!selectedContactPoint || !selectedContactPoint._id) {
      toast.error("No contact point selected");
      return;
    }

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
      
      if (areToastsEnabled()) {
        toast.success("Contact point updated successfully!");
      }
      
      // Add notification
      addNotification({
        type: 'contact_point_updated',
        userName: user?.fullName || 'Someone',
        avatar: user?.avatar || null,  // Add avatar to notification
        action: 'updated contact point',
        entityName: name,
        module: 'Contact Point Settings',
      });
      
      closeEditModal();
      resetForm();
      fetchContactPoints();
    } catch (error) {
      console.error("Error updating contact point:", error);
      if (areToastsEnabled()) {
        toast.error(error.response?.data?.message || "Failed to update contact point");
      }
    }
  };

  const deleteContactPoint = async () => {
    if (!selectedContactPoint || !selectedContactPoint._id) {
      toast.error("No contact point selected");
      return;
    }

    try {
      await axios.delete(
        `${API}/contact-points/delete/${selectedContactPoint._id}`,
        { withCredentials: true }
      );
      
      if (areToastsEnabled()) {
        toast.success("Contact point deleted successfully!");
      }
      
      // Add notification
      addNotification({
        type: 'contact_point_deleted',
        userName: user?.fullName || 'Someone',
        avatar: user?.avatar || null,  // Add avatar to notification
        action: 'deleted contact point',
        entityName: selectedContactPoint.name,
        module: 'Contact Point Settings',
      });
      
      closeDeleteModal();
      resetForm();
      fetchContactPoints();
    } catch (error) {
      console.error("Error deleting contact point:", error);
      if (areToastsEnabled()) {
        toast.error("Failed to delete contact point");
      }
    }
  };

  if (!hasAccess) {
    return (
      <>
        <PageMeta
          title="Contact Point Settings | Access Denied"
          description="Access denied to contact point management"
        />
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Contact Point Management</h1>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                You don't have permission to access contact point management. Only Owners, Admins, and Centre Heads/Managers can manage contact points.
              </p>
            </div>
          </div>
        </div>
        <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Contact Point Settings | Manage Contact Points"
        description="Manage contact points for lead tracking"
      />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Contact Point Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage contact points used across the CRM system
            </p>
          </div>
          <Button onClick={handleAdd} endIcon={<PlusIcon className="size-5" />}>
            Add Contact Point
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading contact points...</p>
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Contact Point Name</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Description</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {contactPoints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                        No contact points found. Create your first contact point!
                      </TableCell>
                    </TableRow>
                  ) : (
                    contactPoints.map((contactPoint) => (
                      <TableRow key={contactPoint._id}>
                        <TableCell className="py-3">
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {contactPoint.name}
                          </p>
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {contactPoint.description || "N/A"}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge size="sm" color={contactPoint.isActive ? "success" : "error"}>
                            {contactPoint.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="mr-2"
                            endIcon={<PencilIcon className="size-5" />}
                            onClick={() => handleEdit(contactPoint)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            endIcon={<CloseIcon className="size-5" />}
                            onClick={() => handleDelete(contactPoint)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
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
            <Label htmlFor="contactPointName">Contact Point Name *</Label>
            <Input
              id="contactPointName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Walk In"
            />
          </div>

          <div>
            <Label htmlFor="contactPointDesc">Description</Label>
            <textarea
              id="contactPointDesc"
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
              id="isActiveContactPointAdd"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="isActiveContactPointAdd" className="mb-0">Mark as Active</Label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Only active contact points will appear in dropdowns</p>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button onClick={createContactPoint}>
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
              placeholder="Contact point name"
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
              id="isActiveContactPointEdit"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="isActiveContactPointEdit" className="mb-0">Active Contact Point</Label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Only active contact points will appear in dropdowns</p>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={updateContactPoint}>
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