import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class BrandService {
  // Get all brands
  static async getAllBrands() {
    try {
      const response = await axios.get(`${API}/brands`, {
        withCredentials: true
      });
      return response.data.brands;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch brands");
    }
  }

  // Get brand by ID
  static async getBrandById(brandId) {
    try {
      const response = await axios.get(`${API}/brands/${brandId}`, {
        withCredentials: true
      });
      return response.data.brand;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch brand");
    }
  }

  // Create a new brand
  static async createBrand(brandData) {
    try {
      const response = await axios.post(`${API}/brands`, brandData, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to create brand");
    }
  }

  // Update a brand
  static async updateBrand(brandId, brandData) {
    try {
      const response = await axios.put(`${API}/brands/${brandId}`, brandData, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update brand");
    }
  }

  // Delete a brand
  static async deleteBrand(brandId) {
    try {
      const response = await axios.delete(`${API}/brands/${brandId}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete brand");
    }
  }

  // Assign brands to a user
  static async assignBrandsToUser(userId, brandIds) {
    try {
      const response = await axios.post(`${API}/brands/assign`, {
        userId,
        brandIds
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to assign brands to user");
    }
  }

  // Get brands assigned to a user
  static async getUserBrands(userId) {
    try {
      const response = await axios.get(`${API}/brands/user/${userId}`, {
        withCredentials: true
      });
      return response.data.brands;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch user brands");
    }
  }
}

export default BrandService;