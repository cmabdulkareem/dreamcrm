import React, { useState } from 'react';
import Modal from '../ui/modal';
import Button from '../ui/Button';
import Label from '../form/Label';
import Input from '../form/Input';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API } from '../../config/api';

const SupportModal = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('issue');
    const [priority, setPriority] = useState('medium');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            toast.error("Title and description are required.");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API}/support`, {
                title,
                description,
                type,
                priority
            }, { withCredentials: true });

            toast.success("Request submitted successfully!");
            setTitle('');
            setDescription('');
            onClose();
        } catch (error) {
            console.error("Error submitting support request:", error);
            toast.error(error.response?.data?.message || "Failed to submit request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Feature Request & Support</h2>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="support-title">Title</Label>
                    <Input
                        id="support-title"
                        placeholder="Brief title of your request or issue"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor="support-type">Type</Label>
                    <select
                        id="support-type"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-theme-xs outline-none"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="issue">Issue / Problem</option>
                        <option value="feature-request">Feature Request</option>
                        <option value="bug">Bug Report</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="support-priority">Priority</Label>
                        <select
                            id="support-priority"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-theme-xs outline-none"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                </div>
                <div>
                    <Label htmlFor="support-description">Description</Label>
                    <textarea
                        id="support-description"
                        rows={5}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-theme-xs outline-none"
                        placeholder="Please provide details about your request or describe the issue"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" loading={loading} onClick={handleSubmit}>Submit Request</Button>
                </div>
            </div>
        </Modal>
    );
};

export default SupportModal;
