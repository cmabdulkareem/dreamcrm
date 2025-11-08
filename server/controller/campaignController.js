import Campaign from '../model/campaignModel.js';

// Get all campaigns
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    return res.status(200).json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get active campaigns only (for dropdowns)
export const getActiveCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json({ campaigns });
  } catch (error) {
    console.error('Get active campaigns error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create new campaign
export const createCampaign = async (req, res) => {
  try {
    const { name, description, discountPercentage, cashback, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Campaign name is required' });
    }

    // Generate value from name (lowercase, replace spaces with hyphens)
    const value = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if campaign with same name or value exists
    const existingCampaign = await Campaign.findOne({
      $or: [{ name }, { value }]
    });

    if (existingCampaign) {
      return res.status(400).json({ message: 'Campaign already exists' });
    }

    const campaign = new Campaign({
      name,
      value,
      description: description || '',
      discountPercentage: discountPercentage || 0,
      cashback: cashback || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    await campaign.save();
    return res.status(201).json({ message: 'Campaign created successfully', campaign });
  } catch (error) {
    console.error('Create campaign error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update campaign
export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, discountPercentage, cashback, isActive } = req.body;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (name && name !== campaign.name) {
      // Check if new name already exists
      const existingCampaign = await Campaign.findOne({ name, _id: { $ne: id } });
      if (existingCampaign) {
        return res.status(400).json({ message: 'Campaign name already exists' });
      }
      campaign.name = name;
      // Update value when name changes
      campaign.value = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    if (description !== undefined) campaign.description = description;
    if (discountPercentage !== undefined) campaign.discountPercentage = discountPercentage;
    if (cashback !== undefined) campaign.cashback = cashback;
    if (isActive !== undefined) campaign.isActive = isActive;

    await campaign.save();
    return res.status(200).json({ message: 'Campaign updated successfully', campaign });
  } catch (error) {
    console.error('Update campaign error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete campaign
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByIdAndDelete(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    return res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
