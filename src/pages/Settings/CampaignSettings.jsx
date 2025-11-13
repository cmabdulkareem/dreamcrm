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

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function CampaignSettings() {
  const { user } = useContext(AuthContext);
  const { addNotification } = useNotifications();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [cashback, setCashback] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`${API}/campaigns/all`, { withCredentials: true });
      setCampaigns(response.data.campaigns);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setDiscountPercentage("");
    setCashback("");
    setIsActive(true);
    setSelectedCampaign(null);
  };

  const handleAdd = () => {
    resetForm();
    openAddModal();
  };

  const handleEdit = (campaign) => {
    setSelectedCampaign(campaign);
    setName(campaign.name);
    setDescription(campaign.description || "");
    setDiscountPercentage(campaign.discountPercentage || "");
    setCashback(campaign.cashback || "");
    setIsActive(campaign.isActive);
    openEditModal();
  };

  const handleDelete = (campaign) => {
    setSelectedCampaign(campaign);
    openDeleteModal();
  };

  const createCampaign = async () => {
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    try {
      await axios.post(
        `${API}/campaigns/create`,
        { 
          name, 
          description, 
          discountPercentage: discountPercentage ? parseFloat(discountPercentage) : 0,
          cashback: cashback ? parseFloat(cashback) : 0,
          isActive 
        },
        { withCredentials: true }
      );
      
      if (areToastsEnabled()) {
        toast.success("Campaign created successfully!");
      }
      
      // Add notification
      addNotification({
        type: 'campaign_created',
        userName: user?.fullName || 'Someone',
        avatar: user?.avatar || null,  // Add avatar to notification
        action: 'created campaign',
        entityName: name,
        module: 'Campaign Settings',
      });
      
      closeAddModal();
      resetForm();
      fetchCampaigns();
    } catch (error) {
      console.error("Error creating campaign:", error);
      if (areToastsEnabled()) {
        toast.error(error.response?.data?.message || "Failed to create campaign");
      }
    }
  };

  const updateCampaign = async () => {
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    try {
      await axios.put(
        `${API}/campaigns/update/${selectedCampaign._id}`,
        { 
          name, 
          description, 
          discountPercentage: discountPercentage ? parseFloat(discountPercentage) : 0,
          cashback: cashback ? parseFloat(cashback) : 0,
          isActive 
        },
        { withCredentials: true }
      );
      
      if (areToastsEnabled()) {
        toast.success("Campaign updated successfully!");
      }
      
      // Add notification
      addNotification({
        type: 'campaign_updated',
        userName: user?.fullName || 'Someone',
        avatar: user?.avatar || null,  // Add avatar to notification
        action: 'updated campaign',
        entityName: name,
        module: 'Campaign Settings',
      });
      
      closeEditModal();
      resetForm();
      fetchCampaigns();
    } catch (error) {
      console.error("Error updating campaign:", error);
      if (areToastsEnabled()) {
        toast.error(error.response?.data?.message || "Failed to update campaign");
      }
    }
  };

  const deleteCampaign = async () => {
    try {
      await axios.delete(
        `${API}/campaigns/delete/${selectedCampaign._id}`,
        { withCredentials: true }
      );
      
      if (areToastsEnabled()) {
        toast.success("Campaign deleted successfully!");
      }
      
      // Add notification
      addNotification({
        type: 'campaign_deleted',
        userName: user?.fullName || 'Someone',
        avatar: user?.avatar || null,  // Add avatar to notification
        action: 'deleted campaign',
        entityName: selectedCampaign.name,
        module: 'Campaign Settings',
      });
      
      closeDeleteModal();
      resetForm();
      fetchCampaigns();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      if (areToastsEnabled()) {
        toast.error("Failed to delete campaign");
      }
    }
  };

  return (
    <>
      <PageMeta
        title="Campaign Settings | Manage Campaigns"
        description="Manage marketing campaigns for lead tracking"
      />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Campaign Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage campaigns used across the CRM system
            </p>
          </div>
          <Button onClick={handleAdd} endIcon={<PlusIcon className="size-5" />}>
            Add Campaign
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading campaigns...</p>
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Campaign Name</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Description</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Discount %</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Cashback</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                        No campaigns found. Create your first campaign!
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((campaign) => (
                      <TableRow key={campaign._id}>
                        <TableCell className="py-3">
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {campaign.name}
                          </p>
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {campaign.description || "N/A"}
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {campaign.discountPercentage ? `${campaign.discountPercentage}%` : "N/A"}
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {campaign.cashback ? `₹${campaign.cashback}` : "N/A"}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge size="sm" color={campaign.isActive ? "success" : "error"}>
                            {campaign.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="mr-2"
                            endIcon={<PencilIcon className="size-5" />}
                            onClick={() => handleEdit(campaign)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            endIcon={<CloseIcon className="size-5" />}
                            onClick={() => handleDelete(campaign)}
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

      {/* Add Campaign Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={closeAddModal}
        className="max-w-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Add New Campaign
        </h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="campaignName">Campaign Name *</Label>
            <Input
              id="campaignName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Promotion 2024"
            />
          </div>

          <div>
            <Label htmlFor="campaignDesc">Description</Label>
            <textarea
              id="campaignDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Campaign description (optional)"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="discountPercentage">Discount %</Label>
              <Input
                id="discountPercentage"
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="cashback">Cashback (₹)</Label>
              <Input
                id="cashback"
                type="number"
                min="0"
                value={cashback}
                onChange={(e) => setCashback(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveCampaignAdd"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="isActiveCampaignAdd" className="mb-0">Mark as Active</Label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Only active campaigns will appear in dropdowns</p>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button onClick={createCampaign}>
              Create Campaign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Campaign Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={closeEditModal}
        className="max-w-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Edit Campaign
        </h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="editCampaignName">Campaign Name *</Label>
            <Input
              id="editCampaignName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Campaign name"
            />
          </div>

          <div>
            <Label htmlFor="editCampaignDesc">Description</Label>
            <textarea
              id="editCampaignDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Campaign description (optional)"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="editDiscountPercentage">Discount %</Label>
              <Input
                id="editDiscountPercentage"
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="editCashback">Cashback (₹)</Label>
              <Input
                id="editCashback"
                type="number"
                min="0"
                value={cashback}
                onChange={(e) => setCashback(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveCampaignEdit"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="isActiveCampaignEdit" className="mb-0">Active Campaign</Label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Only active campaigns will appear in dropdowns</p>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={updateCampaign}>
              Update Campaign
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
          Delete Campaign
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete <strong>{selectedCampaign?.name}</strong>? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={deleteCampaign}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </>
  );
}
