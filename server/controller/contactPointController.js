import ContactPoint from '../model/contactPointModel.js';

// Get all contact points
export const getAllContactPoints = async (req, res) => {
  try {
    const query = { ...req.brandFilter };
    const contactPoints = await ContactPoint.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ contactPoints });
  } catch (error) {
    console.error('Get contact points error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get active contact points only (for dropdowns)
export const getActiveContactPoints = async (req, res) => {
  try {
    const query = { isActive: true, ...req.brandFilter };
    const contactPoints = await ContactPoint.find(query).sort({ name: 1 });
    return res.status(200).json({ contactPoints });
  } catch (error) {
    console.error('Get active contact points error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create new contact point
export const createContactPoint = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Contact point name is required' });
    }

    // Generate value from name (lowercase, replace spaces with hyphens)
    const value = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Validate that value is not empty after processing
    if (!value || value.trim() === '') {
      return res.status(400).json({ message: 'Contact point name must contain at least one alphanumeric character' });
    }

    // Check if contact point with same name or value exists
    const existingContactPoint = await ContactPoint.findOne({
      $or: [{ name: name.trim() }, { value }]
    });

    if (existingContactPoint) {
      return res.status(400).json({ message: 'Contact point already exists' });
    }

    const contactPoint = new ContactPoint({
      name: name.trim(),
      value,
      description: description ? description.trim() : '',
      isActive: isActive !== undefined ? isActive : true,
      brand: req.brandFilter?.brand || req.headers['x-brand-id'] || null // Strict brand assignment
    });

    await contactPoint.save();
    return res.status(201).json({ message: 'Contact point created successfully', contactPoint });
  } catch (error) {
    console.error('Create contact point error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Contact point with this name or value already exists' });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Server error' });
  }
};

// Update contact point
export const updateContactPoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid contact point ID' });
    }

    const contactPoint = await ContactPoint.findById(id);
    if (!contactPoint) {
      return res.status(404).json({ message: 'Contact point not found' });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ message: 'Contact point name is required' });
      }

      if (trimmedName !== contactPoint.name) {
        // Generate new value from name
        const newValue = trimmedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // Validate that value is not empty after processing
        if (!newValue || newValue.trim() === '') {
          return res.status(400).json({ message: 'Contact point name must contain at least one alphanumeric character' });
        }

        // Check if new name or value already exists
        const existingContactPoint = await ContactPoint.findOne({
          _id: { $ne: id },
          $or: [{ name: trimmedName }, { value: newValue }]
        });

        if (existingContactPoint) {
          return res.status(400).json({ message: 'Contact point with this name or value already exists' });
        }

        contactPoint.name = trimmedName;
        // Update value when name changes
        contactPoint.value = newValue;
      }
    }

    if (description !== undefined) contactPoint.description = description ? description.trim() : '';
    if (isActive !== undefined) contactPoint.isActive = isActive;

    await contactPoint.save();
    return res.status(200).json({ message: 'Contact point updated successfully', contactPoint });
  } catch (error) {
    console.error('Update contact point error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Contact point with this name or value already exists' });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    // Handle CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid contact point ID' });
    }

    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete contact point
export const deleteContactPoint = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid contact point ID' });
    }

    const contactPoint = await ContactPoint.findByIdAndDelete(id);
    if (!contactPoint) {
      return res.status(404).json({ message: 'Contact point not found' });
    }

    return res.status(200).json({ message: 'Contact point deleted successfully' });
  } catch (error) {
    console.error('Delete contact point error:', error);

    // Handle CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid contact point ID' });
    }

    return res.status(500).json({ message: 'Server error' });
  }
};