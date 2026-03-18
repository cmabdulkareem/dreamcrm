import Brand from '../model/brandModel.js';

// Get all modules
export const getAllModules = async (req, res) => {
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
      return res.status(200).json({ modules: [] });
    }

    let allModules = brands.flatMap(brand => brand.modules || []);
    allModules.sort((a, b) => {
      if (a.order !== b.order) {
        return (a.order || 0) - (b.order || 0);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return res.status(200).json({ modules: allModules });
  } catch (error) {
    console.error("Error fetching modules:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reorder modules
export const reorderModules = async (req, res) => {
  try {
    const { orders } = req.body; // Array of { id, order }
    const brandId = req.brandFilter?.brand || req.headers['x-brand-id'] || null;
    if (!brandId) return res.status(400).json({ message: "Brand ID is required" });

    const brand = await Brand.findById(brandId);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    orders.forEach(({ id, order }) => {
      const module = brand.modules.id(id);
      if (module) {
        module.order = order;
      }
    });

    await brand.save();

    return res.status(200).json({ 
      message: "Modules reordered successfully.",
      modules: brand.modules.sort((a, b) => (a.order || 0) - (b.order || 0))
    });
  } catch (error) {
    console.error("Reorder modules error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create new module
export const createModule = async (req, res) => {
  try {
    const { name, duration, mode, syllabus, isActive } = req.body;
    const brandId = req.brandFilter?.brand || req.headers['x-brand-id'] || null;
    if (!brandId) return res.status(400).json({ message: "Brand ID is required" });

    const brand = await Brand.findById(brandId);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    // Check if module with this name already exists for this brand
    const exists = brand.modules.some(m => m.name === name);
    if (exists) return res.status(400).json({ message: "Module with this name already exists." });

    brand.modules.push({
      name,
      duration,
      mode,
      syllabus,
      isActive: isActive === 'true' || isActive === true
    });

    await brand.save();

    return res.status(201).json({
      message: "Module created successfully.",
      module: brand.modules[brand.modules.length - 1]
    });
  } catch (error) {
    console.error("Create module error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update module
export const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const brand = await Brand.findOne({ "modules._id": id });
    if (!brand) return res.status(404).json({ message: "Module not found." });

    const module = brand.modules.id(id);

    if (updateData.name && updateData.name !== module.name) {
      const exists = brand.modules.some(m => m._id.toString() !== id && m.name === updateData.name);
      if (exists) return res.status(400).json({ message: "Module with this name already exists for this brand." });
      module.name = updateData.name;
    }
    
    if (updateData.duration !== undefined) module.duration = updateData.duration;
    if (updateData.mode !== undefined) module.mode = updateData.mode;
    if (updateData.syllabus !== undefined) module.syllabus = updateData.syllabus;
    if (updateData.isActive !== undefined) module.isActive = updateData.isActive === 'true' || updateData.isActive === true;

    await brand.save();

    return res.status(200).json({
      message: "Module updated successfully.",
      module
    });
  } catch (error) {
    console.error("Update module error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete module
export const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findOne({ "modules._id": id });
    if (!brand) return res.status(404).json({ message: "Module not found." });

    brand.modules.pull(id);
    await brand.save();

    return res.status(200).json({ message: "Module deleted successfully." });
  } catch (error) {
    console.error("Delete module error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Toggle module status
export const toggleModuleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findOne({ "modules._id": id });
    if (!brand) return res.status(404).json({ message: "Module not found." });

    const module = brand.modules.id(id);
    module.isActive = !module.isActive;
    await brand.save();

    return res.status(200).json({
      message: `Module ${module.isActive ? 'activated' : 'deactivated'} successfully.`,
      module
    });
  } catch (error) {
    console.error("Toggle module status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
