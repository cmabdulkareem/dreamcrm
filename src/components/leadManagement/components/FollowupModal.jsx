import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { formatDate } from "../leadHelpers";

/**
 * FollowupModal
 * Modal for setting a follow-up reminder for a lead.
 */
const FollowupModal = ({ isOpen, onClose, selectedRow, onSetReminder, onReset }) => (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        overlayClassName="bg-black/5 backdrop-blur-none"
        className="max-w-[700px] p-6 lg:p-10"
    >
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Set Follow-up Reminder</h4>
        <p>
            Set a reminder for <strong>{selectedRow?.fullName}</strong> on{" "}
            {selectedRow ? formatDate(selectedRow.followUpDate) : ""}.
        </p>
        <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { onClose(); onReset(); }}>Close</Button>
            <Button variant="warning" onClick={onSetReminder}>Set Reminder</Button>
        </div>
    </Modal>
);

export default FollowupModal;
