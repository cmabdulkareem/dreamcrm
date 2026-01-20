import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import API from '../../config/api';
import Button from '../../components/ui/button/Button.jsx';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';

const CreateSupportRequest = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('issue');
    const [priority, setPriority] = useState('medium');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            navigate(-1); // Go back
        } catch (error) {
            console.error("Error submitting support request:", error);
            toast.error(error.response?.data?.message || "Failed to submit request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageMeta title="Create Support Request - CRM" />
            <PageBreadcrumb pageTitle="Feature Request & Support" />

            <div className="max-w-3xl mx-auto">
                <ComponentCard title="New Support Request">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            Have a suggestion or found a bug? Let us know! Your feedback helps us improve the system.
                        </p>

                        <div>
                            <Label htmlFor="support-title">Title *</Label>
                            <Input
                                id="support-title"
                                placeholder="Brief title of your request or issue"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="support-type">Type</Label>
                                <select
                                    id="support-type"
                                    className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-theme-xs outline-none"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="issue">Issue / Problem</option>
                                    <option value="feature-request">Feature Request</option>
                                    <option value="bug">Bug Report</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="support-priority">Priority</Label>
                                <select
                                    id="support-priority"
                                    className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-theme-xs outline-none"
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
                            <Label htmlFor="support-description">Description *</Label>
                            <textarea
                                id="support-description"
                                rows={6}
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-theme-xs outline-none"
                                placeholder="Please provide details about your request or describe the issue"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" loading={loading}>
                                Submit Request
                            </Button>
                        </div>
                    </form>
                </ComponentCard>
            </div>
        </>
    );
};

export default CreateSupportRequest;
