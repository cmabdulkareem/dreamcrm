import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadCrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import InputField from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import Select from '../../../components/form/Select';
import TextArea from '../../../components/form/input/TextArea';
import { hrService } from '../../../services/hrService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const JobForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        type: 'Full-time',
        status: 'Active',
        description: '',
        requirements: ''
    });

    useEffect(() => {
        if (isEditMode) {
            fetchJob();
        }
    }, [id]);

    const fetchJob = async () => {
        try {
            setLoading(true);
            const job = await hrService.getJob(id);
            if (job) {
                setFormData(job);
            } else {
                toast.error('Job not found');
                navigate('/hr/recruitment/jobs');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isEditMode) {
                await hrService.updateJob(id, formData);
            } else {
                await hrService.createJob(formData);
            }
            navigate('/hr/recruitment/jobs');
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
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="md:col-span-2">
                            <Label htmlFor="title">Job Title</Label>
                            <InputField
                                name="title"
                                id="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Senior React Developer"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="department">Department</Label>
                            <Select
                                options={[
                                    { value: 'Engineering', label: 'Engineering' },
                                    { value: 'Marketing', label: 'Marketing' },
                                    { value: 'Design', label: 'Design' },
                                    { value: 'Sales', label: 'Sales' },
                                    { value: 'HR', label: 'Human Resources' },
                                    { value: 'Finance', label: 'Finance' },
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
                            <TextArea
                                name="requirements"
                                id="requirements"
                                value={formData.requirements}
                                onChange={handleChange}
                                placeholder="Enter job requirements..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/hr/recruitment/jobs')}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Job Posting'}
                        </button>
                    </div>
                </form>
            </ComponentCard>
        </>
    );
};

export default JobForm;
