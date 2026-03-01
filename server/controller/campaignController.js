import Brand from '../model/brandModel.js';
import Customer from '../model/customerModel.js';

// Get all campaigns
export const getAllCampaigns = async (req, res) => {
  try {
    const headerBrandId = req.headers['x-brand-id'];
    console.log('[DEBUG] getAllCampaigns: headerBrandId=', headerBrandId, ' brandFilter=', req.brandFilter);
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

    console.log('[DEBUG] getAllCampaigns: query=', JSON.stringify(query));
    const brands = await Brand.find(query);
    console.log('[DEBUG] getAllCampaigns: found brands=', brands.length, 'campaigns counts=', brands.map(b => b.campaigns?.length));

    if (!brands || brands.length === 0) {
      if (headerBrandId) return res.status(404).json({ message: "Brand not found" });
      return res.status(200).json({ campaigns: [] });
    }

    let allCampaigns = brands.flatMap(brand => brand.campaigns || []);
    allCampaigns.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.status(200).json({ campaigns: allCampaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get active campaigns only (for dropdowns)
export const getActiveCampaigns = async (req, res) => {
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
      return res.status(200).json({ campaigns: [] });
    }

    let activeCampaigns = brands.flatMap(brand => brand.campaigns || []).filter(c => c.isActive);
    activeCampaigns.sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({ campaigns: activeCampaigns });
  } catch (error) {
    console.error('Get active campaigns error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create new campaign
export const createCampaign = async (req, res) => {
  try {
    const { name, description, discountPercentage, cashback, isActive } = req.body;
    if (!name) return res.status(400).json({ message: 'Campaign name is required' });

    const brandId = req.brandFilter?.brand || req.headers['x-brand-id'] || null;
    if (!brandId) return res.status(400).json({ message: "Brand ID is required" });

    const brand = await Brand.findById(brandId);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const value = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if campaign with same name or value exists FOR THIS BRAND
    const exists = brand.campaigns.some(c => c.name === name || c.value === value);
    if (exists) {
      return res.status(400).json({ message: 'Campaign with this name or value already exists in this brand' });
    }

    brand.campaigns.push({
      name, value,
      description: description || '',
      discountPercentage: discountPercentage || 0,
      cashback: cashback || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    await brand.save();
    return res.status(201).json({ message: 'Campaign created successfully', campaign: brand.campaigns[brand.campaigns.length - 1] });
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

    const brand = await Brand.findOne({ "campaigns._id": id });
    if (!brand) return res.status(404).json({ message: 'Campaign not found' });

    const campaign = brand.campaigns.id(id);

    if (name && name !== campaign.name) {
      const oldName = campaign.name;
      const oldValue = campaign.value;
      const newValue = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      // Check if new name or value already exists
      const exists = brand.campaigns.some(c => c._id.toString() !== id && (c.name === name || c.value === newValue));
      if (exists) return res.status(400).json({ message: 'Campaign name or value already exists in this brand' });

      campaign.name = name;
      campaign.value = newValue;

      // Update related customers
      await Customer.updateMany(
        { campaign: { $in: [oldName, oldValue] }, brand: brand._id },
        { campaign: newValue }
      );
    }

    if (description !== undefined) campaign.description = description;
    if (discountPercentage !== undefined) campaign.discountPercentage = discountPercentage;
    if (cashback !== undefined) campaign.cashback = cashback;
    if (isActive !== undefined) campaign.isActive = isActive;

    await brand.save();
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

    const brand = await Brand.findOne({ "campaigns._id": id });
    if (!brand) return res.status(404).json({ message: 'Campaign not found' });

    brand.campaigns.pull(id);
    await brand.save();

    return res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
