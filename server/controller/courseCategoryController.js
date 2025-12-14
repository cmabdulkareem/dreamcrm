import courseCategoryModel from '../model/courseCategoryModel.js';

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const brandId = req.brandFilter?.brand || req.headers['x-brand-id'];

        let finalQuery = {};
        if (req.brandFilter) {
            finalQuery = { ...req.brandFilter };
        } else if (req.headers['x-brand-id']) {
            finalQuery = { brand: req.headers['x-brand-id'] };
        }

        const categories = await courseCategoryModel.find(finalQuery).sort({ createdAt: -1 });
        return res.status(200).json({ categories });
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

        // Check if category with this name already exists for this brand
        const existingCategory = await courseCategoryModel.findOne({
            name,
            brand: brandId
        });
        if (existingCategory) {
            return res.status(400).json({ message: "Category with this name already exists." });
        }

        const newCategory = new courseCategoryModel({
            name,
            description,
            isActive: isActive === 'true' || isActive === true,
            brand: req.brandFilter?.brand || req.headers['x-brand-id'] || null
        });

        await newCategory.save();

        return res.status(201).json({
            message: "Category created successfully.",
            category: newCategory
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

        const category = await courseCategoryModel.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        // Update fields
        if (updateData.name) category.name = updateData.name;
        if (updateData.description !== undefined) category.description = updateData.description;
        if (updateData.isActive !== undefined) category.isActive = updateData.isActive === 'true' || updateData.isActive === true;

        await category.save();

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

        const category = await courseCategoryModel.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

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

        const category = await courseCategoryModel.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        category.isActive = !category.isActive;
        await category.save();

        return res.status(200).json({
            message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully.`,
            category
        });
    } catch (error) {
        console.error("Toggle category status error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
