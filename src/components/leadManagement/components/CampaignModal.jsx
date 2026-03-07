import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import Label from "../../form/Label";
import Input from "../../form/input/InputField";

/**
 * CampaignModal
 * Modal to create a new campaign (accessible from the Edit Lead dropdown).
 */
const CampaignModal = ({
    isOpen,
    onClose,
    newCampaignName,
    newCampaignDesc,
    newCampaignDiscount,
    newCampaignCashback,
    newCampaignActive,
    onNameChange,
    onDescChange,
    onDiscountChange,
    onCashbackChange,
    onActiveChange,
    onCreateCampaign,
}) => (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">Add New Campaign</h2>

        <div className="space-y-4">
            <div>
                <Label htmlFor="newCampaignName">Campaign Name *</Label>
                <Input
                    id="newCampaignName"
                    type="text"
                    value={newCampaignName}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="e.g., Summer Promotion 2024"
                />
            </div>

            <div>
                <Label htmlFor="newCampaignDesc">Description</Label>
                <textarea
                    id="newCampaignDesc"
                    value={newCampaignDesc}
                    onChange={(e) => onDescChange(e.target.value)}
                    placeholder="Campaign description (optional)"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-theme-xs"
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <Label htmlFor="newCampaignDiscount">Discount %</Label>
                    <Input
                        id="newCampaignDiscount"
                        type="number"
                        min="0"
                        max="100"
                        value={newCampaignDiscount}
                        onChange={(e) => onDiscountChange(e.target.value)}
                        placeholder="0"
                    />
                </div>
                <div className="flex-1">
                    <Label htmlFor="newCampaignCashback">Cashback (₹)</Label>
                    <Input
                        id="newCampaignCashback"
                        type="number"
                        min="0"
                        value={newCampaignCashback}
                        onChange={(e) => onCashbackChange(e.target.value)}
                        placeholder="0"
                    />
                </div>
            </div>

            <div>
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="newCampaignActive"
                        checked={newCampaignActive}
                        onChange={(e) => onActiveChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <Label htmlFor="newCampaignActive" className="mb-0">Active</Label>
                </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={onCreateCampaign}>Create Campaign</Button>
            </div>
        </div>
    </Modal>
);

export default CampaignModal;
