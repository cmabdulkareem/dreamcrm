import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";

/**
 * DeleteLeadModal
 * Confirmation dialog for deleting a lead.
 */
const DeleteLeadModal = ({ isOpen, onClose, selectedRow, onConfirm, onReset }) => (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        overlayClassName="bg-black/5 backdrop-blur-none"
        className="max-w-[700px] p-6 lg:p-10"
    >
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Confirm Delete</h4>
        <p>Are you sure you want to delete enquiry <strong>{selectedRow?.name || selectedRow?.fullName}</strong>?</p>
        <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { onClose(); onReset(); }}>Cancel</Button>
            <Button variant="danger" onClick={onConfirm}>Delete</Button>
        </div>
    </Modal>
);

export default DeleteLeadModal;
