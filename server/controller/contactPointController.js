import ContactPoint from '../model/contactPointModel.js';

// Get all contact points
export const getAllContactPoints = async (req, res) => {
  try {
    const contactPoints = await ContactPoint.find().sort({ createdAt: -1 });
    return res.status(200).json({ contactPoints });
  } catch (error) {
    console.error('Get contact points error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get active contact points only (for dropdowns)
export const getActiveContactPoints = async (req, res) => {
  try {
    const contactPoints = await ContactPoint.find({ isActive: true }).sort({ name: 1 });
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

    if (!name) {
      return res.status(400).json({ message: 'Contact point name is required' });
    }

    // Generate value from name (lowercase, replace spaces with hyphens)
    const value = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if contact point with same name or value exists
    const existingContactPoint = await ContactPoint.findOne({
      $or: [{ name }, { value }]
    });

    if (existingContactPoint) {
      return res.status(400).json({ message: 'Contact point already exists' });
    }

    const contactPoint = new ContactPoint({
      name,
      value,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true
    });

    await contactPoint.save();
    return res.status(201).json({ message: 'Contact point created successfully', contactPoint });
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

    const contactPoint = await ContactPoint.findById(id);
    if (!contactPoint) {
      return res.status(404).json({ message: 'Contact point not found' });
    }

    if (name && name !== contactPoint.name) {
      // Check if new name already exists
      const existingContactPoint = await ContactPoint.findOne({ name, _id: { $ne: id } });
      if (existingContactPoint) {
        return res.status(400).json({ message: 'Contact point name already exists' });
      }
      contactPoint.name = name;
      // Update value when name changes
      contactPoint.value = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    if (description !== undefined) contactPoint.description = description;
    if (isActive !== undefined) contactPoint.isActive = isActive;

    await contactPoint.save();
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

    const contactPoint = await ContactPoint.findByIdAndDelete(id);
    if (!contactPoint) {
      return res.status(404).json({ message: 'Contact point not found' });
    }

    return res.status(200).json({ message: 'Contact point deleted successfully' });
  } catch (error) {
    console.error('Delete contact point error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};