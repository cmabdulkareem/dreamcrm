import Brand from '../model/brandModel.js';
import Customer from '../model/customerModel.js';

// Get all contact points
export const getAllContactPoints = async (req, res) => {
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
      return res.status(200).json({ contactPoints: [] });
    }

    let allContactPoints = brands.flatMap(brand => brand.contactPoints || []);
    allContactPoints.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.status(200).json({ contactPoints: allContactPoints });
  } catch (error) {
    console.error('Get contact points error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get active contact points only (for dropdowns)
export const getActiveContactPoints = async (req, res) => {
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
      return res.status(200).json({ contactPoints: [] });
    }

    let activeContactPoints = brands.flatMap(brand => brand.contactPoints || []).filter(cp => cp.isActive);
    activeContactPoints.sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({ contactPoints: activeContactPoints });
  } catch (error) {
    console.error('Get active contact points error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create new contact point
export const createContactPoint = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Contact point name is required' });

    const value = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!value) return res.status(400).json({ message: 'Contact point name must contain at least one alphanumeric character' });

    const brandId = req.brandFilter?.brand || req.headers['x-brand-id'] || null;
    if (!brandId) return res.status(400).json({ message: "Brand ID is required" });

    const brand = await Brand.findById(brandId);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const exists = brand.contactPoints.some(cp => cp.name === name.trim() || cp.value === value);
    if (exists) return res.status(400).json({ message: 'Contact point already exists for this brand' });

    brand.contactPoints.push({
      name: name.trim(),
      value,
      description: description ? description.trim() : '',
      isActive: isActive !== undefined ? isActive : true
    });

    await brand.save();
    return res.status(201).json({ message: 'Contact point created successfully', contactPoint: brand.contactPoints[brand.contactPoints.length - 1] });
  } catch (error) {
    console.error('Create contact point error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update contact point
export const updateContactPoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const brand = await Brand.findOne({ "contactPoints._id": id });
    if (!brand) return res.status(404).json({ message: 'Contact point not found' });

    const contactPoint = brand.contactPoints.id(id);

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) return res.status(400).json({ message: 'Contact point name is required' });

      if (trimmedName !== contactPoint.name) {
        const oldValue = contactPoint.value;
        const oldName = contactPoint.name;
        const newValue = trimmedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        if (!newValue) return res.status(400).json({ message: 'Contact point name must contain at least one alphanumeric character' });

        const exists = brand.contactPoints.some(cp => cp._id.toString() !== id && (cp.name === trimmedName || cp.value === newValue));
        if (exists) return res.status(400).json({ message: 'Contact point with this name or value already exists for this brand' });

        contactPoint.name = trimmedName;
        contactPoint.value = newValue;

        await Customer.updateMany(
          { contactPoint: { $in: [oldName, oldValue] }, brand: brand._id },
          { contactPoint: newValue }
        );
      }
    }

    if (description !== undefined) contactPoint.description = description ? description.trim() : '';
    if (isActive !== undefined) contactPoint.isActive = isActive;

    await brand.save();
    return res.status(200).json({ message: 'Contact point updated successfully', contactPoint });
  } catch (error) {
    console.error('Update contact point error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete contact point
export const deleteContactPoint = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findOne({ "contactPoints._id": id });
    if (!brand) return res.status(404).json({ message: 'Contact point not found' });

    brand.contactPoints.pull(id);
    await brand.save();

    return res.status(200).json({ message: 'Contact point deleted successfully' });
  } catch (error) {
    console.error('Delete contact point error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
