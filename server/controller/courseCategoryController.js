import Brand from '../model/brandModel.js';

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const headerBrandId = req.headers['x-brand-id'];
        let query = {};

        if (headerBrandId) {
            query._id = headerBrandId;
        } else if (req.brandFilter) {
            if (req.brandFilter.brand) {
                query._id = req.brandFilter.brand;
            } else {
                query = req.brandFilter;
            }
        }

        const brands = await Brand.find(query);
        if (!brands || brands.length === 0) {
            if (headerBrandId) return res.status(404).json({ message: "Brand not found" });
            return res.status(200).json({ categories: [] });
        }

        let allCategories = brands.flatMap(brand => brand.courseCategories || []);
        allCategories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        return res.status(200).json({ categories: allCategories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Create new category
export const createCategory = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        const brandId = req.brandFilter?.brand || req.headers['x-brand-id'] || null;
        if (!brandId) return res.status(400).json({ message: "Brand ID is required" });

        const brand = await Brand.findById(brandId);
        if (!brand) return res.status(404).json({ message: "Brand not found" });

        // Check if category with this name already exists for this brand
        const exists = brand.courseCategories.some(c => c.name === name);
        if (exists) return res.status(400).json({ message: "Category with this name already exists." });

        brand.courseCategories.push({
            name,
            description,
            isActive: isActive === 'true' || isActive === true
        });

        await brand.save();

        return res.status(201).json({
            message: "Category created successfully.",
            category: brand.courseCategories[brand.courseCategories.length - 1]
        });
    } catch (error) {
        console.error("Create category error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Update category
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const brand = await Brand.findOne({ "courseCategories._id": id });
        if (!brand) return res.status(404).json({ message: "Category not found." });

        const category = brand.courseCategories.id(id);

        if (updateData.name && updateData.name !== category.name) {
            const exists = brand.courseCategories.some(c => c._id.toString() !== id && c.name === updateData.name);
            if (exists) return res.status(400).json({ message: "Category with this name already exists for this brand." });
            category.name = updateData.name;
        }
        if (updateData.description !== undefined) category.description = updateData.description;
        if (updateData.isActive !== undefined) category.isActive = updateData.isActive === 'true' || updateData.isActive === true;

        await brand.save();

        return res.status(200).json({
            message: "Category updated successfully.",
            category
        });
    } catch (error) {
        console.error("Update category error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Delete category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const brand = await Brand.findOne({ "courseCategories._id": id });
        if (!brand) return res.status(404).json({ message: "Category not found." });

        brand.courseCategories.pull(id);
        await brand.save();

        return res.status(200).json({ message: "Category deleted successfully." });
    } catch (error) {
        console.error("Delete category error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Toggle category status
export const toggleCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const brand = await Brand.findOne({ "courseCategories._id": id });
        if (!brand) return res.status(404).json({ message: "Category not found." });

        const category = brand.courseCategories.id(id);
        category.isActive = !category.isActive;
        await brand.save();

        return res.status(200).json({
            message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully.`,
            category
        });
    } catch (error) {
        console.error("Toggle category status error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
