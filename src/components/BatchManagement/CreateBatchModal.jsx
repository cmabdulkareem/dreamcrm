import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API from '../../config/api';
import { Modal } from "../ui/modal";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Label from "../form/Label";
import Button from "../ui/button/Button";

export default function CreateBatchModal({ isOpen, onClose, onCreated }) {
    const [formData, setFormData] = useState({
        batchName: '',
        instructorName: '',
        mode: 'online',
        subject: '',
        startDate: '',
        expectedEndDate: '',
        batchTime: { from: '', to: '' }
    });
    const [loading, setLoading] = useState(false);
    const [instructorOptions, setInstructorOptions] = useState([]);
    // State to track selected instructor ID (if needed for internal logic, though we submit name)
    const [selectedInstructorId, setSelectedInstructorId] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchInstructors = async () => {
                try {
                    // Use correct role name from schema: 'Instructor'
                    const response = await axios.get(`${API}/users/dropdown?roles=Instructor`, { withCredentials: true });
                    const allowedRoles = ['Instructor'];

                    // Filter users on frontend to be doubly sure
                    const filteredUsers = response.data.users.filter(user =>
                        user.roles && user.roles.some(role => allowedRoles.includes(role))
                    );

                    const instructors = filteredUsers.map(user => ({
                        value: user._id,
                        label: user.fullName
                    }));
                    setInstructorOptions(instructors);
                } catch (error) {
                    console.error("Failed to fetch instructors:", error);
                    toast.error("Failed to load instructors");
                }
            };
            fetchInstructors();
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('batchTime.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                batchTime: { ...prev.batchTime, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleInstructorChange = (value) => {
        setSelectedInstructorId(value);
        const selectedInstructor = instructorOptions.find(opt => opt.value === value);
        if (selectedInstructor) {
            setFormData(prev => ({ ...prev, instructorName: selectedInstructor.label }));
        }
    };

    const handleModeChange = (value) => {
        setFormData(prev => ({ ...prev, mode: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${API}/batches`, formData, { withCredentials: true });
            toast.success("Batch created successfully!");
            onCreated(response.data.batch);
            onClose(); // Close modal on success
            // Reset form
            setFormData({
                batchName: '',
                instructorName: '',
                mode: 'online',
                subject: '',
                startDate: '',
                expectedEndDate: '',
                batchTime: { from: '', to: '' }
            });
            setSelectedInstructorId('');
        } catch (error) {
            console.error("Error creating batch:", error);
            toast.error(error.response?.data?.message || "Failed to create batch.");
        } finally {
            setLoading(false);
        }
    };

    const modeOptions = [
        { value: 'online', label: 'Online' },
        { value: 'offline', label: 'Offline' }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-2xl p-6 lg:p-10"
        >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Create New Batch</h3>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <Label htmlFor="batchName">Batch Name</Label>
                        <Input
                            type="text"
                            id="batchName"
                            name="batchName"
                            required
                            value={formData.batchName}
                            onChange={handleChange}
                            placeholder="e.g. Batchname Jan 2026"
                        />
                    </div>

                    <div>
                        <Label htmlFor="instructorName">Instructor Assigned</Label>
                        <Select
                            options={instructorOptions}
                            value={selectedInstructorId}
                            onChange={handleInstructorChange}
                            placeholder="Select Instructor"
                            disabled={instructorOptions.length === 0}
                        />
                    </div>

                    <div>
                        <Label>Mode</Label>
                        <Select
                            options={modeOptions}
                            value={formData.mode}
                            onChange={handleModeChange}
                        />
                    </div>

                    <div className="col-span-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            type="text"
                            id="subject"
                            name="subject"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                            type="date"
                            id="startDate"
                            name="startDate"
                            required
                            value={formData.startDate}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <Label htmlFor="expectedEndDate">Expected End Date</Label>
                        <Input
                            type="date"
                            id="expectedEndDate"
                            name="expectedEndDate"
                            required
                            value={formData.expectedEndDate}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <Label htmlFor="batchTime.from">Time From</Label>
                        <Input
                            type="time"
                            id="batchTime.from"
                            name="batchTime.from"
                            required
                            value={formData.batchTime.from}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <Label htmlFor="batchTime.to">Time To</Label>
                        <Input
                            type="time"
                            id="batchTime.to"
                            name="batchTime.to"
                            required
                            value={formData.batchTime.to}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto mt-2 sm:mt-0"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        className="w-full sm:w-auto"
                    >
                        Create Batch
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
