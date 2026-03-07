import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import Label from "../../form/Label";
import Select from "../../form/Select";

/**
 * AssignLeadModal
 * Modal to assign a lead to a user and/or add a remark.
 */
const AssignLeadModal = ({
    isOpen,
    onClose,
    availableUsers,
    assignToUser,
    assignmentRemark,
    isSubmitting,
    onAssignToChange,
    onRemarkChange,
    onConfirm,
}) => {
    const buttonLabel = !assignToUser && assignmentRemark.trim()
        ? "Add Remark"
        : assignToUser && assignmentRemark.trim()
            ? "Assign & Add Remark"
            : "Assign Lead";

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">Assign Lead</h2>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="assignToUser">Assign To</Label>
                    <Select
                        options={availableUsers.map(u => ({ value: u._id, label: u.fullName }))}
                        value={assignToUser}
                        placeholder="Select User"
                        onChange={onAssignToChange}
                    />
                </div>
                <div>
                    <Label htmlFor="assignmentRemark">Assignment Remark (Optional)</Label>
                    <textarea
                        id="assignmentRemark"
                        value={assignmentRemark}
                        onChange={(e) => onRemarkChange(e.target.value)}
                        placeholder="Add a remark for the assignment..."
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button loading={isSubmitting} onClick={onConfirm}>{buttonLabel}</Button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignLeadModal;
