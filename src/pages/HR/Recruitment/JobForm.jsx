import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadCrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import InputField from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import Select from '../../../components/form/Select';
import TextArea from '../../../components/form/input/TextArea';
import TinyEditor from '../../../components/form/input/Editor';
import { hrService } from '../../../services/hrService';
import BrandService from '../../../services/brandService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const JobForm = ({ jobId, onClose, onSuccess }) => {
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const id = jobId || paramId;
    const isEditMode = !!id;
    const isModal = !!onClose;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        type: 'Full-time',
        status: 'Active',
        description: '',
        requirements: '',
        brand: 'CDC Insights'
    });

    const [brands, setBrands] = useState([]);

    useEffect(() => {
        fetchBrands();
        if (isEditMode) {
            fetchJob();
        } else {
            // Reset form if opening for new job in modal
            setFormData({
                title: '',
                department: '',
                type: 'Full-time',
                status: 'Active',
                description: '',
                requirements: '',
                brand: 'CDC Insights'
            });
        }
    }, [id, isEditMode]);

    const fetchBrands = async () => {
        try {
            const data = await BrandService.getAllBrands();
            setBrands(data || []);
        } catch (error) {
            console.error('Error fetching brands:', error);
        }
    };

    const fetchJob = async () => {
        try {
            setLoading(true);
            const job = await hrService.getJob(id);
            if (job) {
                setFormData(job);
            } else {
                toast.error('Job not found');
                if (!isModal) navigate('/hr/recruitment/jobs');
            }
        } catch (error) {
            console.error('Error fetching job:', error);
            toast.error('Failed to load job details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditorChange = (content) => {
        setFormData(prev => ({ ...prev, requirements: content }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isEditMode) {
                await hrService.updateJob(id, formData);
            } else {
                await hrService.createJob(formData);
            }
            if (isModal) {
                if (onSuccess) onSuccess();
                onClose();
            } else {
                navigate('/hr/recruitment/jobs');
            }
        } catch (error) {
            console.error('Error saving job:', error);
            toast.error('Failed to save job posting');
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode && !formData.title) {
        return <LoadingSpinner />;
    }

    const FormContent = (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                    <Label htmlFor="title">Job Title</Label>
                    <InputField
                        name="title"
                        id="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Marketing Executive"
                        required
                    />
                </div>

                <div>
                    <Label htmlFor="department">Department</Label>
                    <Select
                        options={[
                            { value: 'Counsellor', label: 'Academic Counsellor' },
                            { value: 'Trainer_Mentor', label: 'Trainer / Mentor' },
                            { value: 'Marketing', label: 'Marketing' },
                            { value: 'Accounts', label: 'Accounts' },
                            { value: 'Front_Office', label: 'Front Office / Reception' },
                            { value: 'Administration', label: 'Administration' },
                            { value: 'Operations', label: 'Operations' },
                            { value: 'Technical_Support', label: 'Technical Support' },
                            { value: 'Academic_Coordinator', label: 'Academic Coordinator' },
                            { value: 'Placement_Officer', label: 'Placement Officer' },
                            { value: 'Business_Development', label: 'Business Development' },
                            { value: 'Management', label: 'Management' },
                            { value: 'HR_Manager', label: 'HR Manager' },
                            { value: 'Others', label: 'Others' },
                        ]}
                        value={formData.department}
                        onChange={(value) => handleSelectChange('department', value)}
                        placeholder="Select Department"
                    />
                </div>

                <div>
                    <Label htmlFor="type">Employment Type</Label>
                    <Select
                        options={[
                            { value: 'Full-time', label: 'Full-time' },
                            { value: 'Part-time', label: 'Part-time' },
                            { value: 'Contract', label: 'Contract' },
                            { value: 'Internship', label: 'Internship' },
                        ]}
                        value={formData.type}
                        onChange={(value) => handleSelectChange('type', value)}
                    />
                </div>

                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                        options={[
                            { value: 'Active', label: 'Active' },
                            { value: 'Closed', label: 'Closed' },
                            { value: 'Draft', label: 'Draft' },
                        ]}
                        value={formData.status}
                        onChange={(value) => handleSelectChange('status', value)}
                    />
                </div>

                <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Select
                        options={[
                            { value: 'CDC International', label: 'CDC International' },
                            ...brands.map(b => ({ value: b.name, label: b.name }))
                        ]}
                        value={formData.brand}
                        onChange={(value) => handleSelectChange('brand', value)}
                        placeholder="Select Brand"
                    />
                </div>

                <div className="md:col-span-2">
                    <Label htmlFor="description">Job Description</Label>
                    <TextArea
                        name="description"
                        id="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter detailed job description..."
                        rows={4}
                    />
                </div>

                <div className="md:col-span-2">
                    <Label htmlFor="requirements">Requirements</Label>
                    <TinyEditor
                        value={formData.requirements}
                        onChange={handleEditorChange}
                        placeholder="Enter job requirements..."
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                <button
                    type="button"
                    onClick={() => isModal ? onClose() : navigate('/hr/recruitment/jobs')}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-950 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Job Posting'}
                </button>
            </div>
        </form>
    );

    if (isModal) {
        return (
            <div className="p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {isEditMode ? 'Edit Job Posting' : 'Post New Job'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Fill in the details below to {isEditMode ? 'update the' : 'create a new'} job opportunity.
                    </p>
                </div>
                {FormContent}
            </div>
        );
    }

    return (
        <>
            <PageMeta title={`${isEditMode ? 'Edit' : 'Post'} Job - CRM`} />
            <PageBreadCrumb items={[
                { name: 'HR', path: '/hr' },
                { name: 'Recruitment', path: '/hr/recruitment' },
                { name: 'Jobs', path: '/hr/recruitment/jobs' },
                { name: isEditMode ? 'Edit' : 'New' }
            ]} />

            <ComponentCard title={`${isEditMode ? 'Edit' : 'Post New'} Job`}>
                {FormContent}
            </ComponentCard>
        </>
    );
};

export default JobForm;
