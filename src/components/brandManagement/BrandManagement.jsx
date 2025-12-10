import { useState, useEffect } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

import API from "../../config/api";

const BrandManagement = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBrand, setDeletingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    themeColor: "#ED1164",
    isActive: true
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/brands`, {
        withCredentials: true
      });
      setBrands(res.data.brands);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to fetch brands");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingBrand) {
        // Update existing brand
        await axios.put(
          `${API}/brands/${editingBrand._id}`,
          formData,
          { withCredentials: true }
        );
        toast.success("Brand updated successfully");
      } else {
        // Create new brand
        await axios.post(
          `${API}/brands`,
          formData,
          { withCredentials: true }
        );
        toast.success("Brand created successfully");
      }

      // Refresh brands list
      fetchBrands();

      // Close modal and reset form
      setShowModal(false);
      setEditingBrand(null);
      setFormData({
        name: "",
        description: "",
        website: "",
        isActive: true
      });
    } catch (error) {
      console.error("Error saving brand:", error);
      toast.error(error.response?.data?.message || "Failed to save brand");
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || "",
      description: brand.description || "",
      website: brand.website || "",
      themeColor: brand.themeColor || "#ED1164",
      isActive: brand.isActive !== undefined ? brand.isActive : true
    });
    setShowModal(true);
  };

  const handleDelete = (brand) => {
    setDeletingBrand(brand);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${API}/brands/${deletingBrand._id}`,
        { withCredentials: true }
      );

      toast.success("Brand deleted successfully");

      // Refresh brands list
      fetchBrands();

      // Close modal
      setShowDeleteModal(false);
      setDeletingBrand(null);
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error(error.response?.data?.message || "Failed to delete brand");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBrand(null);
    setFormData({
      name: "",
      description: "",
      website: "",
      themeColor: "#ED1164",
      isActive: true
    });
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingBrand(null);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Brand Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your brands and their settings</p>
        </div>
        <Button onClick={() => setShowModal(true)} variant="primary">
          Add New Brand
        </Button>
      </div>

      <ComponentCard>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Brand Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Website
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Theme Color
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {brands.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No brands found
                    </td>
                  </tr>
                ) : (
                  brands.map((brand) => (
                    <tr key={brand._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {brand.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {brand.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {brand.website ? (
                            <a
                              href={brand.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                            >
                              {brand.website}
                            </a>
                          ) : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 w-6 rounded-full border border-gray-200"
                            style={{ backgroundColor: brand.themeColor || "#ED1164" }}
                          ></div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {brand.themeColor || "#ED1164"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${brand.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                          }`}>
                          {brand.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(brand)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </ComponentCard>

      {/* Create/Edit Brand Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={closeModal}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:max-w-lg sm:w-full dark:bg-gray-800">
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {editingBrand ? "Edit Brand" : "Create Brand"}
                  </h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="name">Brand Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter brand name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Enter brand description"
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="themeColor">Theme Color</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          id="themeColor"
                          name="themeColor"
                          value={formData.themeColor}
                          onChange={handleInputChange}
                          className="h-10 w-20 cursor-pointer rounded border border-gray-300 p-1"
                        />
                        <Input
                          type="text"
                          value={formData.themeColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, themeColor: e.target.value }))}
                          placeholder="#ED1164"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <Label htmlFor="isActive" className="ml-2 mb-0">
                        Is Active
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-gray-700">
                  <Button
                    type="submit"
                    variant="primary"
                    className="inline-flex justify-center w-full px-4 py-2 sm:ml-3 sm:w-auto"
                  >
                    {editingBrand ? "Update Brand" : "Create Brand"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingBrand && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={closeDeleteModal}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:max-w-lg sm:w-full dark:bg-gray-800">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Delete Brand
                </h3>

                <div className="mt-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the brand "<strong>{deletingBrand.name}</strong>"?
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-gray-700">
                <Button
                  type="button"
                  variant="danger"
                  onClick={confirmDelete}
                  className="inline-flex justify-center w-full px-4 py-2 sm:ml-3 sm:w-auto"
                >
                  Delete Brand
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDeleteModal}
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

export default BrandManagement;