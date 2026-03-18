import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API from '../../config/api';
import { Modal } from "../ui/modal";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Clock, Layers, Users, BookOpen, AlertCircle, CheckCircle2, Calendar, Hash, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CreateBatchModal({ isOpen, onClose, onCreated, onUpdated, batch, initialData }) {
    // Determine if we are updating an existing "Slot Record" into a "Batch"
    const isSlotEstablishment = batch && batch.isSlot;
    const isEditMode = !!batch && !batch.isSlot;
    const { selectedBrand } = useAuth();

    const [formData, setFormData] = useState({
        batchName: '',
        instructorName: '',
        mode: 'online',
        subject: '',
        startDate: '',
        expectedEndDate: '',
        batchTime: { from: '', to: '' },
        instructor: '',
        moduleId: '',
        slot: 0,
        isSlot: false
    });
    
    const [loading, setLoading] = useState(false);
    const [instructorOptions, setInstructorOptions] = useState([]);
    const [moduleOptions, setModuleOptions] = useState([]);
    const [selectedInstructorId, setSelectedInstructorId] = useState('');
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [generatingId, setGeneratingId] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchInstructors();
            fetchModules();

            if (batch) {
                // If initializing from an existing slot, keep instructor/slot info but require batch details
                setFormData({
                    batchName: batch.batchName || '',
                    instructorName: batch.instructorName || '',
                    mode: batch.mode || 'online',
                    subject: batch.subject || '',
                    startDate: batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '',
                    expectedEndDate: batch.expectedEndDate ? new Date(batch.expectedEndDate).toISOString().split('T')[0] : '',
                    batchTime: {
                        from: batch.batchTime?.from || '',
                        to: batch.batchTime?.to || ''
                    },
                    instructor: batch.instructor || '',
                    moduleId: batch.moduleId || '',
                    slot: batch.slot ?? 0,
                    isSlot: batch.isSlot || false
                });
                setSelectedInstructorId(batch.instructor || '');
                setSelectedModuleId(batch.moduleId || '');
            } else if (initialData) {
                // Pre-fill from calendar click (implicit assignment)
                setFormData({
                    batchName: '',
                    instructorName: initialData.instructorName || '',
                    mode: 'online',
                    subject: '',
                    startDate: initialData.startDate || '',
                    expectedEndDate: initialData.startDate || '',
                    batchTime: { from: '', to: '' },
                    instructor: initialData.instructor || '',
                    moduleId: '',
                    slot: initialData.slot ?? 0,
                    isSlot: false
                });
                setSelectedInstructorId(initialData.instructor || '');
            }
        }
    }, [isOpen, batch, initialData]);

    const fetchNextBatchId = useCallback(async (date) => {
        if (isEditMode || !isOpen) return;
        
        const brandId = selectedBrand?._id || selectedBrand?.id;
        if (!brandId) return;

        setGeneratingId(true);
        try {
            const response = await axios.get(`${API}/batches/next-id`, {
                params: { brandId, startDate: date },
                withCredentials: true
            });
            setFormData(prev => ({ ...prev, batchName: response.data.nextBatchId }));
        } catch (error) {
            console.error("Error fetching next batch ID:", error);
        } finally {
            setGeneratingId(false);
        }
    }, [isEditMode, isOpen, selectedBrand]);

    useEffect(() => {
        if (isOpen && !isEditMode && formData.startDate) {
            fetchNextBatchId(formData.startDate);
        }
    }, [isOpen, isEditMode, formData.startDate, fetchNextBatchId]);

    const fetchInstructors = async () => {
        const brandId = selectedBrand?._id || selectedBrand?.id;
        if (!brandId) return;

        try {
            const response = await axios.get(`${API}/users/dropdown?roles=Instructor&brandId=${brandId}`, { withCredentials: true });
            setInstructorOptions(response.data.users
                .filter(u => u.roles?.includes('Instructor'))
                .map(u => ({ value: u._id, label: u.fullName }))
            );
        } catch (error) {}
    };

    const fetchModules = async () => {
        try {
            const response = await axios.get(`${API}/modules/all`, { withCredentials: true });
            setModuleOptions(response.data.modules.map(m => ({ value: m._id, label: m.name })));
        } catch (error) {}
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('batchTime.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({ ...prev, batchTime: { ...prev.batchTime, [field]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // When establishing a batch from a slot, we explicitly turn isSlot to false
            const submissionData = { ...formData, isSlot: false };
            
            if (batch) {
                // Update existing record (Slot or Batch)
                const response = await axios.put(`${API}/batches/${batch._id}`, submissionData, { withCredentials: true });
                toast.success(isSlotEstablishment ? "Session Live!" : "Configurations updated.");
                if (onUpdated) onUpdated(response.data.batch);
            } else {
                // Create new batch from scratch
                const response = await axios.post(`${API}/batches`, submissionData, { withCredentials: true });
                toast.success("Batch successfully established.");
                if (onCreated) onCreated(response.data.batch);
            }
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-2xl p-0 overflow-hidden"
        >
            {/* Standard CRM Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-950 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                            {isSlotEstablishment ? 'Capacity Track' : 'Batch Allocation'}
                        </span>
                        <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                            <Hash size={12} className="text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Track {formData.slot + 1}</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {isSlotEstablishment ? 'Establish Capacity' : (isEditMode ? 'Modify Batch Settings' : 'Create New Batch')}
                    </h3>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-900">
                <div className="space-y-6">
                    {/* Primary Identifier */}
                    <div>
                        <Label htmlFor="batchName" required>Official Batch Identifier</Label>
                        <Input
                            type="text"
                            id="batchName"
                            name="batchName"
                            required
                            value={formData.batchName}
                            onChange={handleChange}
                            placeholder={generatingId ? "Generating ID..." : "e.g. BAT-XYZ-250315-001"}
                            className={`w-full ${!isEditMode ? 'bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed font-mono text-blue-950 dark:text-blue-400' : ''}`}
                            readOnly={!isEditMode}
                            icon={generatingId ? <RefreshCcw size={14} className="animate-spin text-blue-950 dark:text-blue-500" /> : <Hash size={14} className="text-gray-400" />}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Instructor & Module */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="instructor" required>Faculty Lead</Label>
                                <Select
                                    id="instructor"
                                    options={instructorOptions}
                                    value={selectedInstructorId}
                                    onChange={(val) => {
                                        setSelectedInstructorId(val);
                                        const match = instructorOptions.find(o => o.value === val);
                                        setFormData(prev => ({ ...prev, instructor: val, instructorName: match?.label || '' }));
                                    }}
                                    placeholder="Select Instructor"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="moduleId" required>Curriculum Module</Label>
                                <Select
                                    id="moduleId"
                                    options={moduleOptions}
                                    value={selectedModuleId}
                                    onChange={(val) => {
                                        setSelectedModuleId(val);
                                        const match = moduleOptions.find(o => o.value === val);
                                        setFormData(prev => ({ ...prev, moduleId: val, subject: match?.label || '' }));
                                    }}
                                    placeholder="Select Module"
                                />
                            </div>
                        </div>

                        {/* Dates & Mode */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="startDate" required>Commencement Date</Label>
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
                                <Label htmlFor="expectedEndDate" required>Projected Completion</Label>
                                <Input
                                    type="date"
                                    id="expectedEndDate"
                                    name="expectedEndDate"
                                    required
                                    value={formData.expectedEndDate}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Time & Mode */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                        <div className="col-span-1">
                            <Label htmlFor="mode">Session Mode</Label>
                            <Select
                                id="mode"
                                name="mode"
                                value={formData.mode}
                                onChange={(val) => setFormData(p => ({ ...p, mode: val }))}
                                options={[
                                    { value: 'online', label: 'Online' },
                                    { value: 'offline', label: 'Offline' },
                                    { value: 'hybrid', label: 'Hybrid' }
                                ]}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label htmlFor="batchTime.from" required>Start Time</Label>
                            <Input
                                type="time"
                                id="batchTime.from"
                                name="batchTime.from"
                                required
                                value={formData.batchTime.from}
                                onChange={handleChange}
                                className="w-full"
                            />
                        </div>
                        <div className="col-span-1">
                            <Label htmlFor="batchTime.to" required>End Time</Label>
                            <Input
                                type="time"
                                id="batchTime.to"
                                name="batchTime.to"
                                required
                                value={formData.batchTime.to}
                                onChange={handleChange}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant={isSlotEstablishment ? "success" : "primary"}
                        loading={loading}
                        startIcon={isSlotEstablishment ? <CheckCircle2 size={18} /> : undefined}
                        className={`min-w-[140px] ${!isSlotEstablishment ? '!bg-blue-950 hover:!bg-blue-900 border-none text-white' : ''}`}
                    >
                        {isSlotEstablishment ? 'Activate Slot' : (isEditMode ? 'Update Batch' : 'Create Batch')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
