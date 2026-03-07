import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import Label from "../../form/Label";
import Select from "../../form/Select";
import { CloseIcon, CalendarIcon } from "../../../icons";
import { immediateFollowupOptions } from "../../../data/DataSets";

const ImmediateFollowupModal = ({
    isOpen,
    onClose,
    value,
    onChange,
    onConfirm,
    isSubmitting,
    leadName
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[400px] p-0 overflow-hidden"
        >
            <div className="flex flex-col bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                            <CalendarIcon className="size-5 text-brand-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick Follow-up</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{leadName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <CloseIcon className="size-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        <div>
                            <Label>Set Reminder Interval</Label>
                            <Select
                                options={immediateFollowupOptions}
                                value={value}
                                onChange={onChange}
                                placeholder="Select interval..."
                            />
                            <p className="text-[10px] text-gray-400 mt-2">
                                This will set a quick reminder to follow up with the lead.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-5 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="text-xs px-4"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        loading={isSubmitting}
                        disabled={!value || isSubmitting}
                        className="text-xs px-6 shadow-md shadow-brand-500/10"
                    >
                        Set Reminder
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ImmediateFollowupModal;
